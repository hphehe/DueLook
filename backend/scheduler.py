import logging

from apscheduler.schedulers.background import BackgroundScheduler
from db import get_db
from repositories import user_repository
from services import gmail_service

logger = logging.getLogger(__name__)


def sync_all_users():
    with get_db() as conn:
        user_ids = user_repository.get_all_google_user_ids(conn)
    for user_id in user_ids:
        try:
            result = gmail_service.sync(user_id)
            print(f"[scheduler] user={user_id} imported={result.imported} skipped={result.skipped}", flush=True)
        except Exception as e:
            print(f"[scheduler] user={user_id} failed: {e}", flush=True)


scheduler = BackgroundScheduler()
scheduler.add_job(sync_all_users, "interval", minutes=2, id="gmail_sync")
