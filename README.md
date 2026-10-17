# Portfolio Controller Serverless API

A lightweight, zero-cold-start Node.js Serverless API tailored for **Vercel Free Tier (Hobby)**.
It serves as the backend controller for the interactive developer portfolio, allowing real-time editing of all personal, skill, project, and experience details.

---

## ⚡ Features

- **100% Vercel Free Tier Eligible**:
  - Pure Serverless Functions (`/api/*`) with instant response times (~10-25ms).
  - Zero heavy binary dependencies or long build pipelines.
- **Flexible Storage Adapter**:
  - **Free Cloud Persistence**: Compatible with **Upstash Redis / Vercel KV** free tier (10,000 requests/day free forever) via simple HTTPS REST API (`KV_REST_API_URL` & `KV_REST_API_TOKEN`).
  - **Local Dev Persistence**: Automatically persists to `data/portfolio-state.json` and in-memory cache when running locally without needing any database setup.
- **Security & Authorization**:
  - Public `GET` endpoints for portfolio presentation.
  - Protected `PUT` / `POST` / `RESET` endpoints via `x-admin-key` header or `Authorization: Bearer <secret>`.
- **CORS Enabled**: Ready to accept requests from localhost, custom domains, or Vercel deployments.

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/docs` | Interactive Swagger UI documentation & debugger | No |
| `GET` | `/openapi.json` | OpenAPI 3.0 JSON specification | No |
| `GET` | `/api/portfolio` | Retrieve current portfolio data (JSON) | No |
| `PUT` | `/api/portfolio` | Update all or part of the portfolio details | Yes (`x-admin-key`) |
| `POST` | `/api/reset` | Reset portfolio back to default seed data | Yes (`x-admin-key`) |
| `GET` | `/api/health` | Healthcheck and storage provider status | No |
| `POST` | `/api/auth` | Verify admin key validity | Yes (`x-admin-key`) |
| `PUT` | `/api/auth` | Change admin passcode to a secure password | Yes (`x-admin-key`) |

---

## 🛠️ Local Development

Run the zero-dependency local development server (runs on `http://localhost:4000`):

```bash
# Inside Portfolio-B-Serverless-API/
npm run dev
```

---

## 🚀 Deploy to Vercel (Free Tier)

### Step 1: Deploy with Vercel CLI or GitHub
```bash
npx vercel
```
Or push to GitHub and import the repository into your Vercel Dashboard.

### Step 2: Configure Environment Variables in Vercel
In your Vercel Project Settings -> **Environment Variables**:

1. `ADMIN_SECRET`: Set your desired admin passcode (e.g. `MySuperSecretPasscode!`).
2. *(Optional for permanent cloud persistence across instances)*:
   - Add **Upstash Redis** from the Vercel Marketplace (Free Tier: 1-click install).
   - Vercel will automatically add `KV_REST_API_URL` and `KV_REST_API_TOKEN`.

---

## 🧪 Testing with cURL

```bash
# 1. Fetch current portfolio
curl http://localhost:4000/api/portfolio

# 2. Update headline
curl -X PUT http://localhost:4000/api/portfolio \
  -H "Content-Type: application/json" \
  -H "x-admin-key: admin123" \
  -d '{"title": "Senior Systems & Cloud Architect"}'

# 3. Check health & storage
curl http://localhost:4000/api/health
```
