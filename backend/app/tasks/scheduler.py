"""APScheduler in-process cron job scheduler for DrGame platform."""
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger("drgame.scheduler")
scheduler = AsyncIOScheduler()


async def weekly_referral_settlement_task():
    """Weekly Friday cron job: settle pending referral commissions and credit withdrawable balances."""
    logger.info("Executing weekly referral commission settlement task...")
    try:
        from app.core.database import AsyncSessionLocal
        from app.modules.wallet.settlement_service import WeeklySettlementService
        async with AsyncSessionLocal() as db:
            result = await WeeklySettlementService.execute_weekly_settlement(
                db, executed_by_type="cron"
            )
            logger.info(f"Weekly settlement completed: {result.get('total_transactions', 0)} transactions settled.")
    except Exception as e:
        logger.warning(f"Weekly referral settlement task error: {e}")


def start_scheduler():
    """Start background scheduler if not already running."""
    if not scheduler.running:
        # Run weekly on Friday at 00:00 UTC
        scheduler.add_job(
            weekly_referral_settlement_task,
            trigger=CronTrigger(day_of_week="fri", hour=0, minute=0),
            id="weekly_referral_settlement",
            name="Weekly Referral Settlement",
            replace_existing=True,
        )
        scheduler.start()
        logger.info("Background AsyncIOScheduler started successfully.")


def stop_scheduler():
    """Stop background scheduler on app shutdown."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Background AsyncIOScheduler stopped.")
