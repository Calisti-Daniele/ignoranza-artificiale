"""
APIRouter aggregator for /api/v1 prefix.
All sub-routers are included here and mounted in main.py.
"""

from fastapi import APIRouter

from app.api.v1 import agents, chat, health, shame

router = APIRouter(prefix="/api/v1")

router.include_router(health.router)
router.include_router(agents.router)
router.include_router(shame.router)
router.include_router(chat.router)
