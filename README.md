# SatelliteFinder

A web app that visualizes live ISS telemetry and Starlink satellite positions on a 3D globe (Cesium).
Frontend is a Vite app. Backend is a FastAPI service that provides ISS and Starlink APIs.

## Demo

- Frontend (Cloudflare Pages): https://satellitefinder.pages.dev
- Backend (Render): https://satellitefinder.onrender.com
- API Docs (Swagger): https://satellitefinder.onrender.com/docs

## Features

- 3D globe visualization with Cesium
- Live ISS position + simple trail
- Load and render Starlink satellites (limit slider)
- "Locate Me" and "Nearest Starlink" (snap + optional fly-to)
- Click satellite point to select and focus
- Basic HUD for telemetry and selection info

## Tech Stack

- Frontend: Vite + JavaScript, CesiumJS
- Backend: Python, FastAPI, Uvicorn
- Deployment: Cloudflare Pages (frontend), Render (backend)

## Project Structure

- frontend/         Vite app (Cesium viewer + HUD)
- backend/          FastAPI service
- data/             (optional) generated/static data if used

## Run Locally

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

# start
```
./start.sh
```
# or
```
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Open:
http://127.0.0.1:8000/docs

### Frontend
```
cd frontend
npm install
npm run dev
```
Open:
http://127.0.0.1:5173


## Author
Yan

Software / Graphics / Interactive Systems Developer

© 2026 Yan. All rights reserved.
