# Client Architecture Guide

Zustand stores, file structure, and setup for the Collabora8r React client.

---

## File Structure

```
src/
├── api/
│   ├── axios.js              # Axios instance with auth interceptor
│   ├── auth.js               # signup, signin, forgotPassword, resetPassword
│   ├── projects.js           # CRUD, joined, admin
│   ├── tasks.js              # CRUD, batch update
│   ├── sprints.js            # CRUD, activate, complete
│   ├── comments.js           # add, list, update, delete
│   ├── chat.js               # getMessages, sendMessage
│   ├── invitations.js        # create, pending, accept, decline
│   ├── labels.js             # CRUD
│   ├── taskLinks.js          # create, list, delete
│   ├── filters.js            # CRUD
│   ├── boards.js             # CRUD
│   ├── time.js               # entries, reports
│   ├── uploads.js            # upload, list, delete
│   ├── activity.js           # project, task, user logs
│   ├── dashboard.js          # assigned tasks, progress
│   ├── ai.js                 # all AI endpoints
│   └── profile.js            # get, update, notifications
│
├── lib/
│   └── socket.js             # Socket.IO connection + event helpers
│
├── stores/
│   ├── useAuthStore.js       # token, user, login, logout
│   ├── useProjectStore.js    # current project, projects list
│   ├── useTaskStore.js       # tasks, current task
│   ├── useSprintStore.js     # sprints, active sprint
│   ├── useChatStore.js       # messages, typing, online members
│   ├── useSocketStore.js     # socket instance, connection status
│   ├── useNotificationStore.js  # notifications, unread count
│   ├── useInvitationStore.js # pending invitations
│   └── useUIStore.js         # sidebar, modals, toasts
│
├── hooks/
│   ├── useSocket.js          # connect/disconnect on auth
│   ├── useProjectRoom.js     # join/leave project room
│   ├── useChat.js            # chat messages + real-time
│   ├── useOnlineMembers.js   # track online status
│   └── useNotifications.js   # real-time notifications
│
├── components/
│   ├── auth/
│   ├── layout/
│   ├── projects/
│   ├── tasks/
│   ├── sprints/
│   ├── chat/
│   ├── board/
│   └── common/
│
└── pages/
    ├── Login.jsx
    ├── Signup.jsx
    ├── Dashboard.jsx
    ├── ProjectView.jsx
    ├── TaskDetail.jsx
    ├── SprintView.jsx
    └── Settings.jsx
```

---

## API Layer Setup

### `api/axios.js`

```js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
```

### `api/projects.js`

```js
import api from "./axios";

export const createProject = (data) => api.post("/projects/create", data);
export const updateProject = (id, data) => api.put(`/projects/${id}/update`, data);
export const getJoinedProjects = () => api.get("/joinedprojects");
export const getAdminProjects = () => api.get("/admin-projects");
export const getProjectDetails = (id) => api.get(`/joinedprojects/${id}`);
export const getOnlineMembers = (id) => api.get(`/projects/${id}/online-members`);
```

### `api/tasks.js`

```js
import api from "./axios";

export const createTask = (data) => api.post("/manageTasks", data);
export const getProjectTasks = (projectId) => api.get(`/manageTasks/project/${projectId}`);
export const updateTask = (taskId, data) => api.patch(`/manageTasks/${taskId}`, data);
export const deleteTask = (taskId) => api.delete(`/manageTasks/${taskId}`);
export const batchUpdateTasks = (updates) => api.patch("/projecttasks/tasks/update", { updates });
```

### `api/chat.js`

```js
import api from "./axios";

export const getChatMessages = (projectId, before) =>
  api.get(`/chat/${projectId}/messages`, {
    params: { before, limit: 50 },
  });

export const sendChatMessage = (projectId, content, type = "text") =>
  api.post(`/chat/${projectId}/messages`, { content, type });
```

---

## Socket Layer

### `lib/socket.js`

