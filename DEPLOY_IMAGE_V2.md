# Production Deployment Guide: Docker Hub Registry Method

This guide walks you through deploying **Openinary** to a production server by building a Docker image locally, pushing it to **Docker Hub**, and pulling it directly on the production server.

The Docker image is built as a **multi-platform image** supporting both:

- `linux/amd64`
- `linux/arm64`

This allows the same Docker image to run on both Intel/AMD servers and ARM64 servers.

---

## 📋 Prerequisites

### Local Machine

- Docker Desktop installed
- Docker Buildx available
- Docker Hub account

### Docker Hub

Create an account at:

https://hub.docker.com

Make sure you are logged in:

```bash
docker login
```

### Production Server

- Linux server
- Docker 20.10+
- Docker Compose v2+
- Sufficient CPU, RAM, and disk space
- Required domain/DNS configuration

---

# 🚀 Step 1: Build & Push Image

Build the production monolithic Openinary image locally and push it to Docker Hub.

## 1. Log in to Docker Hub

```bash
docker login
```

Enter your Docker Hub username and password/token when prompted.

---

## 2. Build a Multi-Platform Image

Use Docker Buildx to build the image for both AMD64 and ARM64:

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t your-dockerhub-username/openinary:latest \
  -f docker/full.Dockerfile \
  --push .
```

Replace:

```text
your-dockerhub-username
```

with your actual Docker Hub username.

For example:

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t diveshzentratech/openinary:latest \
  -f docker/full.Dockerfile \
  --push .
```

```
docker buildx build \
  --platform linux/arm64 \
  -t diveshzentratech/openinary:latest \
  -f docker/full.Dockerfile \
  --push .
```

### Why use `--platform`?

Different servers can use different CPU architectures.

For example:

```text
Local Machine       → linux/amd64
Production Server   → linux/arm64
```

A normal Docker build may produce only the architecture of your local machine.

Using:

```bash
--platform linux/amd64,linux/arm64
```

creates a multi-platform image:

```text
openinary:latest
├── linux/amd64
└── linux/arm64
```

Docker will automatically pull the correct image for the server's architecture.

### Why use `--push`?

The `--push` option pushes the built image directly to Docker Hub.

Therefore, you do **not** need to run:

```bash
docker push ...
```

separately.

---

# 🖥️ Step 2: Prepare Production Server

Create a deployment directory:

```bash
mkdir -p /opt/openinary
cd /opt/openinary
```

You can use a different directory if required.

For example:

```bash
mkdir -p /zentratech/openinary
cd /zentratech/openinary
```

---

# 📄 Step 3: Create `docker-compose.yml`

Create:

```text
docker-compose.yml
```

with the following contents:

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

Replace:

```text
your-dockerhub-username
```

with your Docker Hub username.

For example:

```yaml
image: diveshzentratech/openinary:latest
```

---

# 🔐 Step 4: Create `.env`

Create:

```text
.env
```

in the same directory as `docker-compose.yml`.

Example:

```env
# Production Domain
BETTER_AUTH_URL=https://your-domain.com

# Production Secrets
# Generate with:
# openssl rand -base64 32
BETTER_AUTH_SECRET=your-32-char-random-secret

# Generate with:
# openssl rand -hex 32
API_SECRET=your-64-char-random-secret

# API Public URL
NEXT_PUBLIC_API_BASE_URL=/api

# Resource Limits
DOCKER_CPU_LIMIT=2.0
DOCKER_MEMORY_LIMIT=4G
```

### Generate secure secrets

For `BETTER_AUTH_SECRET`:

```bash
openssl rand -base64 32
```

For `API_SECRET`:

```bash
openssl rand -hex 32
```

Do not commit `.env` to Git.

---

# 🔍 Step 5: Verify Server Architecture

Before starting Openinary, you can check the server architecture:

```bash
uname -m
```

Common results:

```text
x86_64
```

means:

```text
linux/amd64
```

and:

```text
aarch64
```

means:

```text
linux/arm64
```

Because the Docker image is multi-platform, both architectures are supported.

---

# ⚡ Step 6: Pull and Launch Openinary

From the directory containing `docker-compose.yml`:

```bash
docker compose pull
```

Then:

```bash
docker compose up -d
```

Check the container:

```bash
docker compose ps
```

You should see something similar to:

```text
NAME       STATUS
openinary  Up
```

---

# 🔎 Step 7: Verify the Running Container

Check all running containers:

```bash
docker ps
```

Check the Openinary logs:

```bash
docker compose logs -f openinary
```

Or:

```bash
docker logs -f openinary
```

To show the last 100 lines:

```bash
docker logs --tail 100 openinary
```

---

# 🧪 Step 8: Verify Docker Image Architecture

You can verify which architecture Docker pulled:

```bash
docker image inspect your-dockerhub-username/openinary:latest \
  --format '{{.Architecture}}/{{.Os}}'
```

For example, on an ARM64 server:

```text
arm64/linux
```

On an AMD64 server:

```text
amd64/linux
```

The same Docker Hub tag can therefore be used on both architectures.

---

# 🌐 Step 9: Complete Openinary Setup

