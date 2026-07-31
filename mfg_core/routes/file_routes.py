"""
File Management Routes
Handles opening files in VS Code and other file operations
"""
from fastapi import APIRouter, HTTPException
import subprocess
import os
from pathlib import Path

router = APIRouter(prefix="/api/files", tags=["files"])


@router.post("/open")
async def open_file_in_vscode(file_path: str):
    """Open a file in VS Code"""
    try:
        # Get the absolute path
        base_dir = Path(__file__).parent.parent.parent
        full_path = base_dir / file_path
        
        if not full_path.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        
        # Open in VS Code
        subprocess.Popen(['code', str(full_path)])
        
        return {
            "success": True,
            "message": f"Opened {file_path} in VS Code",
            "path": str(full_path)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error opening file: {str(e)}")


@router.get("/config/{product_id}")
async def get_config_path(product_id: str):
    """Get the path to a product's config file"""
    config_path = f"configs/products/{product_id}.json"
    base_dir = Path(__file__).parent.parent.parent
    full_path = base_dir / config_path
    
    return {
        "productId": product_id,
        "relativePath": config_path,
        "absolutePath": str(full_path),
        "exists": full_path.exists()
    }