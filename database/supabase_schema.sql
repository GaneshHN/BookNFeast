-- Supabase-compatible PostgreSQL schema for BookNFeast
-- Includes tables, constraints, indexes, RLS policies, auth trigger, and sample seed data.
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Enumerated types for domain values
CREATE TYPE public.app_user_role AS ENUM ('admin', 'manager', 'staff', 'guest');
CREATE TYPE public.app_department AS ENUM ('Hotel', 'Restaurant');
CREATE TYPE public.app_room_status AS ENUM (
    'available',
    'occupied',
    'maintenance',
    'out-of-service'
);
CREATE TYPE public.app_booking_status AS ENUM (
    'confirmed',
    'checked-in',
    'checked-out',
    'cancelled'
);
CREATE TYPE public.app_table_status AS ENUM ('available', 'occupied', 'reserved');
CREATE TYPE public.app_order_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE public.app_invoice_status AS ENUM ('draft', 'issued', 'paid', 'void');
CREATE TYPE public.app_payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE public.app_payment_method AS ENUM ('cash', 'card', 'online', 'room_charge');
CREATE TYPE public.app_shift AS ENUM ('Morning', 'Evening', 'Night');
-- Role helper functions
CREATE OR REPLACE FUNCTION public.current_user_id() RETURNS uuid LANGUAGE SQL SECURITY DEFINER STABLE AS $$
SELECT auth.uid();
$$;
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE SQL SECURITY DEFINER STABLE AS $$
SELECT EXISTS(
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
            AND p.role = 'admin'
    );
$$;
CREATE OR REPLACE FUNCTION public.is_manager() RETURNS boolean LANGUAGE SQL SECURITY DEFINER STABLE AS $$
SELECT EXISTS(
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'manager')
    );
$$;
CREATE OR REPLACE FUNCTION public.is_hotel_staff() RETURNS boolean LANGUAGE SQL SECURITY DEFINER STABLE AS $$
SELECT EXISTS(
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
            AND p.role = 'staff'
            AND p.department = 'Hotel'
    );
$$;
CREATE OR REPLACE FUNCTION public.is_restaurant_staff() RETURNS boolean LANGUAGE SQL SECURITY DEFINER STABLE AS $$
SELECT EXISTS(
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
            AND p.role = 'staff'
            AND p.department = 'Restaurant'
    );
$$;
CREATE OR REPLACE FUNCTION public.is_guest() RETURNS boolean LANGUAGE SQL SECURITY DEFINER STABLE AS $$
SELECT EXISTS(
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
            AND p.role = 'guest'
    );
$$;
-- Profiles and user identity
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    email text NOT NULL UNIQUE,
    phone text,
    role public.app_user_role NOT NULL DEFAULT 'guest',
    department public.app_department,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (
        role <> 'staff'
        OR department IS NOT NULL
    )
);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);
CREATE TABLE IF NOT EXISTS public.staff_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE
    SET NULL,
        position text NOT NULL,
        department public.app_department NOT NULL,
        shift public.app_shift NOT NULL DEFAULT 'Morning',
        phone text,
        salary numeric(12, 2) NOT NULL DEFAULT 0,
        hire_date date,
        status text NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (salary >= 0)
);
CREATE INDEX IF NOT EXISTS idx_staff_members_department ON public.staff_members(department);
CREATE INDEX IF NOT EXISTS idx_staff_members_position ON public.staff_members(position);
CREATE INDEX IF NOT EXISTS idx_staff_members_status ON public.staff_members(status);
CREATE TABLE IF NOT EXISTS public.guests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE
    SET NULL,
        name text NOT NULL,
        email text,
        phone text,
        id_type text,
        id_number text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_guests_name ON public.guests(name);
