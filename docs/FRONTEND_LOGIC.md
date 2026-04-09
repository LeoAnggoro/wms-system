# Frontend Logic - Detailed Documentation

## Table of Contents
1. [Application Architecture](#1-application-architecture)
2. [Routing System](#2-routing-system)
3. [Authentication Flow](#3-authentication-flow)
4. [Dashboard - Inventory Management](#4-dashboard---inventory-management)
5. [Supabase Integration](#5-supabase-integration)
6. [Component Logic Breakdown](#6-component-logic-breakdown)
7. [State Management](#7-state-management)
8. [UI/UX Logic](#8-uiux-logic)
9. [Data Flow Diagrams](#9-data-flow-diagrams)

---

## 1. Application Architecture

### Structure
```
warehouse-frontend/
├── public/
│   ├── index.html          # HTML template
│   ├── manifest.json       # PWA manifest
│   └── ...                 # Static assets
├── src/
│   ├── index.js            # Entry point
│   ├── App.js              # Root component with routes
│   ├── Login.js            # Login page component
│   ├── dashboard.js        # Main inventory CRUD component
│   ├── supabaseClient.js   # Supabase SDK initialization
│   └── *.css               # Stylesheets
└── package.json            # Dependencies & scripts
```

### Tech Stack
- **React 19.2.4** - UI framework
- **React Router v7** - Client-side routing
- **Supabase JS SDK** - Database, Auth, Storage client
- **Bootstrap 5** - CSS framework
- **Create React App** - Build tooling

### Application Lifecycle
```
1. Browser loads index.html
2. React bundle loads (static/js/main.*.js)
3. index.js executes:
   ├─ Import Bootstrap CSS
   ├─ Import App component
   └─ Mount <App /> to #root element
4. App.js renders Router
5. Router matches URL to component
6. Component mounts and executes hooks
```

---

## 2. Routing System

### Router Configuration: `App.js`

```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Routing Logic Flow:
```
User navigates to URL
         ↓
BrowserRouter intercepts
         ↓
Matches path to <Route>
         ↓
Renders corresponding component
```

### Route Behavior:

| Path | Behavior | Component |
|------|----------|-----------|
| `/` | Redirect to `/login` | None (Navigate) |
| `/login` | Show login form | Login |
| `/dashboard` | Show inventory CRUD | Dashboard |

### Missing Features:
❌ **No route guards** - Dashboard accessible without checking auth  
❌ **No fallback route** - Unknown URLs show blank page  
❌ **No loading states** - No suspense boundaries  

### Recommended Addition:
```javascript
// Protected route wrapper
function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (!session) return <Navigate to="/login" />;
  return children;
}

// Usage:
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

---

## 3. Authentication Flow

### Login Component: `Login.js`

#### Component Structure:
```javascript
function Login() {
  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Navigation
  const navigate = useNavigate();
  
  // Submit handler
  const handleSubmit = async (e) => { ... };
  
  // JSX with inline styles
  return ( ... );
}
```

#### Authentication Logic:
```
User enters email + password
         ↓
Clicks "Login" button
         ↓
handleSubmit(e) executes:
  ├─ e.preventDefault()
  ├─ setLoading(true)
  ├─ setError('')
  │
  └─ try {
       supabase.auth.signInWithPassword({
         email,
         password
       })
       ↓
       Supabase validates credentials
       ↓
       If success:
         ├─ Session auto-saved to localStorage
         ├─ navigate('/dashboard')
       ↓
       If error:
         └─ setError(error.message)
     }
     ↓
     catch (err) {
       setError('Terjadi kesalahan')
     }
     ↓
     finally {
       setLoading(false)
     }
```

#### UI States:
```
Initial State:
┌─────────────────────┐
│  Email: [          ]│
│  Password: [       ]│
│  [Login]            │
│  Lupa password?     │
└─────────────────────┘

Loading State:
┌─────────────────────┐
│  Email: [          ]│
│  Password: [       ]│
│  [🔄 Loading...]    │ (disabled)
└─────────────────────┘

Error State:
┌─────────────────────┐
│  ❌ Invalid password│
│  Email: [          ]│
│  Password: [       ]│
│  [Login]            │
└─────────────────────┘
```

#### Styling Logic (Inline):
```javascript
const styles = {
  container: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  card: {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)', // Glassmorphism effect
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '400px',
    width: '90%'
  }
};
```

**Design Pattern:** Glassmorphism (translucent card on gradient background)

---

## 4. Dashboard - Inventory Management

### Component: `dashboard.js`

This is the **main application** where all inventory management happens.

#### Component State:
```javascript
const [items, setItems] = useState([]);         // List of all items
const [newItem, setNewItem] = useState({        // Form data
  name: '',
  category: '',
  estimatedValue: ''
});
const [imageFile, setImageFile] = useState(null); // Selected file
const [editId, setEditId] = useState(null);       // Editing mode flag
const [session, setSession] = useState(null);     // Auth session
```

#### Session Check on Mount:
```javascript
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    if (!session) {
      navigate('/login'); // Redirect if not logged in
    } else {
      fetchData(); // Load items
    }
  });
}, []);
```

**Execution Flow:**
```
Component mounts
       ↓
useEffect runs once
       ↓
supabase.auth.getSession()
       ↓
Session exists? ──No──→ navigate('/login')
       │
      Yes
       ↓
setSession(session)
       ↓
fetchData()
```

---

## 5. Supabase Integration

### Client Initialization: `supabaseClient.js`

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ajrubsqxqcnblxqjmjsg.supabase.co';
const supabaseKey = 'sb_publishable_...'; // ⚠️ Should be in .env

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
```

**What This Creates:**
A Supabase client instance that provides:
- **Auth API** - signIn, signOut, getSession
- **Database API** - SELECT, INSERT, UPDATE, DELETE
- **Storage API** - Upload, download files

### How Supabase is Used:

#### 1. Authentication:
```javascript
// Login (in Login.js)
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

// Get session (in dashboard.js)
const { data: { session } } = await supabase.auth.getSession();

// Logout (in dashboard.js)
await supabase.auth.signOut();
```

#### 2. Database Operations:
```javascript
// READ
const { data, error } = await supabase
  .from('Items')
  .select('*')
  .order('id', { ascending: false });

// CREATE
const { data, error } = await supabase
  .from('Items')
  .insert({ name, category, estimatedValue, image, createdBy: 1 });

// UPDATE
const { error } = await supabase
  .from('Items')
  .update({ name, category, estimatedValue, image })
  .eq('id', editId);

// DELETE
const { error } = await supabase
  .from('Items')
  .delete()
  .eq('id', id);
```

#### 3. Storage Operations:
```javascript
// Upload file
const { data, error } = await supabase.storage
  .from('inventory-images')
  .upload(`inventory/${Date.now()}_${file.name}`, file);

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('inventory-images')
  .getPublicUrl(data.path);
```

**Supabase Architecture in This App:**
```
┌─────────────────────────────────────────────────┐
│              Supabase Platform                   │
├──────────────┬──────────────┬───────────────────┤
│   Auth       │   Database   │   Storage         │
│              │              │                   │
│ - Users      │ - Items table│ - inventory-      │
│ - Sessions   │ - CRUD ops   │   images bucket   │
│ - JWT tokens │              │                   │
└──────────────┴──────────────┴───────────────────┘
```

---

## 6. Component Logic Breakdown

### fetchData() - Load All Items

```javascript
const fetchData = async () => {
  try {
    const { data, error } = await supabase
      .from('Items')
      .select('*')
      .order('id', { ascending: false });
    
    if (error) throw error;
    
    setItems(data);
  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
};
```

**Execution Steps:**
```
1. Call supabase.from('Items') - Target Items table
2. .select('*') - Select all columns
3. .order('id', { ascending: false }) - Sort by ID descending (newest first)
4. Check for errors
5. Update state with setItems(data)
6. React re-renders table with new data
```

**Data Transformation:**
```javascript
// Supabase returns:
[
  { id: 1, name: "Laptop", category: "Electronics", ... },
  { id: 2, name: "Chair", category: "Furniture", ... }
]

// Stored in state as-is
setItems(data)
```

---

### handleSubmit() - Create or Update Item

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validation
  if (!newItem.name) {
    alert('Nama wajib diisi');
    return;
  }
  
  let imageUrl = null;
  
  // Handle image upload (if file selected)
  if (imageFile) {
    const { data, error } = await supabase.storage
      .from('inventory-images')
      .upload(`inventory/${Date.now()}_${imageFile.name}`, imageFile);
    
    if (error) {
      alert('Gagal upload gambar');
      return;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('inventory-images')
      .getPublicUrl(data.path);
    
    imageUrl = publicUrl;
  }
  
  // Create or Update
  if (editId) {
    // UPDATE MODE
    const { error } = await supabase
      .from('Items')
      .update({
        name: newItem.name,
        category: newItem.category,
        estimatedValue: newItem.estimatedValue,
        image: imageUrl || undefined
      })
      .eq('id', editId);
    
    if (error) {
      alert('Gagal update data');
    } else {
      alert('Data berhasil diupdate');
      resetForm();
      fetchData();
    }
  } else {
    // CREATE MODE
    const { error } = await supabase
      .from('Items')
      .insert({
        name: newItem.name,
        category: newItem.category,
        estimatedValue: newItem.estimatedValue,
        image: imageUrl,
        createdBy: 1  // ⚠️ HARDCODED - Should be session.user.id
      });
    
    if (error) {
      alert('Gagal menambah data');
    } else {
      alert('Data berhasil ditambahkan');
      resetForm();
      fetchData();
    }
  }
};
```

**Logic Flow Diagram:**
```
Form submitted
     ↓
Validate name not empty ──Empty──→ alert("Nama wajib diisi")
     │
    Not Empty
     ↓
Image selected? ──Yes──→ Upload to Storage → Get URL
     │
    No/After Upload
     ↓
editId exists? ──Yes──→ UPDATE mode
     │                    ├─ UPDATE Items WHERE id = editId
     │                    ├─ alert("Data berhasil diupdate")
     │                    ├─ resetForm()
     │                    └─ fetchData()
     │
    No (CREATE mode)
     ↓
     ├─ INSERT INTO Items
     │   { name, category, estimatedValue, image, createdBy: 1 }
     ├─ alert("Data berhasil ditambahkan")
     ├─ resetForm()
     └─ fetchData()
```

**Create vs Update Decision Tree:**
```
editId state:
  null    → CREATE new item
  number  → UPDATE existing item
```

---

### startEdit() - Enter Edit Mode

```javascript
const startEdit = (item) => {
  setEditId(item.id);
  setNewItem({
    name: item.name,
    category: item.category,
    estimatedValue: item.estimatedValue
  });
  setImageFile(null);
};
```

**What This Does:**
```
User clicks "Edit" button on a row
         ↓
startEdit(item) called with that item's data
         ↓
1. editId = item.id (marks as edit mode)
2. newItem = populate form with existing values
3. imageFile = null (clear any previous file selection)
         ↓
Form now shows existing values
Button text changes from "Tambah" to "Update"
```

**Visual Change:**
```
Before Edit:
┌──────────────────────────────────────────┐
│ Name: [          ]                       │
│ Category: [      ]  [Tambah] [Batal]    │
└──────────────────────────────────────────┘

After startEdit(item):
┌──────────────────────────────────────────┐
│ Name: [Laptop Dell ]  (pre-filled)       │
│ Category: [Electronics] [Update] [Batal] │
└──────────────────────────────────────────┘
```

---

### handleDelete() - Remove Item

```javascript
const handleDelete = async (id) => {
  // Confirmation
  if (!confirm('Yakin ingin menghapus item ini?')) {
    return;
  }
  
  const { error } = await supabase
    .from('Items')
    .delete()
    .eq('id', id);
  
  if (error) {
    alert('Gagal menghapus data');
  } else {
    alert('Data berhasil dihapus');
    fetchData(); // Refresh list
  }
};
```

**Execution Flow:**
```
User clicks "Hapus" button
         ↓
handleDelete(id) called
         ↓
confirm() dialog shows
         ↓
User clicks "Cancel"? ──Yes──→ Return (do nothing)
         │
        No (Confirm)
         ↓
DELETE FROM Items WHERE id = id
         ↓
Error? ──Yes──→ alert("Gagal menghapus data")
         │
        No
         ↓
alert("Data berhasil dihapus")
         ↓
fetchData() (refresh list)
```

**Important Note:**
- ❌ Image file in storage is NOT deleted
- ❌ No soft delete (data permanently removed)
- ✅ Immediate refresh after deletion

---

### handleLogout() - Sign Out

```javascript
const handleLogout = async () => {
  await supabase.auth.signOut();
  localStorage.clear();
  navigate('/login');
};
```

**Execution Steps:**
```
User clicks "Logout" button
         ↓
supabase.auth.signOut()
  ├─ Invalidates session on Supabase
  └─ Clears session from localStorage
         ↓
localStorage.clear()
  └─ Clear any remaining data
         ↓
navigate('/login')
  └─ Redirect to login page
```

---

### resetForm() - Helper Function

```javascript
const resetForm = () => {
  setEditId(null);
  setNewItem({
    name: '',
    category: '',
    estimatedValue: ''
  });
  setImageFile(null);
};
```

**When Called:**
- After successful create
- After successful update
- When "Batal" (Cancel) button clicked

---

## 7. State Management

### Local State (useState)

All state is managed locally within components using React hooks:

```javascript
// Dashboard component state
const [items, setItems] = useState([]);           // Array of items
const [newItem, setNewItem] = useState({...});    // Form data object
const [imageFile, setImageFile] = useState(null); // File object
const [editId, setEditId] = useState(null);       // Number or null
const [session, setSession] = useState(null);     // Supabase session
```

### State Relationships:
```
items ────────────► Table rendering
     ◄──────────── fetchData()

newItem ─────────► Form inputs
     ◄──────────── onChange handlers
     ◄──────────── startEdit()
     ◄──────────── resetForm()

imageFile ───────► File input
     ◄──────────── onChange on file input

editId ──────────► Button text ("Tambah" vs "Update")
     ◄──────────── startEdit()
     ◄──────────── resetForm()

session ─────────► Auth check on mount
     ◄──────────── getSession()
```

### State Update Patterns:

**Object State (newItem):**
```javascript
// Update single field
setNewItem({
  ...newItem,           // Spread existing
  name: 'New Value'     // Override specific field
});

// Or using computed property
setNewItem(prev => ({
  ...prev,
  [fieldName]: value
}));
```

**Array State (items):**
```javascript
// Replace entire array
setItems(response.data);

// Add to array (not used - fetchData called instead)
setItems([...items, newItem]);

// Remove from array (not used - fetchData called instead)
setItems(items.filter(item => item.id !== id));
```

### No Global State Management:
❌ No Redux  
❌ No Context API  
❌ No Zustand/Recoil  

**Why It Works:** Only 2 pages, props drilling is minimal

---

## 8. UI/UX Logic

### Table Rendering Logic:

```javascript
<table className="table table-striped table-bordered">
  <thead>
    <tr>
      <th>#</th>
      <th>Nama</th>
      <th>Kategori</th>
      <th>Estimasi Harga</th>
      <th>Gambar</th>
      <th>Aksi</th>
    </tr>
  </thead>
  <tbody>
    {items.map((item, index) => (
      <tr key={item.id}>
        <td>{index + 1}</td>
        <td>{item.name}</td>
        <td>
          <span className="badge bg-info">{item.category}</span>
        </td>
        <td>
          {new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
          }).format(item.estimatedValue)}
        </td>
        <td>
          {item.image && (
            <img src={item.image} alt={item.name} 
                 style={{ width: 50, height: 50 }} />
          )}
        </td>
        <td>
          <button onClick={() => startEdit(item)}>Edit</button>
          <button onClick={() => handleDelete(item.id)}>Hapus</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### Currency Formatting Logic:
```javascript
new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0
}).format(15000000);

// Output: "Rp15.000.000"
```

### Conditional Rendering:
```javascript
// Show image only if exists
{item.image && <img src={item.image} alt={item.name} />}

// Edit mode changes button text
{editId ? 'Update' : 'Tambah'}
```

### Form Input Logic:
```javascript
<input
  type="text"
  value={newItem.name}
  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
  placeholder="Nama barang"
/>
```

**Two-way binding pattern:**
```
Input value ← newItem.name (from state)
Input onChange → Update newItem.name (to state)
```

---

## 9. Data Flow Diagrams

### Full Create Item Flow:
```
┌─────────────────────────────────────────────────────────────┐
│  USER ACTION                                                 │
│  User fills form:                                            │
│  - Name: "Laptop Dell"                                       │
│  - Category: "Electronics"                                   │
│  - Value: 15000000                                           │
│  - Selects file: laptop.jpg                                  │
│  Clicks "Tambah"                                             │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  VALIDATION                                                  │
│  Check newItem.name is not empty ✓                          │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  FILE UPLOAD                                                 │
│  supabase.storage.from('inventory-images')                   │
│    .upload('inventory/1234567890_laptop.jpg', file)          │
│                                                              │
│  Returns: { path: 'inventory/1234567890_laptop.jpg' }       │
│                                                              │
│  Get public URL:                                             │
│  supabase.storage.from('inventory-images')                   │
│    .getPublicUrl(path)                                       │
│                                                              │
│  Returns: https://.../inventory/1234567890_laptop.jpg       │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  DATABASE INSERT                                             │
│  supabase.from('Items').insert({                             │
│    name: 'Laptop Dell',                                      │
│    category: 'Electronics',                                  │
│    estimatedValue: 15000000,                                 │
│    image: 'https://.../1234567890_laptop.jpg',              │
│    createdBy: 1  // ⚠️ HARDCODED                             │
│  })                                                          │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  SUCCESS HANDLING                                            │
│  1. alert("Data berhasil ditambahkan")                       │
│  2. resetForm() - Clear form, exit create mode               │
│  3. fetchData() - Refresh table from database                │
└─────────────────────────────────────────────────────────────┘
```

### Session Check Flow:
```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard Component Mounts                                  │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  useEffect executes                                          │
│  supabase.auth.getSession()                                  │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
┌──────────────────┐  ┌──────────────────┐
│ Session EXISTS   │  │ Session NULL     │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         ▼                     ▼
  setSession(session)    navigate('/login')
         │
         ▼
  fetchData()
         │
         ▼
  Render dashboard with items
```

---

## Component Interaction Map

```
┌─────────────────────────────────────────────────────────────┐
│  Login.js                                                    │
│                                                              │
│  [Email Input] ──┐                                          │
│  [Password Input]─┤                                          │
│  [Login Button] ──┼─► supabase.auth.signInWithPassword()     │
│                   │     ↓                                     │
│                   │   Success ──► navigate('/dashboard')      │
│                   │   Error ────► Show error message          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Dashboard.js                                                │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  FORM SECTION                                          │  │
│  │  [Name Input] ─────┐                                  │  │
│  │  [Category Input] ─┤                                  │  │
│  │  [Value Input] ────┤                                  │  │
│  │  [File Input] ─────┤──► handleSubmit()                │  │
│  │  [Tambah Button] ──┤     ↓                            │  │
│  │  [Batal Button] ───┘   Validate                       │  │
│  └────────────────────────────┼──────────────────────────┘  │
│                               ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  TABLE SECTION                                         │  │
│  │                                                        │  │
│  │  ┌───┬──────┬──────────┬─────────┬───────┬────────┐  │  │
│  │  │ # │ Name │ Category │ Value   │ Image │ Action │  │  │
│  │  ├───┼──────┼──────────┼─────────┼───────┼────────┤  │  │
│  │  │ 1 │ ...  │ ...      │ ...     │ [img] │ [E][D] │  │  │
│  │  └───┴──────┴──────────┴─────────┴───────┴────────┘  │  │
│  │                                                       │  │
│  │  [Edit]  ──► startEdit(item)                          │  │
│  │  [Hapus] ── ► handleDelete(id)                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  [Logout Button] ──► handleLogout()                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Known Issues in Frontend

### ⚠️ Critical: Hardcoded User ID
**Location:** `dashboard.js` - handleSubmit()
```javascript
createdBy: 1  // Should be: session.user.id
```
**Impact:** All items appear created by user ID 1, regardless of who creates them

---

### ⚠️ Security: Exposed Credentials
**Location:** `supabaseClient.js`
```javascript
const supabaseKey = 'sb_publishable_...'; // Hardcoded
```
**Fix:** Move to `.env` file
```javascript
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
```

---

### ⚠️ UX: No Loading States
- Table shows nothing while fetching data
- No spinner during create/update/delete operations
- User might click buttons multiple times

---

### ⚠️ UX: No Search/Filter
- Large item lists become unmanageable
- No pagination implemented

---

### ⚠️ Missing: Error Boundary
- Unhandled errors crash the entire app
- No fallback UI for errors

---

## Best Practices Implemented

✅ Bootstrap for consistent styling  
✅ Async/await for clean async logic  
✅ Confirmation dialog before delete  
✅ Form validation before submit  
✅ Session check on dashboard mount  
✅ Auto-redirect if not authenticated  
✅ Currency formatting for Indonesian locale  
✅ Image preview in table  

---

## Recommended Improvements

1. **Add Context API** for global state (session, theme)
2. **Implement route guards** for protected routes
3. **Add loading spinners** during async operations
4. **Add search/filter** for item table
5. **Add pagination** for large datasets
6. **Move credentials to .env** files
7. **Add error boundaries** for graceful error handling
8. **Delete images from storage** when item is deleted
9. **Add toast notifications** instead of alerts
10. **Add form validation** with visual feedback
