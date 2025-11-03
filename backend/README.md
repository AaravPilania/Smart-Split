# Splitwise Backend API

A simple backend API for a payment-splitting application built with Node.js, Express, and MySQL.

## Features

- ✅ User signup & login (email + password)
- ✅ Create group
- ✅ Add members to group
- ✅ Add an expense to group (title, amount, paidBy, splitBetween)
- ✅ Show total balance for each member in group
- ✅ Show who owes whom and how much
- ✅ Mark a payment as settled

## Tech Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **MySQL** - Relational database
- **mysql2** - MySQL client for Node.js
- **bcryptjs** - Password hashing

## Folder Structure

```
backend/
├── config/
│   └── database.js       # MySQL connection and table creation
├── controllers/
│   ├── authController.js # Authentication logic
│   ├── groupController.js # Group operations
│   └── expenseController.js # Expense operations
├── models/
│   ├── User.js          # User model with MySQL queries
│   ├── Group.js         # Group model with MySQL queries
│   └── Expense.js       # Expense model with MySQL queries
├── routes/
│   ├── authRoutes.js    # Auth endpoints
│   ├── groupRoutes.js   # Group endpoints
│   └── expenseRoutes.js # Expense endpoints
├── database/
│   └── schema.sql       # SQL schema file (optional manual setup)
├── .env.example         # Environment variables template
├── package.json
├── server.js            # Main server file
└── README.md
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up MySQL Database

**Option A: Using MySQL Command Line**
```bash
# Create database
mysql -u root -p
CREATE DATABASE splitwise;
EXIT;
```

**Option B: Database will be created automatically**
The server will create the database and tables automatically on first run if they don't exist.

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` and update the values:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=splitwise
PORT=5000
```

### 4. Run the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:5000`

**Note:** On first run, the server will automatically create all necessary tables if they don't exist.

## API Endpoints

### Authentication

#### Signup
```
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Groups

#### Create Group
```
POST /api/groups
Content-Type: application/json

{
  "name": "Trip to Goa",
  "description": "Vacation expenses",
  "createdBy": 1
}
```

#### Get All Groups (for a user)
```
GET /api/groups?userId=1
```

#### Get Single Group
```
GET /api/groups/:id
```

#### Add Members to Group
```
POST /api/groups/:id/members
Content-Type: application/json

{
  "memberIds": [2, 3]
}
```

### Expenses

#### Add Expense
```
POST /api/expenses/group/:groupId
Content-Type: application/json

{
  "title": "Dinner",
  "amount": 1500,
  "paidBy": 1,
  "splitBetween": [
    {
      "user": 1,
      "amount": 500
    },
    {
      "user": 2,
      "amount": 500
    },
    {
      "user": 3,
      "amount": 500
    }
  ]
}
```

#### Get Expenses for Group
```
GET /api/expenses/group/:groupId
```

#### Get Balances for Group
```
GET /api/expenses/group/:groupId/balances
```

**Response:**
```json
{
  "balances": [
    {
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "balance": 500.00
    },
    {
      "user": {
        "id": 2,
        "name": "Jane Doe",
        "email": "jane@example.com"
      },
      "balance": -250.00
    }
  ]
}
```

#### Get Who Owes Whom
```
GET /api/expenses/group/:groupId/settlements
```

**Response:**
```json
{
  "settlements": [
    {
      "from": {
        "id": 2,
        "name": "Jane Doe",
        "email": "jane@example.com"
      },
      "to": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "amount": 250.00
    }
  ]
}
```

#### Mark Expense as Settled
```
POST /api/expenses/:expenseId/settle
Content-Type: application/json

{
  "settledBy": 2,
  "amount": 250.00
}
```

## Database Schema

The database consists of the following tables:

- **users** - Stores user information (id, email, password, name)
- **groups** - Stores group information (id, name, description, created_by)
- **group_members** - Junction table for group memberships
- **expenses** - Stores expense information (id, title, amount, group_id, paid_by, settled)
- **expense_splits** - Stores how expenses are split between users
- **expense_settlements** - Stores settlement records for expenses

All tables are automatically created on server start. You can also manually run the SQL schema in `database/schema.sql` if needed.

## Example Usage

### 1. Create Account
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123","name":"John Doe"}'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### 3. Create Group
```bash
curl -X POST http://localhost:5000/api/groups \
  -H "Content-Type: application/json" \
  -d '{"name":"Trip to Goa","description":"Vacation expenses","createdBy":1}'
```

### 4. Add Expense
```bash
curl -X POST http://localhost:5000/api/expenses/group/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Dinner",
    "amount":1500,
    "paidBy":1,
    "splitBetween":[
      {"user":1,"amount":500},
      {"user":2,"amount":500},
      {"user":3,"amount":500}
    ]
  }'
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Server Error

Error responses follow this format:
```json
{
  "message": "Error message here"
}
```

## Notes

- All passwords are hashed using bcryptjs before storage
- No JWT authentication - simple and straightforward
- Balance calculation: Positive = paid more than share, Negative = owes
- Settlements algorithm matches creditors with debtors optimally
- All database tables are automatically created on first server start
- Foreign key constraints ensure data integrity

## License

ISC