CREATE INDEX IF NOT EXISTS idx_guests_phone ON public.guests(phone);
CREATE TABLE IF NOT EXISTS public.room_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    capacity int NOT NULL DEFAULT 2,
    default_price numeric(12, 2) NOT NULL DEFAULT 0,
    amenities jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (capacity > 0),
    CHECK (default_price >= 0)
);
CREATE TABLE IF NOT EXISTS public.rooms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    number text NOT NULL UNIQUE,
    room_type_id uuid NOT NULL REFERENCES public.room_types(id),
    floor int NOT NULL DEFAULT 1,
    capacity int NOT NULL DEFAULT 1,
    price_per_night numeric(12, 2) NOT NULL DEFAULT 0,
    status public.app_room_status NOT NULL DEFAULT 'available',
    amenities jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (capacity > 0),
    CHECK (price_per_night >= 0)
);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_room_type ON public.rooms(room_type_id);
CREATE INDEX IF NOT EXISTS idx_rooms_floor ON public.rooms(floor);
CREATE TABLE IF NOT EXISTS public.bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE RESTRICT,
    guest_profile_id uuid REFERENCES public.profiles(id) ON DELETE
    SET NULL,
        room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT,
        check_in date NOT NULL,
        check_out date NOT NULL,
        nights int NOT NULL DEFAULT 1,
        amount numeric(12, 2) NOT NULL DEFAULT 0,
        status public.app_booking_status NOT NULL DEFAULT 'confirmed',
        adults int NOT NULL DEFAULT 1,
        children int NOT NULL DEFAULT 0,
        notes text,
        created_by uuid REFERENCES public.profiles(id),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (check_out > check_in),
        CHECK (nights > 0),
        CHECK (adults >= 0),
        CHECK (children >= 0),
        CHECK (amount >= 0)
);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_room ON public.bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_guest ON public.bookings(guest_id);
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.menu_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    category_id uuid NOT NULL REFERENCES public.menu_categories(id) ON DELETE RESTRICT,
    price numeric(12, 2) NOT NULL DEFAULT 0,
    available boolean NOT NULL DEFAULT true,
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (price >= 0)
);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON public.menu_items(available);
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    number int NOT NULL UNIQUE,
    capacity int NOT NULL DEFAULT 2,
    status public.app_table_status NOT NULL DEFAULT 'available',
    section text NOT NULL DEFAULT 'Indoor',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (capacity > 0)
);
CREATE INDEX IF NOT EXISTS idx_tables_status ON public.restaurant_tables(status);
CREATE INDEX IF NOT EXISTS idx_tables_section ON public.restaurant_tables(section);
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid REFERENCES public.bookings(id) ON DELETE
    SET NULL,
        guest_id uuid REFERENCES public.guests(id) ON DELETE
    SET NULL,
        guest_profile_id uuid REFERENCES public.profiles(id) ON DELETE
    SET NULL,
        table_id uuid REFERENCES public.restaurant_tables(id) ON DELETE
    SET NULL,
        waiter_id uuid REFERENCES public.staff_members(id) ON DELETE
    SET NULL,
        subtotal numeric(12, 2) NOT NULL DEFAULT 0,
        tax numeric(12, 2) NOT NULL DEFAULT 0,
        total numeric(12, 2) NOT NULL DEFAULT 0,
        status public.app_order_status NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (subtotal >= 0),
        CHECK (tax >= 0),
        CHECK (total >= 0)
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_table ON public.orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_guest ON public.orders(guest_id);
CREATE INDEX IF NOT EXISTS idx_orders_booking ON public.orders(booking_id);
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE
    SET NULL,
        name text NOT NULL,
        unit_price numeric(12, 2) NOT NULL DEFAULT 0,
        quantity int NOT NULL DEFAULT 1,
        total_price numeric(12, 2) GENERATED ALWAYS AS (unit_price * quantity) STORED,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (unit_price >= 0),
        CHECK (quantity > 0)
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu ON public.order_items(menu_item_id);
CREATE TABLE IF NOT EXISTS public.invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid REFERENCES public.bookings(id) ON DELETE
    SET NULL,
        order_id uuid REFERENCES public.orders(id) ON DELETE
    SET NULL,
        guest_id uuid REFERENCES public.guests(id) ON DELETE
    SET NULL,
        guest_profile_id uuid REFERENCES public.profiles(id) ON DELETE
    SET NULL,
        issued_at timestamptz NOT NULL DEFAULT now(),
        due_date date,
        subtotal numeric(12, 2) NOT NULL DEFAULT 0,
        tax numeric(12, 2) NOT NULL DEFAULT 0,
        total numeric(12, 2) NOT NULL DEFAULT 0,
        status public.app_invoice_status NOT NULL DEFAULT 'issued',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (subtotal >= 0),
        CHECK (tax >= 0),
        CHECK (total >= 0)
);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_guest ON public.invoices(guest_id);
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    paid_at timestamptz NOT NULL DEFAULT now(),
    method public.app_payment_method NOT NULL DEFAULT 'cash',
    amount numeric(12, 2) NOT NULL DEFAULT 0,
    status public.app_payment_status NOT NULL DEFAULT 'completed',
    transaction_reference text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (amount >= 0)
);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    icon text,
    message text NOT NULL,
    type text NOT NULL DEFAULT 'info',
    activity_time timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES public.profiles(id) ON DELETE
    SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_time ON public.activity_logs(activity_time);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON public.activity_logs(type);
