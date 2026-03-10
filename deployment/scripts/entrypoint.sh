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

chown -R appuser:appuser /app/logs

# Check if required environment variables are set
if [ -z "$SECRET_KEY" ]; then
    echo "WARNING: SECRET_KEY not set, using default (not secure for production!)"
fi

# Create necessary directories
mkdir -p /app/logs

# Start supervisord
echo "Starting application services..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