```js
import { io } from "socket.io-client";

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_API_URL || "http://localhost:3001", {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  socket.on("connect", () => console.log("Socket connected:", socket.id));
  socket.on("disconnect", (reason) => console.log("Socket disconnected:", reason));
  socket.on("connect_error", (err) => console.error("Socket error:", err.message));

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const joinProject = (projectId) => socket?.emit("join-project", projectId);
export const leaveProject = (projectId) => socket?.emit("leave-project", projectId);
export const sendChatMessage = (projectId, content, type = "text") =>
  socket?.emit("chat:message", { projectId, content, type });

export const onChatMessage = (cb) => {
  socket?.on("chat:message", cb);
  return () => socket?.off("chat:message", cb);
};

export const onMemberOnline = (cb) => {
  socket?.on("member:online", cb);
  return () => socket?.off("member:online", cb);
};

export const onMemberOffline = (cb) => {
  socket?.on("member:offline", cb);
  return () => socket?.off("member:offline", cb);
};

export const onNotification = (cb) => {
  socket?.on("notification", cb);
  return () => socket?.off("notification", cb);
};

export const onInvitation = (cb) => {
  socket?.on("invitation", cb);
  return () => socket?.off("invitation", cb);
};
```

---

## Zustand Stores

### `stores/useAuthStore.js`

```js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as authApi from "../api/auth";

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      login: async (email, password) => {
        const { data } = await authApi.signin({ email, password });
        set({ token: data.token });
        return data.token;
      },

      signup: async (userData) => {
        const { data } = await authApi.signup(userData);
        set({ token: data.token });
        return data.token;
      },

      logout: () => {
        set({ token: null, user: null });
        localStorage.removeItem("token");
      },

      setToken: (token) => set({ token }),
    }),
    { name: "auth" }
  )
);

export default useAuthStore;
```

### `stores/useProjectStore.js`

```js
import { create } from "zustand";
import * as projectApi from "../api/projects";

const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    const { data } = await projectApi.getJoinedProjects();
    set({ projects: data, loading: false });
  },

  fetchProjectDetails: async (projectId) => {
    const { data } = await projectApi.getProjectDetails(projectId);
    set({ currentProject: data.project });
    return data.project;
  },

  setCurrentProject: (project) => set({ currentProject: project }),
}));

export default useProjectStore;
```

### `stores/useTaskStore.js`

```js
import { create } from "zustand";
import * as taskApi from "../api/tasks";

const useTaskStore = create((set, get) => ({
  tasks: [],
  currentTask: null,
  loading: false,

  fetchTasks: async (projectId) => {
    set({ loading: true });
    const { data } = await taskApi.getProjectTasks(projectId);
    set({ tasks: data.validTasks || data.tasks, loading: false });
  },

  createTask: async (taskData) => {
    const { data } = await taskApi.createTask(taskData);
    set((s) => ({ tasks: [...s.tasks, data.task] }));
    return data.task;
  },

  updateTask: async (taskId, updates) => {
    const { data } = await taskApi.updateTask(taskId, updates);
    set((s) => ({
      tasks: s.tasks.map((t) => (t._id === taskId ? data.task : t)),
    }));
    return data.task;
  },

  deleteTask: async (taskId) => {
    await taskApi.deleteTask(taskId);
    set((s) => ({ tasks: s.tasks.filter((t) => t._id !== taskId) }));
  },

  setCurrentTask: (task) => set({ currentTask: task }),
}));

export default useTaskStore;
```

### `stores/useSprintStore.js`

```js
import { create } from "zustand";
import * as sprintApi from "../api/sprints";

const useSprintStore = create((set) => ({
  sprints: [],
  activeSprint: null,
  loading: false,

  fetchSprints: async (projectId) => {
    set({ loading: true });
    const { data } = await sprintApi.getSprints(projectId);
    const active = data.find((s) => s.isActive);
    set({ sprints: data, activeSprint: active, loading: false });
  },

  createSprint: async (projectId, sprintData) => {
    const { data } = await sprintApi.createSprint(projectId, sprintData);
    set((s) => ({ sprints: [...s.sprints, data] }));
    return data;
  },

  activateSprint: async (sprintId) => {
    const { data } = await sprintApi.activateSprint(sprintId);
    set((s) => ({
      sprints: s.sprints.map((sp) =>
        sp._id === sprintId ? data.sprint : { ...sp, isActive: false }
      ),
      activeSprint: data.sprint,
    }));
  },

  completeSprint: async (sprintId) => {
    const { data } = await sprintApi.completeSprint(sprintId);
    set((s) => ({
      sprints: s.sprints.map((sp) =>
        sp._id === sprintId ? data.sprint : sp
      ),
      activeSprint: null,
    }));
  },
}));

export default useSprintStore;
```

