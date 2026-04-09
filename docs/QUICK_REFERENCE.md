# WMS Logic - Quick Reference Guide

## 📋 System Overview

A **Warehouse Management System** for tracking inventory items with user authentication.

### Core Features
- ✅ User login (email/password via Supabase Auth)
- ✅ Create, Read, Update, Delete inventory items
- ✅ Upload item images
- ✅ View items in table with category badges and currency formatting

---

## 🔄 How It Works (Simplified)

### User Journey
```
Login Page → Enter credentials → Dashboard → CRUD Items → Logout
```

### Tech Flow
```
Frontend (React) ──HTTP──→ Backend (Express) ──SQL──→ Database (Supabase)
```

---

## 🧩 Frontend Logic (warehouse-frontend/src/)

### File: `index.js` (Entry Point)
**Logic:** Mounts React app to HTML
```javascript
ReactDOM.render(<App />, document.getElementById('root'));
```

---

### File: `App.js` (Routing)
**Logic:** Defines URL routes
```
/          → Redirect to /login
/login     → Show Login component
/dashboard → Show Dashboard component
```

---

### File: `Login.js` (Authentication UI)
**Logic:**
```
1. User enters email + password
2. Clicks "Login"
3. Call: supabase.auth.signInWithPassword({ email, password })
4. If success → Navigate to /dashboard
5. If error → Show error message
```

**State:**
- `email` - Input value
- `password` - Input value
- `loading` - Show spinner while authenticating
- `error` - Display error message

---

### File: `dashboard.js` (Main CRUD Logic)

#### Session Check (On Mount)
```javascript
useEffect(() => {
  supabase.auth.getSession();
  if (!session) navigate('/login');
  else fetchData();
}, []);
```

#### Fetch Items
```javascript
const fetchData = async () => {
  const { data } = await supabase.from('Items').select('*').order('id', { ascending: false });
  setItems(data);
};
```

#### Create/Update Item
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // 1. Validate
  if (!newItem.name) return alert('Nama wajib diisi');
  
  // 2. Upload image (if selected)
  if (imageFile) {
    await supabase.storage.from('inventory-images').upload(path, file);
    imageUrl = getPublicUrl(path);
  }
  
  // 3. Create or Update
  if (editId) {
    // UPDATE
    await supabase.from('Items').update({...}).eq('id', editId);
  } else {
    // CREATE
    await supabase.from('Items').insert({
      name, category, estimatedValue, image,
      createdBy: 1  // ⚠️ HARDCODED - should use session.user.id
    });
  }
  
  // 4. Reset & Refresh
  resetForm();
  fetchData();
};
```

#### Delete Item
```javascript
const handleDelete = async (id) => {
  if (!confirm('Yakin ingin menghapus item ini?')) return;
  await supabase.from('Items').delete().eq('id', id);
  fetchData();
};
```

#### Edit Mode
```javascript
const startEdit = (item) => {
  setEditId(item.id);           // Enter edit mode
  setNewItem({                  // Pre-fill form
    name: item.name,
    category: item.category,
    estimatedValue: item.estimatedValue
  });
};
```

**State Variables:**
- `items` - Array of all items (for table)
- `newItem` - Form data object { name, category, estimatedValue }
- `imageFile` - Selected file object
- `editId` - null = create mode, number = edit mode
- `session` - Supabase auth session

---

### File: `supabaseClient.js` (SDK Setup)
**Logic:** Initialize Supabase client
```javascript
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export default supabase;
```

**Provides:**
- `supabase.auth` - Authentication methods
- `supabase.from()` - Database queries
- `supabase.storage` - File upload/download

---

## 🛠 Backend Logic (backend/)

### File: `server.js` (Entry Point)
**Logic:**
```
1. Initialize Express app
2. Apply middleware:
   - CORS (allow cross-origin)
   - JSON parser (parse request bodies)
   - Static files (serve /uploads directory)
3. Mount routes:
   - /api/auth → authRoutes
   - /api/items → itemRoutes
4. Connect to Supabase database
5. Start server on PORT 5000
```

---

### File: `config/db.js` (Database Config)
**Logic:** Singleton Sequelize instance
```javascript
let sequelize = null;

function getSequelize() {
  if (!sequelize) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
    });
  }
  return sequelize;
}
```

**Sync Function:**
```javascript
async function syncDatabase() {
  await sequelize.authenticate();      // Test connection
  await sequelize.sync({ alter: true }); // Auto-update schema
}
```

---

### File: `models/user.js` (User Schema)
**Database Schema:**
```
Users Table:
├─ id: SERIAL (PK, auto-increment)
├─ name: STRING
├─ email: STRING (unique, required)
├─ password: STRING (required, bcrypt hash)
├─ role: ENUM ['admin', 'staff'] (default: 'staff')
├─ createdAt: TIMESTAMP
└─ updatedAt: TIMESTAMP
```

---

### File: `models/Item.js` (Item Schema)
**Database Schema:**
```
Items Table:
├─ id: SERIAL (PK, auto-increment)
├─ name: STRING (required)
├─ category: STRING
├─ estimatedValue: INTEGER
├─ image: STRING (filename)
├─ createdBy: INTEGER (FK → Users.id)
├─ createdAt: TIMESTAMP
└─ updatedAt: TIMESTAMP

