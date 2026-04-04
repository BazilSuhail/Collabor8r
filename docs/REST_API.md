# REST API Reference

All endpoints. Auth = `Authorization: Bearer <token>` header.

---

## Projects

### POST `/projects/create`

Create a new project.

**Request:**
```json
{
  "name": "My Project",
  "description": "Project description",
  "leadEmail": "lead@example.com",
  "methodology": "sprint",
  "statuses": ["To Do", "In Progress", "Done"],
  "startDate": "2026-01-01",
  "targetDate": "2026-06-30",
  "tags": ["react", "node"],
  "objectives": ["Launch MVP"],
  "visibility": "private",
  "category": "web"
}
```

**Response:** `201`
```json
{
  "message": "Project created",
  "project": { "_id": "...", "name": "My Project", ... }
}
```

### PUT `/projects/:projectId/update`

Update project fields.

**Request:**
```json
{
  "name": "Updated Name",
  "description": "New description",
  "methodology": "kanban",
  "tags": ["updated"]
}
```

**Response:** `200`
```json
{
  "message": "Project updated",
  "project": { ... }
}
```

### PUT `/projects/lead-response/:projectId`

Lead accepts or declines project invitation.

**Request:**
```json
{
  "response": "Accept"
}
```

**Response:** `200`
```json
{
  "message": "Response recorded",
  "project": { ... }
}
```

### GET `/projects/:projectId/summary`

Get project summary with stats.

**Response:** `200`
```json
{
  "summary": "Project description...",
  "stats": {
    "totalTasks": 25,
    "completedTasks": 10,
    "totalSprints": 3,
    "teamSize": 5
  }
}
```

### GET `/projects/:projectId/online-members`

Get online members via Redis presence.

**Response:** `200`
```json
{
  "onlineMembers": ["userId1", "userId2"]
}
```

### POST `/projects/ai-assist`

AI-generate a project from a prompt.

**Request:**
```json
{
  "prompt": "Build a task management app with sprints"
}
```

**Response:** `200`
```json
{
  "project": {
    "name": "Task Management App",
    "description": "...",
    "methodology": "sprint",
    "statuses": ["To Do", "In Progress", "Review", "Done"]
  }
}
```

---

## Admin Projects (created by user)

### GET `/admin-projects/`

List projects where user is the creator.

**Response:** `200`
```json
[
  {
    "_id": "...",
    "name": "My Project",
    "description": "...",
    "methodology": "sprint",
    "leads": [{ "_id": "...", "name": "Lead User", "avatar": "url" }],
    "createdBy": { "_id": "...", "name": "Creator" },
    "taskCount": 25,
    "teamCount": 5
  }
]
```

### GET `/admin-projects/:projectId`

Get single project with full details.

**Response:** `200`
```json
{
  "project": {
    "_id": "...",
    "name": "My Project",
    "team": [{ "_id": "...", "name": "User", "avatar": "url" }],
    "leads": [{ "_id": "...", "name": "Lead" }],
    "createdBy": { "_id": "...", "name": "Creator" },
    "statuses": ["To Do", "In Progress", "Done"],
    "methodology": "sprint"
  },
  "taskCount": 25,
  "sampleTasks": [...]
}
```

### POST `/admin-projects/get-searched-user`

Search user by email for invitation.

**Request:**
```json
{
  "email": "user@example.com",
  "projectId": "..."
}
```

**Response:** `200`
```json
{
  "userId": "...",
  "name": "User",
  "email": "user@example.com",
  "avatar": "url"
}
```

### POST `/admin-projects/send-project-invitation`

Send project invitation to a user.

**Request:**
```json
{
  "userId": "...",
  "projectId": "...",
  "message": "Join our team!",
  "role": "developer"
}
```

**Response:** `200`
```json
{
  "message": "Invitation sent",
  "invitation": { ... }
}
```

---

## Joined Projects

### GET `/joinedprojects/`

