"use client";

import { useState, useEffect } from "react";
import { Box, Button, Input, Text, Table, Group, Select, MultiSelect } from "@mantine/core";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface User {
  id: string;
  username: string;
  password: string;
  role: string;
  modules: string[];
}

const moduleOptions = ["Dashboard", "Finance", "Purchase", "Inventory", "Manufacturing", "Documentation", "Website", "CRM", "HR"];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string | null>("editor");
  const [modules, setModules] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingModules, setEditingModules] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch("/api/auth/users");
    const data = await res.json();
    setUsers(data);
  };

  const addUser = async () => {
    if (!username || !password || !role || modules.length === 0) return;

    await fetch("/api/auth/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role, modules }),
    });

    setUsername("");
    setPassword("");
    setRole("editor");
    setModules([]);
    fetchUsers();
  };

  const updateUserModules = async (id: string) => {
    const response = await fetch("/api/auth/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, modules: editingModules }),
    });

    const updatedUser = await response.json();

    // If editing current user, update localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const currentUser = JSON.parse(userStr);
      if (currentUser.id === id) {
        // Update with the response from server
        currentUser.modules = updatedUser.modules;
        localStorage.setItem("user", JSON.stringify(currentUser));
        // Reload page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 300);
        return;
      }
    }

    setEditingId(null);
    fetchUsers();
  };

  const deleteUser = async (id: string) => {
    await fetch("/api/auth/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchUsers();
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <Box
        style={{
          width: "100%",
          minHeight: "100vh",
          backgroundColor: "white",
          padding: "40px",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        <Box style={{ marginBottom: "30px" }}>
          <Button
            onClick={() => window.location.href = "/dashboard"}
            style={{
              backgroundColor: "#000",
              color: "#fff",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            ← Back
          </Button>
        </Box>

        <Text
          style={{
            fontSize: "28px",
            fontWeight: "600",
            marginBottom: "30px",
          }}
        >
          User Management
        </Text>

        {/* Add User Form */}
        <Box style={{ marginBottom: "40px", paddingBottom: "20px", borderBottom: "1px solid #eee" }}>
          <Text style={{ fontSize: "16px", fontWeight: "600", marginBottom: "15px" }}>
            Add New User
          </Text>
          <Group>
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.currentTarget.value)}
              style={{ fontFamily: "Poppins, sans-serif" }}
            />
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              style={{ fontFamily: "Poppins, sans-serif" }}
            />
            <Select
              label="Role"
              placeholder="Select role"
              data={["admin", "editor"]}
              value={role}
              onChange={setRole}
            />
            <MultiSelect
              label="Modules"
              placeholder="Select modules"
              data={moduleOptions}
              value={modules}
              onChange={setModules}
              searchable
            />
            <Button
              onClick={addUser}
              style={{
                backgroundColor: "#000",
                color: "#fff",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              Add User
            </Button>
          </Group>
        </Box>

        {/* Users Table */}
        <Text style={{ fontSize: "16px", fontWeight: "600", marginBottom: "15px" }}>
          All Users
        </Text>
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Username</Table.Th>
              <Table.Th>Password</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Modules</Table.Th>
              <Table.Th>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((user) => (
              <Table.Tr key={user.id}>
                <Table.Td>{user.username}</Table.Td>
                <Table.Td style={{ fontFamily: "monospace" }}>{user.password}</Table.Td>
                <Table.Td>{user.role}</Table.Td>
                <Table.Td>
                  {editingId === user.id ? (
                    <MultiSelect
                      placeholder="Select modules"
                      data={moduleOptions}
                      value={editingModules}
                      onChange={setEditingModules}
                      searchable
                    />
                  ) : (
                    user.modules.join(", ")
                  )}
                </Table.Td>
                <Table.Td>
                  {editingId === user.id ? (
                    <Group>
                      <Button
                        onClick={() => updateUserModules(user.id)}
                        size="xs"
                        style={{
                          backgroundColor: "#28a745",
                          color: "#fff",
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => setEditingId(null)}
                        size="xs"
                        style={{
                          backgroundColor: "#999",
                          color: "#fff",
                        }}
                      >
                        Cancel
                      </Button>
                    </Group>
                  ) : (
                    <Group>
                      {user.role !== "superadmin" && (
                        <>
                          <Button
                            onClick={() => {
                              setEditingId(user.id);
                              setEditingModules(user.modules);
                            }}
                            size="xs"
                            style={{
                              backgroundColor: "#007bff",
                              color: "#fff",
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => deleteUser(user.id)}
                            size="xs"
                            style={{
                              backgroundColor: "#ff6b6b",
                              color: "#fff",
                            }}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </Group>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>
    </ProtectedRoute>
  );
}
