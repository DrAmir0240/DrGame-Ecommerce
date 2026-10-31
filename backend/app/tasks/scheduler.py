"""APScheduler in-process cron job scheduler for DrGame platform."""
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger("drgame.scheduler")
scheduler = AsyncIOScheduler()


async def daily_rawg_sync_task():
    """Daily cron job: fetch fresh PlayStation releases from RAWG without artificial mockup titles."""
    logger.info("Executing daily RAWG games sync task...")
    try:
        from app.core.database import AsyncSessionLocal
        from app.modules.rawg_sync.services import RAWGSyncService
        async with AsyncSessionLocal() as db:
            # Sync top latest 20 releases
            synced = await RAWGSyncService.sync_top_games(db, page_size=20)
            logger.info(f"Daily RAWG sync task completed successfully: {synced} games synced.")
    except Exception as e:
        logger.warning(f"Daily RAWG sync task error: {e}")


def start_scheduler():
    """Start background scheduler if not already running."""
    if not scheduler.running:
        # Run daily at 03:00 AM UTC
        scheduler.add_job(
            daily_rawg_sync_task,
            trigger=CronTrigger(hour=3, minute=0),
            id="daily_rawg_sync",
            replace_existing=True,
        )
        scheduler.start()
        logger.info("Background AsyncIOScheduler started successfully.")


def stop_scheduler():
    """Stop background scheduler on app shutdown."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Background AsyncIOScheduler stopped.")