-- Row Level Security activation
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
-- Policies for profiles
CREATE POLICY "Profiles: select own or admin" ON public.profiles FOR
SELECT USING (
        id = auth.uid()
        OR public.is_admin()
    );
CREATE POLICY "Profiles: insert authenticated guests" ON public.profiles FOR
INSERT WITH CHECK (
        id = auth.uid()
        OR public.is_admin()
    );
CREATE POLICY "Profiles: update own or admin" ON public.profiles FOR
UPDATE USING (
        id = auth.uid()
        OR public.is_admin()
    ) WITH CHECK (
        (
            id = auth.uid()
            AND role = 'guest'
        )
        OR public.is_admin()
    );
CREATE POLICY "Profiles: delete admin only" ON public.profiles FOR DELETE USING (public.is_admin());
-- Policies for staff members
CREATE POLICY "Staff: select accessible" ON public.staff_members FOR
SELECT USING (
        public.is_admin()
        OR public.is_manager()
        OR profile_id = auth.uid()
    );
CREATE POLICY "Staff: insert admin or manager" ON public.staff_members FOR
INSERT WITH CHECK (
        public.is_admin()
        OR public.is_manager()
    );
CREATE POLICY "Staff: update admin or manager or self" ON public.staff_members FOR
UPDATE USING (
        public.is_admin()
        OR public.is_manager()
        OR profile_id = auth.uid()
    ) WITH CHECK (
        public.is_admin()
        OR public.is_manager()
        OR profile_id = auth.uid()
    );
CREATE POLICY "Staff: delete admin or manager" ON public.staff_members FOR DELETE USING (
    public.is_admin()
    OR public.is_manager()
);
-- Policies for guests
CREATE POLICY "Guests: select own or hotel operations" ON public.guests FOR
SELECT USING (
        public.is_admin()
        OR public.is_manager()
        OR public.is_hotel_staff()
        OR profile_id = auth.uid()
    );
CREATE POLICY "Guests: insert guest self-service or admin" ON public.guests FOR
INSERT WITH CHECK (
        public.is_admin()
        OR public.is_manager()
        OR profile_id = auth.uid()
    );
CREATE POLICY "Guests: update own or hotel operations" ON public.guests FOR
UPDATE USING (
        public.is_admin()
        OR public.is_manager()
        OR public.is_hotel_staff()
        OR profile_id = auth.uid()
    ) WITH CHECK (
        public.is_admin()
        OR public.is_manager()
        OR public.is_hotel_staff()
        OR profile_id = auth.uid()
    );
