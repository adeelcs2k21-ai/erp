-- Add new columns to crm_orders table for payment workflow
-- Run this in your Supabase SQL Editor

ALTER TABLE crm_orders 
ADD COLUMN IF NOT EXISTS po_number text,
ADD COLUMN IF NOT EXISTS po_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS payment_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS payment_screenshot text,
ADD COLUMN IF NOT EXISTS payment_notes text,
ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz,
ADD COLUMN IF NOT EXISTS payment_confirmed_by text,
ADD COLUMN IF NOT EXISTS fulfilled_at timestamptz,
ADD COLUMN IF NOT EXISTS fulfilled_by text;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'crm_orders' 
ORDER BY ordinal_position;
