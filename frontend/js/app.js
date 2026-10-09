/**
 * app.js — SPA router, navigation, modal & toast utilities
 */

// ---- Page registry ----
let PAGES = {};

function resolvePageRenderer(name) {
  const fn = window[name];
  if (typeof fn === 'function') return fn;
  return (container) => {
    container.innerHTML = emptyState('!', 'Page unavailable', 'Renderer not loaded');
  };
}

function initPages() {
  PAGES = {
    home: { title: 'Home', render: resolvePageRenderer('renderHome') },
    dashboard: { title: 'Dashboard', render: resolvePageRenderer('renderDashboard') },
    rooms: { title: 'Rooms', render: resolvePageRenderer('renderRooms') },
    guests: { title: 'Guests', render: resolvePageRenderer('renderGuests') },
    bookings: { title: 'Bookings', render: resolvePageRenderer('renderBookings') },
    menu: { title: 'Menu', render: resolvePageRenderer('renderMenu') },
    tables: { title: 'Tables', render: resolvePageRenderer('renderTables') },
    orders: { title: 'Orders', render: resolvePageRenderer('renderOrders') },
    staff: { title: 'Staff', render: resolvePageRenderer('renderStaff') },
    reports: { title: 'Reports', render: resolvePageRenderer('renderReports') },
  };
}

let currentPage = 'home';

// ---- Admin Auth ----
const DEFAULT_ADMIN = { username: 'admin', password: 'admin' };
const AUTH_API_BASE = 'http://localhost:3000/api/auth';
let isAdminAuthed = false;

