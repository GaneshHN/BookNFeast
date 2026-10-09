/**
 * reports.js — Hotel & Restaurant summary reports
 */

let reportBarChart = null;
let reportPieChart = null;

function renderReports(container) {
  container.innerHTML = `
    <div class="page-header">
      <div><h2>Reports</h2><div class="page-header-sub">Business analytics & summaries</div></div>
    </div>
    <div class="tabs">
      <button class="tab-btn active" data-rtab="hotel">🏨 Hotel Report</button>
      <button class="tab-btn" data-rtab="restaurant">🍽️ Restaurant Report</button>
      <button class="tab-btn" data-rtab="summary">📊 Full Summary</button>
    </div>
    <div id="report-content"></div>
  `;

  container.querySelectorAll('.tab-btn[data-rtab]').forEach(b => {
    b.onclick = () => {
      container.querySelectorAll('.tab-btn[data-rtab]').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      renderReportTab(b.dataset.rtab);
    };
  });

  renderReportTab('hotel');
}

function renderReportTab(tab) {
  const rc = document.getElementById('report-content');
  if (!rc) return;

  if (reportBarChart) { reportBarChart.destroy(); reportBarChart = null; }
  if (reportPieChart) { reportPieChart.destroy(); reportPieChart = null; }

  if (tab === 'hotel') renderHotelReport(rc);
  else if (tab === 'restaurant') renderRestaurantReport(rc);
  else renderSummaryReport(rc);
}

function renderHotelReport(rc) {
  const rooms    = DB.getAll('rooms');
  const bookings = DB.getAll('bookings');
  const guests   = DB.getAll('guests');

  const totalRooms     = rooms.length;
  const availableRooms = rooms.filter(r => r.status === 'available').length;
  const occupiedRooms  = rooms.filter(r => r.status === 'occupied').length;
  const maintRooms     = rooms.filter(r => r.status === 'maintenance').length;

  const checkedOut = bookings.filter(b => b.status === 'checked-out');
  const totalRev   = checkedOut.reduce((s,b) => s+(b.amount||0), 0);
  const activeBook = bookings.filter(b => b.status==='checked-in').length;
  const confirmed  = bookings.filter(b => b.status==='confirmed').length;

  // Type breakdown
  const typeCount = {};
  rooms.forEach(r => { typeCount[r.type] = (typeCount[r.type]||0)+1; });

  rc.innerHTML = `
    <div class="stats-grid" style="margin-bottom:24px;">
      <div class="stat-card gold"><div class="stat-icon">💰</div><div class="stat-value">${formatCurrency(totalRev)}</div><div class="stat-label">Hotel Revenue</div></div>
      <div class="stat-card blue"><div class="stat-icon">🛏️</div><div class="stat-value">${totalRooms}</div><div class="stat-label">Total Rooms</div></div>
      <div class="stat-card green"><div class="stat-icon">✅</div><div class="stat-value">${availableRooms}</div><div class="stat-label">Available</div></div>
      <div class="stat-card red"><div class="stat-icon">🔴</div><div class="stat-value">${occupiedRooms}</div><div class="stat-label">Occupied</div></div>
      <div class="stat-card purple"><div class="stat-icon">📅</div><div class="stat-value">${activeBook+confirmed}</div><div class="stat-label">Active Bookings</div></div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-title" style="margin-bottom:16px;">Bookings by Status</div>
        <div class="chart-box"><canvas id="hotel-bar-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:16px;">Room Type Distribution</div>
        <div class="chart-box"><canvas id="hotel-pie-chart"></canvas></div>
      </div>
    </div>
    <div class="card" style="margin-top:20px;padding:0;overflow:hidden;">
      <div style="padding:16px 20px;border-bottom:1px solid var(--border);font-weight:700;">Recent Bookings</div>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Guest</th><th>Room</th><th>Check-In</th><th>Check-Out</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            ${bookings.slice(0,10).map(b=>`
              <tr>
                <td>${b.guestName}</td>
                <td>Room ${b.roomNumber}</td>
                <td>${formatDate(b.checkIn)}</td>
                <td>${formatDate(b.checkOut)}</td>
                <td style="color:var(--gold);font-weight:600;">${formatCurrency(b.amount)}</td>
                <td>${statusBadge(b.status)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const statusCounts = ['confirmed','checked-in','checked-out','cancelled'].map(s => bookings.filter(b=>b.status===s).length);
  setTimeout(() => {
    const bc = document.getElementById('hotel-bar-chart');
    if (bc) {
      reportBarChart = new Chart(bc, {
        type: 'bar',
        data: {
          labels: ['Confirmed','Checked-In','Checked-Out','Cancelled'],
          datasets: [{ label: 'Bookings', data: statusCounts,
            backgroundColor: ['rgba(59,130,246,0.7)','rgba(16,185,129,0.7)','rgba(245,200,66,0.7)','rgba(239,68,68,0.7)'],
            borderRadius: 6 }]
        },
        options: { responsive:true, maintainAspectRatio:false,
          plugins:{legend:{display:false}},
          scales:{ x:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#94a3b8'}},
                   y:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#94a3b8',stepSize:1}} }
        }
      });
    }
    const pc = document.getElementById('hotel-pie-chart');
    if (pc) {
      reportPieChart = new Chart(pc, {
        type: 'pie',
        data: {
          labels: Object.keys(typeCount),
          datasets: [{ data: Object.values(typeCount),
            backgroundColor: ['rgba(245,200,66,0.8)','rgba(59,130,246,0.8)','rgba(16,185,129,0.8)','rgba(139,92,246,0.8)'],
            borderWidth: 0 }]
        },
        options: { responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ position:'bottom', labels:{ color:'#94a3b8', padding:12, font:{size:12} } } }
        }
      });
    }
  }, 80);
}

