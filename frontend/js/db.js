/**
 * db.js — API-backed CRUD cache with localStorage fallback
 */
const DB = (() => {
  const API_BASE = 'http://localhost:3000/api';
  const COLLECTIONS = ['rooms', 'guests', 'bookings', 'menuItems', 'tables', 'orders', 'staff', 'activity'];
  const cache = {};
  let isUsingFallback = false;

  // Initialize empty cache
  COLLECTIONS.forEach(col => { cache[col] = []; });

  function _uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function _getCol(col) { return cache[col] || []; }

  async function _api(path, options = {}) {
    const config = { ...options };
    config.headers = { 'Content-Type': 'application/json', ...(config.headers || {}) };
    if (config.body && typeof config.body !== 'string') config.body = JSON.stringify(config.body);
    
    try {
      const res = await fetch(`${API_BASE}${path}`, config);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      if (res.status === 204) return null;
      return res.json();
    } catch (err) {
      isUsingFallback = true;
      throw err;
    }
  }

  function _saveLocal() {
    if (isUsingFallback) {
      localStorage.setItem('bnf_db_cache', JSON.stringify(cache));
    }
  }

  function _loadLocal() {
    const saved = localStorage.getItem('bnf_db_cache');
    if (saved) {
      const data = JSON.parse(saved);
      Object.keys(data).forEach(col => { cache[col] = data[col]; });
      return true;
    }
    return false;
  }

  const LOCAL_SEED = {
    rooms: [
      { number: '101', type: 'Standard', floor: 1, capacity: 2, pricePerNight: 2500, status: 'available', amenities: 'AC, WiFi, TV' },
      { number: '102', type: 'Standard', floor: 1, capacity: 2, pricePerNight: 2500, status: 'occupied', amenities: 'AC, WiFi, TV' },
      { number: '103', type: 'Standard', floor: 1, capacity: 2, pricePerNight: 2500, status: 'available', amenities: 'AC, WiFi' },
      { number: '201', type: 'Deluxe', floor: 2, capacity: 2, pricePerNight: 4500, status: 'available', amenities: 'AC, WiFi, Mini Bar' },
      { number: '202', type: 'Deluxe', floor: 2, capacity: 2, pricePerNight: 4500, status: 'available', amenities: 'AC, WiFi, Mini Bar' },
      { number: '203', type: 'Deluxe', floor: 2, capacity: 2, pricePerNight: 4500, status: 'occupied', amenities: 'AC, WiFi, Mini Bar' },
      { number: '301', type: 'Suite', floor: 3, capacity: 4, pricePerNight: 8500, status: 'maintenance', amenities: 'AC, WiFi, Living Room' },
      { number: '302', type: 'Suite', floor: 3, capacity: 4, pricePerNight: 8500, status: 'available', amenities: 'AC, WiFi, Living Room' },
      { number: '401', type: 'Presidential', floor: 4, capacity: 6, pricePerNight: 15000, status: 'available', amenities: 'Private Pool, Butler, WiFi' }
    ],
    guests: [
      { name: 'Arjun Mehta', email: 'arjun@email.com', phone: '9876543210', idType: 'Aadhaar' },
      { name: 'Priya Sharma', email: 'priya@email.com', phone: '9123456780', idType: 'Passport' },
      { name: 'Ravi Kumar', email: 'ravi@email.com', phone: '9988776655', idType: 'Driving License' },
      { name: 'Meera Nair', email: 'meera@email.com', phone: '9001122334', idType: 'Aadhaar' }
    ],
    menuItems: [
      { name: 'Masala Dosa', category: 'Breakfast', price: 120, available: true, description: 'Crispy dosa with sambar' },
      { name: 'Idli Sambar', category: 'Breakfast', price: 80, available: true, description: '4 idlis with sambar' },
      { name: 'Pongal', category: 'Breakfast', price: 110, available: true, description: 'Ghee pongal with coconut chutney' },
      { name: 'Aloo Paratha', category: 'Breakfast', price: 130, available: true, description: 'Stuffed wheat flatbread with curd' },
      { name: 'Tomato Soup', category: 'Soups', price: 110, available: true, description: 'Creamy tomato soup with herbs' },
      { name: 'Sweet Corn Soup', category: 'Soups', price: 120, available: true, description: 'Classic sweet corn vegetable soup' },
      { name: 'Paneer Tikka', category: 'Starters', price: 260, available: true, description: 'Chargrilled paneer with peppers' },
      { name: 'Chicken 65', category: 'Starters', price: 280, available: true, description: 'Crispy spicy South Indian chicken' },
      { name: 'Chicken Biryani', category: 'Main Course', price: 280, available: true, description: 'Hyderabadi style' },
      { name: 'Paneer Butter Masala', category: 'Main Course', price: 240, available: true, description: 'Rich tomato gravy' },
      { name: 'Veg Biryani', category: 'Main Course', price: 220, available: true, description: 'Fragrant basmati rice' },
      { name: 'Dal Tadka', category: 'Main Course', price: 160, available: true, description: 'Yellow dal finished with ghee tadka' },
      { name: 'Butter Chicken', category: 'Main Course', price: 320, available: true, description: 'Creamy tomato chicken curry' },
      { name: 'Fish Curry', category: 'Main Course', price: 350, available: true, description: 'Coastal style fish curry' },
      { name: 'Naan', category: 'Breads', price: 40, available: true, description: 'Tandoor baked soft bread' },
      { name: 'Butter Roti', category: 'Breads', price: 35, available: true, description: 'Whole wheat roti with butter' },
      { name: 'Gulab Jamun', category: 'Dessert', price: 90, available: true, description: '2 pieces with syrup' },
      { name: 'Brownie', category: 'Dessert', price: 130, available: true, description: 'Warm chocolate walnut brownie' },
      { name: 'Kulfi', category: 'Dessert', price: 100, available: true, description: 'Traditional frozen malai dessert' },
      { name: 'Cold Coffee', category: 'Beverages', price: 120, available: true, description: 'With ice cream' },
      { name: 'Fresh Lime Soda', category: 'Beverages', price: 70, available: true, description: 'Sweet or Salted' },
      { name: 'Masala Chai', category: 'Beverages', price: 50, available: true, description: 'Ginger and cardamom tea' },
      { name: 'Mango Lassi', category: 'Beverages', price: 120, available: true, description: 'Thick mango yogurt cooler' },
      { name: 'Samosa', category: 'Snacks', price: 50, available: true, description: 'Two crisp potato stuffed samosas' },
      { name: 'Spring Roll', category: 'Snacks', price: 90, available: true, description: 'Vegetable rolls with chilli dip' }
    ],
    tables: Array.from({length: 12}, (_, i) => ({ number: i+1, capacity: (i < 4 ? 2 : i < 8 ? 4 : 6), status: 'available', section: i < 6 ? 'Indoor' : 'Outdoor' })),
    staff: [
      { name: 'Rajesh Kumar', role: 'Manager', department: 'Hotel', shift: 'Morning', phone: '9000011111', salary: 45000, joinDate: '2022-03-15' },
      { name: 'Sunita Devi', role: 'Receptionist', department: 'Hotel', shift: 'Morning', phone: '9000022222', salary: 22000, joinDate: '2023-01-10' },
      { name: 'Ramesh Pillai', role: 'Waiter', department: 'Restaurant', shift: 'Evening', phone: '9000033333', salary: 18000, joinDate: '2023-06-20' },
      { name: 'Anita Bose', role: 'Chef', department: 'Restaurant', shift: 'Morning', phone: '9000044444', salary: 35000, joinDate: '2021-11-05' },
      { name: 'Vikram Singh', role: 'Housekeeping', department: 'Hotel', shift: 'Night', phone: '9000055555', salary: 16000, joinDate: '2024-02-28' },
      { name: 'Neha Sinha', role: 'Receptionist', department: 'Hotel', shift: 'Evening', phone: '9000066666', salary: 21000, joinDate: '2023-09-12' },
      { name: 'Sanjay Rao', role: 'Security', department: 'Hotel', shift: 'Night', phone: '9000077777', salary: 17000, joinDate: '2022-12-01' },
      { name: 'Pooja Menon', role: 'Waiter', department: 'Restaurant', shift: 'Morning', phone: '9000088888', salary: 18500, joinDate: '2024-01-15' },
      { name: 'Deepak Jain', role: 'Chef', department: 'Restaurant', shift: 'Evening', phone: '9000099999', salary: 34000, joinDate: '2022-07-22' },
      { name: 'Asha Thomas', role: 'Housekeeping', department: 'Hotel', shift: 'Morning', phone: '9000101010', salary: 15500, joinDate: '2023-05-30' }
    ],
    activity: [
      { icon: '🏨', message: 'Premium demo data loaded', type: 'green', time: new Date().toISOString() },
      { icon: '🍽️', message: 'New table orders initialized', type: 'blue', time: new Date().toISOString() }
    ]
  };

  function _ensureMenuCatalog() {
    const existing = new Set(_getCol('menuItems').map(item => String(item.name || '').toLowerCase()));
    (LOCAL_SEED.menuItems || []).forEach(item => {
      if (!existing.has(item.name.toLowerCase())) {
        insert('menuItems', item);
        existing.add(item.name.toLowerCase());
      }
    });
  }

  function _ensureStaffCatalog() {
    const existing = new Map(_getCol('staff').map(staff => [String(staff.name || '').toLowerCase(), staff]));
    (LOCAL_SEED.staff || []).forEach(staff => {
      const key = staff.name.toLowerCase();
      const current = existing.get(key);
      if (current) {
        update('staff', current.id, { ...staff });
      } else {
        const record = insert('staff', staff);
        existing.set(key, record);
      }
    });
  }

  async function seed() {
    try {
      await _api('/seed', { method: 'POST' });
      const data = await _api('/bootstrap');
      COLLECTIONS.forEach(col => { cache[col] = data[col] || []; });
      _ensureMenuCatalog();
      _ensureStaffCatalog();
    } catch (err) {
      console.warn('Backend offline, using localStorage/Seed fallback');
      isUsingFallback = true;
      if (!_loadLocal()) {
        // First time fallback: load constants
        Object.keys(LOCAL_SEED).forEach(col => {
          cache[col] = LOCAL_SEED[col].map(r => ({ ...r, id: _uid(), createdAt: new Date().toISOString() }));
        });
        _saveLocal();
      }
      _ensureMenuCatalog();
      _ensureStaffCatalog();
    }
  }

  function getAll(col) { return _getCol(col).slice(); }
  function getById(col, id) { return _getCol(col).find(r => r.id === id) || null; }
  function count(col, predicate) {
    const records = _getCol(col);
    return typeof predicate === 'function' ? records.filter(predicate).length : records.length;
  }

  function insert(col, data) {
    const record = { ...data, id: _uid(), createdAt: new Date().toISOString() };
    _getCol(col).push(record);
    if (!isUsingFallback) _api(`/${col}`, { method: 'POST', body: record }).catch(() => { isUsingFallback = true; _saveLocal(); });
    else _saveLocal();
    return record;
  }

  function update(col, id, data) {
    const records = _getCol(col);
    const idx = records.findIndex(r => r.id === id);
    if (idx === -1) return null;
    records[idx] = { ...records[idx], ...data, updatedAt: new Date().toISOString() };
    if (!isUsingFallback) _api(`/${col}/${id}`, { method: 'PUT', body: records[idx] }).catch(() => { isUsingFallback = true; _saveLocal(); });
    else _saveLocal();
    return records[idx];
  }

  function remove(col, id) {
    cache[col] = _getCol(col).filter(r => r.id !== id);
    if (!isUsingFallback) _api(`/${col}/${id}`, { method: 'DELETE' }).catch(() => { isUsingFallback = true; _saveLocal(); });
    else _saveLocal();
  }

  function logActivity(icon, message, type = 'blue') {
    const record = insert('activity', { icon, message, type, time: new Date().toISOString() });
    cache.activity = _getCol('activity').slice(-50); // Keep last 50
    _saveLocal();
    return record;
  }

  return { seed, getAll, getById, count, insert, update, remove, logActivity, isFallback: () => isUsingFallback };
})();
