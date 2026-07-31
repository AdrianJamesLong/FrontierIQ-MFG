"""
Configuration API Routes
REST API endpoints for managing product configurations
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from models.product_config import (
    ProductConfig, ProductConfigCreate, ProductConfigUpdate,
    ProductListItem, ProductStatus
)
from config_engine import config_engine


router = APIRouter(prefix="/api/config", tags=["configuration"])


@router.get("/current", response_model=ProductConfig)
async def get_current_config():
    """Get the currently active product configuration"""
    config = config_engine.get_active_product()
    if not config:
        raise HTTPException(status_code=404, detail="No active product configuration")
    return config


@router.get("/mode")
async def get_current_mode():
    """Get the current mode (platform or product)"""
    config = config_engine.get_active_product()
    if not config:
        return {"mode": "platform", "productId": None}
    return {
        "mode": config.mode,
        "productId": config.productId,
        "productName": config.productName
    }


@router.get("/products", response_model=List[ProductListItem])
async def list_products():
    """List all product configurations"""
    return config_engine.list_products()


@router.get("/products/{product_id}", response_model=ProductConfig)
async def get_product(product_id: str):
    """Get a specific product configuration"""
    try:
        return config_engine.load_product_config(product_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Product not found: {product_id}")


@router.post("/products", response_model=ProductConfig)
async def create_product(create_data: ProductConfigCreate):
    """Create a new product configuration"""
    try:
        return config_engine.create_product(create_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating product: {str(e)}")


@router.put("/products/{product_id}", response_model=ProductConfig)
async def update_product(product_id: str, update_data: ProductConfigUpdate):
    """Update an existing product configuration"""
    try:
        return config_engine.update_product(product_id, update_data)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Product not found: {product_id}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating product: {str(e)}")


@router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    """Delete a product configuration"""
    try:
        success = config_engine.delete_product(product_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Product not found: {product_id}")
        return {"success": True, "message": f"Product {product_id} deleted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting product: {str(e)}")


@router.post("/products/{product_id}/activate", response_model=ProductConfig)
async def activate_product(product_id: str):
    """Activate a product (make it the current product)"""
    try:
        return config_engine.activate_product(product_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Product not found: {product_id}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error activating product: {str(e)}")


@router.post("/validate")
async def validate_config(config_data: dict):
    """Validate a product configuration"""
    result = config_engine.validate_config(config_data)
    return result


@router.post("/products/{product_id}/reload", response_model=ProductConfig)
async def reload_product(product_id: str):
    """Reload a product configuration from file (bypass cache)"""
    try:
        return config_engine.reload_config(product_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Product not found: {product_id}")


@router.get("/products/{product_id}/agents")
async def get_product_agents(product_id: str):
    """Get enabled agents for a product"""
    try:
        enabled_agents = config_engine.get_enabled_agents(product_id)
        return {"productId": product_id, "enabledAgents": enabled_agents}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Product not found: {product_id}")


@router.get("/products/{product_id}/agents/{agent_slug}/tools")
async def get_agent_tools(product_id: str, agent_slug: str):
    """Get enabled tools for a specific agent in a product"""
    try:
        tools = config_engine.get_agent_tools(product_id, agent_slug)
        return {
            "productId": product_id,
            "agentSlug": agent_slug,
            "enabledTools": tools
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Product not found: {product_id}")


@router.get("/products/{product_id}/features/{feature}")
async def check_feature(product_id: str, feature: str):
    """Check if a feature is enabled in a product"""
    try:
        enabled = config_engine.is_feature_enabled(product_id, feature)
        return {
            "productId": product_id,
            "feature": feature,
            "enabled": enabled
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Product not found: {product_id}")


@router.get("/products/{product_id}/permissions/{capability}")
async def check_permission(product_id: str, capability: str):
    """Check if a capability is allowed in a product"""
    try:
        allowed = config_engine.check_permission(product_id, capability)
        return {
            "productId": product_id,
            "capability": capability,
            "allowed": allowed
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Product not found: {product_id}")