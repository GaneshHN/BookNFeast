function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function buildSeedRecords() {
  const records = [];
  const now = new Date();

  function add(collection, data) {
    const record = { ...data, id: uid(), createdAt: new Date().toISOString() };
    records.push({ collection, record });
    return record;
  }

  const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Presidential'];
  const floors = [1, 2, 3];
  const statuses = ['available', 'occupied', 'maintenance'];
  let rn = 101;
  const rooms = [];
  for (const f of floors) {
    for (let i = 0; i < 5; i++) {
      const type = roomTypes[Math.floor(Math.random() * 3)];
      const price = type === 'Standard' ? 2500 : type === 'Deluxe' ? 4500 : 8000;
      rooms.push(add('rooms', {
        number: String(rn++),
        type,
        floor: f,
        capacity: type === 'Suite' ? 4 : 2,
        pricePerNight: price,
        status: i < 3 ? 'available' : statuses[i - 3],
        amenities: 'AC, WiFi, TV'
      }));
    }
  }

  const guestData = [
    { name: 'Arjun Mehta', email: 'arjun@email.com', phone: '9876543210', idType: 'Aadhaar', idNumber: 'XXXX1234' },
    { name: 'Priya Sharma', email: 'priya@email.com', phone: '9123456780', idType: 'Passport', idNumber: 'P7654321' },
    { name: 'Ravi Kumar', email: 'ravi@email.com', phone: '9988776655', idType: 'Driving License', idNumber: 'DL9876543' },
    { name: 'Meera Nair', email: 'meera@email.com', phone: '9001122334', idType: 'Aadhaar', idNumber: 'XXXX5678' },
    { name: 'Suresh Babu', email: 'suresh@email.com', phone: '9345678901', idType: 'Passport', idNumber: 'P1234567' },
    { name: 'Divya Patel', email: 'divya@email.com', phone: '9012345678', idType: 'Aadhaar', idNumber: 'XXXX8765' },
    { name: 'Amit Joshi', email: 'amit@email.com', phone: '9090909090', idType: 'Driving License', idNumber: 'DL1234987' },
    { name: 'Fatima Khan', email: 'fatima@email.com', phone: '9080706050', idType: 'Passport', idNumber: 'P2345678' },
    { name: 'Kiran Rao', email: 'kiran@email.com', phone: '9078563412', idType: 'Aadhaar', idNumber: 'XXXX4321' },
    { name: 'Manoj Pillai', email: 'manoj@email.com', phone: '9065432187', idType: 'Passport', idNumber: 'P8765432' }
  ];
  const guests = guestData.map(g => add('guests', g));

  const today = new Date(now);
  const fmt = d => d.toISOString().slice(0, 10);
  add('bookings', {
    guestId: guests[0].id, guestName: guests[0].name,
    roomId: rooms[0].id, roomNumber: rooms[0].number,
    checkIn: fmt(today), checkOut: fmt(new Date(today.getTime() + 3 * 86400000)),
    nights: 3, amount: rooms[0].pricePerNight * 3,
    status: 'checked-in', adults: 2, children: 0, notes: ''
  });
  add('bookings', {
    guestId: guests[1].id, guestName: guests[1].name,
    roomId: rooms[2].id, roomNumber: rooms[2].number,
    checkIn: fmt(new Date(today.getTime() + 86400000)),
    checkOut: fmt(new Date(today.getTime() + 4 * 86400000)),
    nights: 3, amount: rooms[2].pricePerNight * 3,
    status: 'confirmed', adults: 1, children: 0, notes: 'Late check-in'
  });
  add('bookings', {
    guestId: guests[2].id, guestName: guests[2].name,
    roomId: rooms[3].id, roomNumber: rooms[3].number,
    checkIn: fmt(new Date(today.getTime() + 2 * 86400000)),
    checkOut: fmt(new Date(today.getTime() + 5 * 86400000)),
    nights: 3, amount: rooms[3].pricePerNight * 3,
    status: 'checked-in', adults: 2, children: 1, notes: 'Family room'
  });
  add('bookings', {
    guestId: guests[3].id, guestName: guests[3].name,
    roomId: rooms[4].id, roomNumber: rooms[4].number,
    checkIn: fmt(new Date(today.getTime() + 3 * 86400000)),
    checkOut: fmt(new Date(today.getTime() + 6 * 86400000)),
    nights: 3, amount: rooms[4].pricePerNight * 3,
    status: 'confirmed', adults: 1, children: 0, notes: ''
  });
  add('bookings', {
    guestId: guests[4].id, guestName: guests[4].name,
    roomId: rooms[5].id, roomNumber: rooms[5].number,
    checkIn: fmt(new Date(today.getTime() + 4 * 86400000)),
    checkOut: fmt(new Date(today.getTime() + 7 * 86400000)),
    nights: 3, amount: rooms[5].pricePerNight * 3,
    status: 'cancelled', adults: 2, children: 2, notes: 'Cancelled by guest'
  });
  add('bookings', {
    guestId: guests[5].id, guestName: guests[5].name,
    roomId: rooms[6].id, roomNumber: rooms[6].number,
    checkIn: fmt(new Date(today.getTime() + 5 * 86400000)),
    checkOut: fmt(new Date(today.getTime() + 8 * 86400000)),
    nights: 3, amount: rooms[6].pricePerNight * 3,
    status: 'confirmed', adults: 2, children: 0, notes: ''
  });

  const menuData = [
    { name: 'Masala Dosa', category: 'Breakfast', price: 120, available: true, description: 'Crispy dosa with sambar' },
    { name: 'Idli Sambar', category: 'Breakfast', price: 80, available: true, description: '4 idlis with sambar & chutney' },
    { name: 'Pongal', category: 'Breakfast', price: 110, available: true, description: 'Ghee pongal with coconut chutney' },
    { name: 'Aloo Paratha', category: 'Breakfast', price: 130, available: true, description: 'Stuffed wheat flatbread with curd' },
    { name: 'Tomato Soup', category: 'Soups', price: 110, available: true, description: 'Creamy tomato soup with herbs' },
    { name: 'Sweet Corn Soup', category: 'Soups', price: 120, available: true, description: 'Classic sweet corn vegetable soup' },
    { name: 'Paneer Tikka', category: 'Starters', price: 260, available: true, description: 'Chargrilled paneer with peppers' },
    { name: 'Chicken 65', category: 'Starters', price: 280, available: true, description: 'Crispy spicy South Indian chicken' },
    { name: 'Veg Biryani', category: 'Main Course', price: 220, available: true, description: 'Fragrant basmati rice' },
    { name: 'Chicken Biryani', category: 'Main Course', price: 280, available: true, description: 'Hyderabadi style' },
    { name: 'Paneer Butter Masala', category: 'Main Course', price: 240, available: true, description: 'Rich tomato gravy' },
    { name: 'Dal Tadka', category: 'Main Course', price: 160, available: true, description: 'Yellow dal with tadka' },
    { name: 'Gulab Jamun', category: 'Dessert', price: 90, available: true, description: '2 pieces with sugar syrup' },
    { name: 'Ice Cream', category: 'Dessert', price: 110, available: true, description: 'Vanilla / Chocolate / Strawberry' },
    { name: 'Fresh Lime Soda', category: 'Beverages', price: 70, available: true, description: 'Sweet / Salted / Mix' },
    { name: 'Masala Chai', category: 'Beverages', price: 50, available: true, description: 'Ginger & cardamom tea' },
    { name: 'Cold Coffee', category: 'Beverages', price: 120, available: true, description: 'With ice cream' },
    { name: 'Naan', category: 'Breads', price: 40, available: true, description: 'Tandoor baked' },
    { name: 'Roti', category: 'Breads', price: 25, available: true, description: 'Whole wheat' },
    { name: 'Butter Chicken', category: 'Main Course', price: 320, available: true, description: 'Creamy tomato chicken curry' },
    { name: 'Fish Curry', category: 'Main Course', price: 350, available: true, description: 'Spicy coastal fish curry' },
    { name: 'Veg Pulao', category: 'Main Course', price: 180, available: true, description: 'Mildly spiced rice with veggies' },
    { name: 'Samosa', category: 'Snacks', price: 40, available: true, description: '2 pieces, potato filling' },
    { name: 'Spring Roll', category: 'Snacks', price: 60, available: true, description: 'Veg spring rolls' },
    { name: 'Brownie', category: 'Dessert', price: 100, available: true, description: 'Chocolate walnut brownie' },
    { name: 'Kulfi', category: 'Dessert', price: 100, available: true, description: 'Traditional frozen malai dessert' },
    { name: 'Lassi', category: 'Beverages', price: 90, available: true, description: 'Sweet / Salted' },
    { name: 'Mango Lassi', category: 'Beverages', price: 120, available: true, description: 'Thick mango yogurt cooler' }
  ];
  const menuItems = menuData.map(m => add('menuItems', m));
  const menuByName = Object.fromEntries(menuItems.map(item => [item.name, item]));

  const tables = [];
  for (let i = 1; i <= 20; i++) {
    tables.push(add('tables', {
      number: i,
      capacity: i <= 4 ? 2 : i <= 12 ? 4 : 6,
      status: i <= 14 ? 'available' : i === 15 ? 'occupied' : 'reserved',
      section: i <= 10 ? 'Indoor' : 'Outdoor'
    }));
  }

  add('orders', {
    tableId: tables[8].id, tableNumber: tables[8].number,
    items: [
      { menuId: menuByName['Veg Biryani'].id, name: menuByName['Veg Biryani'].name, price: menuByName['Veg Biryani'].price, qty: 2 },
      { menuId: menuByName['Naan'].id, name: menuByName['Naan'].name, price: menuByName['Naan'].price, qty: 4 },
      { menuId: menuByName['Masala Chai'].id, name: menuByName['Masala Chai'].name, price: menuByName['Masala Chai'].price, qty: 2 }
    ],
    subtotal: 2 * 220 + 4 * 40 + 2 * 50,
    tax: Math.round((2 * 220 + 4 * 40 + 2 * 50) * 0.05),
    total: Math.round((2 * 220 + 4 * 40 + 2 * 50) * 1.05),
    status: 'active', waiter: 'Ramesh'
  });

  const staffData = [
    { name: 'Rajesh Kumar', role: 'Manager', department: 'Hotel', shift: 'Morning', phone: '9000011111', salary: 45000, joinDate: '2022-03-15' },
    { name: 'Sunita Devi', role: 'Receptionist', department: 'Hotel', shift: 'Morning', phone: '9000022222', salary: 22000, joinDate: '2023-01-10' },
    { name: 'Ramesh Pillai', role: 'Waiter', department: 'Restaurant', shift: 'Evening', phone: '9000033333', salary: 18000, joinDate: '2023-06-20' },
    { name: 'Anita Bose', role: 'Chef', department: 'Restaurant', shift: 'Morning', phone: '9000044444', salary: 35000, joinDate: '2021-11-05' },
    { name: 'Vikram Singh', role: 'Housekeeping', department: 'Hotel', shift: 'Night', phone: '9000055555', salary: 16000, joinDate: '2024-02-28' },
    { name: 'Neha Sinha', role: 'Front Desk', department: 'Hotel', shift: 'Evening', phone: '9000066666', salary: 21000, joinDate: '2023-09-12' },
    { name: 'Sanjay Rao', role: 'Security', department: 'Hotel', shift: 'Night', phone: '9000077777', salary: 17000, joinDate: '2022-12-01' },
    { name: 'Pooja Menon', role: 'Waitress', department: 'Restaurant', shift: 'Morning', phone: '9000088888', salary: 18500, joinDate: '2024-01-15' },
    { name: 'Deepak Jain', role: 'Chef', department: 'Restaurant', shift: 'Evening', phone: '9000099999', salary: 34000, joinDate: '2022-07-22' },
    { name: 'Asha Thomas', role: 'Housekeeping', department: 'Hotel', shift: 'Morning', phone: '9000101010', salary: 15500, joinDate: '2023-05-30' }
  ];
  staffData.forEach(s => add('staff', s));

  add('activity', { icon: '🏨', message: 'Room 101 checked in by Arjun Mehta', type: 'blue', time: now.toISOString() });
  add('activity', { icon: '🍽️', message: 'Order placed for Table 9', type: 'gold', time: now.toISOString() });
  add('activity', { icon: '📅', message: 'New booking: Priya Sharma — Room 103', type: 'green', time: now.toISOString() });
  add('activity', { icon: '👤', message: 'New guest registered: Ravi Kumar', type: 'blue', time: now.toISOString() });
  add('activity', { icon: '🧹', message: 'Room 105 marked for maintenance', type: 'red', time: now.toISOString() });
  add('activity', { icon: '👩‍🍳', message: 'Chef Anita Bose joined the team', type: 'blue', time: now.toISOString() });
  add('activity', { icon: '🛎️', message: 'Front Desk: Neha Sinha started evening shift', type: 'gold', time: now.toISOString() });
  add('activity', { icon: '🍰', message: 'Brownie dessert added to menu', type: 'green', time: now.toISOString() });

  return records;
}

module.exports = { buildSeedRecords, uid };
