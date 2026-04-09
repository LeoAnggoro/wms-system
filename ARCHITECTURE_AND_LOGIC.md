# WMS System - Architecture & Logic Documentation

## Overview
This is a **Warehouse Management System (WMS)** that allows users to manage inventory items. The system consists of a React frontend and an Express.js backend with Supabase (PostgreSQL) as the database.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React Frontend (warehouse-frontend)                 │   │
│  │  - Login.js (Authentication UI)                      │   │
│  │  - dashboard.js (Inventory CRUD UI)                  │   │
│  │  - supabaseClient.js (Supabase JS Client)            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP Requests / Supabase Client
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND SERVER                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Express.js (backend/server.js)                      │   │
│  │                                                      │   │
│  │  Auth Routes:           Item Routes:                 │   │
│  │  POST /api/auth/register   POST   /api/items         │   │
│  │  POST /api/auth/login      GET    /api/items         │   │
│  │  DELETE /api/auth/:id      PUT    /api/items/:id     │   │
│  │                              DELETE /api/items/:id   │   │
│  └──────────────────────────────────────────────────────┘   │
│              │                              │                │
│              ▼                              ▼                │
│  ┌──────────────────┐          ┌────────────────────────┐   │
│  │ authController.js│          │ itemController.js      │   │
│  │ (⚠️ BROKEN)      │          │ (Working CRUD)         │   │
│  └──────────────────┘          └────────────────────────┘   │
│              │                              │                │
│              ▼                              ▼                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Middleware                                           │   │
│  │  - auth.js (JWT verification)                        │   │
│  │  - upload.js (Multer file upload)                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Sequelize ORM
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE (Supabase)                      │
│  ┌──────────────────┐          ┌────────────────────────┐   │
│  │ Users Table      │          │ Items Table            │   │
│  │ - id (PK)        │◄─────────│ - id (PK)              │   │
│  │ - name           │          │ - name                 │   │
│  │ - email (unique) │          │ - category             │   │
│  │ - password (hash)│          │ - estimatedValue       │   │
│  │ - role           │          │ - image (filename)     │   │
│  └──────────────────┘          │ - createdBy (FK)       │   │
│                                │ - createdAt            │   │
│                                │ - updatedAt            │   │
│                                └────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Storage: inventory-images bucket                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend Logic Flow

### 1. Server Initialization (`server.js`)
```
START
  │
  ├─► Load environment variables (.env)
  │
  ├─► Initialize Express app
  │     │
  │     ├─► Apply CORS middleware
  │     ├─► Apply JSON body parser
  │     └─► Serve static files from /uploads
  │
  ├─► Mount Routes
  │     ├─► /api/auth → authRoutes
  │     └─► /api/items → itemRoutes
  │
  ├─► Connect to Supabase (PostgreSQL) via Sequelize
  │     └─► syncDatabase() - syncs all models
  │
  └─► Listen on PORT (default: 5000) on 0.0.0.0
```

### 2. Authentication Flow (`authController.js` + `auth.js` middleware)

#### Registration Logic (INTENDED - ⚠️ Currently Broken):
```
POST /api/auth/register
  │
  ├─► Receive { name, email, password, role? }
  │
  ├─► Hash password using bcrypt (salt rounds: 10)
  │
  ├─► Create User record in database
  │
  └─► Return { message: "User registered" }
```

#### Login Logic (INTENDED - ⚠️ Currently Broken):
```
POST /api/auth/login
  │
  ├─► Receive { email, password }
  │
  ├─► Find user by email
  │     └─► If not found → Return 404
  │
  ├─► Compare password with bcrypt hash
  │     └─► If invalid → Return 401
  │
  ├─► Generate JWT token with payload:
  │     { id, email, role }
  │     Secret: process.env.JWT_SECRET
  │     Expiry: 24h
  │
  └─► Return { token, user: { id, name, email, role } }
```

#### JWT Authentication Middleware (`middleware/auth.js`):
```
Request arrives at protected route
  │
  ├─► Extract "Authorization" header
  │     └─► If missing → Return 401 "No token provided"
  │
  ├─► Parse Bearer token (split "Bearer " prefix)
  │
  ├─► Verify token using JWT_SECRET
  │     └─► If expired → Return 401 "Token expired"
  │     └─► If invalid → Return 401 "Invalid token"
  │
  ├─► Attach decoded user info to req.user
  │
  └─► Call next() → proceed to route handler
```

### 3. Item CRUD Logic (`itemController.js`)

#### Create Item:
```
POST /api/items (requires auth + image upload)
  │
  ├─► Middleware: auth.js verifies JWT token
  │
  ├─► Middleware: upload.single('image') processes file
  │     └─► Saves to /uploads/{timestamp}.{ext}
  │     └─► Max size: 5MB
  │
  ├─► Extract from req.body: { name, category, estimatedValue }
  │
  ├─► Extract from req.file: filename (if uploaded)
  │
  ├─► Extract from req.user: id (as createdBy)
  │
  ├─► Create Item record in database
  │
  └─► Return created Item object
```

