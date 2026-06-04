# SmartOps AI 🚀

**SmartOps AI** is a state-of-the-art, AI-powered Business Intelligence (BI) Dashboard designed to provide real-time operational insights, predictive analytics, and automated decision-making. Utilizing the Gemini Pro API, SmartOps AI acts as a digital co-pilot for business operations—enabling users to chat with their data, generate visualizations, and monitor key metrics in real-time.

---

## 🌟 Key Features

- **Interactive AI Copilot**: Ask questions about your business data in plain English and receive instant textual insights, SQL/noSQL query suggestions, or automated reports using Google Gemini.
- **Real-Time Data Streaming**: Instant updates of business KPIs, active sessions, and event streams powered by Socket.io.
- **Dynamic Charting & Visualization**: Interactive charts (line, bar, pie, area) built with Recharts & Chart.js, supporting zoom, filter, and theme customization.
- **Multi-Tenant Authentication**: Role-based access control (Admin, Viewer) secured by JSON Web Tokens (JWT) and bcrypt hashing.
- **CSV Data Import**: Upload operation reports, financial records, or custom metrics directly to run instant AI-driven audits.
- **Sleek Dark Glassmorphic Design**: Modern, responsive, and highly interactive user interface styled with Tailwind CSS, Lucide icons, and Framer Motion micro-animations.
- **Docker Ready**: Fully containerized environment using Docker Compose for quick local deployment.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React + Vite (Fast, optimized client builds)
- **Styling**: Tailwind CSS (Modern custom theme with HSL variables)
- **State Management**: Zustand (Sleek, lightweight reactive state)
- **Charts**: Recharts & React-Chartjs-2
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Networking**: Axios & Socket.io-client

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ORM)
- **AI Core**: Google Gemini AI (`@google/generative-ai`)
- **Real-time Engine**: Socket.io
- **Security**: Helmet, Express Rate Limit, bcryptjs
- **Logging**: Morgan
- **File Uploads**: Multer & CSV-Parser

---

## 📂 Project Structure

```bash
smartops-ai/
├── client/                          # React + Vite frontend
│   ├── src/
│   │   ├── components/              # Shared dashboard, layout, common & AI components
│   │   ├── pages/                   # Application pages (Dashboard, Login, Settings)
│   │   ├── context/                 # Context providers (e.g. socket connections)
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── services/                # Axios API services
│   │   └── utils/                   # Helpers, formatters
│   ├── public/                      # Static assets
│   └── package.json
├── server/                          # Node + Express backend
│   ├── config/                      # Database configuration
│   ├── controllers/                 # Express controllers (auth, dashboard, ai)
│   ├── middleware/                  # JWT auth, error handlers, rate-limiters
│   ├── models/                      # MongoDB/Mongoose schemas
│   ├── routes/                      # API routing
│   ├── services/                    # Gemini API & AI services
│   ├── utils/                       # Common server utilities
│   └── server.js                    # Entry point
├── docker-compose.yml               # Multi-container orchestration
├── .gitignore                       # Ignored directories
└── README.md                        # Documentation
```

---

## ⚡ Quickstart

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local instance or Atlas URI)
- Google Gemini API Key (Obtain from [Google AI Studio](https://aistudio.google.com/))

### Environment Setup

#### Backend Setup
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
3. Populate the environment variables:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/smartops
   JWT_SECRET=your_super_secret_jwt_key
   GEMINI_API_KEY=your_google_gemini_api_key
   ```
4. Install backend dependencies and run the server:
   ```bash
   npm install
   npm start
   ```

#### Frontend Setup
1. Navigate to the client folder:
   ```bash
   cd ../client
   ```
2. Create a `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000
   ```
3. Install frontend dependencies and run the development server:
   ```bash
   npm install
   npm run dev
   ```

---

## 🐳 Running with Docker

Run the entire stack (Database, Server, and Frontend) in one command:
```bash
docker-compose up --build
```
- Frontend will be served at `http://localhost:5173`
- Backend API will run at `http://localhost:5000`
- MongoDB will run internally at `mongodb://mongodb:27017/smartops`
