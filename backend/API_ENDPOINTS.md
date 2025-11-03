# API Endpoints Documentation

## Base URL
`http://localhost:5000/api`

## Authentication

All endpoints (except `/auth/signup` and `/auth/login`) require a JWT token in the request header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication Endpoints

### Signup
- **URL:** `POST /auth/signup`
- **Auth:** Not required
- **Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```
- **Response (201):**
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60f7b3c4e5d4f8a9b0c1d2e3",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Login
- **URL:** `POST /auth/login`
- **Auth:** Not required
- **Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60f7b3c4e5d4f8a9b0c1d2e3",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

## 2. Group Endpoints

### Create Group
- **URL:** `POST /groups`
- **Auth:** Required
- **Body:**
```json
{
  "name": "Trip to Goa",
  "description": "Vacation expenses"
}
```
- **Response (201):**
```json
{
  "message": "Group created successfully",
  "group": {
    "_id": "60f7b3c4e5d4f8a9b0c1d2e4",
    "name": "Trip to Goa",
    "description": "Vacation expenses",
    "createdBy": {
      "_id": "60f7b3c4e5d4f8a9b0c1d2e3",
      "name": "John Doe",
      "email": "user@example.com"
    },
    "members": [...],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get All Groups
- **URL:** `GET /groups`
- **Auth:** Required
- **Response (200):**
```json
{
  "groups": [
    {
      "_id": "60f7b3c4e5d4f8a9b0c1d2e4",
      "name": "Trip to Goa",
      "description": "Vacation expenses",
      "createdBy": {...},
      "members": [...],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Single Group
- **URL:** `GET /groups/:id`
- **Auth:** Required
- **Params:** `id` - Group ID
- **Response (200):**
```json
{
  "group": {
    "_id": "60f7b3c4e5d4f8a9b0c1d2e4",
    "name": "Trip to Goa",
    "description": "Vacation expenses",
    "createdBy": {...},
    "members": [...]
  }
}
```

### Add Members to Group
- **URL:** `POST /groups/:id/members`
- **Auth:** Required
- **Params:** `id` - Group ID
- **Body:**
```json
{
  "memberIds": [
    "60f7b3c4e5d4f8a9b0c1d2e4",
    "60f7b3c4e5d4f8a9b0c1d2e5"
  ]
}
```
- **Response (200):**
```json
{
  "message": "Members added successfully",
  "group": {...}
}
```

---

## 3. Expense Endpoints

### Add Expense
- **URL:** `POST /expenses/group/:groupId`
- **Auth:** Required
- **Params:** `groupId` - Group ID
- **Body:**
```json
{
  "title": "Dinner",
  "amount": 1500,
  "paidBy": "60f7b3c4e5d4f8a9b0c1d2e3",
  "splitBetween": [
    {
      "user": "60f7b3c4e5d4f8a9b0c1d2e3",
      "amount": 500
    },
    {
      "user": "60f7b3c4e5d4f8a9b0c1d2e4",
      "amount": 500
    },
    {
      "user": "60f7b3c4e5d4f8a9b0c1d2e5",
      "amount": 500
    }
  ]
}
```
- **Response (201):**
```json
{
  "message": "Expense added successfully",
  "expense": {
    "_id": "60f7b3c4e5d4f8a9b0c1d2e6",
    "title": "Dinner",
    "amount": 1500,
    "group": {...},
    "paidBy": {...},
    "splitBetween": [...],
    "settled": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Expenses for Group
- **URL:** `GET /expenses/group/:groupId`
- **Auth:** Required
- **Params:** `groupId` - Group ID
- **Response (200):**
```json
{
  "expenses": [
    {
      "_id": "60f7b3c4e5d4f8a9b0c1d2e6",
      "title": "Dinner",
      "amount": 1500,
      "paidBy": {...},
      "splitBetween": [...],
      "settled": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Balances for Group
- **URL:** `GET /expenses/group/:groupId/balances`
- **Auth:** Required
- **Params:** `groupId` - Group ID
- **Response (200):**
```json
{
  "balances": [
    {
      "user": {
        "id": "60f7b3c4e5d4f8a9b0c1d2e3",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "balance": 500.00
    },
    {
      "user": {
        "id": "60f7b3c4e5d4f8a9b0c1d2e4",
        "name": "Jane Doe",
        "email": "jane@example.com"
      },
      "balance": -250.00
    }
  ]
}
```
**Note:** Positive balance means the user paid more than their share (owed money). Negative balance means the user owes money.

### Get Who Owes Whom
- **URL:** `GET /expenses/group/:groupId/settlements`
- **Auth:** Required
- **Params:** `groupId` - Group ID
- **Response (200):**
```json
{
  "settlements": [
    {
      "from": {
        "id": "60f7b3c4e5d4f8a9b0c1d2e4",
        "name": "Jane Doe",
        "email": "jane@example.com"
      },
      "to": {
        "id": "60f7b3c4e5d4f8a9b0c1d2e3",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "amount": 250.00
    }
  ]
}
```

### Mark Expense as Settled
- **URL:** `POST /expenses/:expenseId/settle`
- **Auth:** Required
- **Params:** `expenseId` - Expense ID
- **Body:**
```json
{
  "settledBy": "60f7b3c4e5d4f8a9b0c1d2e4",
  "amount": 250.00
}
```
- **Response (200):**
```json
{
  "message": "Payment settled successfully",
  "expense": {...}
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

### 400 Bad Request
```json
{
  "message": "Error message here"
}
```

### 401 Unauthorized
```json
{
  "message": "No token, authorization denied"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Server Error
```json
{
  "message": "Something went wrong!"
}
```

---

## Example cURL Commands

### Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123","name":"John Doe"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Create Group
```bash
curl -X POST http://localhost:5000/api/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"name":"Trip to Goa","description":"Vacation expenses"}'
```

### Add Expense
```bash
curl -X POST http://localhost:5000/api/expenses/group/GROUP_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title":"Dinner",
    "amount":1500,
    "paidBy":"USER_ID",
    "splitBetween":[
      {"user":"USER_ID_1","amount":500},
      {"user":"USER_ID_2","amount":500},
      {"user":"USER_ID_3","amount":500}
    ]
  }'
```

### Get Balances
```bash
curl -X GET http://localhost:5000/api/expenses/group/GROUP_ID/balances \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```