#### Get All Items:
```
GET /api/items (requires auth)
  │
  ├─► Middleware: auth.js verifies JWT token
  │
  ├─► Query Items table with JOIN to Users table
  │     Include: owner (name, email only)
  │     Order: createdAt DESC
  │
  └─► Return array of Items with owner info
```

#### Update Item:
```
PUT /api/items/:id (requires auth + optional image upload)
  │
  ├─► Middleware: auth.js verifies JWT token
  │
  ├─► Find item by ID
  │     └─► If not found → Return 404
  │
  ├─► Extract updates from req.body
  │
  ├─► If new image uploaded:
  │     └─► Add image filename to updates
  │
  ├─► Update item record
  │
  └─► Return updated Item object
```

#### Delete Item:
```
DELETE /api/items/:id (requires auth)
  │
  ├─► Middleware: auth.js verifies JWT token
  │
  ├─► Find item by ID
  │     └─► If not found → Return 404
  │
  ├─► Destroy (delete) item record
  │
  └─► Return { message: "Item deleted successfully" }
```

### 4. Database Models

#### User Model (`models/user.js`):
```javascript
User {
  id: INTEGER (auto-generated primary key)
  name: STRING
  email: STRING (unique, required)
  password: STRING (required, bcrypt hashed)
  role: ENUM ["admin", "staff"] (default: "staff")
  createdAt: DATE
  updatedAt: DATE
}
```

#### Item Model (`models/Item.js`):
```javascript
Item {
  id: INTEGER (auto-generated primary key)
  name: STRING (required)
  category: STRING
  estimatedValue: INTEGER
  image: STRING (filename)
  createdBy: INTEGER (foreign key → User.id)
  createdAt: DATE
  updatedAt: DATE
}

Relationship: Item.belongsTo(User, { foreignKey: "createdBy", as: "owner" })
```

### 5. Database Configuration (`config/db.js`)
```
Singleton Pattern:
  │
  ├─► Creates one Sequelize instance
  │
  ├─► Connects to PostgreSQL via DATABASE_URL
  │     Format: postgresql://user:pass@host:port/dbname
  │
  ├─► SSL Configuration:
  │     - rejectUnauthorized: false (cloud connections)
  │     - prepareThreshold: 0 (Supabase pooler compatibility)
  │
  └─► syncDatabase():
        ├─► sequelize.authenticate() - test connection
        └─► sequelize.sync({ alter: true }) - sync models
```

---

## Frontend Logic Flow

### 1. Application Initialization

#### Entry Point (`index.js`):
```
START
  │
  ├─► Import React, ReactDOM
  │
  ├─► Import Bootstrap CSS globally
  │
  ├─► Import App component
  │
  └─► ReactDOM.render(<App />, document.getElementById('root'))
```

#### App Component (`App.js`):
```
React App Component
  │
  ├─► Wrap in <BrowserRouter>
  │
  ├─► Define Routes:
  │     ├─► "/" → Redirect to /login
  │     ├─► "/login" → <Login />
  │     └─► "/dashboard" → <Dashboard />
  │
  └─► Render matched route component
```

### 2. Authentication Flow (`Login.js`)

```
Login Page Renders
  │
  ├─► Display gradient background + glassmorphism card
  │
  ├─► Form with:
  │     ├─► Email input
  │     ├─► Password input
  │     └─► Login button
  │
  ├─► On Submit:
  │     ├─► Set loading state = true
  │     │
  │     ├─► Call supabase.auth.signInWithPassword({ email, password })
  │     │     │
  │     │     ├─► Success:
  │     │     │     ├─► Session stored in localStorage automatically
  │     │     │     └─► navigate('/dashboard')
  │     │     │
  │     │     └─► Error:
  │     │           └─► Display error message
  │     │
  │     └─► Set loading state = false
  │
  ├─► "Forgot password? Contact Admin" text (non-functional)
  │
  └─► Loading spinner shown while authenticating
```

### 3. Dashboard Logic (`dashboard.js`)

#### Session Check on Mount:
```
useEffect(() => {
  │
  ├─► supabase.auth.getSession()
  │     │
  │     ├─► No session → navigate('/login')
  │     │
  │     └─► Has session → proceed
  │
  └─► fetchData()
}, [])
```

#### Fetch Data:
```
fetchData()
  │
  ├─► supabase.from('Items').select('*').order('id', { ascending: false })
  │
  ├─► Success → setItems(response.data)
  │
  └─► Error → console.error(error)
```

