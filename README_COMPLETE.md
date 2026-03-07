# 💰 Splitwise Frontend & Backend

A full-stack expense-sharing application built with **React** (frontend) and **Express.js** (backend) with **MySQL** database.

## ✨ Features

✅ **User Authentication** - Signup/Login with password hashing  
✅ **Group Management** - Create and manage expense groups  
✅ **Smart Expense Splitting** - Split expenses equally or custom amounts  
✅ **Balance Tracking** - Real-time calculation of who owes whom  
✅ **Settlement Calculations** - Optimal settlement suggestions  
✅ **Group Requests** - Request to join groups with approval workflow  
✅ **User Search** - Find and add users by email  
✅ **Responsive Design** - Works on desktop and mobile  

---

## 🚀 Quick Start

### 1. **Automated Setup (Windows)**
```bash
setup.bat
```

### 2. **Automated Setup (Mac/Linux)**
```bash
chmod +x setup.sh
./setup.sh
```

### 3. **Manual Setup**

#### Prerequisites
- Node.js 16+ 
- MySQL 5.7+
- npm or yarn

#### Backend Setup
```bash
cd backend
npm install
npm start
```

#### Frontend Setup (New Terminal)
```bash
npm install
npm run dev
```

---

## 📋 Environment Configuration

Create `.env` file in `backend/` folder:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=splitwise
DB_PORT=3306
PORT=5000
NODE_ENV=development
```

---

## 🔗 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/profile/:userId` | Get user profile |
| PUT | `/api/auth/profile/:userId` | Update profile |

### Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/groups` | Create group |
| GET | `/api/groups?userId=X` | Get user's groups |
| GET | `/api/groups?all=true` | Discover all groups |
| GET | `/api/groups/:id` | Get group details |
| POST | `/api/groups/:id/members` | Add members |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/expenses/group/:id` | Add expense |
| GET | `/api/expenses/group/:id` | Get expenses |
| GET | `/api/expenses/group/:id/balances` | Get balances |
| GET | `/api/expenses/group/:id/settlements` | Get settlements |
| POST | `/api/expenses/:id/settle` | Settle expense |

### Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/requests/group/:id/request` | Request to join |
| GET | `/api/requests/group/:id/requests` | Get requests |
| GET | `/api/requests/user/:id/requests` | Get user requests |
| POST | `/api/requests/:id/approve` | Approve request |
| POST | `/api/requests/:id/reject` | Reject request |

### Utils
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/search?email=X` | Search users |
| GET | `/api/health` | Health check |

---

## 📁 Project Structure

```
splitwise-frontend/
│
├── backend/                           # Node.js/Express API Server
│   ├── config/database.js            # Database config & table creation
│   ├── controllers/                   # Request handlers
│   │   ├── authController.js
│   │   ├── expenseController.js
│   │   ├── groupController.js
│   │   └── groupRequestController.js
│   ├── models/                        # Data models
│   │   ├── User.js
│   │   ├── Group.js
│   │   └── Expense.js
│   ├── routes/                        # API routes
│   │   ├── authRoutes.js
│   │   ├── expenseRoutes.js
│   │   ├── groupRoutes.js
│   │   └── groupRequestRoutes.js
│   ├── package.json
│   ├── server.js                     # Main server file
│   ├── .env                          # Environment variables
│   └── .env.example                  # Example env file
│
├── src/                              # React Frontend
│   ├── components/                   # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── ScanReceipt.jsx
│   │   └── Statscard.jsx
│   ├── pages/                        # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Expenses.jsx
│   │   ├── Groups.jsx
│   │   ├── Home.jsx
│   │   └── Profile.jsx
│   ├── utils/api.js                  # API client
│   ├── App.jsx                       # Main app component
│   ├── main.jsx                      # Entry point
│   └── index.css                     # Global styles
│
├── public/                           # Static assets
├── dist/                             # Built production files
├── package.json                      # Frontend dependencies
├── vite.config.js                    # Vite configuration
├── tailwind.config.js                # Tailwind CSS config
├── SETUP_GUIDE.md                    # Detailed setup guide
├── setup.sh                          # Linux/Mac setup script
├── setup.bat                         # Windows setup script
└── README.md                         # This file
```

---

## 🔧 Development

### Start Backend (Development)
```bash
cd backend
npm run dev          # Auto-reload with nodemon
```

### Start Frontend (Development)
```bash
npm run dev          # Vite dev server with HMR
```

### Build Frontend for Production
```bash
npm run build        # Creates optimized dist/ folder
npm run preview      # Preview production build
```

### Lint Code
```bash
npm run lint         # Check code style with ESLint
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### MySQL Connection Error
1. Ensure MySQL is running
2. Verify credentials in `.env`
3. Check default user is created:
```sql
CREATE USER 'root'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
```

### Dependencies Issue
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Fails
```bash
# Clean build
rm -rf dist
npm run build
```

---

## 📦 Technologies Used

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Animations
- **Vite** - Build tool
- **Tesseract.js** - OCR for receipt scanning
- **Lucide React** - Icon library

### Backend
- **Express.js** - Web framework
- **MySQL2** - MySQL driver
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin support
- **dotenv** - Environment configuration
- **Nodemon** - Development auto-reload

---

## 🔐 Security Features

✅ **Password Hashing** - bcryptjs with salt rounds  
✅ **CORS Headers** - Properly configured  
✅ **SQL Injection Protection** - Parameterized queries  
✅ **Input Validation** - Request validation  
✅ **Environment Variables** - Sensitive data protection  

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Groups Table
```sql
CREATE TABLE groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);
```

### Expenses Table
```sql
CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  group_id INT NOT NULL,
  paid_by INT NOT NULL,
  settled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (paid_by) REFERENCES users(id) ON DELETE CASCADE
);
```

Additional tables: `group_members`, `expense_splits`, `expense_settlements`, `group_requests`

---

## 🧪 API Testing

### Using curl
```bash
# Health check
curl http://localhost:5000/api/health

# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123","name":"John"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'
```

### Using Postman
1. Import API collection to Postman
2. Set base URL: `http://localhost:5000/api`
3. Test individual endpoints with different parameters

---

## 📈 Future Enhancements

- [ ] JWT Token Authentication
- [ ] Email Notifications
- [ ] Expense Categories
- [ ] Monthly Reports
- [ ] Export to PDF/Excel
- [ ] Multi-currency Support
- [ ] Recurring Expenses
- [ ] Mobile App (React Native)
- [ ] Payment Integration
- [ ] Push Notifications

---

## 📝 License

This project is licensed under the ISC License.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

For issues or questions:
1. Check the [SETUP_GUIDE.md](SETUP_GUIDE.md)
2. Review the troubleshooting section above
3. Check the backend logs for errors
4. Verify all prerequisites are installed

---

## ✅ Status

| Component | Status |
|-----------|--------|
| Backend | ✅ Tested & Working |
| Frontend | ✅ Builds Successfully |
| Database | ✅ Auto-Setup |
| API Endpoints | ✅ All Implemented |
| CORS | ✅ Configured |
| Authentication | ✅ Working |
| Groups | ✅ Working |
| Expenses | ✅ Working |

---

**Last Updated**: March 2026  
**Version**: 1.0.0
