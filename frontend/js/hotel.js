/**
 * hotel.js — Rooms, Guests, Bookings management
 */

// ==================== ROOMS ====================
function renderRooms(container) {
  let filter = { search: '', status: '', type: '' };

  function draw() {
    let rooms = DB.getAll('rooms');
    if (filter.search) rooms = rooms.filter(r => r.number.includes(filter.search) || r.type.toLowerCase().includes(filter.search.toLowerCase()));
    if (filter.status) rooms = rooms.filter(r => r.status === filter.status);
    if (filter.type) rooms = rooms.filter(r => r.type === filter.type);

    container.innerHTML = `
      <div class="page-header">
        <div><h2>Rooms</h2><div class="page-header-sub">${rooms.length} rooms found</div></div>
        <button class="btn btn-primary" id="add-room-btn">+ Add Room</button>
      </div>
      <div class="filter-bar">
        <input type="text" id="room-search" placeholder="🔍 Search by number or type..." value="${filter.search}" style="max-width:260px;">
        <select id="room-status-filter">
          <option value="">All Status</option>
          <option value="available" ${filter.status==='available'?'selected':''}>Available</option>
          <option value="occupied" ${filter.status==='occupied'?'selected':''}>Occupied</option>
          <option value="maintenance" ${filter.status==='maintenance'?'selected':''}>Maintenance</option>
        </select>
        <select id="room-type-filter">
          <option value="">All Types</option>
          <option value="Standard" ${filter.type==='Standard'?'selected':''}>Standard</option>
          <option value="Deluxe" ${filter.type==='Deluxe'?'selected':''}>Deluxe</option>
          <option value="Suite" ${filter.type==='Suite'?'selected':''}>Suite</option>
          <option value="Presidential" ${filter.type==='Presidential'?'selected':''}>Presidential</option>
        </select>
      </div>
      <div class="room-grid" id="room-grid">
        ${rooms.length ? rooms.map(r => roomCard(r)).join('') : emptyState('🛏️','No rooms found','Add rooms or change filters')}
      </div>
    `;
    bindRoomEvents();
  }

  function bindRoomEvents() {
    document.getElementById('add-room-btn').onclick = () => openRoomModal();
    document.getElementById('room-search').oninput = e => { filter.search = e.target.value; draw(); };
    document.getElementById('room-status-filter').onchange = e => { filter.status = e.target.value; draw(); };
    document.getElementById('room-type-filter').onchange = e => { filter.type = e.target.value; draw(); };
    container.querySelectorAll('.room-edit-btn').forEach(btn => btn.onclick = () => openRoomModal(btn.dataset.id));
    container.querySelectorAll('.room-delete-btn').forEach(btn => btn.onclick = () => {
      confirmAction(`Delete Room ${btn.dataset.num}?`, () => {
        DB.remove('rooms', btn.dataset.id);
        toast('Room deleted', 'success');
        draw();
      });
    });
    container.querySelectorAll('.room-status-btn').forEach(btn => btn.onclick = () => {
      const r = DB.getById('rooms', btn.dataset.id);
      const next = r.status === 'available' ? 'occupied' : r.status === 'occupied' ? 'maintenance' : 'available';
      DB.update('rooms', r.id, { status: next });
      draw();
    });
  }

  draw();
}

function roomCard(r) {
  const roomImage = (room) => {
    const roomMap = {
      401: 'https://www.hotelborobudur.com/wp-content/uploads/2025/05/New-deluxe-suite-Edit-copy-scaled.jpg'
    };
    const map = {
      Standard: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
      Deluxe: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      Suite: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80',
      Presidential: 'https://images.unsplash.com/photo-1505693314127-0d443867891c?auto=format&fit=crop&w=1200&q=80'
    };
    return roomMap[room.number] || map[room.type] || map.Standard;
  };
  const colorMap = { available: 'badge-green', occupied: 'badge-red', maintenance: 'badge-yellow' };
  const dotMap   = { available: '#10b981', occupied: '#ef4444', maintenance: '#f5c842' };
  return `
    <div class="room-card">
      <div class="room-photo" style="background-image:url('${roomImage(r)}');"></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
        <div class="room-number">🛏 ${r.number}</div>
        <span class="badge ${colorMap[r.status]||'badge-gray'}">${r.status}</span>
      </div>
      <div class="room-type">${r.type} · Floor ${r.floor} · ${r.capacity} pax</div>
      <div class="room-price">${formatCurrency(r.pricePerNight)}/night</div>
      <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:8px;">${r.amenities||''}</div>
      <div class="room-actions">
        <button class="btn btn-secondary btn-sm btn-icon room-edit-btn" data-id="${r.id}" title="Edit">✏️</button>
        <button class="btn btn-secondary btn-sm btn-icon room-status-btn" data-id="${r.id}" title="Toggle Status">🔄</button>
        <button class="btn btn-danger btn-sm btn-icon room-delete-btn" data-id="${r.id}" data-num="${r.number}" title="Delete">🗑️</button>
      </div>
    </div>`;
}

