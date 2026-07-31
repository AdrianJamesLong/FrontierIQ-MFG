"""
Configuration Engine
Manages product configurations and provides runtime configuration queries
"""
import json
import os
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime
from models.product_config import (
    ProductConfig, ProductConfigCreate, ProductConfigUpdate,
    ProductListItem, ProductStatus
)


class ConfigurationEngine:
    """
    Central configuration management system for Platform/Product modes
    """
    
    def __init__(self, config_dir: str = None):
        if config_dir is None:
            # Default to configs/products relative to project root
            backend_dir = Path(__file__).parent
            project_root = backend_dir.parent
            config_dir = project_root / "configs" / "products"
        self.config_dir = Path(config_dir)
        self.config_dir.mkdir(parents=True, exist_ok=True)
        self._cache: Dict[str, ProductConfig] = {}
        self._active_product_id: Optional[str] = None
        self._load_active_product()
    
    def _get_config_path(self, product_id: str) -> Path:
        """Get the file path for a product configuration"""
        return self.config_dir / f"{product_id}.json"
    
    def _get_active_product_path(self) -> Path:
        """Get the path to the active product marker file"""
        return self.config_dir / ".active_product"
    
    def _load_active_product(self):
        """Load the currently active product ID"""
        active_file = self._get_active_product_path()
        if active_file.exists():
            self._active_product_id = active_file.read_text().strip()
    
    def _save_active_product(self, product_id: str):
        """Save the currently active product ID"""
        active_file = self._get_active_product_path()
        active_file.write_text(product_id)
        self._active_product_id = product_id
    
    def load_product_config(self, product_id: str) -> ProductConfig:
        """
        Load a product configuration by ID
        Uses cache if available, otherwise loads from file
        """
        # Check cache first
        if product_id in self._cache:
            return self._cache[product_id]
        
        # Load from file
        config_path = self._get_config_path(product_id)
        if not config_path.exists():
            raise FileNotFoundError(f"Product configuration not found: {product_id}")
        
        with open(config_path, 'r') as f:
            config_data = json.load(f)
        
        config = ProductConfig(**config_data)
        self._cache[product_id] = config
        return config
    
    def save_product_config(self, config: ProductConfig) -> ProductConfig:
        """Save a product configuration to file"""
        config.updatedAt = datetime.now()
        config_path = self._get_config_path(config.productId)
        
        with open(config_path, 'w') as f:
            json.dump(config.dict(), f, indent=2, default=str)
        
        # Update cache
        self._cache[config.productId] = config
        return config
    
    def create_product(self, create_data: ProductConfigCreate, created_by: Optional[str] = None) -> ProductConfig:
        """Create a new product configuration"""
        # Check if product already exists
        if self._get_config_path(create_data.productId).exists():
            raise ValueError(f"Product already exists: {create_data.productId}")
        
        # If cloning from another product
        if create_data.cloneFrom:
            base_config = self.load_product_config(create_data.cloneFrom)
            config_dict = base_config.dict()
            config_dict['productId'] = create_data.productId
            config_dict['productName'] = create_data.productName
            config_dict['branding'] = create_data.branding.dict()
            config_dict['status'] = ProductStatus.DRAFT
            config_dict['createdAt'] = datetime.now()
            config_dict['updatedAt'] = datetime.now()
            config_dict['createdBy'] = created_by
            config = ProductConfig(**config_dict)
        else:
            # Create new product with defaults
            config = ProductConfig(
                productId=create_data.productId,
                productName=create_data.productName,
                branding=create_data.branding,
                status=ProductStatus.DRAFT,
                createdBy=created_by,
                agents={
                    "enabled": [],
                    "disabled": [],
                    "configurations": {}
                },
                ui={
                    "navigation": {
                        "sidebar": {
                            "enabled": True,
                            "sections": []
                        }
                    },
                    "pages": {
                        "enabled": [],
                        "disabled": []
                    },
                    "features": {
                        "chatHistory": True,
                        "auditTrail": False,
                        "healthMonitoring": False,
                        "dataExport": False,
                        "advancedSettings": False
                    }
                },
                dataConnections={
                    "eventhouse": {
                        "enabled": True,
                        "databases": [],
                        "restrictedTables": [],
                        "readOnly": True
                    },
                    "externalAPIs": {
                        "enabled": [],
                        "disabled": []
                    }
                },
                apiEndpoints={
                    "enabled": ["/api/health", "/api/data/*"],
                    "disabled": []
                },
                permissions={
                    "roles": ["viewer"],
                    "capabilities": {
                        "canCreateAgents": False,
                        "canModifyConfig": False,
                        "canAccessRawData": False,
                        "canExportData": False,
                        "canViewAuditTrail": False,
                        "canManageUsers": False
                    }
                },
                limits={
                    "maxConcurrentChats": 3,
                    "maxChatHistoryDays": 7,
                    "maxAgentCallsPerRequest": 5,
                    "rateLimitPerMinute": 60
                }
            )
        
        return self.save_product_config(config)
    
    def update_product(self, product_id: str, update_data: ProductConfigUpdate) -> ProductConfig:
        """Update an existing product configuration"""
        config = self.load_product_config(product_id)
        
        # Update fields that are provided
        update_dict = update_data.dict(exclude_unset=True)
        for key, value in update_dict.items():
            if value is not None:
                setattr(config, key, value)
        
        return self.save_product_config(config)
    
    def delete_product(self, product_id: str) -> bool:
        """Delete a product configuration"""
        config_path = self._get_config_path(product_id)
        if not config_path.exists():
            return False
        
        # Don't allow deleting the active product
        if product_id == self._active_product_id:
            raise ValueError("Cannot delete the active product. Activate another product first.")
        
        config_path.unlink()
        if product_id in self._cache:
            del self._cache[product_id]
        
        return True
    
    def list_products(self) -> List[ProductListItem]:
        """List all product configurations"""
        products = []
        
        for config_file in self.config_dir.glob("*.json"):
            try:
                with open(config_file, 'r') as f:
                    config_data = json.load(f)
                
                product_id = config_data.get('productId')
                agent_count = len(config_data.get('agents', {}).get('enabled', []))
                
                products.append(ProductListItem(
                    productId=product_id,
                    productName=config_data.get('productName'),
                    status=config_data.get('status', 'draft'),
                    version=config_data.get('version', '1.0.0'),
                    createdAt=config_data.get('createdAt'),
                    updatedAt=config_data.get('updatedAt'),
                    agentCount=agent_count,
                    isActive=(product_id == self._active_product_id)
                ))
            except Exception as e:
                print(f"Error loading product config {config_file}: {e}")
                continue
        
        # Sort by updatedAt, handling both timezone-aware and naive datetimes
        def get_sort_key(product):
            try:
                updated = product.updatedAt
                if isinstance(updated, str):
                    # Parse string datetime
                    from dateutil import parser
                    updated = parser.parse(updated)
                # Convert to timestamp for comparison (works with both aware and naive)
                return updated.timestamp() if hasattr(updated, 'timestamp') else 0
            except:
                return 0
        
        return sorted(products, key=get_sort_key, reverse=True)
    
    def activate_product(self, product_id: str) -> ProductConfig:
        """Activate a product (make it the current product)"""
        config = self.load_product_config(product_id)
        
        # Update status to active
        config.status = ProductStatus.ACTIVE
        self.save_product_config(config)
        
        # Set as active product
        self._save_active_product(product_id)
        
        return config
    
    def get_active_product(self) -> Optional[ProductConfig]:
        """Get the currently active product configuration"""
        if not self._active_product_id:
            return None
        
        try:
            return self.load_product_config(self._active_product_id)
        except FileNotFoundError:
            return None
    
    def get_active_product_id(self) -> Optional[str]:
        """Get the currently active product ID"""
        return self._active_product_id
    
    def is_agent_enabled(self, product_id: str, agent_slug: str) -> bool:
        """Check if an agent is enabled in a product"""
        config = self.load_product_config(product_id)
        enabled_agents = config.agents.get('enabled', [])
        return agent_slug in enabled_agents
    
    def get_enabled_agents(self, product_id: str) -> List[str]:
        """Get list of enabled agents for a product"""
        config = self.load_product_config(product_id)
        return config.agents.get('enabled', [])
    
    def get_agent_tools(self, product_id: str, agent_slug: str) -> List[str]:
        """Get enabled tools for a specific agent"""
        config = self.load_product_config(product_id)
        agent_config = config.agents.get('configurations', {}).get(agent_slug, {})
        return agent_config.get('tools', [])
    
    def is_feature_enabled(self, product_id: str, feature: str) -> bool:
        """Check if a UI feature is enabled"""
        config = self.load_product_config(product_id)
        return config.ui.features.dict().get(feature, False)
    
    def is_endpoint_enabled(self, product_id: str, endpoint: str) -> bool:
        """Check if an API endpoint is enabled"""
        config = self.load_product_config(product_id)
        enabled = config.apiEndpoints.get('enabled', [])
        disabled = config.apiEndpoints.get('disabled', [])
        
        # Check if explicitly disabled
        for pattern in disabled:
            if self._matches_pattern(endpoint, pattern):
                return False
        
        # Check if explicitly enabled
        for pattern in enabled:
            if self._matches_pattern(endpoint, pattern):
                return True
        
        return False
    
    def _matches_pattern(self, path: str, pattern: str) -> bool:
        """Check if a path matches a pattern (supports wildcards)"""
        if pattern.endswith('/*'):
            return path.startswith(pattern[:-2])
        return path == pattern
    
    def check_permission(self, product_id: str, capability: str) -> bool:
        """Check if a capability is allowed in a product"""
        config = self.load_product_config(product_id)
        return config.permissions.capabilities.dict().get(capability, False)
    
    def validate_config(self, config_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate a configuration and return validation results"""
        errors = []
        warnings = []
        
        try:
            # Try to parse as ProductConfig
            config = ProductConfig(**config_data)
            
            # Additional validation rules
            enabled_agents = config.agents.get('enabled', [])
            if len(enabled_agents) == 0:
                warnings.append("No agents are enabled. Users won't be able to interact with any agents.")
            
            # Check if enabled pages reference enabled agents
            enabled_pages = config.ui.pages.get('enabled', [])
            for page in enabled_pages:
                if 'agent' in page.lower():
                    # Extract agent name from page path
                    # This is a simplified check
                    pass
            
            return {
                "valid": True,
                "errors": errors,
                "warnings": warnings
            }
        
        except Exception as e:
            errors.append(str(e))
            return {
                "valid": False,
                "errors": errors,
                "warnings": warnings
            }
    
    def clear_cache(self):
        """Clear the configuration cache"""
        self._cache.clear()
    
    def reload_config(self, product_id: str) -> ProductConfig:
        """Reload a configuration from file (bypass cache)"""
        if product_id in self._cache:
            del self._cache[product_id]
        return self.load_product_config(product_id)


# Global configuration engine instance
config_engine = ConfigurationEngine()