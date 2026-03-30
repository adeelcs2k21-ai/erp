// Simple in-memory database (replace with real DB later)
export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  status: "pending" | "completed";
  createdAt: Date;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  firstOrderDate: Date;
}

let orders: Order[] = [];
let clients: Client[] = [];

export const db = {
  orders: {
    getAll: () => orders,
    add: (order: Omit<Order, "id">) => {
      const newOrder = { ...order, id: Date.now().toString() };
      orders.push(newOrder);
      return newOrder;
    },
    update: (id: string, status: "pending" | "completed") => {
      const order = orders.find((o) => o.id === id);
      if (order) {
        order.status = status;
        // If order is completed, add customer as client
        if (status === "completed") {
          const existingClient = clients.find(
            (c) => c.email === order.customerEmail
          );
          if (!existingClient) {
            clients.push({
              id: Date.now().toString(),
              name: order.customerName,
              email: order.customerEmail,
              firstOrderDate: new Date(),
            });
          }
        }
      }
      return order;
    },
  },
  clients: {
    getAll: () => clients,
  },
};
