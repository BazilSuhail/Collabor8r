# Authentication

## Flow

1. **Signup** → Create account + get JWT
2. **Login** → Email/password → get JWT
3. **Protected routes** → `Authorization: Bearer <token>`

JWT contains `{ id, email }`. Server extracts `req.user.id` from token.

## Endpoints

### POST `/auth/signup`

Create a new account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "phone": "+1234567890",
  "dob": "1995-05-15",
  "gender": "male"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "message": "Account created successfully"
}
```

### POST `/auth/signin`

Login with email and password.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### POST `/auth/check-email`

Check if email is registered.

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "exists": true,
  "message": "Email already registered"
}
```

### POST `/auth/forgot-password`

Send password reset code to email.

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent"
}
```

### POST `/auth/reset-password`

Reset password with verification code.

**Request:**
```json
{
  "email": "john@example.com",
  "code": "123456",
  "newPassword": "newSecret123"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

### POST `/auth/send-code`

Send verification code for registration or login.

**Request:**
```json
{
  "email": "john@example.com",
  "purpose": "registration"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Code sent successfully"
}
```

### POST `/auth/signup-code`

Signup with verification code (instead of password).

**Request:**
```json
{
  "email": "john@example.com",
  "code": "123456",
  "name": "John Doe",
  "gender": "male",
  "phone": "+1234567890",
  "dob": "1995-05-15"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "message": "Account created successfully"
}
```

### POST `/auth/signin-code`

Login with verification code (instead of password).

**Request:**
```json
{
  "email": "john@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

## Verification Code Expiry

Codes expire after 10 minutes. MongoDB TTL auto-deletes expired codes.