### `stores/useChatStore.js`

```js
import { create } from "zustand";
import * as chatApi from "../api/chat";

const useChatStore = create((set, get) => ({
  messages: [],
  loading: false,
  hasMore: true,
  onlineMembers: new Set(),

  fetchMessages: async (projectId, before) => {
    set({ loading: true });
    const { data } = await chatApi.getChatMessages(projectId, before);
    const newMessages = data.messages.reverse();

    if (before) {
      set((s) => ({
        messages: [...newMessages, ...s.messages],
        loading: false,
        hasMore: newMessages.length === 50,
      }));
    } else {
      set({ messages: newMessages, loading: false, hasMore: newMessages.length === 50 });
    }
  },

  addMessage: (message) => {
    set((s) => {
      if (s.messages.find((m) => m._id === message._id)) return s;
      return { messages: [...s.messages, message] };
    });
  },

  setOnlineMembers: (members) => set({ onlineMembers: new Set(members) }),

  addOnlineMember: (userId) =>
    set((s) => {
      const next = new Set(s.onlineMembers);
      next.add(userId);
      return { onlineMembers: next };
    }),

  removeOnlineMember: (userId) =>
    set((s) => {
      const next = new Set(s.onlineMembers);
      next.delete(userId);
      return { onlineMembers: next };
    }),

  clearMessages: () => set({ messages: [], hasMore: true }),
}));

export default useChatStore;
```

### `stores/useSocketStore.js`

```js
import { create } from "zustand";
import { connectSocket, disconnectSocket, getSocket } from "../lib/socket";

const useSocketStore = create((set) => ({
  socket: null,
  connected: false,

  connect: (token) => {
    const socket = connectSocket(token);
    socket.on("connect", () => set({ connected: true }));
    socket.on("disconnect", () => set({ connected: false }));
    set({ socket });
  },

  disconnect: () => {
    disconnectSocket();
    set({ socket: null, connected: false });
  },
}));

export default useSocketStore;
```

### `stores/useNotificationStore.js`

```js
import { create } from "zustand";
import * as profileApi from "../api/profile";

const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    const { data } = await profileApi.getNotifications();
    set({ notifications: data.notifications });
  },

  fetchUnreadCount: async () => {
    const { data } = await profileApi.getUnreadCount();
    set({ unreadCount: data.unreadCount });
  },

  markRead: async (index) => {
    await profileApi.markNotificationRead(index);
    set((s) => ({
      notifications: s.notifications.map((n, i) =>
        i === index ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
  },

  addNotification: (notification) =>
    set((s) => ({
      notifications: [notification, ...s.notifications],
      unreadCount: s.unreadCount + 1,
    })),
}));

export default useNotificationStore;
```

### `stores/useInvitationStore.js`

```js
import { create } from "zustand";
import * as invitationApi from "../api/invitations";

const useInvitationStore = create((set) => ({
  invitations: [],
  loading: false,

  fetchPending: async () => {
    set({ loading: true });
    const { data } = await invitationApi.getPending();
    set({ invitations: data, loading: false });
  },

  acceptInvitation: async (token) => {
    const { data } = await invitationApi.accept(token);
    set((s) => ({
      invitations: s.invitations.filter((i) => i.token !== token),
    }));
    return data;
  },

  declineInvitation: async (token) => {
    const { data } = await invitationApi.decline(token);
    set((s) => ({
      invitations: s.invitations.filter((i) => i.token !== token),
    }));
    return data;
  },

  addInvitation: (invitation) =>
    set((s) => ({ invitations: [...s.invitations, invitation] })),
}));

export default useInvitationStore;
```

### `stores/useUIStore.js`

```js
import { create } from "zustand";

const useUIStore = create((set) => ({
  sidebarOpen: true,
  activeModal: null,
  toasts: [],

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),

  addToast: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { id: Date.now(), ...toast }],
    })),

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export default useUIStore;
```

---

## Hooks

### `hooks/useSocket.js`

