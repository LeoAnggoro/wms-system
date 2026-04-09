# WMS System - Setup Guide

## ✅ Fixes Applied

### 1. **Fixed: Broken Authentication Controller**
- **File:** `backend/controllers/authController.js`
- **Issue:** Contained React frontend code instead of backend logic
- **Fix:** Replaced with proper Express controller using bcrypt + jsonwebtoken
- **Status:** ✅ FIXED

### 2. **Fixed: Hardcoded User ID**
- **File:** `warehouse-frontend/src/dashboard.js`
- **Issue:** `createdBy: 1` hardcoded instead of using actual user ID
- **Fix:** Now uses `user.id` from authenticated Supabase session
- **Status:** ✅ FIXED

### 3. **Fixed: Broken Test**
- **File:** `warehouse-frontend/src/App.test.js`
- **Issue:** Tested for "learn react" text which doesn't exist
- **Fix:** Updated to test for "WMS Login" text
- **Status:** ✅ FIXED

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Supabase project created
- PostgreSQL database ready

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create .env file:**
   ```bash
   copy .env.example .env
   ```

4. **Configure .env with your values:**
   ```env
   DATABASE_URL=postgresql://user:password@host:port/dbname
   JWT_SECRET=your-secret-key-here
   PORT=5000
   ```

   **Get DATABASE_URL from:**
   - Supabase Dashboard → Settings → Database
   - Connection string should include port 6543 (pooler) or 5432 (direct)

5. **Start the server:**
   ```bash
   # Development (with hot reload)
   npm run dev
   
   # Production
   npm start
   ```

6. **Verify server is running:**
   ```
   Server should start on http://localhost:5000
   Visit http://localhost:5000/ to see status
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd warehouse-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create .env file:**
   ```bash
   copy .env.example .env
   ```

4. **Configure .env with your Supabase credentials:**
   ```env
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   REACT_APP_API_URL=http://localhost:5000
   ```

   **Get Supabase credentials from:**
   - Supabase Dashboard → Settings → API
   - Project URL: `https://xxxxx.supabase.co`
   - anon/public key: Starts with `eyJ...`

5. **Start development server:**
   ```bash
   npm start
   ```

6. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🧪 Testing the Fixes

### Test Authentication (Backend)

1. **Register a new user:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"password123\"}"
   ```

   **Expected Response:**
   ```json
   {
     "message": "User berhasil didaftarkan",
     "user": {
       "id": 1,
       "name": "Test User",
       "email": "test@example.com",
       "role": "staff"
     }
   }
   ```

2. **Login:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
   ```

   **Expected Response:**
   ```json
   {
     "message": "Login berhasil",
     "token": "eyJhbGciOiJIUzI1NiIs...",
     "user": {
       "id": 1,
       "name": "Test User",
       "email": "test@example.com",
       "role": "staff"
     }
   }
   ```

3. **Test protected route:**
   ```bash
   curl -X GET http://localhost:5000/api/items \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

### Test Frontend Login

1. **Start both backend and frontend**
2. **Open http://localhost:3000**
3. **Login with credentials**
4. **Should redirect to /dashboard**
5. **Create an item**
6. **Verify `createdBy` is your actual user ID (not 1)**

---

## 📋 Database Setup

### Option 1: Auto-Sync (Development)
The backend automatically creates/updates tables on startup using Sequelize sync.

**What it does:**
- Creates `Users` table if not exists
- Creates `Items` table if not exists
- Adds new columns when models change
- Does NOT delete existing data

**Warning:** Not recommended for production!

### Option 2: Manual SQL (Production)

Run these SQL commands in Supabase SQL Editor:

```sql
-- Create Users table
CREATE TABLE IF NOT EXISTS "Users" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255),
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "role" VARCHAR(10) DEFAULT 'staff',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create Items table
CREATE TABLE IF NOT EXISTS "Items" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "category" VARCHAR(255),
  "estimatedValue" INTEGER,
  "image" VARCHAR(255),
  "image_url" TEXT,
  "createdBy" INTEGER NOT NULL REFERENCES "Users"("id"),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX "Items_createdBy_idx" ON "Items"("createdBy");

-- Enable Row Level Security (RLS)
ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Items" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "Users can view own profile" 
  ON "Users" FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can create own account" 
  ON "Users" FOR INSERT 
  WITH CHECK (true);

-- RLS Policies for Items
CREATE POLICY "Anyone can view items" 
  ON "Items" FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create items" 
  ON "Items" FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own items" 
  ON "Items" FOR UPDATE 
  USING (auth.uid() = "createdBy");

CREATE POLICY "Users can delete own items" 
  ON "Items" FOR DELETE 
  USING (auth.uid() = "createdBy");
