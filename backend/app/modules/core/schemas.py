"""Pydantic V2 schemas for SiteSettings."""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class SiteSettingsOut(BaseModel):
    id: int
    header_dns_primary: str
    header_dns_secondary: str
    server_status_text: str
    server_is_online: bool
    contact_phone: str
    contact_email: str
    contact_address: str
    support_working_hours: str
    social_telegram: str
    social_instagram: str
    social_youtube: str
    jailbreak_config: Dict[str, Any]
    faq_items: List[Dict[str, Any]]
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SiteSettingsUpdate(BaseModel):
    header_dns_primary: Optional[str] = None
    header_dns_secondary: Optional[str] = None
    server_status_text: Optional[str] = None
    server_is_online: Optional[bool] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    contact_address: Optional[str] = None
    support_working_hours: Optional[str] = None
    social_telegram: Optional[str] = None
    social_instagram: Optional[str] = None
    social_youtube: Optional[str] = None
    jailbreak_config: Optional[Dict[str, Any]] = None
    faq_items: Optional[List[Dict[str, Any]]] = None
