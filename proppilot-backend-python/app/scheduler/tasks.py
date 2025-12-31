import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from pytz import timezone

from app.database import async_session_maker
from app.domain.indices.service import IndexValueService

logger = logging.getLogger(__name__)

# Buenos Aires timezone for scheduled tasks
BUENOS_AIRES_TZ = timezone("America/Argentina/Buenos_Aires")

scheduler = AsyncIOScheduler(timezone=BUENOS_AIRES_TZ)


async def fetch_dollar_rates_hourly():
    """
    Fetch dollar rates hourly during Argentine market hours (10:00-18:00 ART).
    Runs Monday to Friday.
    """
    logger.info("Scheduled task: Fetching dollar rates (hourly during market hours)")
    try:
        async with async_session_maker() as db:
            service = IndexValueService(db)
            await service.refresh_indices_for_country("AR")
            await db.commit()
    except Exception as e:
        logger.error(f"Error in scheduled dollar rate fetch: {e}", exc_info=True)


async def fetch_icl_daily():
    """
    Fetch ICL daily at 10:00 ART (BCRA publishes in the morning).
    Runs Monday to Friday.
    """
    logger.info("Scheduled task: Fetching ICL (daily)")
    try:
        async with async_session_maker() as db:
            service = IndexValueService(db)
            await service.refresh_indices_for_country("AR")
            await db.commit()
    except Exception as e:
        logger.error(f"Error in scheduled ICL fetch: {e}", exc_info=True)


async def fetch_ipc_daily():
    """
    Fetch IPC daily at 17:00 ART (INDEC publishes mid-month at 16:00).
    Runs every day to check for new monthly data.
    """
    logger.info("Scheduled task: Fetching IPC (daily check)")
    try:
        async with async_session_maker() as db:
            service = IndexValueService(db)
            await service.refresh_indices_for_country("AR")
            await db.commit()
    except Exception as e:
        logger.error(f"Error in scheduled IPC fetch: {e}", exc_info=True)


async def initial_data_load():
    """
    Initial data load on application startup.
    Runs once after 30 seconds delay to allow application to fully start.
    """
    logger.info("Scheduled task: Initial index data load on startup")
    try:
        async with async_session_maker() as db:
            service = IndexValueService(db)
            await service.refresh_all_indices()
            await db.commit()
        logger.info("Initial index data load completed")
    except Exception as e:
        logger.error(f"Error in initial index data load: {e}", exc_info=True)


def setup_scheduler():
    """Set up all scheduled jobs."""
    # Dollar rates: hourly during market hours (10:00-18:00 ART) Monday-Friday
    scheduler.add_job(
        fetch_dollar_rates_hourly,
        CronTrigger(
            hour="10-18",
            minute=0,
            day_of_week="mon-fri",
            timezone=BUENOS_AIRES_TZ,
        ),
        id="fetch_dollar_rates",
        name="Fetch dollar rates hourly during market hours",
        replace_existing=True,
    )

    # ICL: daily at 10:00 ART Monday-Friday
    scheduler.add_job(
        fetch_icl_daily,
        CronTrigger(
            hour=10,
            minute=0,
            day_of_week="mon-fri",
            timezone=BUENOS_AIRES_TZ,
        ),
        id="fetch_icl_daily",
        name="Fetch ICL daily",
        replace_existing=True,
    )

    # IPC: daily at 17:00 ART every day
    scheduler.add_job(
        fetch_ipc_daily,
        CronTrigger(
            hour=17,
            minute=0,
            timezone=BUENOS_AIRES_TZ,
        ),
        id="fetch_ipc_daily",
        name="Fetch IPC daily",
        replace_existing=True,
    )

    # Initial data load: 30 seconds after startup
    scheduler.add_job(
        initial_data_load,
        "date",
        id="initial_data_load",
        name="Initial index data load",
        replace_existing=True,
    )

    logger.info("Scheduler jobs configured")


def start_scheduler():
    """Start the scheduler."""
    setup_scheduler()
    scheduler.start()
    logger.info("Scheduler started")


def shutdown_scheduler():
    """Shutdown the scheduler."""
    scheduler.shutdown()
    logger.info("Scheduler shutdown")