List all projects the user belongs to.

**Response:** `200`
```json
[
  {
    "_id": "...",
    "name": "Project Name",
    "leads": [{ "_id": "...", "name": "Lead" }],
    "description": "...",
    "theme": "blue",
    "createdBy": { "_id": "...", "name": "Creator" },
    "taskCount": 25,
    "teamCount": 5
  }
]
```

### GET `/joinedprojects/as-lead`

List projects where user is a lead.

**Response:** Same as above.

### GET `/joinedprojects/:projectId`

Get project with team + online status.

**Response:** `200`
```json
{
  "project": {
    "_id": "...",
    "name": "Project",
    "team": [
      {
        "_id": "...",
        "name": "User",
        "email": "user@example.com",
        "avatar": "url",
        "isOnline": true
      }
    ],
    "leads": [...],
    "createdBy": { ... }
  }
}
```

---

## Tasks

### POST `/manageTasks/`

Create a new task.

**Request:**
```json
{
  "title": "Fix login bug",
  "description": "Login fails on mobile",
  "projectId": "...",
  "sprintId": "...",
  "priority": "high",
  "status": "To Do",
  "assignedTo": "...",
  "dueDate": "2026-02-01",
  "estimateHours": 4,
  "labels": ["bug", "urgent"],
  "acceptanceCriteria": ["Login works on iOS", "Login works on Android"]
}
```

**Response:** `201`
```json
{
  "task": { "_id": "...", "title": "Fix login bug", ... },
  "aiExtracted": null
}
```

### GET `/manageTasks/project/:projectId`

Get all tasks for a project.

**Response:** `200`
```json
{
  "projectName": "My Project",
  "validTasks": [
    {
      "_id": "...",
      "title": "Fix login bug",
      "status": "To Do",
      "priority": "high",
      "assignedTo": "userId",
      "sprintId": "...",
      "progress": 0
    }
  ],
  "projectTeam": [
    { "_id": "...", "name": "User", "email": "user@example.com", "avatar": "url" }
  ]
}
```

### GET `/manageTasks/user/:userId`

Get tasks assigned to a specific user.

**Response:** `200`
```json
{
  "assignTasks": ["taskId1", "taskId2"]
}
```

### PATCH `/manageTasks/:taskId`

Update task fields.

**Request:**
```json
{
  "status": "In Progress",
  "priority": "critical",
  "progress": 50
}
```

**Response:** `200`
```json
{
  "message": "Task updated",
  "task": { ... }
}
```

### DELETE `/manageTasks/:taskId`

Delete a task.

**Response:** `200`
```json
{
  "message": "Task deleted"
}
```

---

## Project Tasks

### GET `/project-tasks/:projectId/tasks`

Get tasks with user details for a project.

**Response:** `200`
```json
{
  "project": { ... },
  "tasks": [
    {
      "task": { "_id": "...", "title": "...", ... },
      "user": { "_id": "...", "name": "Assignee", "avatar": "url" }
    }
  ]
}
```

### GET `/project-tasks/:id`

Get single task by ID.

**Response:** `200`
```json
{
  "_id": "...",
  "title": "Fix login bug",
  "description": "...",
  "status": "To Do",
  "priority": "high",
  "assignedTo": "...",
  "projectId": "...",
  "sprintId": "...",
  "progress": 0,
  "estimateHours": 4,
  "loggedHours": 0,
  "labels": ["bug"],
  "acceptanceCriteria": ["..."],
  "attachments": [...]
}
```

---

## User Project Tasks

### GET `/projecttasks/:projectId`

Get tasks + user task details for a project.

**Response:** `200`
```json
{
  "projectTasks": [...],
  "userTaskDetails": [
    {
      "task": { ... },
      "user": { ... }
    }
  ]
}
```

### PATCH `/projecttasks/tasks/update`

Batch update task statuses.

**Request:**
```json
{
  "updates": [
    { "id": "taskId1", "status": "Done" },
    { "id": "taskId2", "status": "In Progress" }
  ]
}
```

