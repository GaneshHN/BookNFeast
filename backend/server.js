const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { pool } = require('./db');
const { buildSeedRecords, uid } = require('./seed-data');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DEFAULT_ADMIN = { username: 'admin', password: 'admin' };

const COLLECTIONS = [
  'rooms',
  'guests',
  'bookings',
  'menuItems',
  'tables',
  'orders',
  'staff',
  'activity'
];

const DEFINITIONS = {
  rooms: {
    table: 'rooms',
    orderBy: 'room_number ASC',
    fields: {
      number: 'room_number',
      type: 'room_type',
      floor: 'floor',
      capacity: 'capacity',
      pricePerNight: 'price_per_night',
      status: 'status',
      amenities: 'amenities'
    },
    numericFields: ['floor', 'capacity', 'pricePerNight']
  },
  guests: {
    table: 'guests',
    orderBy: 'name ASC',
    fields: {
      name: 'name',
      email: 'email',
      phone: 'phone',
      idType: 'id_type',
      idNumber: 'id_number'
    }
  },
  bookings: {
    table: 'bookings',
    orderBy: 'check_in DESC, created_at DESC',
    fields: {
      guestId: 'guest_id',
      guestName: 'guest_name',
      roomId: 'room_id',
      roomNumber: 'room_number',
      checkIn: 'check_in',
      checkOut: 'check_out',
      nights: 'nights',
      amount: 'amount',
      status: 'status',
      adults: 'adults',
      children: 'children',
      notes: 'notes'
    },
    dateFields: ['checkIn', 'checkOut'],
    numericFields: ['nights', 'amount', 'adults', 'children']
  },
  menuItems: {
    table: 'menu_items',
    orderBy: 'category ASC, name ASC',
    fields: {
      name: 'name',
      category: 'category',
      price: 'price',
      available: 'available',
      description: 'description'
    },
    booleanFields: ['available'],
    numericFields: ['price']
  },
  tables: {
    table: 'restaurant_tables',
    orderBy: 'table_number ASC',
    fields: {
      number: 'table_number',
      capacity: 'capacity',
      status: 'status',
      section: 'section'
    },
    numericFields: ['number', 'capacity']
  },
  staff: {
    table: 'staff',
    orderBy: 'name ASC',
    fields: {
      name: 'name',
      role: 'role',
      department: 'department',
      shift: 'shift',
      phone: 'phone',
      salary: 'salary',
      joinDate: 'join_date',
      status: 'status'
    },
    dateFields: ['joinDate'],
    numericFields: ['salary']
  },
  activity: {
    table: 'activity',
    orderBy: 'activity_time DESC, created_at DESC',
    fields: {
      icon: 'icon',
      message: 'message',
      type: 'type',
      time: 'activity_time'
    },
    datetimeFields: ['time']
  }
};

app.use(cors());
app.use(express.json({ limit: '1mb' }));

function toSqlDatetime(value) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function toIso(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return d.toISOString();
}

