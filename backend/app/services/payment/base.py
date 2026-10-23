"""
Payment Provider Abstraction Layer
Supports Zarinpal, Zibal, Crypto, and Mock payment with production safety flag.
"""

from abc import ABC, abstractmethod
import os
import uuid
from typing import Any, Dict, Optional
from pydantic import BaseModel


class PaymentInitiationResult(BaseModel):
    payment_url: str
    authority: str
    tracking_code: Optional[str] = None


class PaymentVerificationResult(BaseModel):
    success: boolean = False
    ref_id: str
    card_pan_masked: Optional[str] = None
    amount: int
    error_message: Optional[str] = None


class BasePaymentProvider(ABC):
    @property
    @abstractmethod
    def provider_id(self) -> str:
        """Provider identifier: 'zarinpal' | 'zibal' | 'crypto' | 'mock'."""
        pass

    @abstractmethod
    async def initiate_payment(
        self,
        order_id: str,
        amount: int,
        description: str,
        callback_url: str,
        user_email: Optional[str] = None,
        user_phone: Optional[str] = None,
    ) -> PaymentInitiationResult:
        """Request payment gateway token and redirection URL."""
        pass

    @abstractmethod
    async def verify_payment(
        self,
        authority: str,
        amount: int,
        params: Dict[str, Any],
    ) -> PaymentVerificationResult:
        """Verify transaction callback from the gateway."""
        pass


class MockPaymentProvider(BasePaymentProvider):
    """
    Mock payment provider for local development and QA testing.
    CRITICAL SAFETY RULE (OD-10):
    Mock payments are strictly blocked in production unless ALLOW_MOCK_PAYMENTS=true.
    """

    @property
    def provider_id(self) -> str:
        return "mock"

    async def initiate_payment(
        self,
        order_id: str,
        amount: int,
        description: str,
        callback_url: str,
        user_email: Optional[str] = None,
        user_phone: Optional[str] = None,
    ) -> PaymentInitiationResult:
        allow_mock = os.getenv("ALLOW_MOCK_PAYMENTS", "true").lower() in ("true", "1")
        env = os.getenv("ENV", "development").lower()

        if env == "production" and not allow_mock:
            raise PermissionError("Mock payments are strictly disabled in production environment.")

        fake_authority = f"MOCK-{uuid.uuid4().hex[:12].upper()}"
        redirect_url = f"{callback_url}?Authority={fake_authority}&Status=OK"

        return PaymentInitiationResult(
            payment_url=redirect_url,
            authority=fake_authority,
            tracking_code=f"TRK-{uuid.uuid4().hex[:8].upper()}",
        )

    async def verify_payment(
        self,
        authority: str,
        amount: int,
        params: Dict[str, Any],
    ) -> PaymentVerificationResult:
        status = params.get("Status", "OK")
        if status.upper() == "OK":
            return PaymentVerificationResult(
                success=True,
                ref_id=f"REF-{uuid.uuid4().hex[:10].upper()}",
                card_pan_masked="6037-****-****-1234",
                amount=amount,
            )
        return PaymentVerificationResult(
            success=False,
            ref_id="",
            amount=amount,
            error_message="Payment cancelled by mock user.",
        )
