from typing import Any, Optional
from fastapi import HTTPException, status


class AppException(HTTPException):
    def __init__(
        self,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        message: str = "An unexpected error occurred",
        code: str = "INTERNAL_ERROR",
        details: Optional[Any] = None,
    ):
        super().__init__(status_code=status_code, detail=message)
        self.code = code
        self.details = details
        self.message = message


class NotFoundException(AppException):
    def __init__(self, message: str = "Resource not found", details: Optional[Any] = None):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=message,
            code="NOT_FOUND",
            details=details,
        )


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message=message,
            code="UNAUTHORIZED",
        )


class ForbiddenException(AppException):
    def __init__(self, message: str = "Operation not permitted"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            message=message,
            code="FORBIDDEN",
        )


class QuotaExceededException(AppException):
    def __init__(self, message: str = "Download quota limit exceeded for your tier"):
        super().__init__(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            message=message,
            code="QUOTA_EXCEEDED",
        )
