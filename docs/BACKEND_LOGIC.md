# Backend Logic - Detailed Documentation

## Table of Contents
1. [Server Architecture](#1-server-architecture)
2. [Database Layer](#2-database-layer)
3. [Authentication System](#3-authentication-system)
4. [Item Management System](#4-item-management-system)
5. [Middleware System](#5-middleware-system)
6. [File Upload System](#6-file-upload-system)
7. [Error Handling](#7-error-handling)
8. [Data Models](#8-data-models)
9. [API Reference](#9-api-reference)

---

## 1. Server Architecture

### Entry Point: `server.js`

The server follows a modular Express architecture with separate concerns divided into:
- **Routes** - Define URL patterns and map to controllers
- **Controllers** - Handle business logic
- **Models** - Define database schema and relationships
- **Middleware** - Cross-cutting concerns (auth, file upload)
- **Config** - Database configuration

#### Server Startup Sequence:
```
1. Import dependencies (express, cors, routes, db config)
2. Initialize Express app
3. Apply middleware stack:
   - CORS (allow cross-origin requests)
   - JSON body parser (parse application/json)
   - Static file server (serve /uploads directory)
4. Define health check route: GET /
5. Mount route modules:
   - /api/auth → authRoutes
   - /api/items → itemRoutes
6. Call syncDatabase():
   - Authenticate DB connection
   - Sync all models (create/alter tables)
7. Start HTTP listener on 0.0.0.0:PORT
```

#### Why This Matters:
- **0.0.0.0 binding**: Required for cloud deployment (Railway, Heroku)
- **syncDatabase()**: Auto-creates tables on startup, no manual migrations needed
- **Modular routes**: Easy to add new route modules without touching server.js

---

## 2. Database Layer

### Configuration: `config/db.js`

Uses the **Singleton Pattern** to ensure only one Sequelize instance exists across the application.

#### Connection Logic:
```javascript
let sequelize = null;

function getSequelize() {
  if (!sequelize) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false  // Allow self-signed certs
        }
      },
      // Critical for Supabase connection pooler (port 6543)
      pool: {
        prepareThreshold: 0
      }
    });
  }
  return sequelize;
}
```

#### Database Sync:
```javascript
async function syncDatabase() {
  await sequelize.authenticate();     // Test connection
  await sequelize.sync({ alter: true }); // Update schema
  console.log('Database synced');
}
```

#### Why `alter: true`:
- **Development**: Automatically adds new columns when models change
- **Production Warning**: Can cause data loss, use migrations instead
- **Current State**: Suitable for prototyping, not production-ready

### Supabase Connection:
- **Protocol**: PostgreSQL (native, not REST API)
- **SSL**: Required for cloud connections
- **Port**: Typically 5432 (direct) or 6543 (pooler)
- **Pooler Mode**: Requires `prepareThreshold: 0` to avoid prepared statement errors

---

## 3. Authentication System

### ⚠️ CRITICAL BUG: `controllers/authController.js`

**Current State:** This file contains **React frontend code** (a Login component) instead of Express controller logic.

**Expected Controller Structure:**

```javascript
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Register new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Hash password (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'staff'
    });
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'SECRET',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Authentication Flow (Intended):

```
┌─────────────┐
│   Register  │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────┐
│ 1. Validate input            │
│ 2. Check email uniqueness    │
│ 3. Hash password (bcrypt)    │
│ 4. Create user in DB         │
│ 5. Return success message    │
└──────────────────────────────┘

┌─────────────┐
│    Login    │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────┐
│ 1. Validate input            │
│ 2. Find user by email        │
│ 3. Verify password (bcrypt)  │
│ 4. Generate JWT token        │
│ 5. Return token + user data  │
└──────────────────────────────┘
```

### JWT Token Structure:
```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234654290
}
```
- `iat`: Issued at (timestamp)
- `exp`: Expiration (24 hours later)

---

## 4. Item Management System

### Controller: `controllers/itemController.js`

This is the **working part** of the backend. All CRUD operations function correctly.

#### Create Item Logic:
```javascript
exports.createItem = async (req, res) => {
  try {
    const { name, category, estimatedValue } = req.body;
    const image = req.file ? req.file.filename : null;
    const createdBy = req.user.id; // From JWT middleware
    
    const item = await Item.create({
      name,
      category,
      estimatedValue,
      image,
      createdBy
    });
    
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**Key Points:**
- Image is **optional** (checks `req.file` existence)
- `createdBy` comes from JWT token, not request body
- Filename stored, not full path (static server handles `/uploads/`)

#### Get All Items Logic:
```javascript
exports.getItems = async (req, res) => {
  try {
    const items = await Item.findAll({
      include: [{
        model: User,
        as: 'owner',
        attributes: ['name', 'email'] // Only select these columns
      }],
      order: [['createdAt', 'DESC']] // Newest first
    });
    
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**Key Points:**
- JOIN with Users table to get creator info
- Returns only `name` and `email` from user (not password!)
- Sorted by creation date (newest first)

#### Update Item Logic:
```javascript
exports.updateItem = async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const updates = {
      ...req.body,
      ...(req.file && { image: req.file.filename })
    };
    
    await item.update(updates);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**Key Points:**
- Spread operator merges body + optional image
- Only updates provided fields (partial updates)
- Returns updated item instance

#### Delete Item Logic:
```javascript
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    await item.destroy();
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**Key Points:**
- Soft delete not implemented (permanent deletion)
- Image file on disk NOT deleted (orphaned file issue)

---

## 5. Middleware System

### Authentication Middleware: `middleware/auth.js`

**Purpose:** Protect routes by requiring valid JWT token

```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // 1. Extract token from header
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1]; // "Bearer TOKEN" → "TOKEN"
  if (!token) {
    return res.status(401).json({ error: 'Malformed token' });
  }
  
  // 2. Verify token
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'SECRET'
    );
    
    // 3. Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

**Usage:**
```javascript
router.get('/items', auth, itemController.getItems);
//                ↑ middleware runs before controller
```

**Flow:**
```
Request → Extract Header → Parse Token → Verify → Attach to req.user → next()
                                    ↓
                              Error? → 401 Response
```

### How to Use in Frontend:
```javascript
const token = localStorage.getItem('token');
fetch('/api/items', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 6. File Upload System

### Multer Configuration: `middleware/upload.js`

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp + original extension
    const uniqueName = `${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter (optional - can restrict types)
const fileFilter = (req, file, cb) => {
  // Accept images only:
  // if (file.mimetype.startsWith('image/')) {
  //   cb(null, true);
  // } else {
  //   cb(new Error('Only images allowed'));
  // }
  cb(null, true); // Accept all files
};

// Create multer instance
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

module.exports = upload;
```

**Upload Flow:**
```
Client POST with multipart/form-data
         ↓
upload.single('image') middleware
         ↓
File saved to /uploads/1234567890.jpg
         ↓
req.file populated with metadata:
  {
    fieldname: 'image',
    originalname: 'photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    destination: 'uploads/',
    filename: '1234567890.jpg',
    path: 'uploads/1234567890.jpg',
    size: 123456
  }
         ↓
Controller accesses req.file.filename
```

**Static File Serving:**
```javascript
// In server.js
app.use('/uploads', express.static('uploads'));
```

This allows accessing uploaded files via:
```
GET /uploads/1234567890.jpg → Returns image
```

---

## 7. Error Handling

### Current Error Handling Pattern:

Each controller uses try-catch blocks:

```javascript
try {
  // Business logic
  const item = await Item.create(...);
  res.json(item);
} catch (error) {
  res.status(500).json({ error: error.message });
}
```

### Missing: Global Error Handler

**Recommended addition to `server.js`:**
```javascript
// After all routes
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});
```

### Common Error Responses:

| Status Code | Meaning | Example |
|-------------|---------|---------|
| 200 | Success | `{ "id": 1, "name": "Item" }` |
| 201 | Created | `{ "id": 1, "name": "New Item" }` |
| 400 | Bad Request | `{ "error": "Email required" }` |
| 401 | Unauthorized | `{ "error": "No token provided" }` |
| 404 | Not Found | `{ "error": "Item not found" }` |
| 409 | Conflict | `{ "error": "Email already exists" }` |
| 500 | Server Error | `{ "error": "Database connection failed" }` |

---

## 8. Data Models

### User Model

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'staff'),
    defaultValue: 'staff'
  }
}, {
  timestamps: true // Adds createdAt, updatedAt
});

module.exports = User;
```

**Database Schema:**
```sql
CREATE TABLE "Users" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255),
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "role" VARCHAR(10) DEFAULT 'staff',
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL
);
```

### Item Model

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user');

const Item = sequelize.define('Item', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  estimatedValue: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true
});

// Define relationship
Item.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'owner'
});

module.exports = Item;
```

**Database Schema:**
```sql
CREATE TABLE "Items" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "category" VARCHAR(255),
  "estimatedValue" INTEGER,
  "image" VARCHAR(255),
  "createdBy" INTEGER NOT NULL REFERENCES "Users"("id"),
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL
);
```

**Relationship:**
```
Item.createdBy → User.id
(Multiple items can reference the same user)
```

---

## 9. API Reference

### Health Check

```
GET /
Response: 200
{ "status": "Server is running" }
```

---

### Authentication Routes

#### Register
```
POST /api/auth/register
Body: {
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "staff" (optional, defaults to "staff")
}

Success: 201
{ "message": "User registered successfully" }

Error: 409
{ "error": "Email already registered" }
```

#### Login
```
POST /api/auth/login
Body: {
  "email": "john@example.com",
  "password": "securepassword"
}

Success: 200
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin"
  }
}

Error: 401
{ "error": "Invalid password" }
```

#### Delete User
```
DELETE /api/auth/:id
Headers: Authorization: Bearer <token>

Success: 200
{ "message": "User deleted successfully" }

Error: 404
{ "error": "User not found" }
```

---

### Item Routes

#### Create Item
```
POST /api/items
Headers:
  Authorization: Bearer <token>
  Content-Type: multipart/form-data
Body (form-data):
  name: "Laptop Dell"
  category: "Electronics"
  estimatedValue: 15000000
  image: <file> (optional)

Success: 201
{
  "id": 1,
  "name": "Laptop Dell",
  "category": "Electronics",
  "estimatedValue": 15000000,
  "image": "1234567890.jpg",
  "createdBy": 1,
  "createdAt": "2026-04-09T10:00:00Z",
  "updatedAt": "2026-04-09T10:00:00Z"
}
```

#### Get All Items
```
GET /api/items
Headers: Authorization: Bearer <token>

Success: 200
[
  {
    "id": 1,
    "name": "Laptop Dell",
    "category": "Electronics",
    "estimatedValue": 15000000,
    "image": "1234567890.jpg",
    "createdBy": 1,
    "createdAt": "2026-04-09T10:00:00Z",
    "updatedAt": "2026-04-09T10:00:00Z",
    "owner": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
]
```

#### Update Item
```
PUT /api/items/:id
Headers:
  Authorization: Bearer <token>
  Content-Type: multipart/form-data
Body (form-data):
  name: "Laptop Dell Updated"
  category: "Electronics"
  estimatedValue: 14000000
  image: <file> (optional)

Success: 200
{ (updated item object) }

Error: 404
{ "error": "Item not found" }
```

#### Delete Item
```
DELETE /api/items/:id
Headers: Authorization: Bearer <token>

Success: 200
{ "message": "Item deleted successfully" }

Error: 404
{ "error": "Item not found" }
```

---

## Security Considerations

### Current State:
✅ Password hashing with bcrypt  
✅ JWT token authentication for protected routes  
✅ Password excluded from item owner queries  

### Vulnerabilities:
❌ Auth controller is broken (needs fix)  
❌ No rate limiting on auth routes (brute force risk)  
❌ No input sanitization (XSS potential)  
❌ No CORS whitelist (accepts all origins)  
❌ Uploaded files not validated (malware risk)  
❌ Image files not deleted when item deleted (storage leak)  

### Recommendations:
1. Fix authController.js immediately
2. Add rate limiting: `express-rate-limit`
3. Add file type validation in Multer
4. Implement CORS whitelist
5. Add helmet.js for security headers
6. Clean up orphaned image files on item deletion
