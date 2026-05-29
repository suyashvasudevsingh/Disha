# Disha

Classroom Voice Intelligence for Teachers.

## Structure

- `client/` - React + Vite frontend
- `server/` - Node.js + Express + SQLite backend

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm run setup
```

## Client

- Vite app entry: `client/index.html`
- Source code: `client/src`
- UI primitives: `client/src/components/ui`
- PWA/offline helpers: `client/src/lib` and `client/src/hooks`

## Server

- Express entry: `server/src/server.ts`
- Report generation: `server/src/services/report.service.ts`
- SQLite database: `server/disha.db`

## Notes

- The root package is only an orchestrator for the two workspace folders.
- The app uses route-based code splitting on the client and a modular API layer on the server.
