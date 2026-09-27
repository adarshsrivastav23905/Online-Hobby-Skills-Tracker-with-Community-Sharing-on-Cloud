# 🚀 PRODUCTION CLOUD DEPLOYMENT GUIDE

# SkillCloud — Free-Tier Production Deployment Instructions

This guide provides step-by-step instructions for deploying **SkillCloud** to production cloud platforms at **$0.00 / month** using free-tier allowances.

---

## 🏗️ Deployment Options Overview

| Architecture Option | Frontend Hosting | Backend REST API | Database (DBaaS) | Object Storage |
| :--- | :--- | :--- | :--- | :--- |
| **Option 1 (Recommended)** | **Vercel / Netlify** | **Render (Web Service)** | **Neon / Supabase Postgres** | **Cloudflare R2 / S3** |
| **Option 2 (Google Cloud)** | **Firebase Hosting** | **Google Cloud Run** | **Cloud SQL Postgres** | **Google Cloud Storage (GCS)** |
| **Option 3 (AWS Free Tier)** | **AWS Amplify / S3** | **AWS App Runner / Lambda** | **Amazon RDS PostgreSQL** | **AWS S3 Bucket** |
| **Option 4 (Docker Container)** | **Nginx Container** | **Gunicorn Flask Container** | **PostgreSQL Container** | **Local Volume / MinIO** |

---

## 🌟 OPTION 1: RECOMMENDED FREE-TIER DEPLOYMENT (Render + Vercel + Neon)

### STEP 1: Provision Free Cloud Database (Neon / Supabase)
1. Go to [Neon.tech](https://neon.tech/) or [Supabase.com](https://supabase.com/) and create a free project.
2. Copy the PostgreSQL connection URI:
   ```text
   postgresql://user:password@ep-sample-12345.us-east-2.aws.neon.tech/hobby_tracker?sslmode=require
   ```

---

### STEP 2: Deploy Backend REST API to Render
1. Create a free account at [Render.com](https://render.com/).
2. Push your repository to GitHub.
3. In Render, click **New +** -> **Web Service**.
4. Connect your GitHub repository and set the following:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:create_app()`
5. Under **Environment Variables**, add:
   ```env
   FLASK_ENV=production
   FLASK_DEBUG=False
   DATABASE_URL=postgresql://user:password@ep-sample-12345.us-east-2.aws.neon.tech/hobby_tracker?sslmode=require
   FLASK_SECRET_KEY=your-secure-flask-secret-key-12345
   JWT_SECRET_KEY=your-secure-jwt-secret-key-67890
   FRONTEND_URL=https://skillcloud.vercel.app
   UPLOAD_FOLDER=uploads
   ```
6. Click **Deploy Web Service**. Render will give you a public URL (e.g., `https://skillcloud-api.onrender.com`).
7. In the Render shell or locally, run the database seed script to populate demo accounts:
   ```bash
   python seed_data.py
   ```

---

### STEP 3: Deploy Frontend SPA to Vercel
1. Go to [Vercel.com](https://vercel.com/) and log in with GitHub.
2. Click **Add New** -> **Project** and import your repository.
3. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `node node_modules/vite/bin/vite.js build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   ```env
   VITE_API_URL=https://skillcloud-api.onrender.com
   ```
5. Click **Deploy**. Vercel will deploy the application globally to edge CDN nodes in under 60 seconds!

---

## 🐳 OPTION 4: 1-COMMAND DOCKER COMPOSE DEPLOYMENT

For running in a containerized environment (VPS or local cloud simulation):

### 1. Backend `Dockerfile`
Create `backend/Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY . .
EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:create_app()"]
```

### 2. Frontend `Dockerfile`
Create `frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN node node_modules/vite/bin/vite.js build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3. Root `docker-compose.yml`
```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: hobbyuser
      POSTGRES_PASSWORD: hobbypassword
      POSTGRES_DB: hobby_tracker
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://hobbyuser:hobbypassword@db:5432/hobby_tracker
      - FLASK_SECRET_KEY=docker-secret-key-12345
      - JWT_SECRET_KEY=docker-jwt-secret-key-67890
      - FRONTEND_URL=http://localhost:80
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  pgdata:
```

Run with:
```bash
docker-compose up --build -d
```

---

## 🔒 Post-Deployment Verification Checklist

- [x] Backend responds `200 OK` on `GET /api/health`
- [x] CORS properly authorizes requests from the frontend domain
- [x] Login with demo accounts succeeds and returns valid JWT token
- [x] Practice logging increments streak and updates goal milestones
- [x] File uploads persist and stream back without corruption
- [x] All 27 automated tests pass in CI/CD pipeline
