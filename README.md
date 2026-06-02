# Disha

Classroom Voice Intelligence for Teachers.

## Quick Start

### Prerequisites
- Node.js 18+
- Optional: Gemini API key for AI-powered coaching (app works with heuristic fallback)

### Setup

1. **Install dependencies**
   ```bash
   npm install
   npm run setup
   ```

2. **Configure Gemini API (optional but recommended)**
   - Get your API key from [Google AI Studio](https://ai.google.dev/)
   - Copy `.env.example` to `server/.env` and add your key:
     ```bash
     GEMINI_API_KEY="your-key-here"
     ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   - Client: http://localhost:5173
   - Server: http://localhost:3001

> This version runs as a direct-access demo mode. No Firebase OTP or phone login is required for the main app flow.

## Architecture

- **Client**: React + Vite + Zustand (offline-first state management)
- **Server**: Node.js + Express + SQLite
- **Auth**: Direct-access demo mode (no Firebase OTP required)
- **AI**: Gemini 1.5 Flash (with heuristic fallback)
- **Storage**: IndexedDB (client) + SQLite (server)

## Features & Status

### ✅ Implemented
- Direct-access demo mode without end-user login
- Session recording with browser speech recognition
- Live transcript display with fallback
- Report generation with charts and metrics
- Deterministic coaching suggestions (always available)
- Offline-first architecture with queue persistence
- Multilingual UI (English, Hindi, Marathi, Telugu, Kannada, Tamil)

### 🟡 Conditional  
- **AI-powered coaching**: Requires `GEMINI_API_KEY`. Falls back to heuristic suggestions when unavailable.
- **Service worker model caching**: Framework in place; model assets must be provided separately.

### ℹ️ Notes
- Whisper on-device STT is architecturally supported but uses mock transcription. Real implementation requires model assets and WASM runtime.
- All flows have deterministic fallbacks ensuring stable demo experience.

## Structure

- `client/` - React + Vite frontend with offline support
- `server/` - Node.js + Express + SQLite backend with AI coaching
- `docker-compose.yml` - Optional Docker setup

## Commands

```bash
npm install          # Install all dependencies
npm run dev          # Start dev servers (client + server)
npm run build        # Build for production
npm run lint         # Run linters
npm run setup        # Initial setup script
```

## Client

- Vite app entry: `client/index.html`
- Source code: `client/src`
- UI primitives: `client/src/components/ui`
- Offline helpers: `client/src/lib` and `client/src/hooks`

## Server

- Express entry: `server/src/server.ts`
- AI coaching: `server/src/services/ai.service.ts`
- Report generation: `server/src/services/report.service.ts`
- Database: `server/disha.db` (SQLite)

## Deployment

### Demo Hosting
For a live demo, ensure:
1. Your domain is authorized in Firebase Console
2. `GEMINI_API_KEY` is set in server environment (optional)
3. Backend is accessible from client hostname

### Docker
```bash
docker-compose up
```
Runs client on port 5173 and server on port 3001.

## Troubleshooting

**No coaching suggestions?**
- Check if `GEMINI_API_KEY` is set. Without it, heuristic coaching still works.
- Verify Gemini API quota and permissions in Google Cloud Console

**Speech recognition not working?**
- Browser must support Web Speech API (Chrome, Edge recommended)
- Microphone permissions must be granted
- Fallback transcript automatically generates regardless

## Notes

- The root package is only an orchestrator for the two workspace folders.
- The app uses route-based code splitting on the client and a modular API layer on the server.
- All critical flows have fallback paths to ensure reliable demo experience.
