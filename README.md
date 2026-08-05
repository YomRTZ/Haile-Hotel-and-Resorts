# 🏨 Haile Resort Hawassa — AI Concierge Chatbot

A full-stack MERN application featuring an AI-powered hotel concierge chatbot for Haile Resort Hawassa.

---

## 🌐 Live URLs

| Service | URL |
|---|---|
| **Frontend** | https://haileresort.netlify.app |
| **Backend API** | https://haile-hotel-and-resorts.onrender.com |
| **Admin Panel** | https://haileresort.netlify.app/admin |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6 |
| Backend | Node.js, Express |
| Database | MongoDB Atlas |
| AI | Groq API (llama-3.1-8b-instant) |
| Auth | JWT |
| Frontend Hosting | Netlify |
| Backend Hosting | Render |
| CI/CD | GitHub Actions |
| Container | Docker + Docker Compose |

---

## 📁 Project Structure

```
Haile_Resort/
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # GitHub Actions CI/CD pipeline
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── hotelData.js       # Static hotel data fallback
│   ├── controllers/
│   │   ├── authController.js  # Register, login, admin login
│   │   └── chatController.js  # Chat, hotel data, sessions
│   ├── middleware/
│   │   └── auth.js            # JWT middleware
│   ├── models/
│   │   ├── ChatSession.js     # Chat session schema
│   │   ├── HotelData.js       # Hotel data schema
│   │   └── User.js            # User schema
│   ├── routes/
│   │   ├── authRoutes.js      # /api/auth/*
│   │   └── chatRoutes.js      # /api/chat/*
│   ├── .env                   # Backend secrets (never commit)
│   ├── .env.example           # Template for env vars
│   ├── Dockerfile
│   ├── package.json
│   └── server.js              # Express app entry point
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── _redirects         # Netlify SPA redirect rule
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminPanel.js  # Admin dashboard UI
│   │   │   ├── ChatInterface.js
│   │   │   ├── ChatWidget.js  # Floating chat widget
│   │   │   ├── Message.js
│   │   │   ├── VoiceControls.js
│   │   │   ├── VoiceSettings.js
│   │   │   └── VoiceWaveform.js
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   └── ChatContext.js
│   │   ├── hooks/
│   │   │   ├── useVoice.js
│   │   │   └── useVoiceFeedback.js
│   │   ├── pages/
│   │   │   ├── AdminPage.js   # /admin route
│   │   │   ├── HotelPage.js   # Main landing page
│   │   │   ├── SignIn.js
│   │   │   └── SignUp.js
│   │   ├── services/
│   │   │   ├── api.js         # Axios API client
│   │   │   ├── voiceAnalytics.js
│   │   │   ├── voiceCommands.js
│   │   │   └── voiceService.js
│   │   ├── App.js
│   │   └── index.js
│   ├── .env                   # Frontend env vars (never commit)
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── .env                       # Root env for Docker Compose (never commit)
├── .gitignore
├── docker-compose.yml
├── netlify.toml               # Netlify build config
├── render.yaml                # Render service config
└── README.md
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.<id>.mongodb.net/hotel-chatbot?retryWrites=true&w=majority
JWT_SECRET=your_long_random_secret
GROQ_API_KEY=gsk_your_groq_key
NODE_ENV=development
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env`)

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_HOTEL_NAME=Haile Resort Hawassa
```

### Production values (set in Render & Netlify dashboards)

| Variable | Used By | Value |
|---|---|---|
| `MONGO_URI` | Render | Atlas connection string |
| `GROQ_API_KEY` | Render | `gsk_...` |
| `JWT_SECRET` | Render | long random string |
| `ADMIN_USERNAME` | Render | `admin` |
| `ADMIN_PASSWORD` | Render | your password |
| `FRONTEND_URL` | Render | `https://haileresort.netlify.app` |
| `NODE_ENV` | Render | `production` |
| `PORT` | Render | `10000` |
| `REACT_APP_API_URL` | Netlify | `https://haile-hotel-and-resorts.onrender.com/api` |
| `REACT_APP_HOTEL_NAME` | Netlify | `Haile Resort Hawassa` |
| `CI` | Netlify | `false` |

