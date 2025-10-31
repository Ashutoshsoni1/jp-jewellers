JP Jewellers — Option 1 (Pure JS backend) - Deploy Guide

Structure:
- frontend/   (Vite + React)
- backend/    (Express API + JSON file storage at backend/data/bills.json)

How to run locally:
1. Frontend:
   cd frontend
   npm install
   npm run dev
   open http://localhost:5173

2. Backend:
   cd backend
   npm install
   npm start
   (listens on process.env.PORT or 4000)

Deploying:
- Frontend: deploy to GitHub Pages (see vite.base '/jp-jewellers/' already set) or any static host.
- Backend: deploy to Render/Vercel/Heroku. Ensure Root Directory set to 'backend' on Render.
- The frontend auto-detects API base URL as window.location.origin + '/api' (so if frontend and backend share same domain + path prefix, it will work). If backend is deployed separately, set up a reverse proxy or edit App.jsx to set API_BASE to the backend host + '/api'.

Notes:
- Bills are stored in backend/data/bills.json (human-readable, editable).
- No native modules; no build errors on Render.
