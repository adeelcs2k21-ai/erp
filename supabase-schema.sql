-- Run this in your Supabase SQL Editor

create table if not exists users (
  id text primary key,
  username text unique not null,
  password text not null,
  role text not null,
  modules text[] not null default '{}',
  created_at timestamptz default now()
);

create table if not exists suppliers (
  id text primary key,
  name text,
  email text,
  phone text,
  address text,
  contact_person text,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists orders (
  id text primary key,
  customer_name text,
  customer_email text,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists clients (
  id text primary key,
  name text,
  email text,
  first_order_date timestamptz default now()
);

create table if not exists quotes (
  id text primary key,
  bom_id text,
  bom_number text,
  supplier_id text,
  supplier_name text,
  items jsonb,
  total_rate numeric,
  transport_cost numeric default 0,
  tax numeric default 0,
  total_amount numeric,
  notes text,
  created_at timestamptz default now()
);

create table if not exists bom_rates (
  id text primary key,
  data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists bom_sends (
  id text primary key,
  bom_id text,
  bom_number text,
  supplier_id text,
  supplier_name text,
  supplier_phone text,
  status text default 'sent',
  sent_at timestamptz default now(),
  items jsonb
);

create table if not exists bom_invoices (
  id text primary key,
  bom_id text,
  bom_number text,
  bom_data jsonb,
  best_quote jsonb,
  status text default 'pending',
  created_by text,
  total_amount numeric,
  supplier_name text,
  delivery_date text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists inventory_receiving (
  id text primary key,
  bom_invoice_id text,
  bom_number text,
  items jsonb,
  received_by text,
  received_date timestamptz default now(),
  notes text,
  status text default 'completed'
);

create table if not exists supplier_quotes (
  id text primary key,
  data jsonb,
  created_at timestamptz default now()
);

-- Seed default users
insert into users (id, username, password, role, modules) values
  ('1', 'superadmin', 'superadmin123', 'superadmin', '{all}'),
  ('2', 'admin', 'admin123', 'admin', '{all}'),
  ('3', 'dashboard_editor', 'dashboard123', 'editor', '{Dashboard}'),
  ('4', 'finance_editor', 'finance123', 'editor', '{Finance}'),
  ('5', 'purchase_editor', 'purchase123', 'editor', '{Purchase}'),
  ('6', 'inventory_editor', 'inventory123', 'editor', '{Inventory}'),
  ('7', 'manufacturing_editor', 'manufacturing123', 'editor', '{Manufacturing}'),
  ('8', 'documentation_editor', 'documentation123', 'editor', '{Documentation}'),
  ('9', 'website_editor', 'website123', 'editor', '{Website}'),
  ('10', 'crm_editor', 'crm123', 'editor', '{CRM}'),
  ('11', 'hr_editor', 'hr123', 'editor', '{HR}')
on conflict (id) do nothing;

create table if not exists purchase_orders (
  id text primary key,
  po_number text,
  items jsonb,
  delivery_date text,
  payment_terms text,
  notes text,
  total_amount numeric,
  status text default 'pending_approval',
  created_by text,
  suppliers jsonb,
  rejection_remarks text,
  created_at timestamptz default now()
);

create table if not exists notifications (
  id text primary key,
  user_id text,
  type text,
  title text,
  message text,
  po_id text,
  read boolean default false,
  created_at timestamptz default now()
);
