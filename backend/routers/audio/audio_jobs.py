"""Shared status and download routes for the audio toolkit.

This single router handles all job polling and file delivery for every audio
tool, registered once in main.py to avoid duplication across routers.
"""
from fastapi import APIRouter
from core.job_queue import add_status_download_routes

router = APIRouter()
add_status_download_routes(router, "audio")
