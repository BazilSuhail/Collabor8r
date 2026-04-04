# Socket.IO Events

## Connection

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", {
  auth: { token: "<jwt>" },
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("Connection failed:", err.message);
});
```

---

## Client → Server Events

### `join-project`

Join a project room to receive real-time updates.

```js
socket.emit("join-project", projectId);
```

| Field | Type | Required |
|-------|------|----------|
| projectId | string | Yes |

### `leave-project`

Leave a project room.

```js
socket.emit("leave-project", projectId);
```

| Field | Type | Required |
|-------|------|----------|
| projectId | string | Yes |

### `chat:message`

Send a chat message (also persists to MongoDB).

```js
socket.emit("chat:message", {
  projectId: "...",
  content: "Hello team!",
  type: "text",
});
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| projectId | string | Yes | |
| content | string | Yes | |
| type | string | No | `"text"` (default), `"image"`, `"file"` |

---

## Server → Client Events

### `online-count`

Fired when any user connects/disconnects. Updates global count.

```js
socket.on("online-count", ({ count }) => {
  console.log("Total online:", count);
});
```

**Payload:**
```json
{ "count": 42 }
```

### `member:online`

Fired when a user joins a project room you're in.

```js
socket.on("member:online", ({ userId, socketId }) => {
  setUserOnline(userId);
});
```

**Payload:**
```json
{
  "userId": "...",
  "socketId": "..."
}
```

### `member:offline`

Fired when a user leaves a project room you're in.

```js
socket.on("member:offline", ({ userId, socketId }) => {
  setUserOffline(userId);
});
```

**Payload:**
```json
{
  "userId": "...",
  "socketId": "..."
}
```

### `chat:message`

Fired when any user sends a chat message in a project room you're in.

```js
socket.on("chat:message", (message) => {
  appendToChat(message);
});
```

**Payload:**
```json
{
  "_id": "...",
  "projectId": "...",
  "userId": "...",
  "content": "Hello team!",
  "type": "text",
  "createdAt": "2026-01-15T10:30:00.000Z",
  "user": {
    "name": "John Doe",
    "avatar": "url"
  }
}
```

### `chat:error`

Fired only to the sender if message save fails.

```js
socket.on("chat:error", ({ error }) => {
  showToast(error);
});
```

**Payload:**
```json
{ "error": "Failed to send message" }
```

### `notification`

Fired for in-app notifications (via server helper).

```js
socket.on("notification", (notification) => {
  showNotification(notification);
});
```

**Payload:** Varies by notification type.

### `invitation`

Fired when user receives a project invitation.

```js
socket.on("invitation", (invitation) => {
  showInvitationModal(invitation);
});
```

**Payload:**
```json
{
  "_id": "...",
  "projectId": { "_id": "...", "name": "Project" },
  "invitedBy": { "_id": "...", "name": "Admin" },
  "type": "teamMember",
  "status": "pending"
}
```

---

## Usage Pattern

```js
import { io } from "socket.io-client";

let socket;

export const connectSocket = (token) => {
  socket = io("http://localhost:3001", {
    auth: { token },
  });

  socket.on("connect", () => {
    console.log("Socket connected");
  });

  return socket;
};

export const joinProject = (projectId) => {
  socket?.emit("join-project", projectId);
};

export const leaveProject = (projectId) => {
  socket?.emit("leave-project", projectId);
};

export const sendChatMessage = (projectId, content, type = "text") => {
  socket?.emit("chat:message", { projectId, content, type });
};

export const onChatMessage = (callback) => {
  socket?.on("chat:message", callback);
  return () => socket?.off("chat:message", callback);
};

export const onMemberOnline = (callback) => {
  socket?.on("member:online", callback);
  return () => socket?.off("member:online", callback);
};

export const onMemberOffline = (callback) => {
  socket?.on("member:offline", callback);
  return () => socket?.off("member:offline", callback);
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
```