Once the container is running, open:

```text
https://your-domain.com/setup
```

Complete the initial Openinary setup.

Make sure your reverse proxy/Nginx configuration forwards traffic to:

```text
localhost:3000
```

or the appropriate Docker host/container configuration.

---

# 🔄 Updating Openinary

When Openinary source code is updated, rebuild and push the image from your local machine.

## 1. Build and Push

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t your-dockerhub-username/openinary:latest \
  -f docker/full.Dockerfile \
  --push .
```

---

## 2. Pull the New Image on the Server

SSH into the production server:

```bash
cd /opt/openinary
```

Then:

```bash
docker compose pull
```

---

## 3. Recreate the Container

```bash
docker compose up -d
```

Docker Compose will recreate the container using the newly pulled image.

---

## 4. Check the Deployment

```bash
docker compose ps
```

Then check logs:

```bash
docker compose logs -f openinary
```

---

# 🛑 Stopping Openinary

To stop Openinary:

```bash
docker compose stop
```

This stops the Openinary container without deleting the named volumes.

Start it again with:

```bash
docker compose start
```

---

# 🗑️ Removing the Container

To stop and remove the Openinary container:

```bash
docker compose down
```

This removes the Compose container and network but **does not normally remove named volumes**.

Your data volumes remain:

```text
cache-data
public-files
db-data
```

Do **not** use `-v` unless you intentionally want to delete the volumes.

```bash
docker compose down -v
```

⚠️ `docker compose down -v` will delete the Compose-managed volumes and can result in data loss.

---

# 💾 Volumes and Persistent Data

The Compose configuration uses named volumes:

```yaml
volumes:
  cache-data:
  public-files:
  db-data:
```

These provide persistent storage outside the container.

The mappings are:

```text
cache-data
    ↓
/app/apps/api/cache

public-files
    ↓
/app/apps/api/public

db-data
    ↓
/app/data
```

Recreating the Openinary container does not remove these volumes.

---

# 🔧 Troubleshooting

## Container keeps restarting

Check the logs:

```bash
docker compose logs --tail 100 openinary
```

or:

```bash
docker logs --tail 100 openinary
```

---

## `exec format error`

If you see:

```text
exec /usr/local/bin/docker-entrypoint.sh: exec format error
```

check the server architecture:

```bash
uname -m
```

Then check the image architecture:

```bash
docker image inspect your-dockerhub-username/openinary:latest \
  --format '{{.Architecture}}/{{.Os}}'
```

If the server is:

```text
aarch64
```

but the image is:

```text
amd64/linux
```

the image was built for the wrong architecture.

Rebuild it using:

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t your-dockerhub-username/openinary:latest \
  -f docker/full.Dockerfile \
  --push .
```

Then pull it again:

```bash
docker compose pull
docker compose up -d
```

---

## Docker is using an old image

Force Docker to pull the latest image:

```bash
docker compose pull
```

Then recreate:

```bash
docker compose up -d
```

If necessary:

```bash
docker compose down
docker compose pull
docker compose up -d
```

---

## Check which image the container is actually using

```bash
docker inspect openinary \
  --format '{{.Config.Image}}'
```

---

# 🔐 Production Security Checklist

Before production deployment, verify:

- [ ] `BETTER_AUTH_SECRET` is a strong random secret
- [ ] `API_SECRET` is a strong random secret
- [ ] `.env` is not committed to Git
- [ ] HTTPS is enabled
- [ ] `/setup` is protected appropriately after initial setup
- [ ] Docker ports are exposed only when necessary
- [ ] Database/data volumes are backed up
- [ ] Docker Hub credentials are protected
- [ ] Production secrets are not included in the Docker image
- [ ] Firewall rules are configured correctly
- [ ] Nginx/reverse proxy is configured correctly
- [ ] Openinary logs are monitored

---

# 📌 Quick Deployment Reference

## Local Machine

```bash
docker login

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t your-dockerhub-username/openinary:latest \
  -f docker/full.Dockerfile \
  --push .
```

## Production Server

```bash
cd /opt/openinary

docker compose pull

docker compose up -d

docker compose ps

docker compose logs -f openinary
```

## Update

### Local:

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t your-dockerhub-username/openinary:latest \
  -f docker/full.Dockerfile \
  --push .
```

### Server:

```bash
cd /opt/openinary
docker compose pull
docker compose up -d
```

---

# 🏗️ Deployment Architecture

```text
                    Local Machine
                         |
                         |
                  Docker Buildx
                         |
             +-----------+-----------+
             |                       |
       linux/amd64              linux/arm64
             |                       |
             +-----------+-----------+
                         |
                         v
                  Docker Hub
                         |
              openinary:latest
                         |
             +-----------+-----------+
             |                       |
             v                       v
       AMD64 Server             ARM64 Server
             |                       |
             | Docker automatically  |
             | selects architecture  |
             v                       v
          Openinary               Openinary
```

Using a multi-platform Docker image means the same:

```text
your-dockerhub-username/openinary:latest
```

tag can be deployed to both AMD64 and ARM64 servers without changing the Docker Compose configuration.
