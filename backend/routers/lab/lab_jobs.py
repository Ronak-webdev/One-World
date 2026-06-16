"""Shared status and download routes for the lab toolkit."""
from fastapi import APIRouter
from core.job_queue import add_status_download_routes

router = APIRouter()
add_status_download_routes(router, "lab")
