"""
Supabase client initialization and utilities
"""

from supabase import create_client, Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


def get_supabase_client() -> Client:
    """Get Supabase client with anon key (for RLS-protected queries)"""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


def get_supabase_admin_client() -> Client:
    """
    Get Supabase client with service role key
    WARNING: Use only after proper authorization checks
    """
    logger.warning("Using Supabase service role client - ensure authorization is verified")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