CREATE POLICY "Guests: delete admin or manager" ON public.guests FOR DELETE USING (
    public.is_admin()
    OR public.is_manager()
);
-- Policies for rooms and room types
CREATE POLICY "Room types: hotel operations" ON public.room_types FOR
SELECT USING (
        public.is_admin()
        OR public.is_manager()
        OR public.is_hotel_staff()
    );
CREATE POLICY "Room types: hotel management" ON public.room_types FOR
INSERT WITH CHECK (
        public.is_admin()
        OR public.is_manager()
        OR public.is_hotel_staff()
    );
CREATE POLICY "Room types: update hotel management" ON public.room_types FOR
UPDATE USING (
        public.is_admin()
        OR public.is_manager()
        OR public.is_hotel_staff()
    ) WITH CHECK (
        public.is_admin()
        OR public.is_manager()
        OR public.is_hotel_staff()
    );
CREATE POLICY "Room types: delete admin or manager" ON public.room_types FOR DELETE USING (
    public.is_admin()
    OR public.is_manager()
);
CREATE POLICY "Rooms: hotel operations" ON public.rooms FOR
SELECT USING (
        public.is_admin()
        OR public.is_manager()
        OR public.is_hotel_staff()
    );
CREATE POLICY "Rooms: hotel management" ON public.rooms FOR
INSERT WITH CHECK (
        public.is_admin()
        OR public.is_manager()
        OR public.is_hotel_staff()
    );
CREATE POLICY "Rooms: update hotel management" ON public.rooms FOR
UPDATE USING (
        public.is_admin()
        OR public.is_manager()
        OR public.is_hotel_staff()
    ) WITH CHECK (
        public.is_admin()
        OR public.is_manager()
        OR public.is_hotel_staff()
    );
CREATE POLICY "Rooms: delete admin or manager" ON public.rooms FOR DELETE USING (
    public.is_admin()
    OR public.is_manager()
);
-- Policies for bookings
CREATE POLICY "Bookings: select own guests and hotel staff" ON public.bookings FOR
SELECT USING (
        public.is_admin()
        OR public.is_manager()
        OR public.is_hotel_staff()
        OR guest_profile_id = auth.uid()
    );
CREATE POLICY "Bookings: insert guests and hotel staff" ON public.bookings FOR
INSERT WITH CHECK (
        public.is_admin()
        OR public.is_manager()
        OR public.is_hotel_staff()
        OR guest_profile_id = auth.uid()
    );
CREATE POLICY "Bookings: update guests and hotel staff" ON public.bookings FOR
UPDATE USING (
        public.is_admin()
        OR public.is_manager()
        OR public.is_hotel_staff()
        OR guest_profile_id = auth.uid()
    ) WITH CHECK (
        public.is_admin()
        OR public.is_manager()
        OR public.is_hotel_staff()
        OR guest_profile_id = auth.uid()
    );
CREATE POLICY "Bookings: delete admin or manager" ON public.bookings FOR DELETE USING (
    public.is_admin()
    OR public.is_manager()
);
-- Policies for restaurant categories and items
CREATE POLICY "Menu categories: restaurant operations" ON public.menu_categories FOR
SELECT USING (
        public.is_admin()
        OR public.is_manager()
        OR public.is_restaurant_staff()
    );
CREATE POLICY "Menu categories: restaurant management" ON public.menu_categories FOR
INSERT WITH CHECK (
        public.is_admin()
        OR public.is_manager()
        OR public.is_restaurant_staff()
    );
CREATE POLICY "Menu categories: update restaurant management" ON public.menu_categories FOR
UPDATE USING (
        public.is_admin()
        OR public.is_manager()
        OR public.is_restaurant_staff()
    ) WITH CHECK (
        public.is_admin()
        OR public.is_manager()
        OR public.is_restaurant_staff()
    );
CREATE POLICY "Menu categories: delete admin or manager" ON public.menu_categories FOR DELETE USING (
    public.is_admin()
    OR public.is_manager()
);
CREATE POLICY "Menu items: restaurant operations" ON public.menu_items FOR
SELECT USING (
        public.is_admin()
        OR public.is_manager()
        OR public.is_restaurant_staff()
    );