Relationship: Item.belongsTo(User, { as: 'owner' })
```

---

### File: `middleware/auth.js` (JWT Verification)
**Logic:**
```
1. Extract "Authorization" header
2. Parse "Bearer TOKEN" → get TOKEN
3. Verify token with JWT_SECRET
4. Attach decoded user to req.user
5. Call next() to proceed
```

**Usage:**
```javascript
router.get('/items', auth, itemController.getItems);
//                   ↑
//              This runs first, blocks if invalid token
```

---

### File: `middleware/upload.js` (File Upload)
**Logic:**
```
1. Multer intercepts multipart/form-data
2. Saves file to /uploads/{timestamp}.{ext}
3. Max size: 5MB
4. Populates req.file with metadata
```

**File Metadata:**
```javascript
req.file = {
  fieldname: 'image',
  originalname: 'photo.jpg',
  filename: '1234567890.jpg',
  path: 'uploads/1234567890.jpg',
  size: 123456
};
```

---

### File: `controllers/itemController.js` (CRUD Logic)

#### Create Item
```
1. Extract body: { name, category, estimatedValue }
2. Extract file: req.file?.filename
3. Extract user: req.user.id (from JWT)
4. Create Item record
5. Return created item
```

#### Get All Items
```
1. Query Items with JOIN to Users (get owner name/email)
2. Order by createdAt DESC
3. Return array of items
```

#### Update Item
```
1. Find item by ID
2. If not found → 404
3. Merge body + optional new image
4. Update record
5. Return updated item
```

#### Delete Item
```
1. Find item by ID
2. If not found → 404
3. Delete record
4. Return success message
```

---

### ⚠️ File: `controllers/authController.js` (BROKEN)
**Current State:** Contains React frontend code instead of backend logic
**Impact:** All auth routes crash at runtime
**Needs:** Complete rewrite with proper Express controller logic

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/` | No | Health check |
| POST | `/api/auth/register` | No | Register user ⚠️ BROKEN |
| POST | `/api/auth/login` | No | Login ⚠️ BROKEN |
| DELETE | `/api/auth/:id` | No | Delete user ⚠️ BROKEN |
| GET | `/api/items` | Yes | Get all items |
| POST | `/api/items` | Yes | Create item (+ image) |
| PUT | `/api/items/:id` | Yes | Update item |
| DELETE | `/api/items/:id` | Yes | Delete item |

---

## 🔐 Authentication Flow

### Frontend Approach (Currently Used):
```
Login.js → supabase.auth.signInWithPassword()
                ↓
Session stored in localStorage automatically
                ↓
Navigate to /dashboard
```

### Backend Approach (Intended but Broken):
```
POST /api/auth/login
        ↓
Find user by email
        ↓
bcrypt.compare(password, hashedPassword)
        ↓
Generate JWT token
        ↓
Return { token, user }
        ↓
Frontend stores token
        ↓
Include in headers: Authorization: Bearer TOKEN
```

---

## 💾 Data Flow Examples

### Example: Creating an Item

```
User Action:
  Fill form: "Laptop Dell", "Electronics", 15000000
  Select file: laptop.jpg
  Click "Tambah"
      ↓
Frontend (dashboard.js):
  1. Validate name not empty ✓
  2. Upload image to Supabase Storage
     Path: inventory/1234567890_laptop.jpg
     URL: https://.../inventory/1234567890_laptop.jpg
  3. INSERT into Items:
     {
       name: "Laptop Dell",
       category: "Electronics",
       estimatedValue: 15000000,
       image: "https://.../1234567890_laptop.jpg",
       createdBy: 1
     }
  4. Reset form
  5. Refresh table
      ↓
Result:
  New row appears in table
```

---

### Example: Updating an Item

```
User Action:
  Click "Edit" on "Laptop Dell" row
      ↓
Frontend:
  startEdit(item) → Pre-fill form with existing values
  Button changes: "Tambah" → "Update"
      ↓
User Action:
  Change name to "Laptop Dell XPS"
  Click "Update"
      ↓
Frontend:
  handleSubmit() → UPDATE Items SET name="Laptop Dell XPS" WHERE id=1
  Reset form
  Refresh table
      ↓
Result:
  Row shows "Laptop Dell XPS"
```

---

## 🎨 UI Logic

### Table Rendering
```javascript
{items.map((item, index) => (
  <tr key={item.id}>
    <td>{index + 1}</td>
    <td>{item.name}</td>
    <td><span className="badge bg-info">{item.category}</span></td>
    <td>{Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.estimatedValue)}</td>
    <td>{item.image && <img src={item.image} style={{ width: 50, height: 50 }} />}</td>
    <td>
      <button onClick={() => startEdit(item)}>Edit</button>
      <button onClick={() => handleDelete(item.id)}>Hapus</button>
    </td>
  </tr>
))}
```

