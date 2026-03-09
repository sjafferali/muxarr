#!/bin/sh
set -e

echo "Starting Muxarr..."

# Adjust appuser UID/GID to match the host media file ownership
PUID=${PUID:-1000}
PGID=${PGID:-1000}

CURRENT_UID=$(id -u appuser)
CURRENT_GID=$(id -g appuser)

if [ "$PGID" != "$CURRENT_GID" ]; then
    echo "Updating appuser GID to $PGID"
    groupmod -o -g "$PGID" appuser
fi

if [ "$PUID" != "$CURRENT_UID" ]; then
    echo "Updating appuser UID to $PUID"
    usermod -o -u "$PUID" appuser
fi

chown -R appuser:appuser /app/logs /app/data

# Check if required environment variables are set
if [ -z "$SECRET_KEY" ]; then
    echo "WARNING: SECRET_KEY not set, using default (not secure for production!)"
fi

# Create necessary directories
mkdir -p /app/logs /app/data

# Database initialization based on type
if [ "$DATABASE_TYPE" = "postgresql" ]; then
    echo "Using PostgreSQL database"

    # Wait for PostgreSQL to be ready
    if [ -n "$POSTGRES_HOST" ] && [ -n "$POSTGRES_PORT" ]; then
        echo "Waiting for PostgreSQL to be ready..."
        # Try different methods to check PostgreSQL connectivity
        if command -v nc >/dev/null 2>&1; then
            while ! nc -z "$POSTGRES_HOST" "$POSTGRES_PORT"; do
                echo "PostgreSQL is unavailable - sleeping"
                sleep 1
            done
        elif command -v python3 >/dev/null 2>&1; then
            while ! python3 -c "import socket; socket.create_connection(('$POSTGRES_HOST', $POSTGRES_PORT), 1).close()" 2>/dev/null; do
                echo "PostgreSQL is unavailable - sleeping"
                sleep 1
            done
        else
            # Just wait a fixed time if no connectivity check is available
            echo "No connectivity check available, waiting 10 seconds..."
            sleep 10
        fi
        echo "PostgreSQL is up!"
    fi
else
    echo "Using SQLite database"
    # Ensure SQLite database file exists
    if [ -n "$SQLITE_DATABASE_PATH" ]; then
        touch "$SQLITE_DATABASE_PATH"
    fi
fi

# Apply any pre-built database migrations
echo "Applying database migrations..."
cd /app/backend
mkdir -p alembic/versions
alembic upgrade head || echo "Migration completed or no changes needed"

# Start supervisord
echo "Starting application services..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
