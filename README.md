# Muxarr

A media track manager for your *arr media library. Muxarr integrates with Radarr and Sonarr to give you full visibility and control over the audio and subtitle tracks in your media files.

## Features

- **Library sync** -- imports movies from Radarr and series from Sonarr
- **Track analysis** -- probes media files with ffprobe to list all audio and subtitle tracks with codec, language, channel layout, and bitrate details
- **Set default tracks** -- change the default audio or subtitle track in-place using mkvpropedit (no remuxing required)
- **Remove tracks** -- strip unwanted audio or subtitle tracks by remuxing with mkvmerge
- **Dark-themed UI** -- clean, responsive interface for browsing your library and managing tracks
- **Search and filter** -- find media by title, filter by movies or shows
- **Library stats** -- total titles, track counts, and library size at a glance

## Quick Start

### Docker Compose (Recommended)

1. Create a `docker-compose.yml`:

```yaml
services:
  muxarr:
    image: sjafferali/muxarr:latest
    container_name: muxarr
    ports:
      - "8080:8080"
    environment:
      - DATABASE_TYPE=sqlite
      - SQLITE_DATABASE_PATH=/app/data/muxarr.db
      - RADARR_URL=http://radarr:7878
      - RADARR_API_KEY=your-radarr-api-key
      - SONARR_URL=http://sonarr:8989
      - SONARR_API_KEY=your-sonarr-api-key
      - SECRET_KEY=generate-a-random-string-here
    restart: unless-stopped
    volumes:
      - muxarr_data:/app/data
      - /path/to/your/media:/media  # mount your media library

volumes:
  muxarr_data:
```

2. Start the container:

```bash
docker compose up -d
```

3. Open http://localhost:8080 and click **Sync** to import your library.

### Docker Run

```bash
docker run -d \
  --name muxarr \
  -p 8080:8080 \
  -e RADARR_URL=http://radarr:7878 \
  -e RADARR_API_KEY=your-radarr-api-key \
  -e SONARR_URL=http://sonarr:8989 \
  -e SONARR_API_KEY=your-sonarr-api-key \
  -e SECRET_KEY=generate-a-random-string-here \
  -v muxarr_data:/app/data \
  -v /path/to/your/media:/media \
  sjafferali/muxarr:latest
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `RADARR_URL` | _(empty)_ | Radarr server URL (e.g., `http://radarr:7878`) |
| `RADARR_API_KEY` | _(empty)_ | Radarr API key (Settings > General in Radarr) |
| `SONARR_URL` | _(empty)_ | Sonarr server URL (e.g., `http://sonarr:8989`) |
| `SONARR_API_KEY` | _(empty)_ | Sonarr API key (Settings > General in Sonarr) |
| `DATABASE_TYPE` | `sqlite` | Database type (`sqlite` or `postgresql`) |
| `SQLITE_DATABASE_PATH` | `./muxarr.db` | SQLite database file path |
| `SECRET_KEY` | _(insecure default)_ | Secret key for the application -- generate a random string for production |
| `WORKERS` | `1` | Number of uvicorn worker processes |
| `FFPROBE_PATH` | `ffprobe` | Path to ffprobe binary (included in Docker image) |
| `MKVPROPEDIT_PATH` | `mkvpropedit` | Path to mkvpropedit binary (included in Docker image) |
| `MKVMERGE_PATH` | `mkvmerge` | Path to mkvmerge binary (included in Docker image) |
| `CORS_ORIGINS` | `["http://localhost:3000","http://localhost:5173"]` | Allowed CORS origins |
| `ENVIRONMENT` | `development` | Environment name |
| `PRODUCTION` | `false` | Production mode (disables API docs) |
| `DEBUG` | `true` | Debug mode |
| `LOG_LEVEL` | `INFO` | Logging level |

### PostgreSQL (Optional)

For larger libraries, you can use PostgreSQL instead of SQLite:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_TYPE` | `sqlite` | Set to `postgresql` |
| `POSTGRES_HOST` | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_USER` | `postgres` | PostgreSQL user |
| `POSTGRES_PASSWORD` | `postgres` | PostgreSQL password |
| `POSTGRES_DB` | `webapp` | PostgreSQL database name |

### Volume Mounts

| Path | Purpose |
|---|---|
| `/app/data` | Database storage (SQLite) |
| `/media` (or your choice) | Your media library -- must match the paths Radarr/Sonarr report for media files |