### Currency Format
```
Input:  15000000
Output: Rp15.000.000
```

### Conditional Rendering
```javascript
// Show image only if exists
{item.image && <img src={item.image} />}

// Button text changes based on mode
{editId ? 'Update' : 'Tambah'}
```

---

## 🐛 Known Issues

### Critical
1. **Auth controller broken** - Contains React code instead of backend logic
2. **Hardcoded user ID** - `createdBy: 1` instead of actual user ID
3. **Exposed credentials** - Supabase keys hardcoded in frontend

### Missing Features
1. **No route guards** - Dashboard accessible without auth check
2. **No loading states** - No spinners during async operations
3. **No search/filter** - Hard to find items in large lists
4. **No pagination** - All items loaded at once
5. **No error boundaries** - App crashes on unhandled errors

### Security
1. **No rate limiting** - Brute force attack possible on login
2. **No input sanitization** - XSS vulnerability
3. **No CORS whitelist** - All origins accepted
4. **Orphaned files** - Images not deleted when item deleted

---

## 📦 Dependencies

### Frontend
```json
{
  "react": "^19.2.4",
  "react-router-dom": "^7.13.2",
  "@supabase/supabase-js": "^2.101.1",
  "bootstrap": "^5.3.8"
}
```

### Backend
```json
{
  "express": "^4.18.2",
  "sequelize": "^6.x",
  "pg": "^8.x",
  "bcrypt": "^5.x",
  "jsonwebtoken": "^9.x",
  "multer": "^1.4.5",
  "cors": "^2.8.5"
}
```

---

## 🚀 How to Run

### Frontend
```bash
cd warehouse-frontend
npm install
npm start
# Opens: http://localhost:3000
```

### Backend
```bash
cd backend
npm install
# Create .env with DATABASE_URL, JWT_SECRET, PORT
npm run dev
# Runs on: http://localhost:5000
```

---

## 📝 Quick Code References

### How to Add New Field to Item
**1. Update model (backend/models/Item.js):**
```javascript
description: {
  type: DataTypes.TEXT,
  allowNull: true
}
```

**2. Update form (frontend dashboard.js):**
```javascript
// Add to newItem state
newItem: { name: '', category: '', estimatedValue: '', description: '' }

// Add input to form
<input
  value={newItem.description}
  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
/>

// Add to handleSubmit
const { description } = newItem;
// Include in insert/update
```

**3. Update table:**
```javascript
<th>Deskripsi</th>
// In map:
<td>{item.description}</td>
```

---

### How to Add New Page
**1. Create component:**
```javascript
// src/Reports.js
function Reports() {
  return <div>Reports Page</div>;
}
export default Reports;
```

**2. Add route (App.js):**
```javascript
import Reports from './Reports';
// In Routes:
<Route path="/reports" element={<Reports />} />
```

**3. Add navigation link:**
```javascript
<Link to="/reports">Reports</Link>
```

---

### How to Add Backend Route
**1. Create controller:**
```javascript
// controllers/reportController.js
exports.getReports = async (req, res) => {
  const reports = await Report.findAll();
  res.json(reports);
};
```

**2. Create route:**
```javascript
// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { getReports } = require('../controllers/reportController');

router.get('/reports', auth, getReports);

module.exports = router;
```

**3. Mount in server.js:**
```javascript
const reportRoutes = require('./routes/reportRoutes');
app.use('/api', reportRoutes);
```

---

## 🎯 Key Patterns

### Two-Way Data Binding (Frontend)
```javascript
<input
  value={newItem.name}           // State → Input
  onChange={(e) =>               // Input → State
    setNewItem({...newItem, name: e.target.value})
  }
/>
```

### CRUD Operations (Frontend)
```javascript
CREATE: supabase.from('Items').insert(data)
READ:   supabase.from('Items').select('*')
UPDATE: supabase.from('Items').update(data).eq('id', id)
DELETE: supabase.from('Items').delete().eq('id', id)
```

### CRUD Operations (Backend)
```javascript
CREATE: Item.create(data)
READ:   Item.findAll()
UPDATE: item.update(data)
DELETE: item.destroy()
```

### Authentication (Frontend)
```javascript
Login:  supabase.auth.signInWithPassword({ email, password })
Session: supabase.auth.getSession()
Logout: supabase.auth.signOut()
```

### Authentication (Backend - Intended)
```javascript
Register: bcrypt.hash(password, 10) → User.create()
Login:    User.findOne() → bcrypt.compare() → jwt.sign()
Verify:   jwt.verify(token) → req.user
```

---

## 💡 Tips

### Debugging Frontend
1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab for API calls
4. Use React DevTools extension

### Debugging Backend
1. Check terminal for error logs
2. Use `console.log(req.body)` to inspect requests
3. Use Postman/Insomnia to test endpoints
4. Check database connection with `syncDatabase()`

### Common Errors
- **"Cannot read property of undefined"** → Check if state/data exists before accessing
- **"CORS error"** → Backend needs CORS middleware or proper headers
- **"Token expired"** → Re-login to get new token
- **"404 Not Found"** → Check URL path and route definitions