function renderRestaurantReport(rc) {
  const orders   = DB.getAll('orders');
  const menu     = DB.getAll('menuItems');
  const tables   = DB.getAll('tables');

  const completed = orders.filter(o => o.status==='completed');
  const totalRev  = completed.reduce((s,o) => s+(o.total||0), 0);
  const totalOrds = orders.length;
  const active    = orders.filter(o => o.status==='active').length;

  // Item popularity
  const itemCount = {};
  orders.forEach(o => o.items.forEach(i => {
    itemCount[i.name] = (itemCount[i.name]||0) + i.qty;
  }));
  const topItems = Object.entries(itemCount).sort((a,b)=>b[1]-a[1]).slice(0,6);

  rc.innerHTML = `
    <div class="stats-grid" style="margin-bottom:24px;">
      <div class="stat-card gold"><div class="stat-icon">💰</div><div class="stat-value">${formatCurrency(totalRev)}</div><div class="stat-label">Restaurant Revenue</div></div>
      <div class="stat-card blue"><div class="stat-icon">🧾</div><div class="stat-value">${totalOrds}</div><div class="stat-label">Total Orders</div></div>
      <div class="stat-card green"><div class="stat-icon">✅</div><div class="stat-value">${completed.length}</div><div class="stat-label">Completed</div></div>
      <div class="stat-card purple"><div class="stat-icon">🍽️</div><div class="stat-value">${menu.length}</div><div class="stat-label">Menu Items</div></div>
      <div class="stat-card red"><div class="stat-icon">🪑</div><div class="stat-value">${tables.length}</div><div class="stat-label">Tables</div></div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-title" style="margin-bottom:16px;">Top Selling Items</div>
        <div class="chart-box"><canvas id="rest-bar-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:4px;">Menu by Category</div>
        <div class="card-subtitle" style="margin-bottom:16px;">Item count per category</div>
        <div class="chart-box"><canvas id="rest-pie-chart"></canvas></div>
      </div>
    </div>
    <div class="card" style="margin-top:20px;">
      <div style="font-weight:700;margin-bottom:14px;">Top Items by Quantity Sold</div>
      ${topItems.length ? topItems.map(([name,qty],i)=>`
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
          <span style="width:20px;color:var(--text-muted);font-size:0.8rem;font-weight:600;">#${i+1}</span>
          <span style="flex:1;font-size:0.9rem;">${name}</span>
          <div style="flex:2;background:rgba(255,255,255,0.06);border-radius:100px;height:8px;">
            <div style="width:${Math.min(100,Math.round(qty/topItems[0][1]*100))}%;background:var(--gold);height:8px;border-radius:100px;transition:width 0.5s;"></div>
          </div>
          <span style="font-size:0.85rem;font-weight:600;color:var(--gold);min-width:30px;text-align:right;">${qty}</span>
        </div>
      `).join('') : `<div style="color:var(--text-muted);font-size:0.85rem;">No orders yet</div>`}
    </div>
  `;

  const catCount = {};
  menu.forEach(m => { catCount[m.category] = (catCount[m.category]||0)+1; });

  setTimeout(() => {
    const bc = document.getElementById('rest-bar-chart');
    if (bc && topItems.length) {
      reportBarChart = new Chart(bc, {
        type: 'bar',
        data: {
          labels: topItems.map(([n])=>n),
          datasets: [{ label:'Qty Sold', data: topItems.map(([,q])=>q),
            backgroundColor:'rgba(245,200,66,0.7)', borderRadius:6 }]
        },
        options:{ responsive:true, maintainAspectRatio:false,
          plugins:{legend:{display:false}},
          scales:{ x:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#94a3b8',font:{size:10}}},
                   y:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#94a3b8'}} }
        }
      });
    }
    const pc = document.getElementById('rest-pie-chart');
    if (pc && Object.keys(catCount).length) {
      reportPieChart = new Chart(pc, {
        type: 'doughnut',
        data: {
          labels: Object.keys(catCount),
          datasets:[{ data:Object.values(catCount),
            backgroundColor:['rgba(245,200,66,0.8)','rgba(59,130,246,0.8)','rgba(16,185,129,0.8)','rgba(139,92,246,0.8)','rgba(239,68,68,0.8)','rgba(245,158,11,0.8)'],
            borderWidth:0 }]
        },
        options:{ responsive:true, maintainAspectRatio:false, cutout:'60%',
          plugins:{legend:{position:'bottom',labels:{color:'#94a3b8',padding:10,font:{size:11}}}}
        }
      });
    }
  }, 80);
}

function renderSummaryReport(rc) {
  const bookings = DB.getAll('bookings');
  const orders   = DB.getAll('orders');
  const rooms    = DB.getAll('rooms');
  const staff    = DB.getAll('staff');
  const guests   = DB.getAll('guests');
  const menu     = DB.getAll('menuItems');
  const tables   = DB.getAll('tables');

  const hotelRev = bookings.filter(b=>b.status==='checked-out').reduce((s,b)=>s+(b.amount||0),0);
  const restRev  = orders.filter(o=>o.status==='completed').reduce((s,o)=>s+(o.total||0),0);
  const totalRev = hotelRev + restRev;
  const salaries = staff.reduce((s,st)=>s+(st.salary||0),0);
  const profit   = totalRev - salaries;

  rc.innerHTML = `
    <div class="stats-grid" style="margin-bottom:24px;">
      <div class="stat-card gold"><div class="stat-icon">💰</div><div class="stat-value">${formatCurrency(totalRev)}</div><div class="stat-label">Total Revenue</div></div>
      <div class="stat-card red"><div class="stat-icon">💸</div><div class="stat-value">${formatCurrency(salaries)}</div><div class="stat-label">Staff Payroll</div></div>
      <div class="stat-card green"><div class="stat-icon">📈</div><div class="stat-value">${formatCurrency(profit)}</div><div class="stat-label">Est. Profit</div></div>
    </div>
    <div class="grid-2" style="margin-bottom:20px;">
      <div class="card">
        <div class="card-title" style="margin-bottom:4px;">Hotel Summary</div>
        <table style="width:100%;font-size:0.87rem;margin-top:10px;">
          <tr><td style="padding:8px 0;color:var(--text-secondary);">Total Rooms</td><td style="text-align:right;font-weight:600;">${rooms.length}</td></tr>
          <tr><td style="padding:8px 0;color:var(--text-secondary);">Registered Guests</td><td style="text-align:right;font-weight:600;">${guests.length}</td></tr>
          <tr><td style="padding:8px 0;color:var(--text-secondary);">Total Bookings</td><td style="text-align:right;font-weight:600;">${bookings.length}</td></tr>
          <tr><td style="padding:8px 0;color:var(--text-secondary);">Checked-Out</td><td style="text-align:right;font-weight:600;">${bookings.filter(b=>b.status==='checked-out').length}</td></tr>
          <tr><td style="padding:8px 0;color:var(--text-secondary);border-top:1px solid var(--border);">Hotel Revenue</td><td style="text-align:right;font-weight:700;color:var(--gold);border-top:1px solid var(--border);">${formatCurrency(hotelRev)}</td></tr>
        </table>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:4px;">Restaurant Summary</div>
        <table style="width:100%;font-size:0.87rem;margin-top:10px;">
          <tr><td style="padding:8px 0;color:var(--text-secondary);">Menu Items</td><td style="text-align:right;font-weight:600;">${menu.length}</td></tr>
          <tr><td style="padding:8px 0;color:var(--text-secondary);">Total Tables</td><td style="text-align:right;font-weight:600;">${tables.length}</td></tr>
          <tr><td style="padding:8px 0;color:var(--text-secondary);">Total Orders</td><td style="text-align:right;font-weight:600;">${orders.length}</td></tr>
          <tr><td style="padding:8px 0;color:var(--text-secondary);">Completed Orders</td><td style="text-align:right;font-weight:600;">${orders.filter(o=>o.status==='completed').length}</td></tr>
          <tr><td style="padding:8px 0;color:var(--text-secondary);border-top:1px solid var(--border);">Restaurant Revenue</td><td style="text-align:right;font-weight:700;color:var(--gold);border-top:1px solid var(--border);">${formatCurrency(restRev)}</td></tr>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:4px;">Staff Payroll Summary</div>
      <div class="table-wrapper" style="margin-top:10px;">
        <table>
          <thead><tr><th>Department</th><th>Count</th><th>Total Payroll</th></tr></thead>
          <tbody>
            ${['Hotel','Restaurant'].map(dept=>{
              const dept_staff = staff.filter(s=>s.department===dept);
              const dept_pay = dept_staff.reduce((s,st)=>s+(st.salary||0),0);
              return `<tr>
                <td>${dept}</td>
                <td>${dept_staff.length}</td>
                <td style="color:var(--gold);font-weight:600;">${formatCurrency(dept_pay)}</td>
              </tr>`;
            }).join('')}
            <tr style="font-weight:700;">
              <td>Total</td>
              <td>${staff.length}</td>
              <td style="color:var(--gold);">${formatCurrency(salaries)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}