async function authRequest(path, options = {}) {
  const config = { ...options };
  config.headers = { 'Content-Type': 'application/json', ...(config.headers || {}) };
  if (config.body && typeof config.body !== 'string') {
    config.body = JSON.stringify(config.body);
  }
  try {
    const res = await fetch(`${AUTH_API_BASE}${path}`, config);
    if (!res.ok) {
      const text = await res.text();
      const err = new Error(text || `Request failed: ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  } catch (fetchError) {
    const err = fetchError instanceof Error ? fetchError : new Error('Network error');
    err.status = err.status || 0;
    throw err;
  }
}

async function getAdminInfo() {
  return authRequest('/info');
}

function loadAuthState() {
  return localStorage.getItem('bnf_admin_auth') === '1';
}

function setAuthState(value) {
  isAdminAuthed = value;
  localStorage.setItem('bnf_admin_auth', value ? '1' : '0');
  updateAuthUI();
}

function updateAuthUI() {
  const actionBtn = document.getElementById('topbar-action');
  const commandBtn = document.getElementById('command-btn');
  const globalSearch = document.getElementById('global-search');
  if (!actionBtn) return;
  if (isAdminAuthed) {
    actionBtn.style.display = 'inline-flex';
    actionBtn.textContent = 'Sign Out';
    actionBtn.className = 'btn btn-secondary btn-sm';
    actionBtn.onclick = () => {
      setAuthState(false);
      toast('Signed out', 'info');
      showAdminLogin();
    };
  } else {
    actionBtn.style.display = 'inline-flex';
    actionBtn.textContent = 'Admin Sign In';
    actionBtn.className = 'btn btn-primary btn-sm';
    actionBtn.onclick = () => showAdminLogin();
  }
  if (commandBtn) commandBtn.disabled = !isAdminAuthed;
  if (globalSearch) globalSearch.disabled = !isAdminAuthed;
}

async function showResetCredentials() {
  const info = await getAdminInfo().catch(() => ({ username: DEFAULT_ADMIN.username }));
  Modal.open({
    title: 'Reset Admin Credentials',
    body: `
      <div class="form-group">
        <label>Current Password</label>
        <input id="admin-current-pass" type="password" placeholder="••••••••">
      </div>
      <div class="form-group">
        <label>New Username</label>
        <input id="admin-new-user" value="${info.username || ''}" placeholder="admin">
      </div>
      <div class="form-group">
        <label>New Password</label>
        <input id="admin-new-pass" type="password" placeholder="••••••••">
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="showAdminLogin()">Back</button>
      <button class="btn btn-primary" id="admin-reset-btn">Save</button>
    `
  });

  setTimeout(() => {
    const resetBtn = document.getElementById('admin-reset-btn');
    if (!resetBtn) return;
    resetBtn.onclick = async () => {
      const currentPass = document.getElementById('admin-current-pass').value.trim();
      const newUser = document.getElementById('admin-new-user').value.trim();
      const newPass = document.getElementById('admin-new-pass').value.trim();
      if (!newUser || !newPass) return toast('Username and password required', 'error');
      try {
        await authRequest('/reset', {
          method: 'POST',
          body: { currentPassword: currentPass, newUsername: newUser, newPassword: newPass }
        });
        toast('Credentials updated', 'success');
        showAdminLogin();
      } catch (err) {
        if (err.status === 401) {
          toast('Current password is incorrect', 'error');
        } else if (err.status === 0) {
          toast('Unable to update credentials. Backend API unavailable at http://localhost:3000.', 'error');
        } else {
          toast(`Unable to update credentials: ${err.message || 'Unknown error'}`, 'error');
        }
      }
    };
  }, 50);
}

function showAdminLogin() {
  document.getElementById('page-title').textContent = 'Admin Sign In';
  Modal.open({
    title: 'Admin Sign In',
    body: `
      <div class="form-group">
        <label>Username</label>
        <input id="admin-user" placeholder="admin">
      </div>
      <div class="form-group">
        <label>Password</label>
        <input id="admin-pass" type="password" placeholder="••••••••">
      </div>
      <div style="font-size:0.78rem;color:var(--text-muted);">
        Default (first run): ${DEFAULT_ADMIN.username} / ${DEFAULT_ADMIN.password}
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" id="admin-reset-open">Reset</button>
      <button class="btn btn-primary" id="admin-login-btn">Sign In</button>
    `
  });

  setTimeout(() => {
    const loginBtn = document.getElementById('admin-login-btn');
    const resetBtn = document.getElementById('admin-reset-open');
    if (resetBtn) resetBtn.onclick = () => showResetCredentials();
    if (!loginBtn) return;

    const proceedLogin = () => {
      setAuthState(true);
      Modal.close();
      toast('Welcome, Admin', 'success');
      navigate(currentPage || 'dashboard');
    };

    loginBtn.onclick = async () => {
      const user = document.getElementById('admin-user').value.trim();
      const pass = document.getElementById('admin-pass').value.trim();
      if (!user || !pass) return toast('Username and password required', 'error');

      try {
        await authRequest('/login', { method: 'POST', body: { username: user, password: pass } });
        proceedLogin();
      } catch (err) {
        // Fallback to local admin check if server is down or returns 401/error
        if (user === DEFAULT_ADMIN.username && pass === DEFAULT_ADMIN.password) {
          toast('Signed in (Local Fallback)', 'info');
          proceedLogin();
        } else {
          toast(err.status === 401 ? 'Invalid credentials' : 'Login failed', 'error');
        }
      }
    };
  }, 50);
}

// ---- Router ----
function navigate(page) {
  if (!PAGES[page]) return;
  if (!isAdminAuthed) {
    showAdminLogin();
    return;
  }
  currentPage = page;

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const navEl = document.getElementById('nav-' + page);
  if (navEl) navEl.classList.add('active');

  // Update page title
  document.getElementById('page-title').textContent = PAGES[page].title;

  // Render page
  const content = document.getElementById('page-content');
  content.innerHTML = '';
  content.classList.remove('page-content-enter');
  void content.offsetWidth;
  content.classList.add('page-content-enter');
  PAGES[page].render(content);
  enhance3DInteractions(content);
}

function enhance3DInteractions(scope = document) {
  const cards = scope.querySelectorAll('.card, .stat-card, .menu-card, .room-card, .table-card, .home-feature, .ops-panel');
  cards.forEach(card => {
    if (card.dataset.tiltReady) return;
    card.dataset.tiltReady = '1';
    card.addEventListener('pointermove', e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
      card.style.setProperty('--spot-x', `${Math.round(e.clientX - rect.left)}px`);
      card.style.setProperty('--spot-y', `${Math.round(e.clientY - rect.top)}px`);
      card.style.setProperty('--tilt-x', `${y.toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${x.toFixed(2)}deg`);
      card.classList.add('is-tilting');
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-tilting');
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
      card.style.removeProperty('--spot-x');
      card.style.removeProperty('--spot-y');
    });
  });
}

// ---- Sidebar toggle ----
function initSidebar() {
  const toggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('main-content');
  let collapsed = false;

  toggle.addEventListener('click', () => {
    collapsed = !collapsed;
    if (window.innerWidth <= 900) {
      sidebar.classList.toggle('mobile-open');
    } else {
      sidebar.classList.toggle('collapsed');
      main.classList.toggle('expanded');
    }
  });

  // Close sidebar on mobile when nav link clicked
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const page = link.dataset.page;
      if (page) navigate(page);
      if (window.innerWidth <= 900) {
        sidebar.classList.remove('mobile-open');
      }
    });
  });
}

// ---- Live Clock ----
function initClock() {
  const el = document.getElementById('topbar-time');
  function tick() {
    const now = new Date();
    el.textContent = now.toLocaleString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
  tick();
  setInterval(tick, 1000);
}

// ---- Command Center & Global Search ----
function getOperationalSnapshot() {
  const rooms = DB.getAll('rooms');
  const bookings = DB.getAll('bookings');
  const orders = DB.getAll('orders');
  const staff = DB.getAll('staff');
  const tables = DB.getAll('tables');

  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const maintenanceRooms = rooms.filter(r => r.status === 'maintenance').length;
  const activeOrders = orders.filter(o => o.status === 'active').length;
  const reservedTables = tables.filter(t => t.status === 'reserved').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const occupancy = rooms.length ? Math.round((occupiedRooms / rooms.length) * 100) : 0;
  const onDuty = staff.filter(s => s.status === 'on-duty' || !s.status).length;

  return {
    occupancy,
    maintenanceRooms,
    activeOrders,
    reservedTables,
    confirmedBookings,
    onDuty,
    mode: DB.isFallback() ? 'Local fallback' : 'SQL synced'
  };
}

function getSearchCorpus() {
  return [
    ...DB.getAll('rooms').map(r => ({
      page: 'rooms',
      type: 'Room',
      title: `Room ${r.number}`,
      meta: `${r.type} · ${r.status} · Floor ${r.floor}`,
      terms: `${r.number} ${r.type} ${r.status} ${r.amenities || ''}`
    })),
    ...DB.getAll('guests').map(g => ({
      page: 'guests',
      type: 'Guest',
      title: g.name,
      meta: `${g.phone || 'No phone'} · ${g.idType || 'ID pending'}`,
      terms: `${g.name} ${g.email || ''} ${g.phone || ''} ${g.idType || ''}`
    })),
    ...DB.getAll('bookings').map(b => ({
      page: 'bookings',
      type: 'Booking',
      title: b.guestName || 'Guest booking',
      meta: `Room ${b.roomNumber} · ${formatDate(b.checkIn)} · ${b.status}`,
      terms: `${b.guestName || ''} ${b.roomNumber || ''} ${b.status || ''} ${b.checkIn || ''}`
    })),
    ...DB.getAll('orders').map(o => ({
      page: 'orders',
      type: 'Order',
      title: o.guestName || `Table ${o.tableNumber || 'Order'}`,
      meta: `${formatCurrency(o.total || 0)} · ${o.status || 'active'}`,
      terms: `${o.guestName || ''} ${o.tableNumber || ''} ${o.status || ''} ${o.total || ''}`
    })),
    ...DB.getAll('staff').map(s => ({
      page: 'staff',
      type: 'Staff',
      title: s.name,
      meta: `${s.role} · ${s.department} · ${s.shift}`,
      terms: `${s.name} ${s.role} ${s.department} ${s.shift}`
    }))
  ];
}

function searchRecords(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getSearchCorpus()
    .filter(item => item.terms.toLowerCase().includes(q))
    .slice(0, 8);
}

function openCommandCenter(initialQuery = '') {
  if (!isAdminAuthed) return showAdminLogin();
  const snapshot = getOperationalSnapshot();
  Modal.open({
    title: 'Command Center',
    size: 'lg',
    body: `
      <div class="command-shell">
        <div class="command-search">
          <span>⌕</span>
          <input id="command-search-input" type="search" placeholder="Search records or type a task..." value="${escapeHtml(initialQuery)}">
        </div>
        <div class="command-metrics">
          <div><span>${snapshot.occupancy}%</span><small>Occupancy</small></div>
          <div><span>${snapshot.activeOrders}</span><small>Active orders</small></div>
          <div><span>${snapshot.confirmedBookings}</span><small>Check-ins</small></div>
          <div><span>${snapshot.mode}</span><small>Data mode</small></div>
        </div>
        <div class="command-actions">
          <button class="command-action" data-page="bookings">Create booking</button>
          <button class="command-action" data-page="orders">Open restaurant orders</button>
          <button class="command-action" data-page="rooms">Review room status</button>
          <button class="command-action" data-page="reports">Open reports</button>
        </div>
        <div class="command-results" id="command-results"></div>
      </div>
    `,
    footer: `<button class="btn btn-secondary" onclick="Modal.close()">Close</button>`
  });

  setTimeout(() => {
    const input = document.getElementById('command-search-input');
    const results = document.getElementById('command-results');
    const renderResults = () => {
      const matches = searchRecords(input.value);
      results.innerHTML = matches.length
        ? matches.map(item => `
            <button class="command-result" data-page="${item.page}">
              <span class="command-result-type">${escapeHtml(item.type)}</span>
              <strong>${escapeHtml(item.title)}</strong>
              <small>${escapeHtml(item.meta)}</small>
            </button>
          `).join('')
        : `<div class="command-empty">Start typing to search across rooms, guests, bookings, orders, and staff.</div>`;
      results.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
          Modal.close();
          navigate(btn.dataset.page);
        });
      });
    };
    input.focus();
    input.addEventListener('input', renderResults);
    renderResults();
    document.querySelectorAll('.command-action').forEach(btn => {
      btn.addEventListener('click', () => {
        Modal.close();
        navigate(btn.dataset.page);
      });
    });
  }, 50);
}

function initCommandCenter() {
  const commandBtn = document.getElementById('command-btn');
  const globalSearch = document.getElementById('global-search');
  if (commandBtn) commandBtn.addEventListener('click', () => openCommandCenter());
  if (globalSearch) {
    globalSearch.addEventListener('focus', () => openCommandCenter(globalSearch.value));
    globalSearch.addEventListener('keydown', e => {
      if (e.key === 'Enter') openCommandCenter(globalSearch.value);
    });
  }
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openCommandCenter(globalSearch ? globalSearch.value : '');
    }
  });
}

// ---- Modal ----
const Modal = (() => {
  const overlay = document.getElementById('modal-overlay');
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');
  const footerEl = document.getElementById('modal-footer');
  const modal = document.getElementById('modal');
  const closeBtn = document.getElementById('modal-close');

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  function open({ title, body, footer = '', size = '' }) {
    titleEl.textContent = title;
    bodyEl.innerHTML = body;
    footerEl.innerHTML = footer;
    modal.className = 'modal' + (size ? ' modal-' + size : '');
    overlay.classList.add('active');
  }

  function close() {
    overlay.classList.remove('active');
    bodyEl.innerHTML = '';
    footerEl.innerHTML = '';
  }

  function getBody() { return bodyEl; }

  return { open, close, getBody };
})();

// ---- Toast ----
function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ---- Confirm Dialog ----
function confirmAction(message, onConfirm) {
  Modal.open({
    title: 'Confirm Action',
    body: `<p style="color:var(--text-secondary);font-size:0.93rem;">${message}</p>`,
    footer: `
      <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
      <button class="btn btn-danger" id="confirm-yes">Confirm</button>
    `
  });
  setTimeout(() => {
    const yes = document.getElementById('confirm-yes');
    if (yes) yes.addEventListener('click', () => { Modal.close(); onConfirm(); });
  }, 50);
}

// ---- Helpers ----
function formatCurrency(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function statusBadge(status) {
  const map = {
    available: 'badge-green',
    occupied: 'badge-red',
    maintenance: 'badge-yellow',
    confirmed: 'badge-blue',
    'checked-in': 'badge-green',
    'checked-out': 'badge-gray',
    cancelled: 'badge-red',
    active: 'badge-green',
    completed: 'badge-gray',
    reserved: 'badge-yellow',
    'on-duty': 'badge-green',
    'off-duty': 'badge-gray',
  };
  const cls = map[status] || 'badge-gray';
  return `<span class="badge ${cls}">${status}</span>`;
}

function emptyState(icon, title, sub) {
  return `<div class="empty-state">
    <div class="empty-state-icon">${icon}</div>
    <h3>${title}</h3>
    <p>${sub}</p>
  </div>`;
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  DB.seed()
    .catch(err => {
      console.error('DB init failed', err);
    })
    .then(() => {
      initSidebar();
      initClock();
      initCommandCenter();
      initPages();
      isAdminAuthed = loadAuthState();
      updateAuthUI();
      if (isAdminAuthed) {
        navigate('dashboard');
      } else {
        showAdminLogin();
      }
    });
});
