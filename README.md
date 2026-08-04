# 🏨 Hotel Chatbot — MERN Stack

An AI-powered hotel concierge chatbot built with MongoDB, Express, React, and Node.js, backed by the OpenAI API.

## Features

- 💬 Real-time AI chat (GPT-3.5-turbo) with hotel-specific context
- 🎤 Voice input (speech-to-text) and 🔊 text-to-speech output
- 💾 Persistent chat sessions in MongoDB
- ⚙️ Admin dashboard — view sessions, update hotel data
- 🔐 JWT-protected admin routes
- 🐳 Docker Compose for one-command setup
- 📱 Fully responsive UI

## Quick Start (local development)

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`)
- An [OpenAI API key](https://platform.openai.com/api-keys)

### 1. Backend

```bash
cd backend
npm install
# Edit .env and set OPENAI_API_KEY
npm run dev        # starts on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm start          # starts on http://localhost:3000
```

## Docker

```bash
# Copy and edit the env file
cp backend/.env .env
# Add your OPENAI_API_KEY to .env

docker-compose up --build
```

App: http://localhost:3000  
API: http://localhost:5000/api/health

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/hotel-chatbot` |
| `JWT_SECRET` | Secret key for JWT signing | — |
| `OPENAI_API_KEY` | OpenAI API key | — |
| `ADMIN_USERNAME` | Admin login username | `admin` |
| `ADMIN_PASSWORD` | Admin login password | `admin123` |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Backend API base URL |
| `REACT_APP_HOTEL_NAME` | Hotel display name |

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/chat/message` | — | Send a message |
| GET | `/api/chat/session/:id` | — | Get session history |
| DELETE | `/api/chat/session/:id` | — | Clear a session |
| POST | `/api/chat/admin/login` | — | Admin login |
| GET | `/api/chat/admin/sessions` | JWT | List all sessions |
| GET | `/api/chat/admin/sessions/:id` | JWT | Session detail |
| GET | `/api/chat/admin/hotel` | JWT | Get hotel data |
| PUT | `/api/chat/admin/hotel` | JWT | Update hotel data |

## Project Structure

```
hotel-chatbot-mern/
├── backend/
│   ├── server.js
│   ├── .env
│   ├── Dockerfile
│   ├── routes/chatRoutes.js
│   ├── controllers/chatController.js
│   ├── models/
│   │   ├── ChatSession.js
│   │   └── HotelData.js
│   ├── middleware/auth.js
│   └── config/
│       ├── db.js
│       └── hotelData.js
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── components/
│   │   │   ├── ChatInterface.js
│   │   │   ├── Message.js
│   │   │   ├── VoiceControls.js
│   │   │   └── AdminPanel.js
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── voiceService.js
│   │   ├── context/ChatContext.js
│   │   └── styles/App.css
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .env
└── docker-compose.yml
```
