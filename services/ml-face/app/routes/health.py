from fastapi import APIRouter

from app import __version__

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "ml-face", "version": __version__}