```js
import { useEffect } from "react";
import useAuthStore from "../stores/useAuthStore";
import useSocketStore from "../stores/useSocketStore";

export const useSocket = () => {
  const token = useAuthStore((s) => s.token);
  const connect = useSocketStore((s) => s.connect);
  const disconnect = useSocketStore((s) => s.disconnect);

  useEffect(() => {
    if (token) {
      connect(token);
    }
    return () => disconnect();
  }, [token]);
};
```

### `hooks/useProjectRoom.js`

```js
import { useEffect } from "react";
import { joinProject, leaveProject } from "../lib/socket";
import useChatStore from "../stores/useChatStore";
import { getOnlineMembers } from "../api/projects";

export const useProjectRoom = (projectId) => {
  const addOnlineMember = useChatStore((s) => s.addOnlineMember);
  const removeOnlineMember = useChatStore((s) => s.removeOnlineMember);

  useEffect(() => {
    if (!projectId) return;

    joinProject(projectId);

    getOnlineMembers(projectId).then(({ data }) => {
      useChatStore.getState().setOnlineMembers(data.onlineMembers);
    });

    return () => leaveProject(projectId);
  }, [projectId]);
};
```

### `hooks/useChat.js`

```js
import { useEffect, useCallback } from "react";
import { onChatMessage } from "../lib/socket";
import useChatStore from "../stores/useChatStore";

export const useChat = (projectId) => {
  const fetchMessages = useChatStore((s) => s.fetchMessages);
  const addMessage = useChatStore((s) => s.addMessage);
  const messages = useChatStore((s) => s.messages);
  const loading = useChatStore((s) => s.loading);
  const hasMore = useChatStore((s) => s.hasMore);

  useEffect(() => {
    if (!projectId) return;
    fetchMessages(projectId);
  }, [projectId]);

  useEffect(() => {
    const cleanup = onChatMessage((message) => {
      if (message.projectId === projectId) {
        addMessage(message);
      }
    });
    return cleanup;
  }, [projectId]);

  const loadMore = useCallback(() => {
    if (messages.length > 0 && hasMore) {
      fetchMessages(projectId, messages[0].createdAt);
    }
  }, [projectId, messages, hasMore]);

  return { messages, loading, hasMore, loadMore };
};
```

### `hooks/useOnlineMembers.js`

```js
import { useEffect } from "react";
import { onMemberOnline, onMemberOffline } from "../lib/socket";
import useChatStore from "../stores/useChatStore";

export const useOnlineMembers = (projectId) => {
  const addOnlineMember = useChatStore((s) => s.addOnlineMember);
  const removeOnlineMember = useChatStore((s) => s.removeOnlineMember);

  useEffect(() => {
    const cleanupOnline = onMemberOnline(({ userId }) => {
      addOnlineMember(userId);
    });

    const cleanupOffline = onMemberOffline(({ userId }) => {
      removeOnlineMember(userId);
    });

    return () => {
      cleanupOnline();
      cleanupOffline();
    };
  }, [projectId]);
};
```

---

## Usage in Components

```jsx
// App.jsx
import { useSocket } from "./hooks/useSocket";

function App() {
  useSocket(); // connects on mount if token exists
  return <Router />;
}

// ProjectChat.jsx
import { useProjectRoom } from "./hooks/useProjectRoom";
import { useChat } from "./hooks/useChat";
import { useOnlineMembers } from "./hooks/useOnlineMembers";
import useChatStore from "../stores/useChatStore";
import { sendChatMessage } from "../lib/socket";

function ProjectChat({ projectId }) {
  useProjectRoom(projectId);
  useOnlineMembers(projectId);
  const { messages, loading, hasMore, loadMore } = useChat(projectId);
  const onlineMembers = useChatStore((s) => s.onlineMembers);

  const handleSend = (content) => {
    sendChatMessage(projectId, content);
  };

  return (
    <div>
      <div>Online: {onlineMembers.size}</div>
      {hasMore && <button onClick={loadMore}>Load more</button>}
      {messages.map((msg) => (
        <div key={msg._id}>
          <strong>{msg.user.name}</strong>: {msg.content}
        </div>
      ))}
      <input onKeyDown={(e) => handleSend(e.target.value)} />
    </div>
  );
}
```