**Important:** The media volume mount path must match what Radarr/Sonarr report as file paths. If Radarr says a movie is at `/movies/Movie Name/movie.mkv`, mount your movies directory to `/movies` in the Muxarr container.

## How It Works

1. **Sync** -- Muxarr calls the Radarr/Sonarr APIs to discover your media library (titles, posters, quality info)
2. **Probe** -- Each media file is scanned with `ffprobe` to extract audio and subtitle track metadata
3. **Browse** -- The web UI displays your library with track counts and lets you drill into individual titles
4. **Manage** -- Set default tracks (uses `mkvpropedit`, instant, no remux) or remove tracks (uses `mkvmerge`, remuxes the file)

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 20+
- Poetry
- ffprobe, mkvpropedit, mkvmerge (from ffmpeg and mkvtoolnix packages)

### Backend

```bash
poetry install
cd backend
poetry run uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server runs at http://localhost:5173 and proxies API requests to the backend at http://localhost:8000.

### Running Tests

```bash
# All CI checks
./scripts/run_ci_checks.sh

# Backend tests only
poetry run pytest

# Frontend type check + lint + build
cd frontend && npm run type-check && npm run lint && npm run build
```

## API

When running in development mode, interactive API docs are available at `/api/docs`.

Key endpoints:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/media` | List media (supports `?media_type=movie&search=term`) |
| `GET` | `/api/v1/media/stats` | Library statistics |
| `GET` | `/api/v1/media/{id}` | Media detail with all tracks |
| `POST` | `/api/v1/media/sync` | Sync from Radarr/Sonarr |
| `POST` | `/api/v1/media/{id}/tracks/audio/{track_id}/default` | Set default audio track |
| `POST` | `/api/v1/media/{id}/tracks/subtitle/{track_id}/default` | Set default subtitle track |
| `DELETE` | `/api/v1/media/{id}/tracks/audio/{track_id}` | Remove audio track |
| `DELETE` | `/api/v1/media/{id}/tracks/subtitle/{track_id}` | Remove subtitle track |

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/  # API route handlers
│   │   ├── core/              # Database setup
│   │   ├── models/            # SQLAlchemy models (Media, AudioTrack, SubtitleTrack)
│   │   ├── schemas/           # Pydantic response schemas
│   │   ├── services/          # Radarr, Sonarr, ffprobe, mkvtoolnix integrations
│   │   ├── config.py          # Settings
│   │   └── main.py            # FastAPI app
│   ├── tests/
│   └── alembic/               # Database migrations
├── frontend/
│   ├── src/
│   │   ├── api/               # API client functions
│   │   ├── components/        # React components
│   │   ├── types/             # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
├── deployment/                # nginx, supervisor, entrypoint configs
├── docker-compose.yml         # Production deployment
├── Dockerfile                 # Multi-stage build
└── pyproject.toml             # Python dependencies
```

## GitHub Actions CI/CD

The workflow at `.github/workflows/main.yml` runs on every push to `main` and on version tags (`v*`). It runs tests, linting, and builds + pushes the Docker image.

### Required Setup

Configure these in your GitHub repository under **Settings > Secrets and variables > Actions**:

**Repository Variables** (Settings > Variables > New repository variable):

| Variable | Value |
|---|---|
| `DOCKER_IMAGE_NAME` | `sjafferali/muxarr` |

**Repository Secrets** (Settings > Secrets > New repository secret):

| Secret | Description |
|---|---|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token (create at https://hub.docker.com/settings/security) |

**Optional Secrets:**

| Secret | Description |
|---|---|
| `CODECOV_TOKEN` | For uploading coverage reports to Codecov |
| `WEBHOOK_URL` | Webhook URL for deployment notifications |
| `WEBHOOK_SECRET` | Webhook secret for deployment notifications |

### What the Pipeline Does

1. **Backend tests** -- runs pytest against a PostgreSQL service container
2. **Frontend tests** -- TypeScript check, ESLint, production build
3. **Python linting** -- ruff and mypy
4. **Dependency security check** -- npm audit
5. **Docker build** -- builds the multi-stage Docker image
6. **Docker push** -- pushes to Docker Hub with tags:
   - `latest` (main branch)
   - `main` (branch name)
   - `v1.0.0`, `v1.0`, `v1` (semantic version tags)
   - `main-abc1234` (branch + short SHA)

## License

MIT
