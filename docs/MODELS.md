# Database Models

17 Mongoose schemas. MongoDB collections.

---

## Profile

User account. `_id` is auto-generated ObjectId.

```js
{
  _id: ObjectId,
  name: String,         // required
  email: String,        // required, unique
  phone: String,
  password: String,     // hashed, required
  avatar: String,       // URL
  dob: Date,
  gender: String,       // "male" | "female" | "other"
  assignedTasks: [ObjectId],  // refs → AssignedTask._id
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** `{ email: 1 }` (unique)

---

## Project

Top-level container for work.

```js
{
  _id: ObjectId,
  name: String,         // required
  description: String,
  methodology: String,  // "sprint" | "kanban"
  createdBy: ObjectId,  // → Profile._id
  leads: [ObjectId],    // → Profile._id
  team: [ObjectId],     // → Profile._id
  statuses: [String],   // e.g. ["To Do", "In Progress", "Done"]
  tags: [String],
  objectives: [String],
  links: [Mixed],
  attachments: [Mixed],
  visibility: String,   // "private" | "public"
  status: String,       // "active" | "archived"
  category: String,
  theme: String,
  startDate: Date,
  targetDate: Date,
  version: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Task

Work item within a project.

```js
{
  _id: ObjectId,
  title: String,        // required
  description: String,
  status: String,       // e.g. "To Do", "In Progress", "Done"
  priority: String,     // "low" | "medium" | "high" | "critical"
  progress: Number,     // 0-100
  dueDate: Date,
  projectId: ObjectId,  // → Project._id (indexed)
  sprintId: ObjectId,   // → Sprint._id (indexed)
  assignedTo: ObjectId, // → Profile._id
  parentId: ObjectId,   // → Task._id (subtask)
  estimateHours: Number,
  loggedHours: Number,
  labels: [ObjectId],   // → Label._id
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    uploadedAt: Date
  }],
  acceptanceCriteria: [String],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** `{ projectId: 1 }`, `{ sprintId: 1 }`

---

## Sprint

Time-boxed iteration.

```js
{
  _id: ObjectId,
  name: String,         // required
  goal: String,
  projectId: ObjectId,  // → Project._id
  startDate: Date,
  endDate: Date,
  isActive: Boolean,
  isCompleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Virtual:** `status` — computed from `isActive` + `isCompleted`

---

## Membership

Per-user project index. `_id` = Profile._id.

```js
{
  _id: ObjectId,        // = Profile._id
  projects: [ObjectId], // → Project._id
  asLead: [ObjectId],   // → Project._id
  createdAt: Date,
  updatedAt: Date
}
```

---

## AssignedTask

Per-user task index. `_id` = Profile._id.

```js
{
  _id: ObjectId,        // = Profile._id
  assignTasks: [ObjectId],  // → Task._id
  createdAt: Date,
  updatedAt: Date
}
```

---

## Comment

Task discussion message.

```js
{
  _id: ObjectId,
  content: String,      // required
  taskId: ObjectId,     // → Task._id
  userId: ObjectId,     // → Profile._id
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    uploadedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

---

## ChatMessage

Project-level chat.

```js
{
  _id: ObjectId,
  projectId: ObjectId,  // → Project._id (indexed)
  userId: ObjectId,     // → Profile._id
  content: String,      // required
  type: String,         // "text" | "image" | "file"
  createdAt: Date,
  updatedAt: Date
}
```

**Index:** `{ projectId: 1, createdAt: -1 }`

---

## Invitation

Project invitation.

```js
{
  _id: ObjectId,
  email: String,        // required
  projectId: ObjectId,  // → Project._id
  invitedBy: ObjectId,  // → Profile._id
  type: String,         // "teamMember" | "projectLead"
  token: String,        // unique, for accept/decline links
  expiresAt: Date,
  status: String,       // "pending" | "accepted" | "declined" | "expired"
  message: String,
  // Denormalized (snapshot at send time):
  senderName: String,
  senderEmail: String,
  senderAvatar: String,
  projectName: String,
  projectDescription: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Notification

Per-user notifications. `_id` = Profile._id. 30-day auto-prune.

```js
{
  _id: ObjectId,        // = Profile._id
  notifications: [{
    type: String,       // e.g. "task_assigned", "comment_added"
    data: Mixed,
    read: Boolean,
    createdAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

---

## ActivityLog

Audit trail entry.

```js
{
  _id: ObjectId,
  actorId: ObjectId,    // → Profile._id
  actorName: String,    // denormalized
  actorAvatar: String,  // denormalized
  action: String,       // e.g. "task_created", "project_updated"
  entityType: String,   // "Task" | "Project" | "Sprint" | etc.
  entityId: ObjectId,
  entityName: String,
  projectId: ObjectId,  // → Project._id
  projectName: String,  // denormalized
  changes: [{
    field: String,
    oldValue: Mixed,
    newValue: Mixed
  }],
  description: String,
  timestamp: Date
}
```

---

## Label

Task tag for a project.

```js
{
  _id: ObjectId,
  name: String,         // required
  color: String,        // hex color
  projectId: ObjectId,  // → Project._id
  createdAt: Date,
  updatedAt: Date
}
```

---

## TaskLink

Task dependency relationship.

```js
{
  _id: ObjectId,
  sourceTaskId: ObjectId,  // → Task._id
  targetTaskId: ObjectId,  // → Task._id
  linkType: String,        // "blocks" | "blocked-by" | "relates-to" | "duplicates" | "depends-on"
  projectId: ObjectId,     // → Project._id
  createdAt: Date,
  updatedAt: Date
}
```

---

## TimeEntry

Time log against a task.

```js
{
  _id: ObjectId,
  taskId: ObjectId,     // → Task._id
  userId: ObjectId,     // → Profile._id
  hours: Number,        // required
  description: String,
  date: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## BoardConfig

Kanban board layout.

```js
{
  _id: ObjectId,
  projectId: ObjectId,  // → Project._id
  name: String,
  columns: [{
    name: String,
    statuses: [String],
    wip: Number         // work-in-progress limit
  }],
  swimlane: String,     // "assignee" | "epic" | "priority"
  filters: Mixed,
  createdBy: ObjectId,  // → Profile._id
  createdAt: Date,
  updatedAt: Date
}
```

---

## SavedFilter

User-saved task filter.

```js
{
  _id: ObjectId,
  name: String,         // required
  userId: ObjectId,     // → Profile._id
  projectId: ObjectId,  // → Project._id
  query: Mixed,         // filter criteria
  isDefault: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## VerificationCode

Auth verification code. Auto-deletes via TTL.

```js
{
  _id: ObjectId,
  email: String,        // required
  code: String,         // required
  purpose: String,      // "registration" | "login" | "password-reset"
  expiresAt: Date,      // TTL — auto-deleted by MongoDB
  isUsed: Boolean,
  createdAt: Date
}
```

**Indexes:** `{ email: 1, purpose: 1 }`, `{ expiresAt: 1 }` (TTL)

---

## Relationships Summary

```
Profile ──1:1──→ Membership
Profile ──1:1──→ AssignedTask
Profile ──1:1──→ Notification
Profile ──────→ Project (createdBy, leads[], team[])
Profile ──────→ Task (assignedTo)
Profile ──────→ Comment (userId)
Profile ──────→ TimeEntry (userId)
Profile ──────→ ActivityLog (actorId)
Profile ──────→ Invitation (invitedBy)
Profile ──────→ SavedFilter (userId)
Profile ──────→ BoardConfig (createdBy)

Project ─────→ Task (projectId)
Project ─────→ Sprint (projectId)
Project ─────→ Label (projectId)
Project ─────→ BoardConfig (projectId)
Project ─────→ TaskLink (projectId)
Project ─────→ Invitation (projectId)
Project ─────→ ActivityLog (projectId)
Project ─────→ SavedFilter (projectId)
Project ─────→ ChatMessage (projectId)

Task ────────→ Comment (taskId)
Task ────────→ Sprint (sprintId)
Task ────────→ Task (parentId — subtasks)
Task ────────→ TaskLink (sourceTaskId / targetTaskId)
Task ────────→ TimeEntry (taskId)
Task ────────→ Label (labels[])
```