**Response:** `200`
```json
{
  "success": true,
  "updatedTasks": [...]
}
```

### PUT `/projecttasks/update-task-progress/:taskId`

Update task with full field set.

**Request:**
```json
{
  "title": "Updated title",
  "status": "Done",
  "priority": "low",
  "progress": 100,
  "estimateHours": 8,
  "loggedHours": 6,
  "resolution": "Fixed",
  "labels": ["bug", "resolved"]
}
```

**Response:** `200`
```json
{
  "success": true,
  "message": "Task updated",
  "updatedTask": { ... }
}
```

---

## Sprints

### GET `/sprints/:projectId`

Get all sprints for a project.

**Response:** `200`
```json
[
  {
    "_id": "...",
    "name": "Sprint 1",
    "goal": "Complete auth module",
    "startDate": "2026-01-01",
    "endDate": "2026-01-14",
    "isActive": true,
    "isCompleted": false,
    "status": "active"
  }
]
```

### POST `/sprints/:projectId`

Create a new sprint.

**Request:**
```json
{
  "name": "Sprint 2",
  "startDate": "2026-01-15",
  "endDate": "2026-01-28",
  "goal": "Complete dashboard"
}
```

**Response:** `201`
```json
{
  "_id": "...",
  "name": "Sprint 2",
  ...
}
```

### GET `/sprints/sprint/:sprintId`

Get sprint with its tasks.

**Response:** `200`
```json
{
  "_id": "...",
  "name": "Sprint 1",
  "tasks": [
    { "_id": "...", "title": "Task 1", ... }
  ]
}
```

### PUT `/sprints/sprint/:sprintId`

Update sprint fields.

**Request:**
```json
{
  "name": "Sprint 1 Updated",
  "goal": "New goal"
}
```

**Response:** `200`
```json
{
  "message": "Sprint updated",
  "sprint": { ... }
}
```

### DELETE `/sprints/sprint/:sprintId`

Delete a sprint.

**Response:** `200`
```json
{
  "message": "Sprint deleted"
}
```

### POST `/sprints/sprint/:sprintId/activate`

Activate a sprint (deactivates others).

**Response:** `200`
```json
{
  "message": "Sprint activated",
  "sprint": { ... }
}
```

### POST `/sprints/sprint/:sprintId/complete`

Mark sprint as completed.

**Response:** `200`
```json
{
  "message": "Sprint completed",
  "sprint": { ... }
}
```

### POST `/sprints/sprint/:sprintId/add-tasks`

Add tasks to a sprint.

**Request:**
```json
{
  "taskIds": ["taskId1", "taskId2"]
}
```

**Response:** `200`
```json
{
  "message": "Tasks added to sprint",
  "sprint": { ... }
}
```

### POST `/sprints/sprint/:sprintId/remove-tasks`

Remove tasks from a sprint.

**Request:**
```json
{
  "taskIds": ["taskId1"]
}
```

**Response:** `200`
```json
{
  "message": "Tasks removed from sprint",
  "sprint": { ... }
}
```

### GET `/sprints/sprint/:sprintId/retrospective`

Get sprint retrospective data.

**Response:** `200`
```json
{
  "whatWentWell": ["Fast delivery", "Good communication"],
  "whatCouldImprove": ["More testing"],
  "actionItems": ["Add unit tests"],
  "stats": { "totalTasks": 10, "completedTasks": 8 }
}
```

---

## Comments

### POST `/comments/tasks/:taskId/comments`

Add a comment to a task.

**Request:**
```json
{
  "content": "This looks good, approved!",
  "userId": "..."
}
```

