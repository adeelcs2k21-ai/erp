-- Flush Database - Clear all data except users (login details)
-- Run this in your Supabase SQL Editor
-- WARNING: This will delete all data except user accounts!

-- STEP 1: Run this first to delete all data
DELETE FROM notifications;
DELETE FROM inventory_receiving;
DELETE FROM bom_invoices;
DELETE FROM bom_sends;
DELETE FROM bom_rates;
DELETE FROM supplier_quotes;
DELETE FROM quotes;
DELETE FROM purchase_orders;
DELETE FROM crm_orders;
DELETE FROM clients;
DELETE FROM products;
DELETE FROM product_history;
DELETE FROM orders;
DELETE FROM suppliers;
