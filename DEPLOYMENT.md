# SmartOps AI - Production Deployment Guide

This guide outlines step-by-step instructions to configure, launch, and manage the SmartOps AI application in a production environment. 

We will deploy the **React Frontend** to **Vercel** and the **Express Backend** to **Render**, backed by a cloud-hosted **MongoDB Atlas** cluster.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Variables Matrix](#environment-variables-matrix)
3. [Database Setup: MongoDB Atlas](#database-setup-mongodb-atlas)
4. [Generative AI: Google Gemini Setup](#generative-ai-google-gemini-setup)
5. [Backend Deployment: Render](#backend-deployment-render)
6. [Frontend Deployment: Vercel](#frontend-deployment-vercel)
7. [Post-Deployment Verification](#post-deployment-verification)

---

## Prerequisites

Before starting, ensure you have active accounts on:
* [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Cloud DB Hosting)
* [Google AI Studio](https://aistudio.google.com/) (Gemini AI Credentials)
* [Render](https://render.com/) (Backend Web Service Hosting)
* [Vercel](https://vercel.com/) (Frontend Static Site Hosting)
* [GitHub](https://github.com/) (Code repository)

---

## Environment Variables Matrix

Ensure the following variables are configured correctly during deployment:

### Backend Environment Variables (Render)

| Variable Name | Required | Default / Example | Purpose |
|:---|:---:|:---|:---|
| `PORT` | Yes | `5005` | Port the Express application listens on. |
| `NODE_ENV` | Yes | `production` | Set to `production` to activate optimizations and security filters. |
| `MONGODB_URI` | Yes | `mongodb+srv://...` | Connection string for MongoDB database cluster. |
| `JWT_SECRET` | Yes | `generate-random-hash` | Key to sign JWT access tokens. Make it a secure cryptographically random string. |
| `JWT_EXPIRE` | No | `7d` | Shelf life of authorization session tokens. |
| `GEMINI_API_KEY` | Yes | `AIzaSy...` | API credential token generated from Google AI Studio. |
| `CLIENT_URL` | Yes | `https://smartops.vercel.app` | Comma-separated list of allowed Frontend domain origins for CORS protection. |

### Frontend Environment Variables (Vercel)

| Variable Name | Required | Default / Example | Purpose |
|:---|:---:|:---|:---|
| `VITE_API_URL` | Yes | `https://smartops-api.onrender.com` | Base URL of the deployed Render backend API service. |

---

## Database Setup: MongoDB Atlas

1. **Create Cluster**: Sign in to MongoDB Atlas and launch a free shared cluster (M0). Choose your preferred region.
2. **Setup Credentials**: Navigate to **Database Access** under Security:
   - Create a database user.
   - Choose **Password** authentication and record the credentials.
3. **Configure Network Whitelist**: Under **Network Access**:
   - Add an IP entry. For serverless hosting environments like Render, select **Allow Access from Anywhere** (`0.0.0.0/0`).
4. **Retrieve Connection URI**: Go to the Clusters tab and click **Connect**:
   - Choose **Connect your application**.
   - Copy the provided driver connection string.
   - Replace `<password>` with your database user password and record this URI for the backend configuration.

---

## Generative AI: Google Gemini Setup

1. Log in to [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API key** in the top navigation menu.
3. Select **Create API Key in New Project** (or bind it to an existing Google Cloud project).
4. Copy your generated API key.
5. Store this safely to supply under `GEMINI_API_KEY`.

---

## Backend Deployment: Render

You can deploy the backend manually or automatically using Render Blueprint configurations.

### Option A: Automatic Blueprint Deployment (Recommended)
Our codebase contains a `render.yaml` file that pre-configures both front and back-end resources on Render.
1. Log in to **Render Dashboard** and click **Blueprints** -> **New Blueprint Instance**.
2. Select your cloned SmartOps AI GitHub repository.
3. Render will parse `render.yaml` and prompt you for the missing environment values:
   - `MONGODB_URI`
   - `GEMINI_API_KEY`
   - `CLIENT_URL` (Set this to your future Vercel URL once generated).
4. Click **Apply** to deploy.

### Option B: Manual Backend Web Service Deployment
1. Click **New +** -> **Web Service** in your Render Dashboard.
2. Select your GitHub repository.
3. Set the following parameters:
   - **Name**: `smartops-ai-backend`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Expand the **Advanced** section:
   - Click **Add Environment Variable** and add the backend variables from the [Environment Variables Matrix](#backend-environment-variables-render).
   - Set **Health Check Path** to `/api/health`.
5. Click **Create Web Service**.

---

## Frontend Deployment: Vercel

1. Log in to **Vercel Dashboard** and click **Add New** -> **Project**.
2. Import your cloned SmartOps AI GitHub repository.
3. Configure project options:
   - **Framework Preset**: `Vite` (automatically detected).
   - **Root Directory**: `client`
4. Expand the **Environment Variables** accordion:
   - Key: `VITE_API_URL`
   - Value: `https://your-render-backend-url.onrender.com` (Retrieve the URL from your Render Web Service dashboard).
5. Click **Deploy**. Vercel will build the frontend and serve it at a custom subdomain (e.g., `smartops-ai.vercel.app`).
6. Copy this URL and update the `CLIENT_URL` environment variable in your **Render backend service configuration** to enforce CORS protection.

---

## Post-Deployment Verification

1. **Verify Health Endpoint**: Visit `https://your-backend-url.onrender.com/api/health` in your browser. Ensure the response status is `200 OK` and returns JSON confirming database connection status:
   ```json
   {
     "status": "healthy",
     "environment": "production",
     "database": {
       "status": "connected"
     }
   }
   ```
2. **Inspect CORS Logs**: Open your deployed Vercel site, register/login, and verify that the dashboard pulls metrics without throwing console CORS errors.
3. **Verify WebSocket Live Sync**: Open two separate browser tabs to the deployed Vercel dashboard. Fluctuate metrics or send a chat in one tab, and verify that the changes instantly update in the other tab.