**Response:** `201`
```json
{
  "message": "Comment added",
  "comment": {
    "_id": "...",
    "content": "This looks good, approved!",
    "userId": { "_id": "...", "name": "User", "avatar": "url" },
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

### GET `/comments/tasks/:taskId/comments`

Get all comments for a task.

**Response:** `200`
```json
{
  "comments": [
    {
      "_id": "...",
      "content": "Comment text",
      "userId": { "_id": "...", "name": "User", "avatar": "url" },
      "createdAt": "...",
      "attachments": [...]
    }
  ]
}
```

### GET `/comments/tasks/:taskId/comments/summary`

AI-generated comment summary.

**Response:** `200`
```json
{
  "summary": "Team agreed on approach...",
  "commentCount": 15
}
```

### PUT `/comments/:commentId`

Update a comment.

**Request:**
```json
{
  "content": "Updated comment text"
}
```

**Response:** `200`
```json
{
  "message": "Comment updated",
  "comment": { ... }
}
```

### DELETE `/comments/:commentId`

Delete a comment.

**Response:** `200`
```json
{
  "message": "Comment deleted"
}
```

### GET `/comments/:id/name`

Get comment author name.

**Response:** `200`
```json
{
  "name": "John Doe"
}
```

---

## Chat

### GET `/chat/:projectId/messages`

Get chat messages for a project (cursor-paginated).

**Query params:**
- `before` — ISO date string (for pagination)
- `limit` — number (default 50, max 100)

**Response:** `200`
```json
{
  "messages": [
    {
      "_id": "...",
      "projectId": "...",
      "userId": "...",
      "content": "Hello team!",
      "type": "text",
      "createdAt": "2026-01-15T10:30:00Z",
      "user": { "name": "John", "avatar": "url" }
    }
  ]
}
```

### POST `/chat/:projectId/messages`

Send a chat message via REST (also broadcasts via socket).

**Request:**
```json
{
  "content": "Hello team!",
  "type": "text"
}
```

**Response:** `201`
```json
{
  "message": {
    "_id": "...",
    "projectId": "...",
    "userId": "...",
    "content": "Hello team!",
    "type": "text",
    "createdAt": "...",
    "user": { "name": "John", "avatar": "url" }
  }
}
```

---

## Invitations

### POST `/invitations/`

Create an invitation.

**Request:**
```json
{
  "email": "user@example.com",
  "projectId": "...",
  "role": "developer",
  "message": "Join our team!"
}
```

**Response:** `201`
```json
{
  "message": "Invitation sent",
  "invitation": { ... }
}
```

### GET `/invitations/pending`

Get pending invitations for the logged-in user.

**Response:** `200`
```json
[
  {
    "_id": "...",
    "email": "user@example.com",
    "projectId": { "_id": "...", "name": "Project" },
    "invitedBy": { "_id": "...", "name": "Admin" },
    "type": "teamMember",
    "status": "pending",
    "token": "...",
    "expiresAt": "..."
  }
]
```

### POST `/invitations/:token/accept`

Accept an invitation.

**Response:** `200`
```json
{
  "message": "Invitation accepted",
  "invitation": { ... }
}
```

### POST `/invitations/:token/decline`

Decline an invitation.

**Response:** `200`
```json
{
  "message": "Invitation declined",
  "invitation": { ... }
}
```

### GET `/invitations/project/:projectId`

Get all invitations for a project.

**Response:** `200`
```json
[
  {
    "_id": "...",
    "email": "user@example.com",
    "status": "pending",
    "type": "teamMember",
    "invitedBy": { ... },
    "createdAt": "..."
  }
]
```

---

## Manage Users (Add to Project)

### GET `/manageusers/:projectId/get-all-users`

Get all users in a project.

**Response:** `200`
```json
[
  { "email": "user@example.com", "name": "User", "avatar": "url" }
]
```

### POST `/manageusers/get-project-details`

Get project details + creator.

**Request:**
```json
{
  "projectId": "..."
}
```

**Response:** `200`
```json
{
  "project": { ... },
  "createdBy": { "_id": "...", "name": "Creator", "email": "..." }
}
```

### POST `/manageusers/accept-invite`

Accept a project invitation.

**Request:**
```json
{
  "projectId": "..."
}
```

**Response:** `200`
```json
{
  "message": "Successfully joined project"
}
```

---

## Labels

### GET `/labels/project/:projectId`

Get all labels for a project.

**Response:** `200`
```json
[
  { "_id": "...", "name": "bug", "color": "#ff0000", "projectId": "..." }
]
```

### POST `/labels/`

Create a label.

**Request:**
```json
{
  "name": "urgent",
  "projectId": "...",
  "color": "#ff5722"
}
```

**Response:** `201`
```json
{
  "_id": "...",
  "name": "urgent",
  "color": "#ff5722",
  "projectId": "..."
}
```

### PUT `/labels/:labelId`

Update a label.

**Request:**
```json
{
  "name": "critical",
  "color": "#d32f2f"
}
```

**Response:** `200`
```json
{
  "message": "Label updated",
  "label": { ... }
}
```

### DELETE `/labels/:labelId`

Delete a label.

**Response:** `200`
```json
{
  "message": "Label deleted"
}
```

---

## Task Links (Dependencies)

### POST `/task-links/`

Create a task dependency link.

**Request:**
```json
{
  "sourceTaskId": "...",
  "targetTaskId": "...",
  "linkType": "blocks",
  "projectId": "..."
}
```

**Response:** `201`
```json
{
  "message": "Task link created",
  "link": { ... }
}
```

### GET `/task-links/task/:taskId`

Get all links for a task.

**Response:** `200`
```json
[
  {
    "_id": "...",
    "sourceTaskId": { "_id": "...", "title": "Task A" },
    "targetTaskId": { "_id": "...", "title": "Task B" },
    "linkType": "blocks",
    "projectId": "..."
  }
]
```

### DELETE `/task-links/:linkId`

Delete a task link.

**Response:** `200`
```json
{
  "message": "Task link deleted"
}
```

---

## Filters (Saved Views)

### GET `/filters/project/:projectId`

Get user's saved filters for a project.

**Response:** `200`
```json
[
  {
    "_id": "...",
    "name": "My High Priority",
    "query": { "priority": "high", "assignedTo": "userId" },
    "projectId": "...",
    "isDefault": false
  }
]
```

### POST `/filters/`

Create a saved filter.

**Request:**
```json
{
  "name": "Urgent Bugs",
  "query": { "priority": "critical", "labels": ["bug"] },
  "projectId": "...",
  "isDefault": false
}
```

**Response:** `201`
```json
{
  "_id": "...",
  "name": "Urgent Bugs",
  ...
}
```

### PUT `/filters/:filterId`

Update a saved filter.

**Request:**
```json
{
  "name": "Updated Name",
  "isDefault": true
}
```

**Response:** `200`
```json
{
  "message": "Filter updated",
  "filter": { ... }
}
```

### DELETE `/filters/:filterId`

Delete a saved filter.

**Response:** `200`
```json
{
  "message": "Filter deleted"
}
```

---

## Board Configuration

### GET `/boards/project/:projectId`

Get board configs for a project.

**Response:** `200`
```json
[
  {
    "_id": "...",
    "projectId": "...",
    "name": "Main Board",
    "columns": [
      { "name": "To Do", "statuses": ["To Do"], "wip": 0 },
      { "name": "In Progress", "statuses": ["In Progress"], "wip": 5 }
    ],
    "swimlane": "assignee",
    "filters": {},
    "createdBy": "..."
  }
]
```

### POST `/boards/`

Create a board config.

**Request:**
```json
{
  "projectId": "...",
  "name": "Sprint Board",
  "columns": [
    { "name": "To Do", "statuses": ["To Do"], "wip": 0 },
    { "name": "Done", "statuses": ["Done"], "wip": 0 }
  ],
  "swimlane": "priority"
}
```

**Response:** `201`
```json
{
  "_id": "...",
  ...
}
```

### PUT `/boards/:boardId`

Update a board config.

**Request:**
```json
{
  "name": "Updated Board",
  "columns": [...]
}
```

**Response:** `200`
```json
{
  "message": "Board updated",
  "board": { ... }
}
```

### DELETE `/boards/:boardId`

Delete a board config.

**Response:** `200`
```json
{
  "message": "Board deleted"
}
```

---

## Profile & Notifications

### GET `/profile/`

Get current user's profile.

**Response:** `200`
```json
{
  "_id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "avatar": "url",
  "dob": "1995-05-15",
  "gender": "male",
  "assignedTasks": ["taskId1", "taskId2"]
}
```

### PUT `/profile/`

Update profile.

**Request:**
```json
{
  "name": "John Updated",
  "avatar": "new-url"
}
```

**Response:** `200`
```json
{
  "message": "Profile updated",
  "profile": { ... }
}
```

### GET `/profile/get-notifications`

Get user's notifications (30-day window).

**Response:** `200`
```json
{
  "notifications": [
    {
      "type": "task_assigned",
      "data": { "taskTitle": "Fix bug", "projectId": "..." },
      "read": false,
      "createdAt": "..."
    }
  ]
}
```

### PUT `/profile/notifications/mark-read`

Mark a notification as read.

**Request:**
```json
{
  "index": 0
}
```

**Response:** `200`
```json
{
  "message": "Notification marked as read",
  "result": { ... }
}
```

### GET `/profile/notifications/unread-count`

Get count of unread notifications.

**Response:** `200`
```json
{
  "unreadCount": 5
}
```

---

## Activity Log

### GET `/activity/project/:projectId`

Get activity log for a project.

**Response:** `200`
```json
[
  {
    "_id": "...",
    "actorId": "...",
    "actorName": "John",
    "actorAvatar": "url",
    "action": "task_created",
    "entityType": "Task",
    "entityId": "...",
    "entityName": "Fix login bug",
    "projectId": "...",
    "projectName": "My Project",
    "changes": [{ "field": "status", "oldValue": null, "newValue": "To Do" }],
    "description": "John created task Fix login bug",
    "createdAt": "..."
  }
]
```

### GET `/activity/task/:taskId`

Get activity log for a task.

**Response:** Same structure as above.

### GET `/activity/user`

Get current user's activity.

**Response:** Same structure as above (limit 30).

---

## Time Tracking

### POST `/time/entries`

Log time against a task.

**Request:**
```json
{
  "taskId": "...",
  "hours": 2.5,
  "description": "Fixed login validation",
  "date": "2026-01-15"
}
```

**Response:** `201`
```json
{
  "_id": "...",
  "taskId": "...",
  "userId": "...",
  "hours": 2.5,
  "description": "Fixed login validation",
  "date": "2026-01-15T00:00:00Z"
}
```

### GET `/time/entries/task/:taskId`

Get time entries for a task.

**Response:** `200`
```json
[
  {
    "_id": "...",
    "hours": 2.5,
    "description": "...",
    "date": "...",
    "userId": { "_id": "...", "name": "User", "avatar": "url" }
  }
]
```

### GET `/time/entries/user`

Get current user's time entries.

**Response:** Same structure as above.

### GET `/time/report/project/:projectId`

Get time report for a project.

**Response:** `200`
```json
{
  "tasks": [...],
  "entries": [...],
  "totalHours": 42.5,
  "entryCount": 15
}
```

### GET `/time/report/sprint/:sprintId`

Get time report for a sprint.

**Response:** Same structure as above.

### PUT `/time/entries/:entryId`

Update a time entry.

**Request:**
```json
{
  "hours": 3,
  "description": "Updated description"
}
```

**Response:** `200`
```json
{
  "message": "Time entry updated",
  "entry": { ... }
}
```

### DELETE `/time/entries/:entryId`

Delete a time entry.

**Response:** `200`
```json
{
  "message": "Time entry deleted"
}
```

---

## Uploads

### POST `/uploads/task/:taskId`

Upload files to a task (multipart, max 10).

**Request:** `multipart/form-data`
```
files: [file1, file2, ...]
```

**Response:** `200`
```json
{
  "files": [
    { "filename": "doc.pdf", "url": "/uploads/doc.pdf", "size": 1024 }
  ],
  "task": { ... }
}
```

### POST `/uploads/comment/:commentId`

Upload files to a comment.

**Request:** Same as above.

**Response:** `200`
```json
{
  "files": [...],
  "comment": { ... }
}
```

### GET `/uploads/task/:taskId`

Get attachments for a task.

**Response:** `200`
```json
{
  "attachments": [
    { "filename": "doc.pdf", "url": "/uploads/doc.pdf", "size": 1024 }
  ]
}
```

### DELETE `/uploads/:fileId`

Delete an attachment.

**Response:** `200`
```json
{
  "message": "File deleted"
}
```

---

## AI Assistant

### POST `/ai/draft-task`

AI-generate a task from a prompt.

**Request:**
```json
{
  "prompt": "Create a login page with email and password validation",
  "projectId": "..."
}
```

**Response:** `200`
```json
{
  "task": {
    "title": "Implement login page",
    "description": "...",
    "priority": "high",
    "status": "To Do",
    "dueDate": "...",
    "estimateHours": 8,
    "acceptanceCriteria": ["Email validation", "Password strength check"],
    "suggestedAssignee": "user@example.com"
  }
}
```

### POST `/ai/create-task`

Create task via AI extraction.

**Request:**
```json
{
  "prompt": "I need a bug fix for the login page",
  "projectId": "..."
}
```

**Response:** `200`
```json
{
  "task": { ... },
  "aiExtracted": { "priority": "high", "labels": ["bug"] }
}
```

### POST `/ai/roadmap`

Generate a project roadmap.

**Request:**
```json
{
  "projectId": "...",
  "goal": "Launch MVP in 3 months"
}
```

**Response:** `200`
```json
{
  "roadmap": {
    "summary": "3-phase approach...",
    "phases": [
      {
        "name": "Phase 1 - Foundation",
        "duration": "4 weeks",
        "tasks": ["Setup auth", "Create database schema"]
      }
    ]
  }
}
```

### POST `/ai/suggest-tasks`

AI suggest tasks for a project.

**Request:**
```json
{
  "projectId": "...",
  "prompt": "What should we build for the dashboard?"
}
```

**Response:** `200`
```json
{
  "tasks": [
    {
      "title": "Create dashboard layout",
      "description": "...",
      "priority": "high",
      "estimateHours": 6
    }
  ]
}
```

### POST `/ai/create-tasks`

Bulk create tasks from AI suggestions.

**Request:**
```json
{
  "projectId": "...",
  "tasks": [
    { "title": "Task 1", "description": "..." },
    { "title": "Task 2", "description": "..." }
  ]
}
```

**Response:** `200`
```json
{
  "tasks": [...],
  "count": 2
}
```

### POST `/ai/create-sprint`

AI-generate a sprint from a prompt.

**Request:**
```json
{
  "prompt": "2-week sprint focused on auth and dashboard",
  "projectId": "..."
}
```

**Response:** `200`
```json
{
  "sprint": { "name": "Sprint 1", "startDate": "...", "endDate": "...", "goal": "..." },
  "aiExtracted": { ... }
}
```

### POST `/ai/breakdown-task`

Break a task into subtasks.

**Request:**
```json
{
  "taskDescription": "Implement user authentication with JWT"
}
```

**Response:** `200`
```json
{
  "subtasks": [
    { "title": "Create auth middleware", "estimateHours": 2 },
    { "title": "Implement login endpoint", "estimateHours": 3 },
    { "title": "Add JWT token refresh", "estimateHours": 2 }
  ]
}
```

### POST `/ai/suggest-assignee`

AI suggest best team member for a task.

**Request:**
```json
{
  "projectId": "...",
  "taskDescription": "Fix React component rendering issue"
}
```

**Response:** `200`
```json
{
  "suggestedEmail": "dev@example.com",
  "reason": "Has experience with React and frontend bugs",
  "suggestedUser": { "_id": "...", "name": "Dev", "email": "..." }
}
```

### POST `/ai/recommend-metadata`

AI recommend task priority/status/due date.

**Request:**
```json
{
  "title": "Fix critical security vulnerability",
  "description": "SQL injection in login form"
}
```

**Response:** `200`
```json
{
  "priority": "critical",
  "status": "To Do",
  "suggestedDueDate": "2026-01-20"
}
```

### POST `/ai/generate-acceptance-criteria`

AI generate acceptance criteria.

**Request:**
```json
{
  "title": "Implement user registration",
  "description": "Email + password registration with validation"
}
```

**Response:** `200`
```json
{
  "criteria": [
    "User can register with email and password",
    "Email validation rejects invalid formats",
    "Password must be at least 8 characters",
    "Confirmation email is sent after registration"
  ]
}
```

### POST `/ai/summarize-comments`

AI summarize task comments.

**Request:**
```json
{
  "taskId": "..."
}
```

**Response:** `200`
```json
{
  "summary": "Team discussed two approaches. Agreed on option B...",
  "commentCount": 15
}
```

### GET `/ai/project-summary/:projectId`

Get AI-generated project summary.

**Response:** `200`
```json
{
  "summary": "Project is 60% complete...",
  "stats": {
    "totalTasks": 25,
    "completedTasks": 15,
    "overdueTasks": 2,
    "teamSize": 5
  }
}
```

### POST `/ai/detect-risks`

AI detect project risks.

**Request:**
```json
{
  "projectId": "..."
}
```

**Response:** `200`
```json
{
  "risks": [
    {
      "type": "deadline",
      "description": "3 tasks are overdue",
      "severity": "high"
    }
  ],
  "stats": { ... }
}
```

### POST `/ai/search-tasks`

AI-powered task search.

**Request:**
```json
{
  "query": "login related bugs",
  "projectId": "..."
}
```

**Response:** `200`
```json
{
  "tasks": [
    { "_id": "...", "title": "Fix login validation", ... }
  ]
}
```

### POST `/ai/retrospective`

AI generate sprint retrospective.

**Request:**
```json
{
  "sprintId": "..."
}
```

**Response:** `200`
```json
{
  "whatWentWell": ["Delivered on time"],
  "whatCouldImprove": ["More code reviews"],
  "actionItems": ["Schedule weekly reviews"],
  "stats": { "totalTasks": 10, "completedTasks": 8 }
}
```

---

## Dashboard

### GET `/overview/assigned-tasks`

Get tasks assigned to the current user.

**Response:** `200`
```json
{
  "tasks": [
    {
      "_id": "...",
      "title": "Fix login bug",
      "status": "In Progress",
      "priority": "high",
      "dueDate": "...",
      "projectName": "My Project",
      "projectId": "..."
    }
  ]
}
```

### GET `/overview/progress-overview`

Get progress overview across projects.

**Response:** `200`
```json
{
  "projectCounts": {
    "total": 5,
    "active": 3,
    "completed": 2
  },
  "tasks": [
    {
      "_id": "...",
      "title": "Task",
      "status": "Done",
      "projectId": "...",
      "projectName": "Project"
    }
  ]
}
```

---

## Health Check

### GET `/health`

No auth required.

**Response:** `200`
```json
{
  "status": "ok",
  "message": "Collabor8r API is running",
  "port": 3001,
  "memory": {
    "rss": "45.2 MB",
    "heapTotal": "30.1 MB",
    "heapUsed": "25.3 MB",
    "external": "2.1 MB"
  }
}
```
