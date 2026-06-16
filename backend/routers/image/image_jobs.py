"""Shared status and download routes for the image toolkit.

This single router handles all job polling and file delivery for every image
tool so we don't need add_status_download_routes() in every individual router.
"""
from fastapi import APIRouter
from core.job_queue import add_status_download_routes

router = APIRouter()
add_status_download_routes(router, "image")
