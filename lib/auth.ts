// Simple in-memory auth (replace with real DB later)
export type UserRole = "superadmin" | "admin" | "editor";

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  modules: string[]; // Changed from module to modules (array)
  createdAt: Date;
}

let users: User[] = [
  {
    id: "1",
    username: "superadmin",
    password: "superadmin123",
    role: "superadmin",
    modules: ["all"],
    createdAt: new Date(),
  },
  {
    id: "2",
    username: "admin",
    password: "admin123",
    role: "admin",
    modules: ["all"],
    createdAt: new Date(),
  },
  {
    id: "3",
    username: "dashboard_editor",
    password: "dashboard123",
    role: "editor",
    modules: ["Dashboard"],
    createdAt: new Date(),
  },
  {
    id: "4",
    username: "finance_editor",
    password: "finance123",
    role: "editor",
    modules: ["Finance"],
    createdAt: new Date(),
  },
  {
    id: "5",
    username: "purchase_editor",
    password: "purchase123",
    role: "editor",
    modules: ["Purchase"],
    createdAt: new Date(),
  },
  {
    id: "6",
    username: "inventory_editor",
    password: "inventory123",
    role: "editor",
    modules: ["Inventory"],
    createdAt: new Date(),
  },
  {
    id: "7",
    username: "manufacturing_editor",
    password: "manufacturing123",
    role: "editor",
    modules: ["Manufacturing"],
    createdAt: new Date(),
  },
  {
    id: "8",
    username: "documentation_editor",
    password: "documentation123",
    role: "editor",
    modules: ["Documentation"],
    createdAt: new Date(),
  },
  {
    id: "9",
    username: "website_editor",
    password: "website123",
    role: "editor",
    modules: ["Website"],
    createdAt: new Date(),
  },
  {
    id: "10",
    username: "crm_editor",
    password: "crm123",
    role: "editor",
    modules: ["CRM"],
    createdAt: new Date(),
  },
  {
    id: "11",
    username: "hr_editor",
    password: "hr123",
    role: "editor",
    modules: ["HR"],
    createdAt: new Date(),
  },
];

export const authDb = {
  users: {
    getAll: () => users,
    getByUsername: (username: string) => users.find((u) => u.username === username),
    add: (user: Omit<User, "id" | "createdAt">) => {
      const newUser = {
        ...user,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      users.push(newUser);
      return newUser;
    },
    update: (id: string, modules: string[]) => {
      const user = users.find((u) => u.id === id);
      if (user) {
        user.modules = modules;
      }
      return user;
    },
    delete: (id: string) => {
      users = users.filter((u) => u.id !== id);
    },
  },
};
