export type NotificationType = "po_pending_approval" | "po_approved" | "po_rejected" | "po_sent_to_supplier";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  poId: string;
  read: boolean;
  createdAt: Date;
}

let notifications: Notification[] = [];

export const notificationDb = {
  notifications: {
    getAll: () => notifications,
    getByUserId: (userId: string) => notifications.filter((n) => n.userId === userId),
    add: (notification: Omit<Notification, "id" | "createdAt">) => {
      const newNotification = {
        ...notification,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      notifications.push(newNotification);
      return newNotification;
    },
    markAsRead: (id: string) => {
      const notification = notifications.find((n) => n.id === id);
      if (notification) {
        notification.read = true;
      }
      return notification;
    },
    delete: (id: string) => {
      notifications = notifications.filter((n) => n.id !== id);
    },
  },
};