CREATE POLICY "Menu items: restaurant management" ON public.menu_items FOR
INSERT WITH CHECK (
        public.is_admin()
        OR public.is_manager()
        OR public.is_restaurant_staff()
    );
CREATE POLICY "Menu items: update restaurant management" ON public.menu_items FOR
UPDATE USING (
        public.is_admin()
        OR public.is_manager()
        OR public.is_restaurant_staff()
    ) WITH CHECK (
        public.is_admin()
        OR public.is_manager()
        OR public.is_restaurant_staff()
    );
CREATE POLICY "Menu items: delete admin or manager" ON public.menu_items FOR DELETE USING (
    public.is_admin()
    OR public.is_manager()
);
-- Policies for restaurant tables
CREATE POLICY "Restaurant tables: restaurant operations" ON public.restaurant_tables FOR
SELECT USING (
        public.is_admin()
        OR public.is_manager()
        OR public.is_restaurant_staff()
    );
CREATE POLICY "Restaurant tables: restaurant management" ON public.restaurant_tables FOR
INSERT WITH CHECK (
        public.is_admin()
        OR public.is_manager()
        OR public.is_restaurant_staff()
    );
CREATE POLICY "Restaurant tables: update restaurant management" ON public.restaurant_tables FOR
UPDATE USING (
        public.is_admin()
        OR public.is_manager()
        OR public.is_restaurant_staff()
    ) WITH CHECK (
        public.is_admin()
        OR public.is_manager()
        OR public.is_restaurant_staff()
    );
CREATE POLICY "Restaurant tables: delete admin or manager" ON public.restaurant_tables FOR DELETE USING (
    public.is_admin()
    OR public.is_manager()
);
-- Policies for orders and order items
CREATE POLICY "Orders: select own and restaurant staff" ON public.orders FOR
SELECT USING (
        public.is_admin()
        OR public.is_manager()
        OR public.is_restaurant_staff()
        OR guest_profile_id = auth.uid()
    );
CREATE POLICY "Orders: insert own guests and restaurant staff" ON public.orders FOR
INSERT WITH CHECK (
        public.is_admin()
        OR public.is_manager()
        OR public.is_restaurant_staff()
        OR guest_profile_id = auth.uid()
    );
CREATE POLICY "Orders: update own guests and restaurant staff" ON public.orders FOR
UPDATE USING (
        public.is_admin()
        OR public.is_manager()
        OR public.is_restaurant_staff()
        OR guest_profile_id = auth.uid()
    ) WITH CHECK (
        public.is_admin()
        OR public.is_manager()
        OR public.is_restaurant_staff()
        OR guest_profile_id = auth.uid()
    );
CREATE POLICY "Orders: delete admin or manager" ON public.orders FOR DELETE USING (
    public.is_admin()
    OR public.is_manager()
);
CREATE POLICY "Order items: select via order access" ON public.order_items FOR
SELECT USING (
        EXISTS(
            SELECT 1
            FROM public.orders o
            WHERE o.id = public.order_items.order_id
                AND (
                    public.is_admin()
                    OR public.is_manager()
                    OR public.is_restaurant_staff()
                    OR o.guest_profile_id = auth.uid()
                )
        )
    );
CREATE POLICY "Order items: insert via order access" ON public.order_items FOR
INSERT WITH CHECK (
        EXISTS(
            SELECT 1
            FROM public.orders o
            WHERE o.id = public.order_items.order_id
                AND (
                    public.is_admin()
                    OR public.is_manager()
                    OR public.is_restaurant_staff()
                    OR o.guest_profile_id = auth.uid()
                )
        )
    );
