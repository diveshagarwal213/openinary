# Production Deployment Guide: Docker Hub Registry Method

This guide walks you through deploying **Openinary** to a production server by building a Docker image locally, pushing it to **Docker Hub**, and pulling it directly on your production server.

---

## 📋 Prerequisites

- **Local Machine**: Docker Desktop installed.
- **Docker Hub Account**: Free account at [hub.docker.com](https://hub.docker.com).
- **Production Server**: Linux server with Docker 20.10+ and Docker Compose v2+ installed.

---

## 🚀 Step 1: Build & Push Image (Local Machine)

1. **Log in to Docker Hub**:

   ```bash
   docker login
   ```

2. **Build the production monolithic image**:

   ```bash
   docker build -t your-dockerhub-username/openinary:latest -f docker/full.Dockerfile .
   ```

   _(Replace `your-dockerhub-username` with your actual Docker Hub username)_

3. **Push the image to Docker Hub**:
   ```bash
   docker push your-dockerhub-username/openinary:latest
   ```

---

## 🖥️ Step 2: Prepare Production Server

Create a deployment folder on your production server (e.g., `/opt/openinary`):

```bash
mkdir -p /opt/openinary && cd /opt/openinary
```

### 1. Create `docker-compose.yml`

Create a `docker-compose.yml` file with the following contents:

```yaml
services:
  openinary:
    image: your-dockerhub-username/openinary:latest
    container_name: openinary
    restart: always
    ports:
      - "3000:3000"
    volumes:
      - cache-data:/app/apps/api/cache
      - public-files:/app/apps/api/public
      - db-data:/app/data
    environment:
      - NODE_ENV=production
      - MODE=fullstack
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - BETTER_AUTH_URL=${BETTER_AUTH_URL}
      - API_SECRET=${API_SECRET}
      - DOCKER_CPU_LIMIT=${DOCKER_CPU_LIMIT:-2.0}
      - DOCKER_MEMORY_LIMIT=${DOCKER_MEMORY_LIMIT:-4G}

volumes:
  cache-data:
  public-files:
  db-data:
```

### 2. Create `.env`

Create a `.env` file for production configuration:

```env
# Production Domain
BETTER_AUTH_URL=https://your-domain.com

# Production Secrets (Generate strong secrets)
# Command: openssl rand -base64 32
BETTER_AUTH_SECRET=your-32-char-random-secret

# Command: openssl rand -hex 32
API_SECRET=your-64-char-random-secret

# API Public URL
NEXT_PUBLIC_API_BASE_URL=/api

# Resource Limits
DOCKER_CPU_LIMIT=2.0
DOCKER_MEMORY_LIMIT=4G
```

---

## ⚡ Step 3: Launch Container (Production Server)

On your production server, start Openinary:

```bash
docker compose up -d
```

Check status and logs:

```bash
docker compose ps
docker compose logs -f
```

Visit `https://your-domain.com/setup` to complete initial setup!

---

## 🔄 Updating to New Versions

When you update your source code in the future:

1. **Local Machine**:

   ```bash
   docker build -t your-dockerhub-username/openinary:latest -f docker/full.Dockerfile .
   docker push your-dockerhub-username/openinary:latest
   ```

2. **Production Server**:
   ```bash
   docker compose pull
   docker compose up -d
   ```
