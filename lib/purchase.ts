export interface PurchaseOrderItem {
  id: string;
  itemName: string;
  itemType: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  description: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  items: PurchaseOrderItem[];
  deliveryDate: string;
  paymentTerms: string;
  notes: string;
  totalAmount: number;
  status: "draft" | "pending_approval" | "approved" | "rejected" | "sent_to_supplier" | "completed";
  createdBy: string;
  approvedBy?: string;
  rejectionRemarks?: string;
  suppliers: Supplier[];
  createdAt: Date;
}

let purchaseOrders: PurchaseOrder[] = [];

export const purchaseDb = {
  orders: {
    getAll: () => purchaseOrders,
    getById: (id: string) => purchaseOrders.find((o) => o.id === id),
    add: (order: Omit<PurchaseOrder, "id" | "createdAt">) => {
      const newOrder = {
        ...order,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      purchaseOrders.push(newOrder);
      return newOrder;
    },
    update: (id: string, order: Partial<PurchaseOrder>) => {
      const index = purchaseOrders.findIndex((o) => o.id === id);
      if (index !== -1) {
        purchaseOrders[index] = { ...purchaseOrders[index], ...order };
        return purchaseOrders[index];
      }
      return null;
    },
    delete: (id: string) => {
      purchaseOrders = purchaseOrders.filter((o) => o.id !== id);
    },
  },
};