function toDateOnly(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function toSqlDate(value) {
  return value ? toDateOnly(value) : null;
}

function stripMeta(record) {
  const { id, createdAt, updatedAt, items, ...data } = record || {};
  return data;
}

function isValidCollection(col) {
  return COLLECTIONS.includes(col);
}

function isDateField(def, key) {
  return (def.dateFields || []).includes(key);
}

function isDatetimeField(def, key) {
  return (def.datetimeFields || []).includes(key);
}

function isBooleanField(def, key) {
  return (def.booleanFields || []).includes(key);
}

function isNumericField(def, key) {
  return (def.numericFields || []).includes(key);
}

function sqlValue(def, key, value) {
  if (value === undefined) return undefined;
  if (value === '') return null;
  if (isDateField(def, key)) return toSqlDate(value);
  if (isDatetimeField(def, key)) return value ? toSqlDatetime(value) : null;
  if (isBooleanField(def, key)) return value ? 1 : 0;
  return value;
}

function readValue(def, key, value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (isDateField(def, key)) return toDateOnly(value);
  if (isDatetimeField(def, key)) return toIso(value);
  if (isBooleanField(def, key)) return Boolean(value);
  if (isNumericField(def, key)) return Number(value);
  return value;
}

function rowToRecord(def, row) {
  const record = {
    id: row.id,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
  Object.entries(def.fields).forEach(([key, column]) => {
    record[key] = readValue(def, key, row[column]);
  });
  return record;
}

function getDefinition(collection) {
  return DEFINITIONS[collection] || null;
}

async function ensureAdminUser() {
  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM admin_users');
  const count = rows[0]?.count || 0;
  if (count > 0) return;

  const hash = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
  await pool.query(
    'INSERT INTO admin_users (username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)',
    [DEFAULT_ADMIN.username, hash, toSqlDatetime(new Date()), null]
  );
}

async function listGeneric(collection) {
  const def = getDefinition(collection);
  const [rows] = await pool.query(`SELECT * FROM ${def.table} ORDER BY ${def.orderBy}`);
  return rows.map(row => rowToRecord(def, row));
}

async function getGeneric(collection, id) {
  const def = getDefinition(collection);
  const [rows] = await pool.query(`SELECT * FROM ${def.table} WHERE id = ? LIMIT 1`, [id]);
  return rows.length ? rowToRecord(def, rows[0]) : null;
}

async function insertGeneric(collection, input) {
  const def = getDefinition(collection);
  const id = input.id || uid();
  const createdAt = input.createdAt ? toSqlDatetime(input.createdAt) : toSqlDatetime(new Date());
  const updatedAt = input.updatedAt ? toSqlDatetime(input.updatedAt) : null;
  const columns = ['id'];
  const values = [id];

  Object.entries(def.fields).forEach(([key, column]) => {
    const value = sqlValue(def, key, input[key]);
    if (value !== undefined) {
      columns.push(column);
      values.push(value);
    }
  });

  columns.push('created_at', 'updated_at');
  values.push(createdAt, updatedAt);

  const placeholders = columns.map(() => '?').join(', ');
  await pool.query(
    `INSERT INTO ${def.table} (${columns.join(', ')}) VALUES (${placeholders})`,
    values
  );

  return getGeneric(collection, id);
}

async function updateGeneric(collection, id, patch) {
  const def = getDefinition(collection);
  const assignments = [];
  const values = [];

  Object.entries(def.fields).forEach(([key, column]) => {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      assignments.push(`${column} = ?`);
      values.push(sqlValue(def, key, patch[key]));
    }
  });

  if (!assignments.length) return getGeneric(collection, id);

  const updatedAt = toSqlDatetime(new Date());
  assignments.push('updated_at = ?');
  values.push(updatedAt, id);

  const [result] = await pool.query(
    `UPDATE ${def.table} SET ${assignments.join(', ')} WHERE id = ?`,
    values
  );
  if (!result.affectedRows) return null;
  return getGeneric(collection, id);
}

async function deleteGeneric(collection, id) {
  const def = getDefinition(collection);
  const [result] = await pool.query(`DELETE FROM ${def.table} WHERE id = ?`, [id]);
  return result.affectedRows > 0;
}

async function orderItems(orderIds) {
  if (!orderIds.length) return new Map();
  const placeholders = orderIds.map(() => '?').join(', ');
  const [rows] = await pool.query(
    `SELECT order_id, menu_id, name, price, qty FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id ASC`,
    orderIds
  );
  const byOrder = new Map();
  rows.forEach(row => {
    if (!byOrder.has(row.order_id)) byOrder.set(row.order_id, []);
    byOrder.get(row.order_id).push({
      menuId: row.menu_id,
      name: row.name,
      price: Number(row.price),
      qty: Number(row.qty)
    });
  });
  return byOrder;
}

function rowToOrder(row, items = []) {
  return {
    id: row.id,
    tableId: row.table_id,
    tableNumber: row.table_number === null ? null : Number(row.table_number),
    guestName: row.guest_name,
    items,
    subtotal: Number(row.subtotal),
    tax: Number(row.tax),
    total: Number(row.total),
    status: row.status,
    waiter: row.waiter,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

async function listOrders() {
  const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
  const items = await orderItems(rows.map(row => row.id));
  return rows.map(row => rowToOrder(row, items.get(row.id) || []));
}

async function getOrder(id) {
  const [rows] = await pool.query('SELECT * FROM orders WHERE id = ? LIMIT 1', [id]);
  if (!rows.length) return null;
  const items = await orderItems([id]);
  return rowToOrder(rows[0], items.get(id) || []);
}

async function replaceOrderItems(orderId, items = []) {
  await pool.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);
  if (!items.length) return;
  const values = items.map(item => [
    orderId,
    item.menuId || null,
    item.name || '',
    item.price || 0,
    item.qty || 1
  ]);
  await pool.query(
    'INSERT INTO order_items (order_id, menu_id, name, price, qty) VALUES ?',
    [values]
  );
}

async function insertOrder(input) {
  const id = input.id || uid();
  const createdAt = input.createdAt ? toSqlDatetime(input.createdAt) : toSqlDatetime(new Date());
  const updatedAt = input.updatedAt ? toSqlDatetime(input.updatedAt) : null;
  await pool.query(
    `INSERT INTO orders
      (id, table_id, table_number, guest_name, subtotal, tax, total, status, waiter, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.tableId || null,
      input.tableNumber ?? null,
      input.guestName || null,
      input.subtotal || 0,
      input.tax || 0,
      input.total || 0,
      input.status || 'active',
      input.waiter || null,
      createdAt,
      updatedAt
    ]
  );
  await replaceOrderItems(id, input.items || []);
  return getOrder(id);
}

async function updateOrder(id, input) {
  const fields = {
    tableId: 'table_id',
    tableNumber: 'table_number',
    guestName: 'guest_name',
    subtotal: 'subtotal',
    tax: 'tax',
    total: 'total',
    status: 'status',
    waiter: 'waiter'
  };
  const assignments = [];
  const values = [];
  Object.entries(fields).forEach(([key, column]) => {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      assignments.push(`${column} = ?`);
      values.push(input[key] === undefined ? null : input[key]);
    }
  });

  if (assignments.length) {
    assignments.push('updated_at = ?');
    values.push(toSqlDatetime(new Date()), id);
    const [result] = await pool.query(
      `UPDATE orders SET ${assignments.join(', ')} WHERE id = ?`,
      values
    );
    if (!result.affectedRows) return null;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'items')) {
    await replaceOrderItems(id, input.items || []);
  }

  return getOrder(id);
}

async function deleteOrder(id) {
  const [result] = await pool.query('DELETE FROM orders WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function listCollection(collection) {
  return collection === 'orders' ? listOrders() : listGeneric(collection);
}

async function getCollectionRecord(collection, id) {
  return collection === 'orders' ? getOrder(id) : getGeneric(collection, id);
}

async function insertCollectionRecord(collection, input) {
  return collection === 'orders' ? insertOrder(input) : insertGeneric(collection, input);
}

async function updateCollectionRecord(collection, id, input) {
  return collection === 'orders' ? updateOrder(id, input) : updateGeneric(collection, id, input);
}

async function deleteCollectionRecord(collection, id) {
  return collection === 'orders' ? deleteOrder(id) : deleteGeneric(collection, id);
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/auth/info', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT username FROM admin_users LIMIT 1');
    if (!rows.length) return res.json({ username: DEFAULT_ADMIN.username });
    res.json({ username: rows[0].username });
  } catch (err) {
    console.error('Auth info failed', err);
    res.status(500).json({ error: 'auth_info_failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'missing_credentials' });
  try {
    const [rows] = await pool.query(
      'SELECT id, username, password_hash FROM admin_users WHERE username = ? LIMIT 1',
      [username]
    );
    if (!rows.length) return res.status(401).json({ error: 'invalid_credentials' });
    const match = await bcrypt.compare(password, rows[0].password_hash);
    if (!match) return res.status(401).json({ error: 'invalid_credentials' });
    res.json({ ok: true, username: rows[0].username });
  } catch (err) {
    console.error('Login failed', err);
    res.status(500).json({ error: 'login_failed' });
  }
});

app.post('/api/auth/reset', async (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body || {};
  if (!currentPassword || !newUsername || !newPassword) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  try {
    const [rows] = await pool.query('SELECT id, password_hash FROM admin_users LIMIT 1');
    if (!rows.length) return res.status(404).json({ error: 'admin_missing' });

    const ok = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE admin_users SET username = ?, password_hash = ?, updated_at = ? WHERE id = ?',
      [newUsername, hash, toSqlDatetime(new Date()), rows[0].id]
    );

    res.json({ ok: true, username: newUsername });
  } catch (err) {
    console.error('Reset failed', err);
    res.status(500).json({ error: 'reset_failed' });
  }
});

app.get('/api/bootstrap', async (_req, res) => {
  try {
    const payload = {};
    for (const collection of COLLECTIONS) {
      payload[collection] = await listCollection(collection);
    }
    res.json(payload);
  } catch (err) {
    console.error('Bootstrap failed', err);
    res.status(500).json({ error: 'bootstrap_failed' });
  }
});

app.post('/api/seed', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS count FROM rooms');
    const count = rows[0]?.count || 0;
    if (count > 0) return res.json({ seeded: false });

    const seedRecords = buildSeedRecords();
    for (const { collection, record } of seedRecords) {
      await insertCollectionRecord(collection, record);
    }

    res.json({ seeded: true, count: seedRecords.length });
  } catch (err) {
    console.error('Seed failed', err);
    res.status(500).json({ error: 'seed_failed' });
  }
});

app.get('/api/:collection', async (req, res) => {
  const { collection } = req.params;
  if (!isValidCollection(collection)) return res.status(400).json({ error: 'invalid_collection' });
  try {
    res.json(await listCollection(collection));
  } catch (err) {
    console.error('List failed', err);
    res.status(500).json({ error: 'list_failed' });
  }
});

app.get('/api/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  if (!isValidCollection(collection)) return res.status(400).json({ error: 'invalid_collection' });
  try {
    const record = await getCollectionRecord(collection, id);
    if (!record) return res.status(404).json({ error: 'not_found' });
    res.json(record);
  } catch (err) {
    console.error('Get failed', err);
    res.status(500).json({ error: 'get_failed' });
  }
});

app.post('/api/:collection', async (req, res) => {
  const { collection } = req.params;
  if (!isValidCollection(collection)) return res.status(400).json({ error: 'invalid_collection' });
  try {
    const record = await insertCollectionRecord(collection, req.body || {});
    res.status(201).json(record);
  } catch (err) {
    console.error('Create failed', err);
    res.status(500).json({ error: 'create_failed' });
  }
});

app.put('/api/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  if (!isValidCollection(collection)) return res.status(400).json({ error: 'invalid_collection' });
  try {
    const record = await updateCollectionRecord(collection, id, req.body || {});
    if (!record) return res.status(404).json({ error: 'not_found' });
    res.json(record);
  } catch (err) {
    console.error('Update failed', err);
    res.status(500).json({ error: 'update_failed' });
  }
});

app.delete('/api/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  if (!isValidCollection(collection)) return res.status(400).json({ error: 'invalid_collection' });
  try {
    await deleteCollectionRecord(collection, id);
    res.status(204).end();
  } catch (err) {
    console.error('Delete failed', err);
    res.status(500).json({ error: 'delete_failed' });
  }
});

async function startServer() {
  await ensureAdminUser();
  app.listen(PORT, () => {
    console.log(`BookNFeast API running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Server failed to start', err);
  process.exit(1);
});
