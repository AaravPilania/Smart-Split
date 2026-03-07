# Folder Structure

```
backend/
├── config/
│   └── database.js              # MongoDB connection configuration
│
├── controllers/
│   ├── authController.js        # Authentication logic (signup, login)
│   ├── groupController.js       # Group operations (create, get, add members)
│   └── expenseController.js     # Expense operations (add, get, balances, settlements)
│
├── middleware/
│   └── auth.js                  # JWT authentication middleware
│
├── models/
│   ├── User.js                  # User schema (email, password, name)
│   ├── Group.js                 # Group schema (name, description, members)
│   └── Expense.js               # Expense schema (title, amount, paidBy, splitBetween)
│
├── routes/
│   ├── authRoutes.js            # Authentication routes (/signup, /login)
│   ├── groupRoutes.js           # Group routes (/groups)
│   └── expenseRoutes.js         # Expense routes (/expenses)
│
├── .env.example                 # Environment variables template
├── package.json                 # Dependencies and scripts
├── server.js                    # Main server file
├── README.md                    # Setup and usage instructions
├── API_ENDPOINTS.md             # Detailed API documentation
└── FOLDER_STRUCTURE.md          # This file
```

## File Descriptions

### Models
- **User.js**: Defines user schema with email, password (hashed), and name. Includes password hashing middleware.
- **Group.js**: Defines group schema with name, description, creator, and members array.
- **Expense.js**: Defines expense schema with title, amount, group reference, paidBy user, splitBetween array, and settlement tracking.

### Controllers
- **authController.js**: Handles user signup and login. Generates JWT tokens.
- **groupController.js**: Handles group creation, retrieval, and member management.
- **expenseController.js**: Handles expense creation, retrieval, balance calculation, settlement calculation, and marking expenses as settled.

### Routes
- **authRoutes.js**: Routes for `/api/auth/signup` and `/api/auth/login`.
- **groupRoutes.js**: Routes for `/api/groups` (all require authentication).
- **expenseRoutes.js**: Routes for `/api/expenses` (all require authentication).

### Middleware
- **auth.js**: JWT authentication middleware. Validates token and attaches user to request object.

### Config
- **database.js**: MongoDB connection setup using Mongoose.

### Root Files
- **server.js**: Express app setup, middleware configuration, route mounting, and server startup.
- **package.json**: Project dependencies and npm scripts.
- **.env.example**: Template for environment variables.


