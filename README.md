# Samagama MERN

A MERN stack prototype for the Samagama internship dashboard.

## Structure

- `client/` — React frontend powered by Vite
- `server/` — Express backend REST API

## Run locally

1. Install dependencies from workspace root:
   ```bash
   npm install
   npm run dev
   ```

2. Open the client URL shown by Vite (usually `http://localhost:5173`).

## Features

- FAQ page with category accordion and search filter
- Doubt posting workflow with pending admin approval
- Admin review actions for approving or rejecting doubts
- Yaksha mini placeholder page with chat-style UI

> Note: data is stored in-memory in the backend. For production, connect MongoDB and persist data.
