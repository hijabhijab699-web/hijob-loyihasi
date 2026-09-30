from fastapi import APIRouter

from app import __version__

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "ml-garment", "version": __version__}
