from fastapi import Request, status
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger("drgame.exceptions")

class AppException(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, error_code: str = "APP_ERROR"):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(message)

class NotFoundException(AppException):
    def __init__(self, message: str = "منبع مورد نظر یافت نشد.", error_code: str = "NOT_FOUND"):
        super().__init__(message=message, status_code=status.HTTP_404_NOT_FOUND, error_code=error_code)

class UnauthorizedException(AppException):
    def __init__(self, message: str = "احراز هویت انجام نشده است.", error_code: str = "UNAUTHORIZED"):
        super().__init__(message=message, status_code=status.HTTP_401_UNAUTHORIZED, error_code=error_code)

class ForbiddenException(AppException):
    def __init__(self, message: str = "شما اجازه دسترسی به این بخش را ندارید.", error_code: str = "FORBIDDEN"):
        super().__init__(message=message, status_code=status.HTTP_403_FORBIDDEN, error_code=error_code)

class ConflictException(AppException):
    def __init__(self, message: str = "این منبع از قبل وجود دارد.", error_code: str = "CONFLICT"):
        super().__init__(message=message, status_code=status.HTTP_409_CONFLICT, error_code=error_code)

class BadRequestException(AppException):
    def __init__(self, message: str = "درخواست نامعتبر است.", error_code: str = "BAD_REQUEST"):
        super().__init__(message=message, status_code=status.HTTP_400_BAD_REQUEST, error_code=error_code)

# Convenient Aliases
AuthenticationError = UnauthorizedException
AuthorizationError = ForbiddenException
ConflictError = ConflictException
BadRequestError = BadRequestException
NotFoundError = NotFoundException

async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error_code": exc.error_code,
            "message": exc.message,
            "path": str(request.url.path)
        }
    )

async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": "خطای غیرمنتظره در سرور رخ داده است.",
            "path": str(request.url.path)
        }
    )
