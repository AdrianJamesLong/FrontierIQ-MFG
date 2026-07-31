"""
Preview Management Routes
Handles spawning and managing preview instances of product configurations
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, List
import subprocess
import json
import os
from pathlib import Path
import psutil
import signal

router = APIRouter(prefix="/api/preview", tags=["preview"])

# Track active preview instances
preview_instances: Dict[str, Dict] = {}
# Start port allocation from 5174 (main is 5173)
next_available_port = 5174


def find_available_port(start_port: int = 5174) -> int:
    """Find an available port starting from the given port"""
    port = start_port
    while port < 65535:
        # Check if port is in use
        in_use = False
        for conn in psutil.net_connections():
            if conn.laddr.port == port:
                in_use = True
                break
        if not in_use:
            return port
        port += 1
    raise Exception("No available ports found")


def kill_process_on_port(port: int):
    """Kill any process running on the specified port"""
    for proc in psutil.process_iter(['pid', 'name', 'connections']):
        try:
            for conn in proc.connections():
                if conn.laddr.port == port:
                    proc.kill()
                    return True
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return False


@router.post("/products/{product_id}/start")
async def start_preview(product_id: str):
    """Start a preview instance for a product"""
    global next_available_port
    
    # Check if preview already exists
    if product_id in preview_instances:
        instance = preview_instances[product_id]
        if instance.get('process') and instance['process'].poll() is None:
            return {
                "success": True,
                "message": "Preview already running",
                "productId": product_id,
                "port": instance['port'],
                "url": f"http://localhost:{instance['port']}"
            }
    
    try:
        # Find available port
        port = find_available_port(next_available_port)
        next_available_port = port + 1
        
        # Get the frontend directory
        frontend_dir = Path(__file__).parent.parent.parent / "platform-ui"
        
        # Create environment variables for the preview
        env = os.environ.copy()
        env['VITE_PRODUCT_ID'] = product_id
        env['VITE_PREVIEW_MODE'] = 'true'
        env['PORT'] = str(port)
        
        # Start the preview instance using npm run dev with custom port
        # On Windows, we need to use shell=True
        process = subprocess.Popen(
            f'npm run dev -- --port {port} --strictPort',
            shell=True,
            cwd=str(frontend_dir),
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
        )
        
        # Store the instance info
        preview_instances[product_id] = {
            'process': process,
            'port': port,
            'pid': process.pid,
            'productId': product_id
        }
        
        # Return URL with product ID as query parameter so frontend can load it
        return {
            "success": True,
            "message": f"Preview started for {product_id}",
            "productId": product_id,
            "port": port,
            "url": f"http://localhost:{port}?previewProduct={product_id}",
            "pid": process.pid
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start preview: {str(e)}")


@router.post("/products/{product_id}/stop")
async def stop_preview(product_id: str):
    """Stop a preview instance"""
    if product_id not in preview_instances:
        raise HTTPException(status_code=404, detail=f"No preview running for {product_id}")
    
    instance = preview_instances[product_id]
    
    try:
        # Try to terminate gracefully first
        if instance['process'].poll() is None:
            if os.name == 'nt':
                # On Windows, send CTRL_BREAK_EVENT
                os.kill(instance['pid'], signal.CTRL_BREAK_EVENT)
            else:
                instance['process'].terminate()
            
            # Wait a bit for graceful shutdown
            try:
                instance['process'].wait(timeout=5)
            except subprocess.TimeoutExpired:
                # Force kill if it doesn't stop
                instance['process'].kill()
        
        # Also try to kill any process on that port
        kill_process_on_port(instance['port'])
        
        # Remove from tracking
        del preview_instances[product_id]
        
        return {
            "success": True,
            "message": f"Preview stopped for {product_id}",
            "productId": product_id
        }
        
    except Exception as e:
        # Still remove from tracking even if there was an error
        if product_id in preview_instances:
            del preview_instances[product_id]
        raise HTTPException(status_code=500, detail=f"Error stopping preview: {str(e)}")


@router.get("/instances")
async def list_preview_instances():
    """List all active preview instances"""
    active_instances = []
    
    # Clean up dead processes
    dead_instances = []
    for product_id, instance in preview_instances.items():
        if instance['process'].poll() is not None:
            dead_instances.append(product_id)
        else:
            active_instances.append({
                "productId": product_id,
                "port": instance['port'],
                "url": f"http://localhost:{instance['port']}",
                "pid": instance['pid']
            })
    
    # Remove dead instances
    for product_id in dead_instances:
        del preview_instances[product_id]
    
    return {
        "instances": active_instances,
        "count": len(active_instances)
    }


@router.get("/products/{product_id}/status")
async def get_preview_status(product_id: str):
    """Get the status of a preview instance"""
    if product_id not in preview_instances:
        return {
            "running": False,
            "productId": product_id
        }
    
    instance = preview_instances[product_id]
    is_running = instance['process'].poll() is None
    
    if not is_running:
        # Clean up dead instance
        del preview_instances[product_id]
        return {
            "running": False,
            "productId": product_id
        }
    
    return {
        "running": True,
        "productId": product_id,
        "port": instance['port'],
        "url": f"http://localhost:{instance['port']}",
        "pid": instance['pid']
    }


@router.post("/cleanup")
async def cleanup_all_previews():
    """Stop all preview instances"""
    stopped = []
    errors = []
    
    for product_id in list(preview_instances.keys()):
        try:
            instance = preview_instances[product_id]
            if instance['process'].poll() is None:
                if os.name == 'nt':
                    os.kill(instance['pid'], signal.CTRL_BREAK_EVENT)
                else:
                    instance['process'].terminate()
                try:
                    instance['process'].wait(timeout=3)
                except subprocess.TimeoutExpired:
                    instance['process'].kill()
            
            kill_process_on_port(instance['port'])
            stopped.append(product_id)
        except Exception as e:
            errors.append({"productId": product_id, "error": str(e)})
        finally:
            if product_id in preview_instances:
                del preview_instances[product_id]
    
    return {
        "success": True,
        "stopped": stopped,
        "errors": errors,
        "count": len(stopped)
    }