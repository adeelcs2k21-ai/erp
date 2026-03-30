import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const SUPPLIERS_FILE = path.join(DATA_DIR, "suppliers.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const QUOTES_FILE = path.join(DATA_DIR, "quotes.json");
const BOM_SENDS_FILE = path.join(DATA_DIR, "bom_sends.json");

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Suppliers
export function getSuppliers() {
  ensureDataDir();
  try {
    if (fs.existsSync(SUPPLIERS_FILE)) {
      const data = fs.readFileSync(SUPPLIERS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading suppliers:", error);
  }
  return [];
}

export function saveSuppliers(suppliers: any[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(SUPPLIERS_FILE, JSON.stringify(suppliers, null, 2));
  } catch (error) {
    console.error("Error saving suppliers:", error);
  }
}

// Orders
export function getOrders() {
  ensureDataDir();
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading orders:", error);
  }
  return [];
}

export function saveOrders(orders: any[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error("Error saving orders:", error);
  }
}

// Quotes
export function getQuotes() {
  ensureDataDir();
  try {
    if (fs.existsSync(QUOTES_FILE)) {
      const data = fs.readFileSync(QUOTES_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading quotes:", error);
  }
  return [];
}

export function saveQuotes(quotes: any[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(QUOTES_FILE, JSON.stringify(quotes, null, 2));
  } catch (error) {
    console.error("Error saving quotes:", error);
  }
}

// BOM Sends (track when BOMs are sent to suppliers)
export function getBOMSends() {
  ensureDataDir();
  try {
    if (fs.existsSync(BOM_SENDS_FILE)) {
      const data = fs.readFileSync(BOM_SENDS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading BOM sends:", error);
  }
  return [];
}

export function saveBOMSends(sends: any[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(BOM_SENDS_FILE, JSON.stringify(sends, null, 2));
  } catch (error) {
    console.error("Error saving BOM sends:", error);
  }
}
