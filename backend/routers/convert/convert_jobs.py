"""Shared status and download routes for the convert toolkit."""
from fastapi import APIRouter
from core.job_queue import add_status_download_routes

router = APIRouter()
add_status_download_routes(router, "convert")
