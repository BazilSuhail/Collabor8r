# Collabora8r API Reference

Complete API documentation for the Collabora8r server — REST endpoints, Socket.IO events, database models, and client architecture guide.

## Files

| File | What's Inside |
|------|---------------|
| `AUTH.md` | Authentication flow, JWT, sign up/in, password reset |
| `REST_API.md` | All 93 REST endpoints grouped by domain |
| `SOCKET_EVENTS.md` | All real-time events, payloads, client usage |
| `MODELS.md` | All 17 Mongoose schemas with field types |
| `CLIENT_ARCHITECTURE.md` | Zustand stores, file structure, setup guide |

## Quick Start

```bash
# Base URL
http://localhost:3001

# Auth header (all protected routes)
Authorization: Bearer <token>

# Connect socket
const socket = io("http://localhost:3001", {
  auth: { token: "<jwt>" }
});
```

## Base Response Format

```json
// Success
{ "key": "value" }

// Error
{ "error": "message" }
// or
{ "errors": { "field": "message" } }
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |
| `JWT_SECRET` | Yes | JWT signing secret |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `REDIS_URL` | No | Enables Redis adapter, BullMQ workers, presence |
| `OPENAI_API_KEY` | Yes | For AI features |

## Architecture Summary

```
Client
  ├── REST API (93 endpoints) → Express controllers → Mongoose models → MongoDB
  ├── Socket.IO → Redis adapter (scaling) → Broadcast to project rooms
  └── BullMQ workers (optional) → Notifications, emails, activity logs
```
