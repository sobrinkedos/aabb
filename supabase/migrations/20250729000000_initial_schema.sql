/*
          # Initial Schema Setup
          This script establishes the foundational database structure for the ClubManager Pro application. It includes tables for user profiles, members, inventory, menu items, and orders. It also sets up Row Level Security (RLS) to protect data and a trigger to automatically create user profiles upon registration.

          ## Query Description: This operation is safe and foundational. It creates new tables and enables security but does not modify or delete any existing data. It's designed to be run on a new or empty database.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true

          ## Structure Details:
          - Tables Created: profiles, members, inventory_items, menu_items, orders, order_items.
          - Triggers Created: on_auth_user_created to populate profiles.
          - RLS Policies: Enabled on all new tables, granting select access to authenticated users and full access to admins.

          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes, new policies are created for all tables.
          - Auth Requirements: Policies reference auth.uid() and a custom role field in the profiles table.

          ## Performance Impact:
          - Indexes: Primary keys are indexed automatically.
          - Triggers: One trigger is added to handle new user profile creation.
          - Estimated Impact: Low, as this is an initial setup.
          */

-- 1. PROFILES TABLE
-- Stores public user data, linked to auth.users
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'employee',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Stores public user data, linked to the authentication service.';
COMMENT ON COLUMN public.profiles.role IS 'User role for application-level permissions (e.g., admin, employee).';

-- 2. AUTOMATIC PROFILE CREATION
-- Trigger function to create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'avatar_url',
    'employee' -- Default role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function after a new user is inserted
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. MEMBERS TABLE
CREATE TABLE public.members (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- active, inactive, pending
  join_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  membership_type TEXT NOT NULL, -- individual, family, vip
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.members IS 'Stores information about club members.';

-- 4. MENU ITEMS TABLE
CREATE TABLE public.menu_items (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category TEXT NOT NULL, -- drinks, food, snacks
  available BOOLEAN NOT NULL DEFAULT TRUE,
  preparation_time INTEGER, -- in minutes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.menu_items IS 'Represents items available on the bar and kitchen menus.';

-- 5. INVENTORY ITEMS TABLE
CREATE TABLE public.inventory_items (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL, -- unidades, kg, litros, garrafas
  cost NUMERIC(10, 2),
  supplier TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.inventory_items IS 'Manages stock of all products and ingredients.';

-- 6. ORDERS TABLE
CREATE TABLE public.orders (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, preparing, ready, delivered, cancelled
  total NUMERIC(10, 2) NOT NULL,
  employee_id UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.orders IS 'Tracks customer orders from the bar and kitchen.';

-- 7. ORDER ITEMS (JOIN TABLE)
CREATE TABLE public.order_items (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id),
  quantity INTEGER NOT NULL,
  price NUMERIC(10, 2) NOT NULL, -- Price at the time of order
  notes TEXT
);

COMMENT ON TABLE public.order_items IS 'Links orders with their respective menu items.';

-- 8. ROW LEVEL SECURITY (RLS)
-- Helper function to get user role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR PROFILES
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- POLICIES FOR OTHER TABLES (Admin-focused)
-- Generic policies for admin access
CREATE POLICY "Admins have full access" ON public.members FOR ALL USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "Admins have full access" ON public.menu_items FOR ALL USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "Admins have full access" ON public.inventory_items FOR ALL USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "Admins have full access" ON public.orders FOR ALL USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "Admins have full access" ON public.order_items FOR ALL USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');

-- Generic policies for authenticated user read access
CREATE POLICY "Authenticated users can view data" ON public.members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view data" ON public.menu_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view data" ON public.inventory_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view data" ON public.orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view data" ON public.order_items FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for employees to create/update orders
CREATE POLICY "Employees can create and update orders" ON public.orders FOR ALL USING (public.get_my_role() IN ('admin', 'employee')) WITH CHECK (public.get_my_role() IN ('admin', 'employee'));
CREATE POLICY "Employees can manage order items" ON public.order_items FOR ALL USING (public.get_my_role() IN ('admin', 'employee')) WITH CHECK (public.get_my_role() IN ('admin', 'employee'));
