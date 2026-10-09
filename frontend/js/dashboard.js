/**
 * dashboard.js — Dashboard with stats, charts, and activity feed
 */

let revenueChart = null;
let occupancyChart = null;

function renderDashboard(container) {
  const rooms    = DB.getAll('rooms');
  const bookings = DB.getAll('bookings');
  const orders   = DB.getAll('orders');
  const guests   = DB.getAll('guests');
  const staff    = DB.getAll('staff');
  const menu     = DB.getAll('menuItems');

  const totalRooms    = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const availRooms    = rooms.filter(r => r.status === 'available').length;
  const occupancyPct  = totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const hotelRevenue = bookings
    .filter(b => b.status === 'checked-out')
    .reduce((s, b) => s + (b.amount || 0), 0);

  const restRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((s, o) => s + (o.total || 0), 0);

  const totalRevenue = hotelRevenue + restRevenue;
  const activeOrders = orders.filter(o => o.status === 'active').length;
  const todayBookings = bookings.filter(b => {
    return b.createdAt && b.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10);
  }).length;
  const snapshot = getOperationalSnapshot();
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const activeBookings = bookings.filter(b => ['confirmed', 'checked-in'].includes(b.status)).length;
  const revenueMixTotal = Math.max(hotelRevenue + restRevenue, 1);
  const hotelMix = Math.round((hotelRevenue / revenueMixTotal) * 100);
  const restaurantMix = Math.round((restRevenue / revenueMixTotal) * 100);
  const floorGroups = rooms.reduce((acc, room) => {
    const floor = room.floor || 'Unassigned';
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {});
  const serviceQueue = [
    { label: 'Confirmed check-ins', value: snapshot.confirmedBookings, detail: 'Front desk priority', level: snapshot.confirmedBookings > 2 ? 'high' : 'normal' },
    { label: 'Active restaurant orders', value: activeOrders, detail: 'Kitchen and service flow', level: activeOrders > 3 ? 'high' : 'normal' },
    { label: 'Maintenance rooms', value: snapshot.maintenanceRooms, detail: 'Housekeeping follow-up', level: snapshot.maintenanceRooms ? 'warn' : 'normal' },
    { label: 'Reserved tables', value: snapshot.reservedTables, detail: 'Dining room readiness', level: snapshot.reservedTables > 2 ? 'warn' : 'normal' }
  ];
  const insights = [
    snapshot.occupancy >= 70
      ? 'Occupancy is strong. Keep one deluxe or suite room ready for walk-in upgrades.'
      : 'Occupancy has room to grow. Consider a weekday room + dinner offer.',
    activeOrders > 0
      ? 'Restaurant demand is active. Monitor completed order turnaround from the Orders page.'
      : 'No active orders right now. This is a good window to update menu availability.',
    snapshot.maintenanceRooms
      ? `${snapshot.maintenanceRooms} room needs maintenance clearance before peak check-in time.`
      : 'No rooms are blocked for maintenance. Room inventory is clean.'
  ];

  container.innerHTML = `
    <div class="page-hero" style="background-image:url('https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1800&q=80');">
      <div class="hero-content">
        <div class="hero-eyebrow">Hotel & Restaurant Overview</div>
        <div class="hero-title">Welcome back, Admin</div>
        <div class="hero-text">Track occupancy, bookings, and dining performance in real time with a unified command center.</div>
        <div class="hero-actions">
          <button class="btn btn-primary btn-sm hero-action" data-page="bookings">+ New Booking</button>
          <button class="btn btn-secondary btn-sm hero-action" data-page="reports">View Reports</button>
        </div>
        <div class="hero-highlights">
          <div class="hero-chip">${occupancyPct}% Rooms Occupied</div>
          <div class="hero-chip">${formatCurrency(totalRevenue)} Revenue</div>
          <div class="hero-chip">${activeOrders} Active Orders</div>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card gold">
        <div class="stat-icon">💰</div>
        <div class="stat-value">${formatCurrency(totalRevenue)}</div>
        <div class="stat-label">Total Revenue</div>
        <div class="stat-change up">↑ Hotel + Restaurant</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-icon">🛏️</div>
        <div class="stat-value">${availRooms}<span style="font-size:1rem;color:var(--text-muted)">/${totalRooms}</span></div>
        <div class="stat-label">Rooms Available</div>
        <div class="stat-change ${occupancyPct > 60 ? 'up' : 'down'}">${occupancyPct}% Occupied</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">👤</div>
        <div class="stat-value">${guests.length}</div>
        <div class="stat-label">Total Guests</div>
        <div class="stat-change up">↑ ${todayBookings} bookings today</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-icon">🧾</div>
        <div class="stat-value">${activeOrders}</div>
        <div class="stat-label">Active Orders</div>
        <div class="stat-change up">Restaurant floor</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon">👥</div>
        <div class="stat-value">${staff.length}</div>
        <div class="stat-label">Total Staff</div>
        <div class="stat-change up">${menu.length} menu items</div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid-2" style="margin-bottom:20px;">
      <div class="card">
        <div class="card-title">Revenue — Last 7 Days</div>
        <div class="card-subtitle" style="margin-bottom:16px;">Hotel + Restaurant combined</div>
        <div class="chart-box"><canvas id="revenue-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-title">Room Occupancy</div>
        <div class="card-subtitle" style="margin-bottom:16px;">Current status breakdown</div>
        <div class="chart-box"><canvas id="occupancy-chart"></canvas></div>
      </div>
    </div>

    <!-- Bottom Row -->
    <div class="grid-2">
      <div class="card">
        <div class="card-title" style="margin-bottom:14px;">Recent Activity</div>
        <div class="activity-feed" id="activity-feed"></div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:14px;">Upcoming Check-ins</div>
        <div id="upcoming-checkins"></div>
      </div>
    </div>

    <div class="ops-grid">
      <section class="ops-panel ops-panel-wide">
        <div class="ops-panel-head">
          <div>
            <h3>Operations Intelligence</h3>
            <p>Live pressure points across hotel and restaurant workflows</p>
          </div>
          <span class="sync-pill">${snapshot.mode}</span>
        </div>
        <div class="ops-split">
          <div class="revenue-mix">
            <div class="mix-row">
              <span>Hotel revenue</span>
              <strong>${formatCurrency(hotelRevenue)}</strong>
            </div>
            <div class="mix-bar"><span style="width:${hotelMix}%"></span></div>
            <div class="mix-row">
              <span>Restaurant revenue</span>
              <strong>${formatCurrency(restRevenue)}</strong>
            </div>
            <div class="mix-bar restaurant"><span style="width:${restaurantMix}%"></span></div>
            <div class="mix-note">${completedOrders} completed orders · ${activeBookings} active bookings</div>
          </div>
          <div class="insight-list">
            ${insights.map(text => `<div class="insight-item"><span>◆</span><p>${text}</p></div>`).join('')}
          </div>
        </div>
      </section>

      <section class="ops-panel">
        <div class="ops-panel-head">
          <div>
            <h3>Floor Health</h3>
            <p>Room status by floor</p>
          </div>
        </div>
        <div class="floor-stack">
          ${Object.entries(floorGroups).map(([floor, floorRooms]) => {
            const occupied = floorRooms.filter(r => r.status === 'occupied').length;
            const blocked = floorRooms.filter(r => r.status === 'maintenance').length;
            const pct = floorRooms.length ? Math.round((occupied / floorRooms.length) * 100) : 0;
            return `
              <div class="floor-row">
                <div class="floor-meta">
                  <strong>Floor ${floor}</strong>
                  <span>${occupied}/${floorRooms.length} occupied · ${blocked} blocked</span>
                </div>
                <div class="floor-meter"><span style="width:${pct}%"></span></div>
              </div>
            `;
          }).join('')}
        </div>
      </section>

      <section class="ops-panel">
        <div class="ops-panel-head">
          <div>
            <h3>Service Queue</h3>
            <p>Tasks needing manager attention</p>
          </div>
        </div>
        <div class="queue-list">
          ${serviceQueue.map(item => `
            <button class="queue-item ${item.level}">
              <span>${item.value}</span>
              <div>
                <strong>${item.label}</strong>
                <small>${item.detail}</small>
              </div>
            </button>
          `).join('')}
        </div>
      </section>
    </div>
  `;

  renderActivityFeed();
  renderUpcomingCheckins(bookings, rooms);
  initCharts(rooms, bookings, orders);
  container.querySelectorAll('.hero-action').forEach(btn =>
    btn.addEventListener('click', () => navigate(btn.dataset.page))
  );
}

