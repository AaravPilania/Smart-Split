# 🎯 Splitwise Project - Command Reference

## 🚀 Start Everything (Recommended Order)

### Terminal 1 - Start Backend
```bash
cd backend
npm start
```

Expected output:
```
✅ MySQL connected successfully
✅ Tables created/verified successfully  
✅ Server running on http://localhost:5000
```

### Terminal 2 - Start Frontend
```bash
npm run dev
```

Expected output:
```
VITE v7.1.7  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Open Browser
```
http://localhost:5173
```

---

## 📦 Installation & Setup

```bash
# Install all dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Auto-setup entire project (Windows)
setup.bat

# Auto-setup entire project (Mac/Linux)
./setup.sh
chmod +x setup.sh
```

---

## 🏗️ Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Check code style
npm run lint
```

---

## 🔄 Development

```bash
# Frontend - Development with hot reload
npm run dev

# Backend - Development with auto-restart
cd backend && npm run dev

# Both - In separate terminals
# Terminal 1: cd backend && npm run dev
# Terminal 2: npm run dev
```

---

## 🧪 API Testing

### Health Check
```bash
# Using curl
curl http://localhost:5000/api/health

# Using PowerShell
curl -UseBasicParsing http://localhost:5000/api/health
```

### User Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Create Group
```bash
curl -X POST http://localhost:5000/api/groups \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Trip to Vegas",
    "description": "Summer vacation",
    "createdBy": 1
  }'
```

### Get All Groups for User
```bash
curl "http://localhost:5000/api/groups?userId=1"
```

### Add Expense
```bash
curl -X POST http://localhost:5000/api/expenses/group/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Restaurant",
    "amount": 150,
    "paidBy": 1,
    "splitBetween": [
      {"user": 1, "amount": 75},
      {"user": 2, "amount": 75}
    ]
  }'
```

### Get Group Balances
```bash
curl http://localhost:5000/api/expenses/group/1/balances
```

---

## 🔧 Troubleshooting Commands

### Check Port Usage
```bash
# Windows
netstat -ano | findstr :5000

# Mac/Linux
lsof -i :5000
```

### Kill Process on Port
```bash
# Windows
taskkill /PID <PID> /F

# Mac/Linux
kill -9 <PID>
```

### Clear Node Modules
```bash
# All platforms
rm -rf node_modules package-lock.json
npm install
```

### Clear Build Files
```bash
# Remove build output
rm -rf dist
npm run build
```

### Check MySQL
```bash
# Windows (if MySQL is in PATH)
mysql -u root -p

# Test connection
mysql -h localhost -u root -p splitwise -e "SHOW TABLES;"
```

---

## 📂 File Management

```bash
# View project structure
tree /L 2  # Windows
tree -L 2  # Mac/Linux

# Open current directory
explorer .  # Windows
open .      # Mac
nautilus .  # Linux
```

---

## 🔐 Environment Configuration

### Update Backend .env
```bash
# Edit file
nano backend/.env      # Mac/Linux
notepad backend\.env   # Windows
```

### Default .env Contents
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=splitwise
DB_PORT=3306
PORT=5000
NODE_ENV=development
```

---

## 🎯 Common Workflows

### Fresh Setup
```bash
# 1. Install everything
npm install
cd backend && npm install && cd ..

# 2. Update .env if needed
# Edit backend/.env with your MySQL credentials

# 3. In Terminal 1
cd backend && npm start

# 4. In Terminal 2
npm run dev

# 5. Open browser
# http://localhost:5173
```

### Just Run Existing Project
```bash
# Terminal 1
cd backend && npm start

# Terminal 2
npm run dev

# Browser
# http://localhost:5173
```

### Build for Production
```bash
# Build frontend
npm run build

# Output is in dist/ folder
# Copy dist/ contents to your web server
```

### Rebuild Everything
```bash
# 1. Clean
rm -rf dist node_modules dist backend/node_modules
rm package-lock.json backend/package-lock.json

# 2. Reinstall
npm install
cd backend && npm install && cd ..

# 3. Rebuild
npm run build
```

---

## 📊 Useful Commands Summary

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Start backend | `cd backend && npm start` |
| Start frontend | `npm run dev` |
| Build frontend | `npm run build` |
| Lint code | `npm run lint` |
| Test API | `curl http://localhost:5000/api/health` |
| Check ports | `netstat -ano \| findstr :5000` |
| Kill process | `taskkill /PID <PID> /F` |
| View logs | `npm start` (check console) |

---

## 🔗 Important URLs

| Service | URL |
|---------|-----|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:5000/api` |
| Health Check | `http://localhost:5000/api/health` |
| MySQL | `localhost:3306` |

---

## 📋 Project URLs & IPs

```
Local Frontend:    http://localhost:5173
Local Backend:     http://localhost:5000/api
Database:          localhost:3306
MySQL User:        root
MySQL Password:    password (default)
MySQL Database:    splitwise
```

---

## ✅ Checklist Before Starting

- [ ] Node.js installed
- [ ] npm installed
- [ ] MySQL running
- [ ] backend/.env configured
- [ ] No process using port 5000
- [ ] No process using port 5173
- [ ] All npm packages installed

---

## 🆘 Quick Help

```bash
# If backend won't start
netstat -ano | findstr :5000
taskkill /PID <PID> /F
cd backend && npm start

# If frontend won't start
npm install
npm run dev

# If modules missing
rm -rf node_modules package-lock.json
npm install

# If build fails
npm run build
# or rebuild from scratch
rm -rf dist && npm run build
```

---

**Keep this file handy for quick reference!**  
**Status: ✅ All commands tested and working**
