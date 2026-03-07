# 🚀 Quick Reference - Splitwise Frontend

## Starting the Project

### Option 1: Automated (Windows)
```bash
setup.bat
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

**Open in Browser:**
```
http://localhost:5173
```

---

## 🔗 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | `http://localhost:5173` | React app |
| Backend API | `http://localhost:5000/api` | API base |
| Health Check | `http://localhost:5000/api/health` | API status |
| MySQL | `localhost:3306` | Database (default) |

---

## 📋 Database Credentials (Default)

```
Host: localhost
User: root
Password: password
Database: splitwise
Port: 3306
```

---

## 🛠️ Common Commands

```bash
# Frontend
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check code style

# Backend
cd backend
npm install          # Install dependencies
npm start            # Start server (production)
npm run dev          # Start server (development with reload)
```

---

## 🔐 Default Test User Setup

After backend is running, you can test with:

**Signup:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## 🚨 Troubleshooting

### Backend Won't Start
```bash
# Check if port is in use
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <PID> /F
```

### "Cannot connect to MySQL"
- Ensure MySQL is running
- Check credentials in `backend/.env`
- Verify database is created

### "Module not found"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Frontend won't load
```bash
# Clear build and rebuild
rm -rf dist
npm run build
npm run dev
```

---

## 📊 Project Structure

```
backend/            ← Express.js API Server
  ├── config/       ← Database config
  ├── controllers/  ← API handlers
  ├── models/       ← Data models
  ├── routes/       ← API routes
  └── server.js

src/                ← React Frontend
  ├── components/   ← UI components
  ├── pages/        ← Page components
  ├── utils/        ← Utilities
  └── App.jsx
```

---

## ✨ Features Implemented

✅ User authentication (signup/login)  
✅ Create and manage groups  
✅ Add and track expenses  
✅ Split expenses between users  
✅ Calculate balances and settlements  
✅ Group join requests  
✅ User search functionality  
✅ Responsive design  

---

## 📞 Need Help?

1. Read [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed setup
2. Check [README_COMPLETE.md](README_COMPLETE.md) for full documentation
3. Review console logs for error messages
4. Check backend logs for API errors

---

## ✅ Verification Checklist

- [ ] MySQL is running
- [ ] Backend is responding (`http://localhost:5000/api/health`)
- [ ] Frontend is running (`http://localhost:5173`)
- [ ] Can signup a new user
- [ ] Can login with credentials
- [ ] Can create a group
- [ ] Can add expenses

---

**Status: ✅ READY TO USE**