function renderActivityFeed() {
  const feed = document.getElementById('activity-feed');
  if (!feed) return;
  const activities = DB.getAll('activity').slice(0, 8);
  if (!activities.length) {
    feed.innerHTML = emptyState('📋', 'No activity yet', 'Activity will appear here');
    return;
  }
  feed.innerHTML = activities.map(a => `
    <div class="activity-item">
      <div class="activity-dot ${a.type || 'blue'}"></div>
      <div style="flex:1;">
        <div>${a.message}</div>
        <div class="activity-time">${formatDateTime(a.time)}</div>
      </div>
    </div>
  `).join('');
}

function renderUpcomingCheckins(bookings, rooms) {
  const el = document.getElementById('upcoming-checkins');
  if (!el) return;
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = bookings
    .filter(b => b.checkIn >= today && (b.status === 'confirmed' || b.status === 'checked-in'))
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
    .slice(0, 6);

  if (!upcoming.length) {
    el.innerHTML = emptyState('📅', 'No upcoming check-ins', 'New bookings will appear here');
    return;
  }
  el.innerHTML = `<div style="display:flex;flex-direction:column;gap:10px;">` +
    upcoming.map(b => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);font-size:0.85rem;">
        <div>
          <div style="font-weight:600;">${b.guestName}</div>
          <div style="color:var(--text-muted);font-size:0.77rem;">Room ${b.roomNumber} · ${b.nights} nights</div>
        </div>
        <div style="text-align:right;">
          <div style="color:var(--gold);font-weight:600;">${formatDate(b.checkIn)}</div>
          ${statusBadge(b.status)}
        </div>
      </div>
    `).join('') + `</div>`;
}

function initCharts(rooms, bookings, orders) {
  // Destroy previous instances
  if (revenueChart) { revenueChart.destroy(); revenueChart = null; }
  if (occupancyChart) { occupancyChart.destroy(); occupancyChart = null; }

  // Revenue — last 7 days (mock trend based on seeded data)
  const days = [];
  const revenueData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }));
    revenueData.push(Math.floor(3000 + Math.random() * 12000));
  }

  const rCtx = document.getElementById('revenue-chart');
  if (rCtx) {
    revenueChart = new Chart(rCtx, {
      type: 'line',
      data: {
        labels: days,
        datasets: [{
          label: 'Revenue (₹)',
          data: revenueData,
          borderColor: '#f5c842',
          backgroundColor: 'rgba(245,200,66,0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#f5c842',
          pointRadius: 4,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 11 }, callback: v => '₹' + v.toLocaleString('en-IN') } }
        }
      }
    });
  }

  // Occupancy doughnut
  const available   = rooms.filter(r => r.status === 'available').length;
  const occupied    = rooms.filter(r => r.status === 'occupied').length;
  const maintenance = rooms.filter(r => r.status === 'maintenance').length;

  const oCtx = document.getElementById('occupancy-chart');
  if (oCtx) {
    occupancyChart = new Chart(oCtx, {
      type: 'doughnut',
      data: {
        labels: ['Available', 'Occupied', 'Maintenance'],
        datasets: [{
          data: [available, occupied, maintenance],
          backgroundColor: ['#10b981', '#ef4444', '#f5c842'],
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', font: { size: 12 }, padding: 16 }
          }
        }
      }
    });
  }
}
