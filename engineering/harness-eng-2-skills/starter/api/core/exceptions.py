from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class AppException(Exception):
    def __init__(self, detail: str) -> None:
        self.detail = detail


class NotFound(AppException):
    pass


class ValidationError(AppException):
    pass


STATUS_MAP: dict[type[AppException], int] = {
    NotFound: 404,
    ValidationError: 422,
}


def _error_response(status: int, detail: str, request: Request) -> JSONResponse:
    return JSONResponse(
        status_code=status,
        content={
            "error": {
                "code": status,
                "message": detail,
                "path": request.url.path,
            }
        },
    )


def _status_for(exc: AppException) -> int:
    for exc_type, status in STATUS_MAP.items():
        if isinstance(exc, exc_type):
            return status
    return 400


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        return _error_response(_status_for(exc), exc.detail, request)
