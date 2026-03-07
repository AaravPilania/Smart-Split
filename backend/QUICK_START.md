# Quick Start Guide

Get your backend up and running in 4 simple steps!

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Set Up MySQL

Make sure MySQL is installed and running on your system.

**Windows:**
- Install MySQL from [mysql.com](https://dev.mysql.com/downloads/installer/)
- Start MySQL service

**Mac:**
```bash
brew install mysql
brew services start mysql
```

**Linux:**
```bash
sudo apt-get install mysql-server
sudo systemctl start mysql
```

## Step 3: Configure Environment

1. Create a `.env` file in the `backend` directory:
```bash
# Copy the example file
cp .env.example .env
```

2. Edit `.env` and update these values:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=splitwise
PORT=5000
```

**Important:** Replace `your_mysql_password` with your actual MySQL root password!

## Step 4: Run the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will start on `http://localhost:5000`

**Note:** The database and tables will be created automatically on first run!

## Test the API

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Create an Account
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

Save the `id` from the response - you'll need it for other requests!

### Create a Group
```bash
curl -X POST http://localhost:5000/api/groups \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Group",
    "description": "Testing the API",
    "createdBy": 1
  }'
```

### Get Groups for a User
```bash
curl "http://localhost:5000/api/groups?userId=1"
```

## Next Steps

- Read `README.md` for detailed documentation
- Check `API_ENDPOINTS.md` for all available endpoints
- See `FOLDER_STRUCTURE.md` to understand the codebase

## Troubleshooting

**"MySQL connection error"**
- Make sure MySQL is running
- Check your MySQL credentials in `.env`
- Verify MySQL is accessible on `localhost:3306`

**"Database doesn't exist" error**
- The database will be created automatically on first run
- Or manually create: `CREATE DATABASE splitwise;`

**"Port already in use"**
- Change `PORT` in `.env` to a different number
- Or stop the process using port 5000

**"Access denied for user"**
- Check your MySQL username and password in `.env`
- Make sure the MySQL user has permission to create databases