CREATE POLICY "Order items: update via order access" ON public.order_items FOR
UPDATE USING (
        EXISTS(
            SELECT 1
            FROM public.orders o
            WHERE o.id = public.order_items.order_id
                AND (
                    public.is_admin()
                    OR public.is_manager()
                    OR public.is_restaurant_staff()
                    OR o.guest_profile_id = auth.uid()
                )
        )
    ) WITH CHECK (
        EXISTS(
            SELECT 1
            FROM public.orders o
            WHERE o.id = public.order_items.order_id
                AND (
                    public.is_admin()
                    OR public.is_manager()
                    OR public.is_restaurant_staff()
                    OR o.guest_profile_id = auth.uid()
                )
        )
    );
CREATE POLICY "Order items: delete admin or manager" ON public.order_items FOR DELETE USING (
    public.is_admin()
    OR public.is_manager()
);
-- Policies for invoices and payments
CREATE POLICY "Invoices: select own and operations" ON public.invoices FOR
SELECT USING (
        public.is_admin()
        OR public.is_manager()
        OR guest_profile_id = auth.uid()
    );
CREATE POLICY "Invoices: insert admin or manager" ON public.invoices FOR
INSERT WITH CHECK (
        public.is_admin()
        OR public.is_manager()
    );
CREATE POLICY "Invoices: update admin or manager" ON public.invoices FOR
UPDATE USING (
        public.is_admin()
        OR public.is_manager()
    ) WITH CHECK (
        public.is_admin()
        OR public.is_manager()
    );
CREATE POLICY "Invoices: delete admin or manager" ON public.invoices FOR DELETE USING (
    public.is_admin()
    OR public.is_manager()
);
CREATE POLICY "Payments: select via invoice" ON public.payments FOR
SELECT USING (
        EXISTS(
            SELECT 1
            FROM public.invoices i
            WHERE i.id = public.payments.invoice_id
                AND (
                    public.is_admin()
                    OR public.is_manager()
                    OR i.guest_profile_id = auth.uid()
                )
        )
    );
CREATE POLICY "Payments: insert admin or manager" ON public.payments FOR
INSERT WITH CHECK (
        EXISTS(
            SELECT 1
            FROM public.invoices i
            WHERE i.id = public.payments.invoice_id
                AND (
                    public.is_admin()
                    OR public.is_manager()
                )
        )
    );
CREATE POLICY "Payments: update admin or manager" ON public.payments FOR
UPDATE USING (
        EXISTS(
            SELECT 1
            FROM public.invoices i
            WHERE i.id = public.payments.invoice_id
                AND (
                    public.is_admin()
                    OR public.is_manager()
                )
        )
    ) WITH CHECK (
        EXISTS(
            SELECT 1
            FROM public.invoices i
            WHERE i.id = public.payments.invoice_id
                AND (
                    public.is_admin()
                    OR public.is_manager()
                )
        )
    );
CREATE POLICY "Payments: delete admin or manager" ON public.payments FOR DELETE USING (
    public.is_admin()
    OR public.is_manager()
);
-- Policies for activity logs
CREATE POLICY "Activity logs: select operations" ON public.activity_logs FOR
SELECT USING (
        public.is_admin()
        OR public.is_manager()
        OR public.is_hotel_staff()
        OR public.is_restaurant_staff()
    );
CREATE POLICY "Activity logs: insert operations" ON public.activity_logs FOR
INSERT WITH CHECK (
        public.is_admin()
        OR public.is_manager()
        OR public.is_hotel_staff()
        OR public.is_restaurant_staff()
    );
CREATE POLICY "Activity logs: update admin or manager" ON public.activity_logs FOR
UPDATE USING (
        public.is_admin()
        OR public.is_manager()
    ) WITH CHECK (
        public.is_admin()
        OR public.is_manager()
    );
CREATE POLICY "Activity logs: delete admin or manager" ON public.activity_logs FOR DELETE USING (
    public.is_admin()
    OR public.is_manager()
);
-- Trigger to create profile records automatically when a new auth.user is inserted.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        created_at,
        updated_at
    )
VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.user_metadata->>'full_name', NEW.email),
        'guest',
        now(),
        now()
    ) ON CONFLICT (id) DO NOTHING;
RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS auth_user_insert_profile ON auth.users;
CREATE TRIGGER auth_user_insert_profile
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
-- Sample data for testing
INSERT INTO public.staff_members (
        position,
        department,
        shift,
        phone,
        salary,
        hire_date,
        status
    )
VALUES (
        'Receptionist',
        'Hotel',
        'Morning',
        '9000011111',
        22000,
        '2023-01-10',
        'active'
    ),
    (
        'Waiter',
        'Restaurant',
        'Evening',
        '9000033333',
        18000,
        '2023-06-20',
        'active'
    );
INSERT INTO public.guests (name, email, phone, id_type, id_number)
VALUES (
        'Arjun Mehta',
        'arjun@booknfeast.test',
        '9876543210',
        'Aadhaar',
        'XXXX1234'
    ),
    (
        'Priya Sharma',
        'priya@booknfeast.test',
        '9123456780',
        'Passport',
        'P7654321'
    );
INSERT INTO public.room_types (
        name,
        description,
        capacity,
        default_price,
        amenities
    )
VALUES (
        'Standard',
        'Standard room with all basic amenities',
        2,
        2500,
        '[]'::jsonb
    ),
    (
        'Deluxe',
        'Deluxe room with extra space and services',
        2,
        4500,
        '[]'::jsonb
    ),
    (
        'Suite',
        'Suite room with premium amenities',
        4,
        8000,
        '[]'::jsonb
    );
INSERT INTO public.rooms (
        number,
        room_type_id,
        floor,
        capacity,
        price_per_night,
        status,
        amenities
    )
VALUES (
        '101',
        (
            SELECT id
            FROM public.room_types
            WHERE name = 'Standard'
        ),
        1,
        2,
        2500,
        'available',
        '["AC","WiFi","TV"]'
    ),
    (
        '102',
        (
            SELECT id
            FROM public.room_types
            WHERE name = 'Standard'
        ),
        1,
        2,
        2500,
        'available',
        '["AC","WiFi","TV"]'
    ),
    (
        '103',
        (
            SELECT id
            FROM public.room_types
            WHERE name = 'Deluxe'
        ),
        1,
        2,
        4500,
        'available',
        '["AC","WiFi","TV"]'
    ),
    (
        '104',
        (
            SELECT id
            FROM public.room_types
            WHERE name = 'Suite'
        ),
        1,
        4,
        8000,
        'maintenance',
        '["AC","WiFi","TV","Mini Bar"]'
    ),
    (
        '105',
        (
            SELECT id
            FROM public.room_types
            WHERE name = 'Deluxe'
        ),
        1,
        2,
        4500,
        'available',
        '["AC","WiFi","TV"]'
    );
INSERT INTO public.bookings (
        guest_id,
        room_id,
        check_in,
        check_out,
        nights,
        amount,
        status,
        adults,
        children,
        notes
    )
VALUES (
        (
            SELECT id
            FROM public.guests
            WHERE name = 'Arjun Mehta'
        ),
        (
            SELECT id
            FROM public.rooms
            WHERE number = '101'
        ),
        current_date,
        current_date + INTERVAL '3 days',
        3,
        7500,
        'checked-in',
        2,
        0,
        'Early arrival'
    ),
    (
        (
            SELECT id
            FROM public.guests
            WHERE name = 'Priya Sharma'
        ),
        (
            SELECT id
            FROM public.rooms
            WHERE number = '103'
        ),
        current_date + INTERVAL '1 day',
        current_date + INTERVAL '4 days',
        3,
        13500,
        'confirmed',
        1,
        0,
        'Late check-in'
    );
INSERT INTO public.menu_categories (name, description)
VALUES ('Breakfast', 'Morning meal and light snacks'),
    ('Main Course', 'Main entrees'),
    ('Dessert', 'Sweets and after-meal treats'),
    ('Beverages', 'Drinks and refreshments');
