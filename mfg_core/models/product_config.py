"""
Product Configuration Models
Pydantic models for product suite configurations
"""
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum


class ProductStatus(str, Enum):
    """Product activation status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    DRAFT = "draft"


class BrandingConfig(BaseModel):
    """Branding configuration for a product"""
    name: str = Field(..., description="Product display name")
    logo: Optional[str] = Field(None, description="Logo URL or path")
    favicon: Optional[str] = Field(None, description="Favicon URL or path")
    primaryColor: str = Field("#F40009", description="Primary brand color (hex)")
    secondaryColor: str = Field("#8B0005", description="Secondary brand color (hex)")
    
    @validator('primaryColor', 'secondaryColor')
    def validate_hex_color(cls, v):
        if not v.startswith('#') or len(v) != 7:
            raise ValueError('Color must be a valid hex code (e.g., #F40009)')
        return v


class AgentToolConfig(BaseModel):
    """Configuration for a specific agent"""
    enabled: bool = True
    tools: List[str] = Field(default_factory=list, description="Enabled tools for this agent")
    disabledTools: List[str] = Field(default_factory=list, description="Explicitly disabled tools")
    systemPromptOverride: Optional[str] = None
    maxTokens: int = Field(4096, ge=1, le=200000)
    temperature: float = Field(0.7, ge=0.0, le=2.0)


class NavigationSection(BaseModel):
    """Navigation section configuration"""
    id: str
    enabled: bool = True
    items: List[str] = Field(default_factory=list)


class UIFeatures(BaseModel):
    """UI feature toggles"""
    chatHistory: bool = True
    auditTrail: bool = False
    healthMonitoring: bool = False
    dataExport: bool = False
    advancedSettings: bool = False


class UIConfig(BaseModel):
    """UI configuration"""
    navigation: Dict[str, Any] = Field(default_factory=dict)
    pages: Dict[str, List[str]] = Field(default_factory=lambda: {"enabled": [], "disabled": []})
    features: UIFeatures = Field(default_factory=UIFeatures)


class DataConnectionConfig(BaseModel):
    """Data connection configuration"""
    eventhouse: Dict[str, Any] = Field(default_factory=dict)
    externalAPIs: Dict[str, List[str]] = Field(default_factory=lambda: {"enabled": [], "disabled": []})


class PermissionCapabilities(BaseModel):
    """Permission capabilities"""
    canCreateAgents: bool = False
    canModifyConfig: bool = False
    canAccessRawData: bool = False
    canExportData: bool = False
    canViewAuditTrail: bool = False
    canManageUsers: bool = False


class PermissionsConfig(BaseModel):
    """Permissions configuration"""
    roles: List[str] = Field(default_factory=lambda: ["viewer"])
    capabilities: PermissionCapabilities = Field(default_factory=PermissionCapabilities)


class LimitsConfig(BaseModel):
    """Usage limits configuration"""
    maxConcurrentChats: int = Field(3, ge=1)
    maxChatHistoryDays: int = Field(7, ge=1)
    maxAgentCallsPerRequest: int = Field(5, ge=1)
    rateLimitPerMinute: int = Field(60, ge=1)


class ProductConfig(BaseModel):
    """Complete product configuration"""
    productId: str = Field(..., description="Unique product identifier")
    productName: str = Field(..., description="Human-readable product name")
    version: str = Field("1.0.0", description="Configuration version")
    status: ProductStatus = Field(ProductStatus.DRAFT, description="Product status")
    mode: str = Field("product", description="Mode: 'platform' or 'product'")
    
    branding: BrandingConfig
    agents: Dict[str, Any] = Field(default_factory=dict)
    ui: UIConfig = Field(default_factory=UIConfig)
    dataConnections: DataConnectionConfig = Field(default_factory=DataConnectionConfig)
    apiEndpoints: Dict[str, List[str]] = Field(default_factory=lambda: {"enabled": [], "disabled": []})
    permissions: PermissionsConfig = Field(default_factory=PermissionsConfig)
    limits: LimitsConfig = Field(default_factory=LimitsConfig)
    
    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: datetime = Field(default_factory=datetime.now)
    createdBy: Optional[str] = None
    
    @validator('productId')
    def validate_product_id(cls, v):
        if not v or not v.replace('-', '').replace('_', '').isalnum():
            raise ValueError('Product ID must be alphanumeric with hyphens or underscores')
        return v


class ProductConfigCreate(BaseModel):
    """Model for creating a new product"""
    productId: str
    productName: str
    branding: BrandingConfig
    cloneFrom: Optional[str] = Field(None, description="Product ID to clone from")


class ProductConfigUpdate(BaseModel):
    """Model for updating a product"""
    productName: Optional[str] = None
    status: Optional[ProductStatus] = None
    branding: Optional[BrandingConfig] = None
    agents: Optional[Dict[str, Any]] = None
    ui: Optional[UIConfig] = None
    dataConnections: Optional[DataConnectionConfig] = None
    apiEndpoints: Optional[Dict[str, List[str]]] = None
    permissions: Optional[PermissionsConfig] = None
    limits: Optional[LimitsConfig] = None


class ProductListItem(BaseModel):
    """Simplified product info for listing"""
    productId: str
    productName: str
    status: ProductStatus
    version: str
    createdAt: datetime
    updatedAt: datetime
    agentCount: int = 0
    isActive: bool = False