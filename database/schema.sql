CREATE DATABASE IF NOT EXISTS hotel
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE hotel;

ALTER DATABASE hotel
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL
);

CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(32) PRIMARY KEY,
  room_number VARCHAR(20) NOT NULL UNIQUE,
  room_type VARCHAR(50) NOT NULL,
  floor INT NOT NULL DEFAULT 1,
  capacity INT NOT NULL DEFAULT 2,
  price_per_night DECIMAL(10,2) NOT NULL DEFAULT 0,
  status ENUM('available', 'occupied', 'maintenance') NOT NULL DEFAULT 'available',
  amenities TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  INDEX idx_rooms_status (status),
  INDEX idx_rooms_type (room_type)
);

CREATE TABLE IF NOT EXISTS guests (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NULL,
  phone VARCHAR(30) NOT NULL,
  id_type VARCHAR(60) NULL,
  id_number VARCHAR(80) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  INDEX idx_guests_name (name),
  INDEX idx_guests_phone (phone)
);

CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(32) PRIMARY KEY,
  guest_id VARCHAR(32) NULL,
  guest_name VARCHAR(120) NOT NULL,
  room_id VARCHAR(32) NULL,
  room_number VARCHAR(20) NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INT NOT NULL DEFAULT 1,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status ENUM('confirmed', 'checked-in', 'checked-out', 'cancelled') NOT NULL DEFAULT 'confirmed',
  adults INT NOT NULL DEFAULT 1,
  children INT NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  CONSTRAINT fk_bookings_guest FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE SET NULL,
  CONSTRAINT fk_bookings_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
  INDEX idx_bookings_dates (check_in, check_out),
  INDEX idx_bookings_status (status)
);

CREATE TABLE IF NOT EXISTS menu_items (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(140) NOT NULL,
  category VARCHAR(80) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  UNIQUE KEY uq_menu_name (name),
  INDEX idx_menu_category (category),
  INDEX idx_menu_available (available)
);

CREATE TABLE IF NOT EXISTS restaurant_tables (
  id VARCHAR(32) PRIMARY KEY,
  table_number INT NOT NULL UNIQUE,
  capacity INT NOT NULL DEFAULT 2,
  status ENUM('available', 'occupied', 'reserved') NOT NULL DEFAULT 'available',
  section VARCHAR(50) NOT NULL DEFAULT 'Indoor',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  INDEX idx_tables_status (status),
  INDEX idx_tables_section (section)
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(32) PRIMARY KEY,
  table_id VARCHAR(32) NULL,
  table_number INT NULL,
  guest_name VARCHAR(120) NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status ENUM('active', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
  waiter VARCHAR(120) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  CONSTRAINT fk_orders_table FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  INDEX idx_orders_status (status),
  INDEX idx_orders_table (table_id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(32) NOT NULL,
  menu_id VARCHAR(32) NULL,
  name VARCHAR(140) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  qty INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_menu FOREIGN KEY (menu_id) REFERENCES menu_items(id) ON DELETE SET NULL,
  INDEX idx_order_items_order (order_id)
);

CREATE TABLE IF NOT EXISTS staff (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  role VARCHAR(80) NOT NULL,
  department ENUM('Hotel', 'Restaurant') NOT NULL,
  shift ENUM('Morning', 'Evening', 'Night') NOT NULL DEFAULT 'Morning',
  phone VARCHAR(30) NOT NULL,
  salary DECIMAL(10,2) NOT NULL DEFAULT 0,
  join_date DATE NULL,
  status ENUM('on-duty', 'off-duty') NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  INDEX idx_staff_department (department),
  INDEX idx_staff_role (role)
);

CREATE TABLE IF NOT EXISTS activity (
  id VARCHAR(32) PRIMARY KEY,
  icon VARCHAR(20) NOT NULL,
  message VARCHAR(255) NOT NULL,
  type VARCHAR(40) NOT NULL DEFAULT 'blue',
  activity_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  INDEX idx_activity_time (activity_time)
);