INSERT INTO public.menu_items (name, category_id, price, available, description)
VALUES (
        'Masala Dosa',
        (
            SELECT id
            FROM public.menu_categories
            WHERE name = 'Breakfast'
        ),
        120,
        true,
        'Crispy dosa with sambar'
    ),
    (
        'Veg Biryani',
        (
            SELECT id
            FROM public.menu_categories
            WHERE name = 'Main Course'
        ),
        220,
        true,
        'Fragrant basmati rice with vegetables'
    ),
    (
        'Paneer Butter Masala',
        (
            SELECT id
            FROM public.menu_categories
            WHERE name = 'Main Course'
        ),
        240,
        true,
        'Creamy tomato gravy with cottage cheese'
    ),
    (
        'Gulab Jamun',
        (
            SELECT id
            FROM public.menu_categories
            WHERE name = 'Dessert'
        ),
        90,
        true,
        'Sweet cheese dumplings in syrup'
    ),
    (
        'Masala Chai',
        (
            SELECT id
            FROM public.menu_categories
            WHERE name = 'Beverages'
        ),
        50,
        true,
        'Ginger and cardamom tea'
    );
INSERT INTO public.restaurant_tables (number, capacity, status, section)
VALUES (1, 2, 'available', 'Indoor'),
    (2, 4, 'available', 'Indoor'),
    (3, 6, 'occupied', 'Outdoor');
INSERT INTO public.orders (
        guest_id,
        table_id,
        waiter_id,
        subtotal,
        tax,
        total,
        status
    )
VALUES (
        (
            SELECT id
            FROM public.guests
            WHERE name = 'Arjun Mehta'
        ),
        (
            SELECT id
            FROM public.restaurant_tables
            WHERE number = 3
        ),
        (
            SELECT id
            FROM public.staff_members
            WHERE phone = '9000033333'
        ),
        440,
        22,
        462,
        'active'
    );
INSERT INTO public.order_items (
        order_id,
        menu_item_id,
        name,
        unit_price,
        quantity
    )
VALUES (
        (
            SELECT id
            FROM public.orders
            LIMIT 1
        ), (
            SELECT id
            FROM public.menu_items
            WHERE name = 'Veg Biryani'
        ),
        'Veg Biryani',
        220,
        2
    ),
    (
        (
            SELECT id
            FROM public.orders
            LIMIT 1
        ), (
            SELECT id
            FROM public.menu_items
            WHERE name = 'Naan'
        ),
        'Naan',
        40,
        4
    ),
    (
        (
            SELECT id
            FROM public.orders
            LIMIT 1
        ), (
            SELECT id
            FROM public.menu_items
            WHERE name = 'Masala Chai'
        ),
        'Masala Chai',
        50,
        2
    );
INSERT INTO public.activity_logs (icon, message, type, created_by)
VALUES (
        '🏨',
        'Room 101 checked in by Arjun Mehta',
        'info',
        '00000000-0000-0000-0000-000000000003'
    ),
    (
        '🍽️',
        'Order placed for Table 3',
        'success',
        '00000000-0000-0000-0000-000000000004'
    ),
    (
        '📅',
        'New booking: Priya Sharma — Room 103',
        'success',
        '00000000-0000-0000-0000-000000000003'
    );
INSERT INTO public.invoices (
        booking_id,
        order_id,
        guest_id,
        due_date,
        subtotal,
        tax,
        total,
        status
    )
VALUES (
        (
            SELECT id
            FROM public.bookings
            WHERE guest_id = (
                    SELECT id
                    FROM public.guests
                    WHERE name = 'Arjun Mehta'
                )
        ),
        NULL,
        (
            SELECT id
            FROM public.guests
            WHERE name = 'Arjun Mehta'
        ),
        current_date + INTERVAL '5 days',
        7500,
        375,
        7875,
        'issued'
    );
INSERT INTO public.payments (invoice_id, method, amount, status)
VALUES (
        (
            SELECT id
            FROM public.invoices
            LIMIT 1
        ), 'card', 7875, 'pending'
    );