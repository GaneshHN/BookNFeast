function renderHome(container) {
  const rooms = DB.getAll('rooms');
  const guests = DB.getAll('guests');
  const bookings = DB.getAll('bookings');
  const orders = DB.getAll('orders');

  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const occupancyPct = rooms.length ? Math.round((occupiedRooms / rooms.length) * 100) : 0;
  const activeOrders = orders.filter(o => o.status === 'active').length;
  const upcomingCheckins = bookings.filter(b => ['confirmed', 'checked-in'].includes(b.status)).length;
  const maintenanceRooms = rooms.filter(r => r.status === 'maintenance').length;
  const staff = DB.getAll('staff');
  const tables = DB.getAll('tables');
  const readyTables = tables.filter(t => t.status === 'available').length;

  container.innerHTML = `
    <section class="home-hero">
      <div class="home-hero-left">
        <div class="home-brand">
          <img class="home-logo" src="../assets/booknfeast-logo.svg" alt="BookNFeast logo" />
          <div class="home-brand-text">
            <div class="home-title">BookNFeast</div>
            <div class="home-tagline">Book your stay, feast your way</div>
          </div>
        </div>
        <div class="home-eyebrow">Hotel and Restaurant Platform</div>
        <h2 class="home-headline">Run rooms, dining, and staff from a single command center.</h2>
        <p class="home-subtext">Live bookings, menu updates, and staff rosters stay in sync with SQL-powered storage so your team always works with current data.</p>
        <div class="home-actions">
          <button class="btn btn-primary home-cta" data-page="dashboard">Open Dashboard</button>
          <button class="btn btn-secondary home-cta" data-page="bookings">Create Booking</button>
        </div>
        <div class="home-trust">
          <div class="home-pill">${rooms.length} rooms tracked</div>
          <div class="home-pill">${guests.length} guest profiles</div>
          <div class="home-pill">${activeOrders} active orders</div>
        </div>
      </div>
      <div class="home-hero-right">
        <div class="home-glass-card">
          <div class="home-card-title">Today at a glance</div>
          <div class="home-metrics">
            <div>
              <div class="home-metric-label">Occupancy</div>
              <div class="home-metric-value">${occupancyPct}%</div>
            </div>
            <div>
              <div class="home-metric-label">Upcoming check-ins</div>
              <div class="home-metric-value">${upcomingCheckins}</div>
            </div>
            <div>
              <div class="home-metric-label">Active orders</div>
              <div class="home-metric-value">${activeOrders}</div>
            </div>
          </div>
          <div class="home-live">Live data synced to SQL</div>
        </div>
        <div class="home-side-stack">
          <div class="home-mini-card">
            <div class="home-mini-label">Rooms available</div>
            <div class="home-mini-value">${rooms.filter(r => r.status === 'available').length}</div>
          </div>
          <div class="home-mini-card">
            <div class="home-mini-label">Guests checked in</div>
            <div class="home-mini-value">${bookings.filter(b => b.status === 'checked-in').length}</div>
          </div>
        </div>
        <div class="home-command-card">
          <div class="home-card-title">Manager quick scan</div>
          <div class="home-scan-row"><span>Maintenance rooms</span><strong>${maintenanceRooms}</strong></div>
          <div class="home-scan-row"><span>Tables ready</span><strong>${readyTables}</strong></div>
          <div class="home-scan-row"><span>Staff profiles</span><strong>${staff.length}</strong></div>
          <button class="btn btn-primary btn-sm home-command-open">Open Command Center</button>
        </div>
      </div>
    </section>

    <section class="home-ops-strip">
      <div>
        <span>Occupancy</span>
        <strong>${occupancyPct}%</strong>
      </div>
      <div>
        <span>Check-ins</span>
        <strong>${upcomingCheckins}</strong>
      </div>
      <div>
        <span>Active orders</span>
        <strong>${activeOrders}</strong>
      </div>
      <div>
        <span>Data mode</span>
        <strong>${DB.isFallback() ? 'Local' : 'SQL'}</strong>
      </div>
    </section>

    <section class="home-feature-grid">
      <article class="home-feature">
        <div class="home-feature-icon">🛏️</div>
        <h3>Room control</h3>
        <p>Update availability, rates, and amenities in seconds with quick actions.</p>
      </article>
      <article class="home-feature">
        <div class="home-feature-icon">🍽️</div>
        <h3>Menu management</h3>
        <p>Toggle availability and pricing while orders update in real time.</p>
      </article>
      <article class="home-feature">
        <div class="home-feature-icon">👥</div>
        <h3>Team operations</h3>
        <p>Track staff schedules, roles, and department headcount at a glance.</p>
      </article>
    </section>
  `;

  container.querySelectorAll('.home-cta').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.page));
  });
  const commandBtn = container.querySelector('.home-command-open');
  if (commandBtn) commandBtn.addEventListener('click', () => openCommandCenter());
}