function openRoomModal(id) {
  const r = id ? DB.getById('rooms', id) : {};
  Modal.open({
    title: id ? `Edit Room ${r.number}` : 'Add New Room',
    body: `
      <div class="form-row">
        <div class="form-group"><label>Room Number *</label><input id="rm-number" value="${r.number||''}" placeholder="101"></div>
        <div class="form-group"><label>Floor</label><input id="rm-floor" type="number" value="${r.floor||1}" min="1"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Type *</label>
          <select id="rm-type">
            ${['Standard','Deluxe','Suite','Presidential'].map(t=>`<option value="${t}" ${r.type===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Capacity</label><input id="rm-cap" type="number" value="${r.capacity||2}" min="1"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Price / Night (₹) *</label><input id="rm-price" type="number" value="${r.pricePerNight||0}" min="0"></div>
        <div class="form-group"><label>Status</label>
          <select id="rm-status">
            ${['available','occupied','maintenance'].map(s=>`<option value="${s}" ${r.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group"><label>Amenities</label><input id="rm-amenities" value="${r.amenities||''}" placeholder="AC, WiFi, TV, Mini Bar"></div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
      <button class="btn btn-primary" id="save-room-btn">${id ? 'Update' : 'Add Room'}</button>
    `
  });
  setTimeout(() => {
    document.getElementById('save-room-btn').onclick = () => {
      const number  = document.getElementById('rm-number').value.trim();
      const floor   = +document.getElementById('rm-floor').value;
      const type    = document.getElementById('rm-type').value;
      const cap     = +document.getElementById('rm-cap').value;
      const price   = +document.getElementById('rm-price').value;
      const status  = document.getElementById('rm-status').value;
      const amenities = document.getElementById('rm-amenities').value;
      if (!number || !price) return toast('Room number and price are required', 'error');
      if (id) {
        DB.update('rooms', id, { number, floor, type, capacity: cap, pricePerNight: price, status, amenities });
        toast('Room updated', 'success');
      } else {
        DB.insert('rooms', { number, floor, type, capacity: cap, pricePerNight: price, status, amenities });
        DB.logActivity('🛏️', `Room ${number} added`, 'blue');
        toast('Room added', 'success');
      }
      Modal.close();
      renderRooms(document.getElementById('page-content'));
    };
  }, 50);
}

// ==================== GUESTS ====================
function renderGuests(container) {
  let search = '';

  function draw() {
    let guests = DB.getAll('guests');
    if (search) guests = guests.filter(g =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.email.toLowerCase().includes(search.toLowerCase()) ||
      g.phone.includes(search)
    );
    container.innerHTML = `
      <div class="page-header">
        <div><h2>Guests</h2><div class="page-header-sub">${guests.length} guests registered</div></div>
        <button class="btn btn-primary" id="add-guest-btn">+ Add Guest</button>
      </div>
      <div class="filter-bar">
        <input type="text" id="guest-search" placeholder="🔍 Search by name, email or phone..." value="${search}">
      </div>
      <div class="card" style="padding:0;overflow:hidden;">
        <div class="table-wrapper">
          <table>
            <thead><tr>
              <th>Name</th><th>Email</th><th>Phone</th><th>ID Type</th><th>ID Number</th><th>Since</th><th>Actions</th>
            </tr></thead>
            <tbody>
              ${guests.length ? guests.map(g => `
                <tr>
                  <td><strong>${g.name}</strong></td>
                  <td style="color:var(--text-secondary);">${g.email}</td>
                  <td>${g.phone}</td>
                  <td>${g.idType||'—'}</td>
                  <td><code style="font-size:0.78rem;color:var(--text-muted);">${g.idNumber||'—'}</code></td>
                  <td style="color:var(--text-muted);font-size:0.8rem;">${formatDate(g.createdAt)}</td>
                  <td>
                    <div style="display:flex;gap:6px;">
                      <button class="btn btn-secondary btn-sm btn-icon guest-edit-btn" data-id="${g.id}">✏️</button>
                      <button class="btn btn-danger btn-sm btn-icon guest-delete-btn" data-id="${g.id}" data-name="${g.name}">🗑️</button>
                    </div>
                  </td>
                </tr>
              `).join('') : `<tr><td colspan="7">${emptyState('👤','No guests found','Register your first guest')}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
    document.getElementById('add-guest-btn').onclick = () => openGuestModal();
    document.getElementById('guest-search').oninput = e => { search = e.target.value; draw(); };
    container.querySelectorAll('.guest-edit-btn').forEach(b => b.onclick = () => openGuestModal(b.dataset.id));
    container.querySelectorAll('.guest-delete-btn').forEach(b => b.onclick = () =>
      confirmAction(`Delete guest "${b.dataset.name}"?`, () => {
        DB.remove('guests', b.dataset.id); toast('Guest deleted', 'success'); draw();
      })
    );
  }
  draw();
}

function openGuestModal(id) {
  const g = id ? DB.getById('guests', id) : {};
  Modal.open({
    title: id ? 'Edit Guest' : 'Register New Guest',
    body: `
      <div class="form-group"><label>Full Name *</label><input id="g-name" value="${g.name||''}" placeholder="John Doe"></div>
      <div class="form-row">
        <div class="form-group"><label>Email</label><input id="g-email" type="email" value="${g.email||''}" placeholder="email@example.com"></div>
        <div class="form-group"><label>Phone *</label><input id="g-phone" value="${g.phone||''}" placeholder="9876543210"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>ID Type</label>
          <select id="g-idtype">
            ${['Aadhaar','Passport','Driving License','Voter ID','PAN Card'].map(t=>`<option ${g.idType===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>ID Number</label><input id="g-idnum" value="${g.idNumber||''}" placeholder="XXXX1234"></div>
      </div>
      <div class="form-group"><label>Address</label><textarea id="g-addr" rows="2" placeholder="Street, City, State">${g.address||''}</textarea></div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
      <button class="btn btn-primary" id="save-guest-btn">${id?'Update':'Register'}</button>
    `
  });
  setTimeout(() => {
    document.getElementById('save-guest-btn').onclick = () => {
      const name  = document.getElementById('g-name').value.trim();
      const email = document.getElementById('g-email').value.trim();
      const phone = document.getElementById('g-phone').value.trim();
      const idType   = document.getElementById('g-idtype').value;
      const idNumber = document.getElementById('g-idnum').value.trim();
      const address  = document.getElementById('g-addr').value.trim();
      if (!name || !phone) return toast('Name and phone are required', 'error');
      if (id) {
        DB.update('guests', id, { name, email, phone, idType, idNumber, address });
        toast('Guest updated', 'success');
      } else {
        DB.insert('guests', { name, email, phone, idType, idNumber, address });
        DB.logActivity('👤', `New guest: ${name}`, 'green');
        toast('Guest registered', 'success');
      }
      Modal.close();
      renderGuests(document.getElementById('page-content'));
    };
  }, 50);
}

// ==================== BOOKINGS ====================
function renderBookings(container) {
  let filterStatus = '';
  let search = '';

  function draw() {
    let bookings = DB.getAll('bookings').sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    if (filterStatus) bookings = bookings.filter(b => b.status === filterStatus);
    if (search) bookings = bookings.filter(b =>
      b.guestName.toLowerCase().includes(search.toLowerCase()) ||
      b.roomNumber.includes(search)
    );

    container.innerHTML = `
      <div class="page-header">
        <div><h2>Bookings</h2><div class="page-header-sub">${bookings.length} bookings</div></div>
        <button class="btn btn-primary" id="add-booking-btn">+ New Booking</button>
      </div>
      <div class="filter-bar">
        <input type="text" id="bk-search" placeholder="🔍 Search guest or room..." value="${search}">
        <select id="bk-status-filter">
          <option value="">All</option>
          ${['confirmed','checked-in','checked-out','cancelled'].map(s=>`<option value="${s}" ${filterStatus===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="card" style="padding:0;overflow:hidden;">
        <div class="table-wrapper">
          <table>
            <thead><tr>
              <th>Guest</th><th>Room</th><th>Check-In</th><th>Check-Out</th><th>Nights</th><th>Amount</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              ${bookings.length ? bookings.map(b => `
                <tr>
                  <td><strong>${b.guestName}</strong></td>
                  <td>Room <strong>${b.roomNumber}</strong></td>
                  <td>${formatDate(b.checkIn)}</td>
                  <td>${formatDate(b.checkOut)}</td>
                  <td style="text-align:center;">${b.nights}</td>
                  <td style="color:var(--gold);font-weight:600;">${formatCurrency(b.amount)}</td>
                  <td>${statusBadge(b.status)}</td>
                  <td>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                      ${b.status==='confirmed' ? `<button class="btn btn-success btn-sm bk-checkin-btn" data-id="${b.id}">Check In</button>` : ''}
                      ${b.status==='checked-in' ? `<button class="btn btn-primary btn-sm bk-checkout-btn" data-id="${b.id}">Check Out</button>` : ''}
                      ${(b.status==='confirmed'||b.status==='checked-in') ? `<button class="btn btn-danger btn-sm bk-cancel-btn" data-id="${b.id}">Cancel</button>` : ''}
                      <button class="btn btn-secondary btn-sm btn-icon bk-delete-btn" data-id="${b.id}">🗑️</button>
                    </div>
                  </td>
                </tr>
              `).join('') : `<tr><td colspan="8">${emptyState('📅','No bookings','Create your first booking')}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('add-booking-btn').onclick = () => openBookingModal();
    document.getElementById('bk-search').oninput = e => { search = e.target.value; draw(); };
    document.getElementById('bk-status-filter').onchange = e => { filterStatus = e.target.value; draw(); };
    container.querySelectorAll('.bk-checkin-btn').forEach(btn => btn.onclick = () => {
      const b = DB.getById('bookings', btn.dataset.id);
      DB.update('bookings', b.id, { status: 'checked-in' });
      DB.update('rooms', b.roomId, { status: 'occupied' });
      DB.logActivity('🏨', `Check-in: ${b.guestName} → Room ${b.roomNumber}`, 'green');
      toast('Checked in successfully', 'success'); draw();
    });
    container.querySelectorAll('.bk-checkout-btn').forEach(btn => btn.onclick = () => {
      const b = DB.getById('bookings', btn.dataset.id);
      DB.update('bookings', b.id, { status: 'checked-out' });
      DB.update('rooms', b.roomId, { status: 'available' });
      DB.logActivity('🏨', `Check-out: ${b.guestName} from Room ${b.roomNumber}`, 'gold');
      toast('Checked out successfully', 'success'); draw();
    });
    container.querySelectorAll('.bk-cancel-btn').forEach(btn => btn.onclick = () =>
      confirmAction('Cancel this booking?', () => {
        const b = DB.getById('bookings', btn.dataset.id);
        DB.update('bookings', b.id, { status: 'cancelled' });
        DB.update('rooms', b.roomId, { status: 'available' });
        toast('Booking cancelled', 'success'); draw();
      })
    );
    container.querySelectorAll('.bk-delete-btn').forEach(btn => btn.onclick = () =>
      confirmAction('Delete this booking record?', () => {
        DB.remove('bookings', btn.dataset.id); toast('Booking deleted', 'success'); draw();
      })
    );
  }
  draw();
}

function openBookingModal() {
  const guests = DB.getAll('guests');
  const rooms  = DB.getAll('rooms').filter(r => r.status === 'available');
  const today  = new Date().toISOString().slice(0,10);
  const tom    = new Date(Date.now()+86400000).toISOString().slice(0,10);

  if (!guests.length) return toast('Register a guest first', 'error');
  if (!rooms.length) return toast('No available rooms', 'error');

  Modal.open({
    title: 'New Booking',
    body: `
      <div class="form-group"><label>Guest *</label>
        <select id="bk-guest">
          ${guests.map(g=>`<option value="${g.id}">${g.name} (${g.phone})</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Room *</label>
        <select id="bk-room">
          ${rooms.map(r=>`<option value="${r.id}" data-price="${r.pricePerNight}">Room ${r.number} — ${r.type} (${formatCurrency(r.pricePerNight)}/night)</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Check-In *</label><input id="bk-ci" type="date" value="${today}" min="${today}"></div>
        <div class="form-group"><label>Check-Out *</label><input id="bk-co" type="date" value="${tom}" min="${tom}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Adults</label><input id="bk-adults" type="number" value="2" min="1"></div>
        <div class="form-group"><label>Children</label><input id="bk-children" type="number" value="0" min="0"></div>
      </div>
      <div class="form-group" id="bk-total-display" style="background:rgba(245,200,66,0.08);border:1px solid rgba(245,200,66,0.2);border-radius:8px;padding:12px;font-size:0.9rem;">
        Estimated amount will appear here
      </div>
      <div class="form-group"><label>Notes</label><textarea id="bk-notes" rows="2" placeholder="Special requests..."></textarea></div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
      <button class="btn btn-primary" id="save-bk-btn">Confirm Booking</button>
    `
  });

  function calcTotal() {
    const ci = document.getElementById('bk-ci').value;
    const co = document.getElementById('bk-co').value;
    const roomSel = document.getElementById('bk-room');
    const price = roomSel ? +roomSel.options[roomSel.selectedIndex].dataset.price : 0;
    if (ci && co) {
      const nights = Math.max(1, Math.round((new Date(co)-new Date(ci))/86400000));
      const total = nights * price;
      document.getElementById('bk-total-display').innerHTML =
        `<strong>${nights} nights × ${formatCurrency(price)}/night = <span style="color:var(--gold);">${formatCurrency(total)}</span></strong>`;
    }
  }

  function syncCheckoutMin() {
    const ciEl = document.getElementById('bk-ci');
    const coEl = document.getElementById('bk-co');
    if (!ciEl || !coEl || !ciEl.value) return;
    const minDate = new Date(ciEl.value);
    minDate.setDate(minDate.getDate() + 1);
    const minStr = minDate.toISOString().slice(0, 10);
    coEl.min = minStr;
    if (!coEl.value || coEl.value < minStr) coEl.value = minStr;
  }

  setTimeout(() => {
    document.getElementById('bk-ci').onchange = () => { syncCheckoutMin(); calcTotal(); };
    document.getElementById('bk-co').onchange = calcTotal;
    document.getElementById('bk-room').onchange = calcTotal;
    syncCheckoutMin();
    calcTotal();

    document.getElementById('save-bk-btn').onclick = () => {
      const guestId = document.getElementById('bk-guest').value;
      const roomSel = document.getElementById('bk-room');
      const roomId  = roomSel.value;
      const ci      = document.getElementById('bk-ci').value;
      const co      = document.getElementById('bk-co').value;
      const adults  = +document.getElementById('bk-adults').value;
      const children= +document.getElementById('bk-children').value;
      const notes   = document.getElementById('bk-notes').value;
      if (!guestId || !roomId || !ci || !co) return toast('All required fields must be filled', 'error');
      const nights  = Math.max(1, Math.round((new Date(co)-new Date(ci))/86400000));
      const price   = +roomSel.options[roomSel.selectedIndex].dataset.price;
      const guest   = DB.getById('guests', guestId);
      const room    = DB.getById('rooms', roomId);
      DB.insert('bookings', {
        guestId, guestName: guest.name,
        roomId, roomNumber: room.number,
        checkIn: ci, checkOut: co, nights,
        amount: nights * price, status: 'confirmed',
        adults, children, notes
      });
      DB.logActivity('📅', `Booking: ${guest.name} → Room ${room.number}`, 'green');
      toast('Booking confirmed!', 'success');
      Modal.close();
      renderBookings(document.getElementById('page-content'));
    };
  }, 60);
}
