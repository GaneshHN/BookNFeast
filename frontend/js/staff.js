/**
 * staff.js — Staff management
 */

function renderStaff(container) {
  let search = '';
  let deptFilter = '';

  function draw() {
    let staff = DB.getAll('staff').sort((a,b) => String(a.name || '').localeCompare(String(b.name || '')));
    if (search) {
      const q = search.toLowerCase();
      staff = staff.filter(s =>
        String(s.name || '').toLowerCase().includes(q) ||
        String(s.role || '').toLowerCase().includes(q)
      );
    }
    if (deptFilter) staff = staff.filter(s => s.department === deptFilter);

    const total  = DB.count('staff');
    const hotel  = DB.count('staff', s => s.department === 'Hotel');
    const rest   = DB.count('staff', s => s.department === 'Restaurant');

    container.innerHTML = `
      <div class="page-header">
        <div><h2>Staff</h2><div class="page-header-sub">${total} total staff members</div></div>
        <button class="btn btn-primary" id="add-staff-btn">+ Add Staff</button>
      </div>
      <div class="stats-grid" style="margin-bottom:20px;">
        <div class="stat-card blue"><div class="stat-icon">👥</div><div class="stat-value">${total}</div><div class="stat-label">Total Staff</div></div>
        <div class="stat-card gold"><div class="stat-icon">🏨</div><div class="stat-value">${hotel}</div><div class="stat-label">Hotel Dept</div></div>
        <div class="stat-card green"><div class="stat-icon">🍽️</div><div class="stat-value">${rest}</div><div class="stat-label">Restaurant Dept</div></div>
      </div>
      <div class="filter-bar">
        <input type="text" id="staff-search" placeholder="🔍 Search by name or role..." value="${search}">
        <select id="staff-dept-filter">
          <option value="">All Departments</option>
          <option value="Hotel" ${deptFilter==='Hotel'?'selected':''}>Hotel</option>
          <option value="Restaurant" ${deptFilter==='Restaurant'?'selected':''}>Restaurant</option>
        </select>
      </div>
      <div class="card" style="padding:0;overflow:hidden;">
        <div class="table-wrapper">
          <table>
            <thead><tr>
              <th>Name</th><th>Role</th><th>Department</th><th>Shift</th><th>Phone</th><th>Salary</th><th>Since</th><th>Actions</th>
            </tr></thead>
            <tbody>
              ${staff.length ? staff.map(s => {
                const name = s.name || 'Unnamed Staff';
                const role = s.role || 'Staff';
                const department = s.department || 'Hotel';
                const shift = s.shift || 'Morning';
                return `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                      <div class="user-avatar" style="width:30px;height:30px;font-size:0.75rem;">${name[0]}</div>
                      <strong>${name}</strong>
                    </div>
                  </td>
                  <td>${role}</td>
                  <td><span class="badge ${department==='Hotel'?'badge-blue':'badge-green'}">${department}</span></td>
                  <td>
                    <span class="badge ${shift==='Morning'?'badge-yellow':shift==='Evening'?'badge-purple':'badge-gray'}">${shift}</span>
                  </td>
                  <td style="color:var(--text-secondary);">${s.phone || '—'}</td>
                  <td style="color:var(--gold);font-weight:600;">${formatCurrency(s.salary || 0)}</td>
                  <td style="color:var(--text-muted);font-size:0.8rem;">${formatDate(s.joinDate||s.createdAt)}</td>
                  <td>
                    <div style="display:flex;gap:6px;">
                      <button class="btn btn-secondary btn-sm btn-icon staff-edit-btn" data-id="${s.id}">✏️</button>
                      <button class="btn btn-danger btn-sm btn-icon staff-delete-btn" data-id="${s.id}" data-name="${name}">🗑️</button>
                    </div>
                  </td>
                </tr>
              `}).join('') : `<tr><td colspan="8">${emptyState('👥','No staff found','Add your first staff member')}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('add-staff-btn').onclick = () => openStaffModal();
    document.getElementById('staff-search').oninput = e => { search = e.target.value; draw(); };
    document.getElementById('staff-dept-filter').onchange = e => { deptFilter = e.target.value; draw(); };
    container.querySelectorAll('.staff-edit-btn').forEach(b => b.onclick = () => openStaffModal(b.dataset.id));
    container.querySelectorAll('.staff-delete-btn').forEach(b => b.onclick = () =>
      confirmAction(`Remove ${b.dataset.name} from staff?`, () => {
        DB.remove('staff', b.dataset.id); toast('Staff removed', 'success'); draw();
      })
    );
  }
  draw();
}

function openStaffModal(id) {
  const s = id ? DB.getById('staff', id) : {};
  Modal.open({
    title: id ? 'Edit Staff Member' : 'Add Staff Member',
    body: `
      <div class="form-group"><label>Full Name *</label><input id="sf-name" value="${s.name||''}" placeholder="Employee name"></div>
      <div class="form-row">
        <div class="form-group"><label>Role *</label>
          <select id="sf-role">
            ${['Manager','Receptionist','Waiter','Chef','Housekeeping','Security','Accountant','Driver','Helper'].map(r=>`<option ${s.role===r?'selected':''}>${r}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Department *</label>
          <select id="sf-dept">
            <option ${s.department==='Hotel'?'selected':''}>Hotel</option>
            <option ${s.department==='Restaurant'?'selected':''}>Restaurant</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Shift</label>
          <select id="sf-shift">
            <option ${s.shift==='Morning'?'selected':''}>Morning</option>
            <option ${s.shift==='Evening'?'selected':''}>Evening</option>
            <option ${s.shift==='Night'?'selected':''}>Night</option>
          </select>
        </div>
        <div class="form-group"><label>Salary (₹/month)</label><input id="sf-sal" type="number" value="${s.salary||0}" min="0"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Phone *</label><input id="sf-phone" value="${s.phone||''}" placeholder="9876543210"></div>
        <div class="form-group"><label>Join Date</label><input id="sf-join" type="date" value="${s.joinDate||new Date().toISOString().slice(0,10)}"></div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
      <button class="btn btn-primary" id="save-sf-btn">${id?'Update':'Add Staff'}</button>
    `
  });
  setTimeout(() => {
    document.getElementById('save-sf-btn').onclick = () => {
      const name  = document.getElementById('sf-name').value.trim();
      const role  = document.getElementById('sf-role').value;
      const dept  = document.getElementById('sf-dept').value;
      const shift = document.getElementById('sf-shift').value;
      const salary = +document.getElementById('sf-sal').value;
      const phone = document.getElementById('sf-phone').value.trim();
      const joinDate = document.getElementById('sf-join').value;
      if (!name || !phone) return toast('Name and phone are required', 'error');
      if (id) {
        DB.update('staff', id, { name, role, department: dept, shift, salary, phone, joinDate });
        toast('Staff updated', 'success');
      } else {
        DB.insert('staff', { name, role, department: dept, shift, salary, phone, joinDate });
        DB.logActivity('👥', `New staff: ${name} (${role})`, 'blue');
        toast('Staff added', 'success');
      }
      Modal.close();
      renderStaff(document.getElementById('page-content'));
    };
  }, 50);
}
