# Splitwise Frontend - Complete Setup & Run Guide

## 🎯 Quick Start (Both Backend & Frontend)

### Prerequisites
- **Node.js** v16+ installed
- **MySQL** server running on localhost (default port 3306)
- **npm** or **yarn** package manager

### Step 1: Database Setup

1. Ensure MySQL is running locally
2. Create a MySQL user (if not already done):
   ```sql
   CREATE USER 'root'@'localhost' IDENTIFIED BY 'password';
   GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
   FLUSH PRIVILEGES;
   ```

### Step 2: Backend Setup & Launch

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the backend server
npm start
# or for development with auto-reload:
npm run dev
```

**Expected Output:**
```
✅ MySQL connected successfully
✅ Tables created/verified successfully
✅ Server running on http://localhost:5000
   Health check: http://localhost:5000/api/health
```

Backend is now running on `http://localhost:5000`

### Step 3: Frontend Setup & Launch (in a new terminal)

```bash
# From the root directory (splitwise-frontend)
npm install

# Start development server
npm run dev
```

**Expected Output:**
```
  VITE v7.1.7  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

Frontend is now running on `http://localhost:5173`

---

## 📋 Available Endpoints

### Authentication
- **POST** `/api/auth/signup` - Register a new user
- **POST** `/api/auth/login` - Login user
- **GET** `/api/auth/profile/:userId` - Get user profile
- **PUT** `/api/auth/profile/:userId` - Update user profile

### Groups
- **POST** `/api/groups` - Create a new group
- **GET** `/api/groups` - Get all groups (requires `userId` query param)
- **GET** `/api/groups?all=true` - Get all groups for discovery
- **GET** `/api/groups/:id` - Get single group details
- **POST** `/api/groups/:id/members` - Add members to group

### Expenses
- **POST** `/api/expenses/group/:groupId` - Add expense to group
- **GET** `/api/expenses/group/:groupId` - Get all expenses in group
- **GET** `/api/expenses/group/:groupId/balances` - Get member balances
- **GET** `/api/expenses/group/:groupId/settlements` - Get settlement info (who owes whom)
- **POST** `/api/expenses/:expenseId/settle` - Mark expense as settled

### Group Requests
- **POST** `/api/requests/group/:groupId/request` - Create join request
- **GET** `/api/requests/group/:groupId/requests` - Get pending requests for group
- **GET** `/api/requests/user/:userId/requests` - Get user's requests
- **POST** `/api/requests/request/:requestId/approve` - Approve request
- **POST** `/api/requests/request/:requestId/reject` - Reject request

### Other
- **GET** `/api/users/search` - Search users by email
- **GET** `/api/health` - Health check endpoint

---

## 🔧 Backend Environment Configuration

Create/update `.env` file in the `backend/` directory:

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=splitwise
DB_PORT=3306

# Server Configuration
PORT=5000
NODE_ENV=development
```

---

## ✨ Project Structure

```
splitwise-frontend/
├── backend/                    # Node.js Express API
│   ├── config/
│   │   └── database.js        # Database connection & table setup
│   ├── controllers/            # Route handlers
│   ├── models/                 # Data models
│   ├── routes/                 # API routes
│   ├── package.json
│   └── server.js              # Main server file
│
├── src/                        # React frontend
│   ├── components/             # Reusable UI components
│   ├── pages/                  # Page components
│   ├── utils/
│   │   └── api.js             # API client utilities
│   ├── App.jsx
│   └── main.jsx
│
├── package.json               # Frontend dependencies
├── vite.config.js             # Vite configuration
└── tailwind.config.js         # Tailwind CSS configuration
```

---

## 🐛 Common Issues & Solutions

### Port 5000 Already in Use
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

### MySQL Connection Error
- Ensure MySQL is running
- Check credentials in `.env` file match your MySQL setup
- Default: user=`root`, password=`password`

### CORS Issues
- Backend is configured to accept requests from any origin with `origin: '*'`
- Frontend API calls use `http://localhost:5000/api`

### Build Errors
```bash
# Clear cache and rebuild
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 🚀 Development Tips

### Running Backend in Development Mode
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload on file changes
```

### Running Frontend in Development Mode
```bash
npm run dev  # Hot module replacement enabled
```

### Building for Production
```bash
# Frontend
npm run build  # Creates optimized dist/ folder

# Frontend preview
npm run preview
```

### Linting
```bash
npm run lint  # Check code for issues
```

---

## 📦 Key Dependencies

### Backend
- `express` - Web framework
- `mysql2` - MySQL driver
- `bcryptjs` - Password hashing
- `cors` - Cross-origin requests
- `dotenv` - Environment variables

### Frontend
- `react` - UI library
- `react-router-dom` - Routing
- `tailwindcss` - Styling
- `framer-motion` - Animations
- `tesseract.js` - OCR (receipt scanning)

---

## ✅ Verification Checklist

- [ ] MySQL is running and accessible
- [ ] Backend environment file (`.env`) is configured correctly
- [ ] Backend server starts without errors
- [ ] Health check endpoint responds: `http://localhost:5000/api/health`
- [ ] Frontend dependencies installed
- [ ] Frontend builds successfully
- [ ] Frontend development server runs on `http://localhost:5173`
- [ ] Frontend can make API calls to backend

---

## 📞 Support

For API testing, use tools like:
- **Postman** - GUI API testing
- **curl** - Command line API testing
- **REST Client** (VS Code extension)

Example curl test:
```bash
curl -X GET http://localhost:5000/api/health
```

---

**Status**: ✅ Backend tested and working | ✅ Frontend builds successfully | ✅ All dependencies installed