---

## 🔑 GitHub Actions Secrets

Go to: **GitHub repo → Settings → Secrets and variables → Actions**

| Secret | Description |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Render deploy hook URL (from Render → Settings → Deploy Hook) |
| `NETLIFY_AUTH_TOKEN` | Netlify personal access token |
| `NETLIFY_SITE_ID` | Netlify project/site ID |
| `REACT_APP_API_URL` | `https://haile-hotel-and-resorts.onrender.com/api` |

---

## 🚀 Local Development

### Prerequisites
- Node.js 20+
- MongoDB running locally **or** Atlas URI in `.env`

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/Haile_Resort.git
cd Haile_Resort
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm start
```

App runs at `http://localhost:3000`, backend at `http://localhost:5000`.

---

## 🐳 Docker (local)

Requires Docker Desktop running and `.env` at project root with all values filled in.

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

---

## 🗄️ MongoDB Atlas Setup

1. Create free account at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free **M0** cluster
3. **Database Access** → Add user with password
4. **Network Access** → Add IP `0.0.0.0/0` (required for Render)
5. **Connect** → Drivers → copy the URI
6. Replace `<password>` and add `/hotel-chatbot` before the `?` in the URI

---

## 🤖 Groq API Setup

1. Sign up free at [console.groq.com](https://console.groq.com)
2. Go to **API Keys** → Create API Key
3. Copy the `gsk_...` key into `GROQ_API_KEY`

Model used: `llama-3.1-8b-instant` — 14,400 free requests/day.

---

## 🚢 Deployment

### Render (Backend)

1. Connect GitHub repo at [render.com](https://render.com)
2. New **Web Service** → select repo
3. Settings:
   - Root Directory: `backend`
   - Build Command: `npm ci --omit=dev`
   - Start Command: `node server.js`
4. Add all environment variables from the table above
5. Copy **Deploy Hook URL** → add as `RENDER_DEPLOY_HOOK_URL` in GitHub secrets

### Netlify (Frontend)

1. Connect GitHub repo at [netlify.com](https://netlify.com)
2. `netlify.toml` auto-configures build settings
3. Add environment variables:
   - `REACT_APP_API_URL` = `https://haile-hotel-and-resorts.onrender.com/api`
   - `REACT_APP_HOTEL_NAME` = `Haile Resort Hawassa`
   - `CI` = `false`
4. Copy **Site/Project ID** → add as `NETLIFY_SITE_ID` in GitHub secrets
5. Generate **Personal Access Token** → add as `NETLIFY_AUTH_TOKEN` in GitHub secrets

### CI/CD Flow

Every push to `main`:
1. GitHub Actions installs and builds both backend and frontend
2. If build passes → triggers Render deploy hook (backend)
3. If build passes → deploys frontend bundle to Netlify

---

## 🔐 Admin Panel

Access at `/admin` (e.g. `https://haileresort.netlify.app/admin`)

Default credentials (change in Render env vars):
- Username: `admin`
- Password: `admin123`

Features:
- View all chat sessions and full conversation history
- Edit hotel data (name, rooms, amenities, policies) that the AI uses

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/admin-login` | Admin login |
| GET | `/api/auth/me` | Get current user (protected) |

### Chat
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chat/send` | Send message, get AI response |
| GET | `/api/chat/history/:sessionId` | Get session history |
| POST | `/api/chat/clear` | Clear session |
| GET | `/api/chat/hotel-data` | Get hotel data |
| PUT | `/api/chat/hotel-data` | Update hotel data |
| GET | `/api/chat/sessions` | List all sessions (admin) |
| GET | `/api/chat/sessions/:sessionId` | Get session detail (admin) |

### Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server health check |