```

### Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create new bucket: `inventory-images`
3. Set public access (or configure RLS policies)
4. Allowed MIME types: `image/*`
5. Max file size: 5MB

---

## 🔧 Common Issues & Solutions

### Issue 1: "Cannot connect to database"

**Symptoms:**
```
Error: connect ECONNREFUSED
```

**Solutions:**
- Check DATABASE_URL format is correct
- Ensure SSL is enabled for Supabase connections
- Verify port (6543 for pooler, 5432 for direct)
- Check if database is accessible from your location

**Fix:**
```javascript
// In config/db.js, ensure SSL is configured
dialectOptions: {
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
}
```

---

### Issue 2: "JWT verification failed"

**Symptoms:**
```
TokenExpiredError: jwt expired
JsonWebTokenError: invalid token
```

**Solutions:**
- Check JWT_SECRET is set in .env
- Ensure same JWT_SECRET used for signing and verifying
- Token expires after 24 hours (re-login)

**Fix:**
```env
# In backend/.env
JWT_SECRET=my-secret-key-123
```

---

### Issue 3: "CORS error from frontend"

**Symptoms:**
```
Access to fetch at 'http://localhost:5000' has been blocked by CORS policy
```

**Solutions:**
- Ensure CORS middleware is enabled in backend
- Check backend is running
- Verify correct API URL in frontend

**Fix:**
```javascript
// In server.js
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true
}));
```

---

### Issue 4: "File upload fails"

**Symptoms:**
```
MulterError: Unexpected field
```

**Solutions:**
- Ensure form uses `multipart/form-data`
- Field name must be `image` (matches multer config)
- Check file size < 5MB

**Fix Frontend:**
```javascript
const formData = new FormData();
formData.append('image', file); // Field name must be 'image'
formData.append('name', 'Item Name');
```

---

### Issue 5: "createdBy is still wrong"

**Symptoms:**
- Items show wrong user ID
- Foreign key constraint violation

**Solutions:**
- Frontend now uses `user.id` from Supabase session
- Ensure user is logged in before creating items
- Check Supabase session is valid

**Verification:**
```javascript
// In dashboard.js, check user ID
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user ID:', user.id);
```

---

### Issue 6: "Supabase auth not working"

**Symptoms:**
- Login fails
- Session not persisting
- "No active session" errors

**Solutions:**
- Verify Supabase URL and anon key are correct
- Enable Email/Password auth in Supabase Dashboard
- Check browser console for errors
- Clear localStorage and try again

**Enable Email Auth in Supabase:**
1. Authentication → Providers
2. Enable "Email" provider
3. Configure email templates (optional)
4. Disable email confirmation if not needed

---

## 📊 Architecture After Fixes

```
┌──────────────────────────────────────────────────────┐
│                   FRONTEND (React)                    │
│                                                       │
│  Login.js ──────────────────► Dashboard.js           │
│  • Supabase Auth              • Uses user.id         │
│  • Email/Password             • Fixed createdBy      │
│  • Session check              • Proper error handling│
└────────────────────┬─────────────────────────────────┘
                     │
                     │ Direct Supabase Client
                     │ OR Backend API
                     ▼
┌──────────────────────────────────────────────────────┐
│                   BACKEND (Express)                   │
│                                                       │
│  authController.js ───────► itemController.js        │
│  • FIXED: Was React code  • CRUD operations          │
│  • Now uses bcrypt        • JWT auth middleware      │
│  • Now uses jwt.sign      • Multer file upload       │
└────────────────────┬─────────────────────────────────┘
                     │
                     │ Sequelize ORM (PostgreSQL)
                     ▼
┌──────────────────────────────────────────────────────┐
│              DATABASE (Supabase)                       │
│                                                       │
│  Users Table              Items Table                │
│  • id (PK)                • id (PK)                  │
│  • email (unique)         • createdBy (FK → Users)   │
│  • password (hashed)      • image_url (TEXT)         │
│  • role                   • All other fields         │
│                                                       │
│  Storage: inventory-images bucket                    │
└──────────────────────────────────────────────────────┘
```

---

## 🔒 Security Checklist

- [x] Password hashing with bcrypt (10 rounds)
- [x] JWT token authentication
- [x] Protected routes require valid token
- [x] File upload size limit (5MB)
- [x] Input validation
- [ ] Enable HTTPS in production
- [ ] Add rate limiting on auth routes
- [ ] Implement CORS whitelist
- [ ] Add input sanitization (prevent XSS)
- [ ] Enable Row Level Security (RLS) in Supabase
- [ ] Use environment variables for all secrets
- [ ] Delete orphaned images when items deleted

---

## 📝 Next Steps

### Immediate
1. ✅ Set up Supabase project
2. ✅ Configure environment variables
3. ✅ Install dependencies
4. ✅ Run backend server
5. ✅ Run frontend dev server
6. ✅ Test login flow
7. ✅ Test CRUD operations

### Recommended Improvements
1. Add loading spinners during async operations
2. Add search/filter functionality
3. Add pagination for large datasets
4. Add toast notifications (replace alerts)
5. Add error boundaries for graceful error handling
6. Add form validation with visual feedback
7. Implement soft deletes (don't permanently delete)
8. Add image deletion when item deleted
9. Add user profile page
10. Add role-based access control (admin vs staff)

### Production Deployment
1. Set NODE_ENV=production
2. Use production database
3. Configure CORS whitelist
4. Set up CI/CD pipeline
5. Enable monitoring/logging
6. Set up backups
7. Configure SSL certificates

---

## 📞 Support

If you encounter issues:

1. Check this setup guide
2. Review error messages in console
3. Verify all environment variables
4. Check database connection
5. Ensure both servers are running
6. Clear browser cache and localStorage

### Common Commands

```bash
# Backend
cd backend
npm install          # Install dependencies
npm run dev          # Start dev server
npm start            # Start production server

# Frontend
cd warehouse-frontend
npm install          # Install dependencies
npm start            # Start dev server
npm run build        # Build for production
npm test             # Run tests
```

---

## ✨ Summary of All Fixes

| File | Issue | Status |
|------|-------|--------|
| `backend/controllers/authController.js` | Contained React code | ✅ FIXED |
| `warehouse-frontend/src/dashboard.js` | Hardcoded createdBy: 1 | ✅ FIXED |
| `warehouse-frontend/src/App.test.js` | Wrong test assertion | ✅ FIXED |
| `backend/.env.example` | Missing | ✅ CREATED |
| `warehouse-frontend/.env.example` | Missing | ✅ CREATED |

All critical errors have been resolved! 🎉