#### Create/Update Item (`handleSubmit`):
```
handleSubmit(e)
  │
  ├─► e.preventDefault()
  │
  ├─► Validate: newItem.name exists
  │     └─► If not → alert("Nama wajib diisi")
  │
  ├─► If editing (editId !== null):
  │     │
  │     ├─► If image file selected:
  │     │     ├─► Upload to Supabase Storage
  │     │     │     Bucket: 'inventory-images'
  │     │     │     Path: 'inventory/{timestamp}_{filename}'
  │     │     │
  │     │     └─► Get public URL
  │     │
  │     ├─► supabase.from('Items').update({
  │     │       name, category, estimatedValue, image
  │     │     }).eq('id', editId)
  │     │
  │     └─► Success: reset form, fetchData(), alert("Updated")
  │
  └─► If creating (editId === null):
        │
        ├─► If image file selected:
        │     └─► Upload to Storage (same as above)
        │
        ├─► supabase.from('Items').insert({
        │       name, category, estimatedValue, image,
        │       createdBy: 1  // ⚠️ HARDCODED
        │     })
        │
        └─► Success: reset form, fetchData(), alert("Created")
```

#### Delete Item (`handleDelete`):
```
handleDelete(id)
  │
  ├─► confirm("Yakin ingin menghapus item ini?")
  │     └─► Cancel → return
  │
  ├─► supabase.from('Items').delete().eq('id', id)
  │
  └─► Success: fetchData(), alert("Deleted")
```

#### Logout (`handleLogout`):
```
handleLogout()
  │
  ├─► supabase.auth.signOut()
  │
  ├─► localStorage.clear()
  │
  └─► navigate('/login')
```

### 4. Supabase Client (`supabaseClient.js`)
```javascript
Creates Supabase client with:
  - URL: https://ajrubsqxqcnblxqjmjsg.supabase.co
  - Anon Key: (publishable key)

Exports: supabase instance for use across components
```

---

## Data Flow Diagram

### Full Item Creation Flow:
```
User on Dashboard
      │
      ├─► Fills form: Name, Category, Estimated Value
      │
      ├─► (Optional) Selects image file
      │
      ├─► Clicks "Simpan"
      │
      ├─► Frontend validates name is not empty
      │
      ├─► If image: Upload to Supabase Storage
      │     └─► Get public URL
      │
      ├─► INSERT into Items table via Supabase client
      │     { name, category, estimatedValue, image, createdBy: 1 }
      │
      ├─► Refresh item list
      │
      └─► Show success alert
```

### Full Login Flow (Frontend → Supabase Direct):
```
User on Login Page
      │
      ├─► Enters email + password
      │
      ├─► Clicks "Login"
      │
      ├─► supabase.auth.signInWithPassword()
      │
      ├─► Supabase validates credentials
      │
      ├─► Session stored in localStorage
      │
      └─► Navigate to /dashboard
```

---

## API Endpoints Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/` | No | Server health check |
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | User login |
| DELETE | `/api/auth/:id` | No | Delete user |
| GET | `/api/items` | Yes | Get all items |
| POST | `/api/items` | Yes | Create item (with image) |
| PUT | `/api/items/:id` | Yes | Update item |
| DELETE | `/api/items/:id` | Yes | Delete item |

---

## Known Issues & Bugs

### ⚠️ Critical: Backend Auth Controller is Broken
- **File:** `backend/controllers/authController.js`
- **Problem:** Contains React frontend code instead of Express controller logic
- **Impact:** All auth routes (`/api/auth/*`) will crash at runtime
- **Fix needed:** Replace with proper backend auth controller using bcrypt + jsonwebtoken

### ⚠️ Security: Hardcoded User ID
- **File:** `warehouse-frontend/src/dashboard.js`
- **Problem:** `createdBy: 1` is hardcoded instead of using actual authenticated user
- **Impact:** All items appear created by user ID 1
- **Fix needed:** Extract user ID from Supabase session

### ⚠️ Security: Exposed Supabase Credentials
- **File:** `warehouse-frontend/src/supabaseClient.js`
- **Problem:** Supabase URL and anon key are hardcoded in client code
- **Impact:** Potential unauthorized access if key is misused
- **Fix needed:** Use environment variables (.env)

### ⚠️ Missing: Row Level Security (RLS)
- **Problem:** No RLS policies mentioned for Supabase tables
- **Impact:** Direct API access could bypass frontend auth
- **Fix needed:** Configure RLS policies in Supabase dashboard

### ⚠️ Test Failure
- **File:** `warehouse-frontend/src/App.test.js`
- **Problem:** Tests for "learn react" text which doesn't exist
- **Impact:** Tests will fail
- **Fix needed:** Update test to check for actual app content

---

## Technology Stack

### Backend:
- **Runtime:** Node.js
- **Framework:** Express.js
- **ORM:** Sequelize
- **Database:** PostgreSQL (Supabase)
- **Auth:** bcrypt + jsonwebtoken (JWT)
- **File Upload:** Multer
- **Deployment:** Railway (uses $PORT env var)

### Frontend:
- **Framework:** React 19 (Create React App)
- **Routing:** React Router v7
- **UI:** Bootstrap 5
- **Backend Client:** Supabase JS SDK (direct connection)
- **Build Tool:** react-scripts 5.0.1
- **Production Server:** serve

---

## Environment Variables Required

### Backend (.env):
```
DATABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET=your-secret-key
PORT=5000
```

### Frontend (.env):
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```
