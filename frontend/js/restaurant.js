/**
 * restaurant.js — Menu, Tables, Orders, Billing
 */

// ==================== MENU ====================
function renderMenu(container) {
  let search = '';
  let catFilter = '';
  const CATEGORIES = ['Breakfast','Starters','Soups','Main Course','Breads','Dessert','Beverages','Snacks'];

  function draw() {
    let items = DB.getAll('menuItems');
    if (search) items = items.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
    if (catFilter) items = items.filter(m => m.category === catFilter);

    const grouped = {};
    items.forEach(m => {
      if (!grouped[m.category]) grouped[m.category] = [];
      grouped[m.category].push(m);
    });

    container.innerHTML = `
      <div class="page-header">
        <div><h2>Menu</h2><div class="page-header-sub">${items.length} items</div></div>
        <button class="btn btn-primary" id="add-menu-btn">+ Add Item</button>
      </div>
      <div class="filter-bar">
        <input type="text" id="menu-search" placeholder="🔍 Search menu..." value="${search}">
        <select id="menu-cat-filter">
          <option value="">All Categories</option>
          ${CATEGORIES.map(c=>`<option value="${c}" ${catFilter===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div id="menu-content">
        ${Object.keys(grouped).length
          ? Object.entries(grouped).map(([cat, itms]) => `
            <div style="margin-bottom:24px;">
              <h3 style="font-size:0.85rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;font-weight:600;">${cat}</h3>
              <div class="menu-grid">
                ${itms.map(m => menuCard(m)).join('')}
              </div>
            </div>
          `).join('')
          : emptyState('🍽️','No menu items','Add your first menu item')
        }
      </div>
    `;

    document.getElementById('add-menu-btn').onclick = () => openMenuModal();
    document.getElementById('menu-search').oninput = e => { search = e.target.value; draw(); };
    document.getElementById('menu-cat-filter').onchange = e => { catFilter = e.target.value; draw(); };
    container.querySelectorAll('.menu-edit-btn').forEach(b => b.onclick = () => openMenuModal(b.dataset.id));
    container.querySelectorAll('.menu-toggle-btn').forEach(b => b.onclick = () => {
      const m = DB.getById('menuItems', b.dataset.id);
      DB.update('menuItems', m.id, { available: !m.available });
      draw();
    });
    container.querySelectorAll('.menu-delete-btn').forEach(b => b.onclick = () =>
      confirmAction(`Delete "${b.dataset.name}"?`, () => {
        DB.remove('menuItems', b.dataset.id); toast('Item deleted', 'success'); draw();
      })
    );
    if (typeof enhance3DInteractions === 'function') enhance3DInteractions(container);
  }
  draw();
}

function menuCard(m) {
  const menuImage = (item) => {
    const categoryMap = {
      Breakfast: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=1200&q=80',
      'Main Course': 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80',
      Breads: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80',
      Dessert: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=1200&q=80',
      Beverages: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
      Starters: 'https://images.unsplash.com/photo-1543352634-99a5d6f0c7e1?auto=format&fit=crop&w=1200&q=80',
      Soups: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80'
    };
    const itemMap = {
  'Masala Dosa':
    'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg',

  'Idli Sambar':
    'https://images.pexels.com/photos/4331489/pexels-photo-4331489.jpeg',

  'Pongal':
    'https://imgs.search.brave.com/mmrmsgDS_c-r8UEqsnQYofYKdHYrDYE7B3URtbswR3w/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudG9paW1nLmNv/bS90aHVtYi8xMjY1/MTc0MDQuanBnP3Bo/b3RvaWQ9MTI2NTE3/NDA0JmltZ3NpemU9/MTMxMzgyMiZ3aWR0/aD02MDAmaGVpZ2h0/PTMzNSZyZXNpemVt/b2RlPTc1',
        
        'Aloo Paratha':
          '../assets/aloo-paratha.jpg',

  'Tomato Soup':
    'https://www.indianhealthyrecipes.com/wp-content/uploads/2022/11/tomato-soup-recipe-500x375.jpg',

  'Sweet Corn Soup':
    'https://healthylivingjames.co.uk/wp-content/uploads/2025/03/Chicken-and-Sweetcorn-Soup-Square.jpg',

  'Paneer Tikka':
    'https://www.indianveggiedelight.com/wp-content/uploads/2021/08/air-fryer-paneer-tikka-featured.jpg',

  'Chicken 65':
    'https://aromaticessence.co/wp-content/uploads/2017/06/IMG_0609.jpg',

  'Veg Biryani':
    'https://imgs.search.brave.com/clgaYaILxzuVxyJ_WU3M7nAshWD1_72cXa9PG1727JI/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93d3cu/c2h1dHRlcnN0b2Nr/LmNvbS9pbWFnZS1w/aG90by92ZWctYmly/eWFuaS1wdWxhdi1m/cmllZC1yaWNlLTI2/MG53LTE5MzkzOTYw/NzUuanBn',

  'Chicken Biryani':
    'https://imgs.search.brave.com/LX2z-Hj5NorKOQS-dn6cZE-dTgIIKqVMQBjgqPeQurM/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzIwLzA0LzIxLzcw/LzM2MF9GXzIwMDQy/MTcwNDRfd0xTQVls/T09Fa1BscjFSdmJ4/M1VxMjlZQ2dMa0tj/RWguanBn',
      
        'Butter Chicken':
          '../assets/butter-chicken.webp',

  'Paneer Butter Masala':
    'https://imgs.search.brave.com/6ti4l1i8_7-zOZNTTLSNqht1PvEtB5lmJFymg6YuS4g/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93d3cu/aW5kaWFuaGVhbHRo/eXJlY2lwZXMuY29t/L3dwLWNvbnRlbnQv/dXBsb2Fkcy8yMDIz/LzA3L3BhbmVlci1i/dXR0ZXItbWFzYWxh/LXJlY2lwZS5qcGc',

  'Dal Tadka':
    'https://imgs.search.brave.com/St4BhI2MJUG60ONIatynMLM4vQaS6RZUzQM1aQVZP_M/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9nbGVi/ZWtpdGNoZW4uY29t/L3dwLWNvbnRlbnQv/dXBsb2Fkcy8yMDE5/LzA1L2RhbHRhZGth/Y2xvc2V1cC5qcGc',
      'Fish Curry':
        '../assets/fish-curry.jpg',

  'Gulab Jamun':
    'https://imgs.search.brave.com/84zbZ9nMabdLcC0eA0zLejX0xwCVJ1bbV0HmyM8lclY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly90YWxv/ZGZvb2RzLmNvbS9j/ZG4vc2hvcC9maWxl/cy9HdWxhYl9KYW11/bl9OZXdfQ3JlYXRp/dmVfSW1hZ2UucG5n/P3Y9MTc3NDUzMTE2/OA',

  'Brownie':
    'https://i.pinimg.com/736x/22/d0/2c/22d02c3cbb0b2ba46f0089b6c94821fa.jpg',

  'Kulfi':
    'https://www.sharmispassions.com/wp-content/uploads/2014/05/mango-kulfi7.jpg',

  'Fresh Lime Soda':
    'https://gunjanchopra.com/content/images/2022/08/FI-2.jpg',

  'Masala Chai':
    'https://instacuppastore.com/cdn/shop/articles/blog-authentic-chai-recipe-morning-routine-cover_5b49c9b2-eef8-4268-bab7-3c52fff3eb49.jpg?v=1775497167',

  'Mango Lassi':
    '../assets/mango-lassi.jpg',

  'Cold Coffee':
    'https://images.unsplash.com/photo-1481391032119-d89fee407e44?auto=format&fit=crop&w=1200&q=80',

  'Naan':
    'https://imgs.search.brave.com/VnbYyhwQYfrS8KgmMGu5MChfbiq-kMTUI-ctNgtxqD0/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzE1LzU1LzkwLzkw/LzM2MF9GXzE1NTU5/MDkwOTVfTGhXZFR1/Y09KM0RpN1hObDdL/VmxoQjg0T2M0U3lu/OHAuanBn',

  'Butter Roti':
    'https://orders.popskitchen.in/storage/2024/09/image-62.png',

  'Samosa':
    'https://c.ndtvimg.com/2023-03/0m65kep_samosa_625x300_10_March_23.jpg',

  'Spring Roll':
    'https://www.elmundoeats.com/wp-content/uploads/2024/02/Crispy-spring-rolls.jpg',

  'Roti':
    'https://imgs.search.brave.com/8fRtR5s-oXmCNA3kbrBN9_J8LNo3KXZO3zpk-fZKCzU/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93d3cu/c2ltcGx5cmVjaXBl/cy5jb20vdGhtYi9X/ajc0MEh0dTN6ODdq/a29Lcy03RE1qSlln/c1U9LzE1MDB4MC9m/aWx0ZXJzOm5vX3Vw/c2NhbGUoKTptYXhf/Ynl0ZXMoMTUwMDAw/KTpzdHJpcF9pY2Mo/KTpmb3JtYXQod2Vi/cCkvU2ltcGx5LVJl/Y2lwZXMtUm90aS1N/RVRIT0QtMjAtYTU3/MmM1Y2NiMTY0NGFj/NGI3ZmJjNzgzM2Ix/MzlmNzEuanBn'
};
    if (itemMap[item.name]) {
      const fallback = categoryMap[item.category] || categoryMap.Starters;
      return { primary: itemMap[item.name], fallback };
    }

    const primary = categoryMap[item.category] || 'https://images.unsplash.com/photo-1543352634-99a5d6f0c7e1?auto=format&fit=crop&w=1200&q=80';
    return { primary, fallback: primary };
  };
  const { primary, fallback } = menuImage(m);
  return `
    <div class="menu-card">
      <div class="menu-photo" style="background-image:url('${primary}'), url('${fallback}');"></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div class="menu-item-name">${m.name}</div>
          <div class="menu-item-cat">${m.category}</div>
        </div>
        <span class="badge ${m.available ? 'badge-green':'badge-red'}">${m.available?'Available':'Unavailable'}</span>
      </div>
      <div style="font-size:0.78rem;color:var(--text-muted);margin:6px 0;">${m.description||''}</div>
      <div class="menu-item-price">${formatCurrency(m.price)}</div>
      <div class="menu-card-actions">
        <button class="btn btn-secondary btn-sm btn-icon menu-edit-btn" data-id="${m.id}" title="Edit">✏️</button>
        <button class="btn btn-secondary btn-sm menu-toggle-btn" data-id="${m.id}">${m.available?'Mark Unavail':'Mark Avail'}</button>
        <button class="btn btn-danger btn-sm btn-icon menu-delete-btn" data-id="${m.id}" data-name="${m.name}" title="Delete">🗑️</button>
      </div>
    </div>`;
}

function openMenuModal(id) {
  const m = id ? DB.getById('menuItems', id) : {};
  const CATEGORIES = ['Breakfast','Starters','Soups','Main Course','Breads','Dessert','Beverages','Snacks'];
  Modal.open({
    title: id ? 'Edit Menu Item' : 'Add Menu Item',
    body: `
      <div class="form-group"><label>Item Name *</label><input id="mi-name" value="${m.name||''}" placeholder="e.g. Masala Dosa"></div>
      <div class="form-row">
        <div class="form-group"><label>Category *</label>
          <select id="mi-cat">
            ${CATEGORIES.map(c=>`<option ${m.category===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Price (₹) *</label><input id="mi-price" type="number" value="${m.price||0}" min="0"></div>
      </div>
      <div class="form-group"><label>Description</label><textarea id="mi-desc" rows="2" placeholder="Brief description...">${m.description||''}</textarea></div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
      <button class="btn btn-primary" id="save-mi-btn">${id?'Update':'Add Item'}</button>
    `
  });
  setTimeout(() => {
    document.getElementById('save-mi-btn').onclick = () => {
      const name = document.getElementById('mi-name').value.trim();
      const cat  = document.getElementById('mi-cat').value;
      const price = +document.getElementById('mi-price').value;
      const desc  = document.getElementById('mi-desc').value.trim();
      if (!name || !price) return toast('Name and price are required', 'error');
      if (id) {
        DB.update('menuItems', id, { name, category: cat, price, description: desc });
        toast('Item updated', 'success');
      } else {
        DB.insert('menuItems', { name, category: cat, price, description: desc, available: true });
        toast('Item added', 'success');
      }
      Modal.close();
      renderMenu(document.getElementById('page-content'));
    };
  }, 50);
}

// ==================== TABLES ====================
function renderTables(container) {
  function draw() {
    const tables = DB.getAll('tables').sort((a,b) => a.number - b.number);
    const avail  = tables.filter(t => t.status === 'available').length;
    const occ    = tables.filter(t => t.status === 'occupied').length;
    const res    = tables.filter(t => t.status === 'reserved').length;

    container.innerHTML = `
      <div class="page-header">
        <div><h2>Tables</h2><div class="page-header-sub">${avail} available · ${occ} occupied · ${res} reserved</div></div>
        <button class="btn btn-primary" id="add-table-btn">+ Add Table</button>
      </div>
      <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">
        <div class="stat-card green" style="padding:14px 20px;flex:1;min-width:120px;">
          <div class="stat-value">${avail}</div><div class="stat-label">Available</div>
        </div>
        <div class="stat-card red" style="padding:14px 20px;flex:1;min-width:120px;">
          <div class="stat-value">${occ}</div><div class="stat-label">Occupied</div>
        </div>
        <div class="stat-card gold" style="padding:14px 20px;flex:1;min-width:120px;">
          <div class="stat-value">${res}</div><div class="stat-label">Reserved</div>
        </div>
      </div>
      <div class="table-grid" id="rest-table-grid">
        ${tables.length ? tables.map(t => tableCard(t)).join('') : emptyState('🪑','No tables','Add restaurant tables')}
      </div>
    `;

    document.getElementById('add-table-btn').onclick = () => openTableModal();
    container.querySelectorAll('.tbl-status-btn').forEach(b => b.onclick = () => {
      const t = DB.getById('tables', b.dataset.id);
      const cycle = { available: 'occupied', occupied: 'reserved', reserved: 'available' };
      DB.update('tables', t.id, { status: cycle[t.status] || 'available' });
      draw();
    });
    container.querySelectorAll('.tbl-delete-btn').forEach(b => b.onclick = () =>
      confirmAction(`Delete Table ${b.dataset.num}?`, () => {
        DB.remove('tables', b.dataset.id); toast('Table deleted', 'success'); draw();
      })
    );
  }
  draw();
}

function tableCard(t) {
  const icon = { available: '🟢', occupied: '🔴', reserved: '🟡' };
  return `
    <div class="table-card ${t.status}">
      <div style="font-size:1.5rem;">${icon[t.status]||'⚪'}</div>
      <div class="table-num">T${t.number}</div>
      <div class="table-cap">${t.capacity} seats · ${t.section||''}</div>
      <div style="margin-top:10px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm tbl-status-btn" data-id="${t.id}">${t.status==='available'?'Set Occupied':t.status==='occupied'?'Set Reserved':'Set Avail'}</button>
        <button class="btn btn-danger btn-sm btn-icon tbl-delete-btn" data-id="${t.id}" data-num="${t.number}">🗑️</button>
      </div>
    </div>`;
}

function openTableModal() {
  Modal.open({
    title: 'Add Table',
    body: `
      <div class="form-row">
        <div class="form-group"><label>Table Number *</label><input id="tb-num" type="number" placeholder="13" min="1"></div>
        <div class="form-group"><label>Capacity *</label><input id="tb-cap" type="number" value="4" min="1"></div>
      </div>
      <div class="form-group"><label>Section</label>
        <select id="tb-section">
          <option>Indoor</option><option>Outdoor</option><option>Terrace</option><option>Private</option>
        </select>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
      <button class="btn btn-primary" id="save-tb-btn">Add Table</button>
    `
  });
  setTimeout(() => {
    document.getElementById('save-tb-btn').onclick = () => {
      const num = +document.getElementById('tb-num').value;
      const cap = +document.getElementById('tb-cap').value;
      const sec = document.getElementById('tb-section').value;
      if (!num || !cap) return toast('Number and capacity required', 'error');
      DB.insert('tables', { number: num, capacity: cap, section: sec, status: 'available' });
      toast('Table added', 'success');
      Modal.close();
      renderTables(document.getElementById('page-content'));
    };
  }, 50);
}

// ==================== ORDERS ====================
function renderOrders(container) {
  let tab = 'active';

  function draw() {
    let orders = DB.getAll('orders').sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    const active = orders.filter(o => o.status === 'active');
    const completed = orders.filter(o => o.status === 'completed');
    const shown = tab === 'active' ? active : completed;

    container.innerHTML = `
      <div class="page-header">
        <div><h2>Orders</h2><div class="page-header-sub">${active.length} active · ${completed.length} completed</div></div>
        <button class="btn btn-primary" id="new-order-btn">+ New Order</button>
      </div>
      <div class="tabs">
        <button class="tab-btn ${tab==='active'?'active':''}" data-tab="active">Active Orders (${active.length})</button>
        <button class="tab-btn ${tab==='completed'?'active':''}" data-tab="completed">Completed (${completed.length})</button>
      </div>
      <div>
        ${shown.length ? `
          <div class="card" style="padding:0;overflow:hidden;">
            <div class="table-wrapper">
              <table>
                <thead><tr><th>Table</th><th>Items</th><th>Subtotal</th><th>Tax (5%)</th><th>Total</th><th>Status</th><th>Time</th><th>Actions</th></tr></thead>
                <tbody>
                  ${shown.map(o => `
                    <tr>
                      <td><strong>Table ${o.tableNumber}</strong></td>
                      <td style="max-width:200px;">
                        ${o.items.map(i=>`${i.name}×${i.qty}`).join(', ')}
                      </td>
                      <td>${formatCurrency(o.subtotal)}</td>
                      <td>${formatCurrency(o.tax)}</td>
                      <td style="color:var(--gold);font-weight:700;">${formatCurrency(o.total)}</td>
                      <td>${statusBadge(o.status)}</td>
                      <td style="font-size:0.78rem;color:var(--text-muted);">${formatDateTime(o.createdAt)}</td>
                      <td>
                        <div style="display:flex;gap:6px;">
                          ${o.status==='active' ? `
                            <button class="btn btn-success btn-sm ord-complete-btn" data-id="${o.id}">Complete</button>
                            <button class="btn btn-primary btn-sm btn-icon ord-bill-btn" data-id="${o.id}" title="Print Bill">🧾</button>
                          ` : `<button class="btn btn-secondary btn-sm btn-icon ord-bill-btn" data-id="${o.id}" title="View Bill">🧾</button>`}
                          <button class="btn btn-danger btn-sm btn-icon ord-delete-btn" data-id="${o.id}">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : emptyState('🧾',`No ${tab} orders`,tab==='active'?'Create a new order':'No completed orders yet')}
      </div>
    `;

    container.querySelectorAll('.tab-btn').forEach(b => b.onclick = () => { tab = b.dataset.tab; draw(); });
    document.getElementById('new-order-btn').onclick = () => openOrderModal();
    container.querySelectorAll('.ord-complete-btn').forEach(b => b.onclick = () => {
      const o = DB.getById('orders', b.dataset.id);
      DB.update('orders', o.id, { status: 'completed' });
      DB.update('tables', o.tableId, { status: 'available' });
      DB.logActivity('🧾', `Order completed — Table ${o.tableNumber} — ${formatCurrency(o.total)}`, 'gold');
      toast('Order completed', 'success'); draw();
    });
    container.querySelectorAll('.ord-bill-btn').forEach(b => b.onclick = () => showBill(b.dataset.id));
    container.querySelectorAll('.ord-delete-btn').forEach(b => b.onclick = () =>
      confirmAction('Delete this order?', () => {
        const o = DB.getById('orders', b.dataset.id);
        if (o && o.status === 'active') {
          DB.update('tables', o.tableId, { status: 'available' });
        }
        DB.remove('orders', b.dataset.id);
        toast('Order deleted', 'success');
        draw();
      })
    );
  }
  draw();
}

function openOrderModal() {
  const tables = DB.getAll('tables').filter(t => t.status === 'available');
  const menuItems = DB.getAll('menuItems').filter(m => m.available);
  const CATEGORIES = [...new Set(menuItems.map(m => m.category))];
  if (!tables.length) return toast('No available tables', 'error');
  if (!menuItems.length) return toast('No available menu items', 'error');

  let cart = [];

  function cartHTML() {
    if (!cart.length) return `<div style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:20px;">No items added yet</div>`;
    const sub = cart.reduce((s,i) => s + i.price*i.qty, 0);
    const tax  = Math.round(sub * 0.05);
    const total = sub + tax;
    return `
      <div class="order-items-list" style="margin-bottom:12px;">
        ${cart.map((item,idx) => `
          <div class="order-item-row">
            <span style="flex:1;">${item.name}</span>
            <div class="qty-ctrl">
              <button class="qty-btn" data-action="dec" data-idx="${idx}">−</button>
              <span class="qty-val">${item.qty}</span>
              <button class="qty-btn" data-action="inc" data-idx="${idx}">+</button>
            </div>
            <span style="min-width:70px;text-align:right;color:var(--gold);font-weight:600;">${formatCurrency(item.price*item.qty)}</span>
            <button class="qty-btn" data-action="remove" data-idx="${idx}" style="margin-left:4px;">✕</button>
          </div>
        `).join('')}
      </div>
      <div class="order-summary">
        <div class="summary-line"><span>Subtotal</span><span>${formatCurrency(sub)}</span></div>
        <div class="summary-line"><span>Tax (5%)</span><span>${formatCurrency(tax)}</span></div>
        <div class="summary-total"><span>Total</span><span>${formatCurrency(total)}</span></div>
      </div>`;
  }

  function rebind() {
    document.querySelectorAll('.qty-btn[data-action]').forEach(b => {
      b.onclick = () => {
        const idx = +b.dataset.idx;
        if (b.dataset.action === 'inc') cart[idx].qty++;
        else if (b.dataset.action === 'dec') { cart[idx].qty--; if(cart[idx].qty<1) cart.splice(idx,1); }
        else if (b.dataset.action === 'remove') cart.splice(idx, 1);
        document.getElementById('order-cart').innerHTML = cartHTML();
        rebind();
      };
    });
  }

  Modal.open({
    title: 'New Order',
    size: 'lg',
    body: `
      <div class="order-layout">
        <div>
          <div class="form-group" style="margin-bottom:12px;">
            <label>Select Table *</label>
            <select id="ord-table">
              ${tables.map(t=>`<option value="${t.id}" data-num="${t.number}">Table ${t.number} (${t.capacity} seats · ${t.section})</option>`).join('')}
            </select>
          </div>
          <div class="tabs" style="margin-bottom:12px;">
            ${CATEGORIES.map((c,i)=>`<button class="tab-btn ${i===0?'active':''}" data-cat="${c}">${c}</button>`).join('')}
          </div>
          <div id="menu-selector" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;max-height:260px;overflow-y:auto;">
          </div>
        </div>
        <div>
          <div style="font-weight:600;margin-bottom:12px;font-size:0.9rem;">🧾 Order Summary</div>
          <div id="order-cart">${cartHTML()}</div>
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
      <button class="btn btn-primary" id="place-order-btn">Place Order</button>
    `
  });

  function renderMenuSelector(cat) {
    const ms = document.getElementById('menu-selector');
    if (!ms) return;
    const items = menuItems.filter(m => m.category === cat);
    ms.innerHTML = items.map(m => `
      <div class="menu-card" style="cursor:pointer;padding:12px;" data-menuid="${m.id}" data-name="${m.name}" data-price="${m.price}">
        <div style="font-weight:600;font-size:0.85rem;">${m.name}</div>
        <div style="color:var(--gold);font-size:0.88rem;font-weight:700;margin-top:4px;">${formatCurrency(m.price)}</div>
        <button class="btn btn-primary btn-sm" style="margin-top:8px;width:100%;">+ Add</button>
      </div>
    `).join('');
    ms.querySelectorAll('.menu-card').forEach(card => {
      card.querySelector('button').onclick = () => {
        const id = card.dataset.menuid;
        const ex = cart.find(i => i.menuId === id);
        if (ex) ex.qty++;
        else cart.push({ menuId: id, name: card.dataset.name, price: +card.dataset.price, qty: 1 });
        document.getElementById('order-cart').innerHTML = cartHTML();
        rebind();
      };
    });
  }

  setTimeout(() => {
    const firstCat = CATEGORIES[0];
    renderMenuSelector(firstCat);
    document.querySelectorAll('.tab-btn[data-cat]').forEach(b => {
      b.onclick = () => {
        document.querySelectorAll('.tab-btn[data-cat]').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        renderMenuSelector(b.dataset.cat);
      };
    });
    document.getElementById('place-order-btn').onclick = () => {
      if (!cart.length) return toast('Add items to the order', 'error');
      const tblSel = document.getElementById('ord-table');
      const tableId = tblSel.value;
      const tableNum = tblSel.options[tblSel.selectedIndex].dataset.num;
      const sub  = cart.reduce((s,i) => s + i.price*i.qty, 0);
      const tax  = Math.round(sub * 0.05);
      const total = sub + tax;
      DB.insert('orders', {
        tableId, tableNumber: +tableNum,
        items: cart.map(i=>({menuId:i.menuId, name:i.name, price:i.price, qty:i.qty})),
        subtotal: sub, tax, total, status: 'active'
      });
      DB.update('tables', tableId, { status: 'occupied' });
      DB.logActivity('🍽️', `New order — Table ${tableNum} — ${formatCurrency(total)}`, 'gold');
      toast('Order placed!', 'success');
      Modal.close();
      renderOrders(document.getElementById('page-content'));
    };
  }, 60);
}

function showBill(orderId) {
  const o = DB.getById('orders', orderId);
  if (!o) return;
  Modal.open({
    title: `Bill — Table ${o.tableNumber}`,
    body: `
      <div style="text-align:center;margin-bottom:16px;">
        <div style="font-size:1.3rem;font-weight:800;color:var(--gold);">BookNFeast</div>
        <div style="font-size:0.78rem;color:var(--text-muted);">Restaurant Bill</div>
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">${formatDateTime(o.createdAt)}</div>
      </div>
      <div style="border-top:1px dashed var(--border);border-bottom:1px dashed var(--border);padding:12px 0;margin-bottom:12px;">
        ${o.items.map(i=>`
          <div style="display:flex;justify-content:space-between;font-size:0.87rem;padding:4px 0;">
            <span>${i.name} × ${i.qty}</span>
            <span>${formatCurrency(i.price*i.qty)}</span>
          </div>
        `).join('')}
      </div>
      <div class="order-summary">
        <div class="summary-line"><span>Subtotal</span><span>${formatCurrency(o.subtotal)}</span></div>
        <div class="summary-line"><span>GST (5%)</span><span>${formatCurrency(o.tax)}</span></div>
        <div class="summary-total"><span>Grand Total</span><span>${formatCurrency(o.total)}</span></div>
      </div>
      <div style="text-align:center;margin-top:16px;font-size:0.78rem;color:var(--text-muted);">Thank you for dining with us! 🙏</div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="Modal.close()">Close</button>
      <button class="btn btn-primary" onclick="window.print()">🖨️ Print</button>
    `
  });
}
