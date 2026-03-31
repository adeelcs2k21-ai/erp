"use client";

import { useState, useEffect } from "react";
import { Box, Button, Text, Tabs, Table, Badge, Modal, Input, Select, NumberInput, Textarea, Grid } from "@mantine/core";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profile_image_url?: string;
  department: string;
  position: string;
  salary: number;
  hourly_rate?: number;
  employment_type: string;
  status: string;
  hire_date: string;
  working_hours_per_day?: number;
  annual_leave_days?: number;
  sick_leave_days?: number;
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  check_in_time: string;
  check_out_time: string;
  break_start_time?: string;
  break_end_time?: string;
  total_hours: number;
  regular_hours?: number;
  overtime_hours?: number;
  break_hours?: number;
  status: string;
}

export default function HR() {
  const [activeTab, setActiveTab] = useState<string | null>("employees");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Employee form state
  const [employeeForm, setEmployeeForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    salary: 0,
    employment_type: "full_time",
    hire_date: "",
  });

  // Leave request form state
  const [leaveForm, setLeaveForm] = useState({
    employee_id: "",
    leave_type: "annual",
    start_date: "",
    end_date: "",
    reason: "",
  });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    // Only fetch data if tables exist
    if (activeTab === "employees") {
      fetchEmployees();
    } else if (activeTab === "leave") {
      fetchLeaveRequests();
    } else if (activeTab === "attendance") {
      fetchAttendance();
    }
  }, [activeTab]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/hr/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const res = await fetch("/api/hr/leave-requests");
      if (res.ok) {
        const data = await res.json();
        setLeaveRequests(data || []);
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      setLeaveRequests([]);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await fetch("/api/hr/attendance");
      if (res.ok) {
        const data = await res.json();
        setAttendance(data || []);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setAttendance([]);
    }
  };

  const createEmployee = async () => {
    try {
      const res = await fetch("/api/hr/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employeeForm),
      });
      const newEmployee = await res.json();
      setEmployees(Array.isArray(employees) ? [...employees, newEmployee] : [newEmployee]);
      setShowEmployeeModal(false);
      setEmployeeForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        department: "",
        position: "",
        salary: 0,
        employment_type: "full_time",
        hire_date: "",
      });
    } catch (error) {
      console.error("Error creating employee:", error);
    }
  };

  const createLeaveRequest = async () => {
    try {
      const res = await fetch("/api/hr/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leaveForm),
      });
      const newLeave = await res.json();
      setLeaveRequests(Array.isArray(leaveRequests) ? [...leaveRequests, newLeave] : [newLeave]);
      setShowLeaveModal(false);
      setLeaveForm({
        employee_id: "",
        leave_type: "annual",
        start_date: "",
        end_date: "",
        reason: "",
      });
    } catch (error) {
      console.error("Error creating leave request:", error);
    }
  };

  return (
    <ProtectedRoute>
      <Box
        style={{
          width: "100%",
          minHeight: "100vh",
          backgroundColor: "white",
          display: "flex",
          flexDirection: "row",
          fontFamily: "Poppins, sans-serif",
          padding: "40px",
        }}
      >
        <Navigation currentPage={8} />

        <Box
          style={{
            marginLeft: "200px",
            flex: 1,
            paddingBottom: "100px",
          }}
        >
          <Box
            style={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "30px",
              marginTop: "40px",
              marginLeft: "80px",
              marginRight: "-400px",
              width: "1300px",
              minHeight: "600px",
              position: "relative",
            }}
          >
            <Box style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <Text style={{ fontSize: "24px", fontWeight: "600" }}>Human Resources</Text>
              <Text style={{ fontSize: "12px", color: "#999" }}>Active Tab: {activeTab}</Text>
            </Box>

            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="employees">Employees</Tabs.Tab>
                <Tabs.Tab value="attendance">Attendance</Tabs.Tab>
                <Tabs.Tab value="leave">Leave Management</Tabs.Tab>
                <Tabs.Tab value="payroll">Payroll</Tabs.Tab>
                <Tabs.Tab value="performance">Performance</Tabs.Tab>
              </Tabs.List>

              {/* Employees Tab */}
              <Tabs.Panel value="employees">
                <Box style={{ marginTop: "20px" }}>
                  <EmployeesTab 
                    employees={employees} 
                    onAddEmployee={() => setShowEmployeeModal(true)}
                    onViewEmployee={(employee) => {
                      setSelectedEmployee(employee);
                      setShowEmployeeDetails(true);
                    }}
                  />
                </Box>
              </Tabs.Panel>

              {/* Attendance Tab */}
              <Tabs.Panel value="attendance">
                <Box style={{ marginTop: "20px" }}>
                  <AttendanceTab attendance={attendance} />
                </Box>
              </Tabs.Panel>

              {/* Leave Management Tab */}
              <Tabs.Panel value="leave">
                <Box style={{ marginTop: "20px" }}>
                  <LeaveTab 
                    leaveRequests={leaveRequests} 
                    onAddLeave={() => setShowLeaveModal(true)}
                  />
                </Box>
              </Tabs.Panel>

              {/* Payroll Tab */}
              <Tabs.Panel value="payroll">
                <Box style={{ marginTop: "20px" }}>
                  <PayrollTab />
                </Box>
              </Tabs.Panel>

              {/* Performance Tab */}
              <Tabs.Panel value="performance">
                <Box style={{ marginTop: "20px" }}>
                  <PerformanceTab />
                </Box>
              </Tabs.Panel>
            </Tabs>
          </Box>
        </Box>
      </Box>

      {/* Add Employee Modal */}
      <Modal
        opened={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        title="Add New Employee"
        size="lg"
      >
        <Box style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <Grid>
            <Grid.Col span={6}>
              <Input
                label="First Name"
                placeholder="Enter first name"
                value={employeeForm.first_name}
                onChange={(e) => setEmployeeForm({ ...employeeForm, first_name: e.currentTarget.value })}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Input
                label="Last Name"
                placeholder="Enter last name"
                value={employeeForm.last_name}
                onChange={(e) => setEmployeeForm({ ...employeeForm, last_name: e.currentTarget.value })}
              />
            </Grid.Col>
          </Grid>
          <Input
            label="Email"
            placeholder="Enter email"
            value={employeeForm.email}
            onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.currentTarget.value })}
          />
          <Input
            label="Phone"
            placeholder="Enter phone number"
            value={employeeForm.phone}
            onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.currentTarget.value })}
          />
          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Department"
                placeholder="Select department"
                data={["Human Resources", "Engineering", "Sales", "Marketing", "Finance", "Operations"]}
                value={employeeForm.department}
                onChange={(val) => setEmployeeForm({ ...employeeForm, department: val || "" })}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Input
                label="Position"
                placeholder="Enter position"
                value={employeeForm.position}
                onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.currentTarget.value })}
              />
            </Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}>
              <NumberInput
                label="Salary"
                placeholder="Enter salary"
                value={employeeForm.salary}
                onChange={(val) => setEmployeeForm({ ...employeeForm, salary: val || 0 })}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Employment Type"
                data={[
                  { value: "full_time", label: "Full Time" },
                  { value: "part_time", label: "Part Time" },
                  { value: "contract", label: "Contract" },
                  { value: "intern", label: "Intern" }
                ]}
                value={employeeForm.employment_type}
                onChange={(val) => setEmployeeForm({ ...employeeForm, employment_type: val || "full_time" })}
              />
            </Grid.Col>
          </Grid>
          <Input
            label="Hire Date"
            type="date"
            value={employeeForm.hire_date}
            onChange={(e) => setEmployeeForm({ ...employeeForm, hire_date: e.currentTarget.value })}
          />
          <Button onClick={createEmployee} style={{ backgroundColor: "#000", color: "#fff" }}>
            Add Employee
          </Button>
        </Box>
      </Modal>

      {/* Add Leave Request Modal */}
      <Modal
        opened={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Submit Leave Request"
        size="md"
      >
        <Box style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <Select
            label="Employee"
            placeholder="Select employee"
            data={employees.map(emp => ({ 
              value: emp.id, 
              label: `${emp.first_name} ${emp.last_name} (${emp.employee_id})` 
            }))}
            value={leaveForm.employee_id}
            onChange={(val) => setLeaveForm({ ...leaveForm, employee_id: val || "" })}
          />
          <Select
            label="Leave Type"
            data={[
              { value: "annual", label: "Annual Leave" },
              { value: "sick", label: "Sick Leave" },
              { value: "maternity", label: "Maternity Leave" },
              { value: "paternity", label: "Paternity Leave" },
              { value: "emergency", label: "Emergency Leave" },
              { value: "unpaid", label: "Unpaid Leave" }
            ]}
            value={leaveForm.leave_type}
            onChange={(val) => setLeaveForm({ ...leaveForm, leave_type: val || "annual" })}
          />
          <Grid>
            <Grid.Col span={6}>
              <Input
                label="Start Date"
                type="date"
                value={leaveForm.start_date}
                onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.currentTarget.value })}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Input
                label="End Date"
                type="date"
                value={leaveForm.end_date}
                onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.currentTarget.value })}
              />
            </Grid.Col>
          </Grid>
          <Textarea
            label="Reason"
            placeholder="Enter reason for leave"
            value={leaveForm.reason}
            onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.currentTarget.value })}
          />
          <Button onClick={createLeaveRequest} style={{ backgroundColor: "#000", color: "#fff" }}>
            Submit Leave Request
          </Button>
        </Box>
      </Modal>

      {/* Employee Details Modal */}
      <Modal
        opened={showEmployeeDetails}
        onClose={() => {
          setShowEmployeeDetails(false);
          setSelectedEmployee(null);
        }}
        title="Employee Details"
        size="lg"
      >
        {selectedEmployee && (
          <Box style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Profile Image Section */}
            <Box style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "10px" }}>
              <Box
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  backgroundColor: "#f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  border: "3px solid #e0e0e0",
                }}
              >
                {selectedEmployee.profile_image_url ? (
                  <img
                    src={selectedEmployee.profile_image_url}
                    alt={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <Text style={{ fontSize: "24px", fontWeight: "600", color: "#999" }}>
                    {selectedEmployee.first_name.charAt(0)}{selectedEmployee.last_name.charAt(0)}
                  </Text>
                )}
              </Box>
              <Box>
                <Text style={{ fontSize: "20px", fontWeight: "600", marginBottom: "5px" }}>
                  {selectedEmployee.first_name} {selectedEmployee.last_name}
                </Text>
                <Text style={{ fontSize: "14px", color: "#666" }}>
                  {selectedEmployee.position} • {selectedEmployee.department}
                </Text>
                <Button
                  size="xs"
                  variant="outline"
                  style={{ marginTop: "8px" }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        // Here you would upload the file and update the employee
                        console.log('Upload file:', file);
                      }
                    };
                    input.click();
                  }}
                >
                  Change Photo
                </Button>
              </Box>
            </Box>
            {/* Personal Information */}
            <Box>
              <Text style={{ fontSize: "16px", fontWeight: "600", marginBottom: "15px", color: "#333" }}>
                Personal Information
              </Text>
              <Box style={{ backgroundColor: "#f9f9f9", padding: "20px", borderRadius: "8px" }}>
                <Grid>
                  <Grid.Col span={6}>
                    <Box style={{ marginBottom: "10px" }}>
                      <Text style={{ fontSize: "12px", color: "#666", fontWeight: "500" }}>Employee ID</Text>
                      <Text style={{ fontSize: "14px", fontWeight: "600" }}>{selectedEmployee.employee_id}</Text>
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box style={{ marginBottom: "10px" }}>
                      <Text style={{ fontSize: "12px", color: "#666", fontWeight: "500" }}>Full Name</Text>
                      <Text style={{ fontSize: "14px", fontWeight: "600" }}>
                        {selectedEmployee.first_name} {selectedEmployee.last_name}
                      </Text>
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box style={{ marginBottom: "10px" }}>
                      <Text style={{ fontSize: "12px", color: "#666", fontWeight: "500" }}>Email</Text>
                      <Text style={{ fontSize: "14px" }}>{selectedEmployee.email}</Text>
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box style={{ marginBottom: "10px" }}>
                      <Text style={{ fontSize: "12px", color: "#666", fontWeight: "500" }}>Phone</Text>
                      <Text style={{ fontSize: "14px" }}>{selectedEmployee.phone || "Not provided"}</Text>
                    </Box>
                  </Grid.Col>
                </Grid>
              </Box>
            </Box>

            {/* Job Information */}
            <Box>
              <Text style={{ fontSize: "16px", fontWeight: "600", marginBottom: "15px", color: "#333" }}>
                Job Information
              </Text>
              <Box style={{ backgroundColor: "#f9f9f9", padding: "20px", borderRadius: "8px" }}>
                <Grid>
                  <Grid.Col span={6}>
                    <Box style={{ marginBottom: "10px" }}>
                      <Text style={{ fontSize: "12px", color: "#666", fontWeight: "500" }}>Department</Text>
                      <Text style={{ fontSize: "14px", fontWeight: "600" }}>{selectedEmployee.department}</Text>
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box style={{ marginBottom: "10px" }}>
                      <Text style={{ fontSize: "12px", color: "#666", fontWeight: "500" }}>Position</Text>
                      <Text style={{ fontSize: "14px", fontWeight: "600" }}>{selectedEmployee.position}</Text>
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box style={{ marginBottom: "10px" }}>
                      <Text style={{ fontSize: "12px", color: "#666", fontWeight: "500" }}>Employment Type</Text>
                      <Badge color="blue" variant="light">
                        {selectedEmployee.employment_type.replace("_", " ").toUpperCase()}
                      </Badge>
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box style={{ marginBottom: "10px" }}>
                      <Text style={{ fontSize: "12px", color: "#666", fontWeight: "500" }}>Status</Text>
                      <Badge color={selectedEmployee.status === "active" ? "green" : "red"}>
                        {selectedEmployee.status.toUpperCase()}
                      </Badge>
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box style={{ marginBottom: "10px" }}>
                      <Text style={{ fontSize: "12px", color: "#666", fontWeight: "500" }}>Hire Date</Text>
                      <Text style={{ fontSize: "14px" }}>
                        {selectedEmployee.hire_date ? new Date(selectedEmployee.hire_date).toLocaleDateString() : "Not provided"}
                      </Text>
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box style={{ marginBottom: "10px" }}>
                      <Text style={{ fontSize: "12px", color: "#666", fontWeight: "500" }}>Salary</Text>
                      <Text style={{ fontSize: "14px", fontWeight: "600", color: "#2e7d32" }}>
                        ${selectedEmployee.salary?.toLocaleString() || "Not specified"}
                      </Text>
                    </Box>
                  </Grid.Col>
                </Grid>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "10px" }}>
              <Button variant="outline" onClick={() => setShowEmployeeDetails(false)}>
                Close
              </Button>
              <Button style={{ backgroundColor: "#000", color: "#fff" }}>
                Edit Employee
              </Button>
            </Box>
          </Box>
        )}
      </Modal>

    </ProtectedRoute>
  );
}

// Employees Tab Component
function EmployeesTab({ 
  employees, 
  onAddEmployee, 
  onViewEmployee 
}: { 
  employees: Employee[], 
  onAddEmployee: () => void,
  onViewEmployee: (employee: Employee) => void
}) {
  return (
    <Box>
      <Box style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <Text style={{ fontSize: "18px", fontWeight: "600" }}>Employee Directory</Text>
        <Button onClick={onAddEmployee} style={{ backgroundColor: "#000", color: "#fff" }}>
          + Add Employee
        </Button>
      </Box>

      {Array.isArray(employees) && employees.length === 0 ? (
        <Text style={{ color: "#999", fontSize: "14px" }}>No employees found</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Employee ID</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Department</Table.Th>
              <Table.Th>Position</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {Array.isArray(employees) && employees.map((emp, idx) => (
              <Table.Tr 
                key={emp.id || idx}
                onClick={() => onViewEmployee(emp)}
                style={{ cursor: "pointer" }}
              >
                <Table.Td>{emp.employee_id}</Table.Td>
                <Table.Td>{emp.first_name} {emp.last_name}</Table.Td>
                <Table.Td>{emp.email}</Table.Td>
                <Table.Td>{emp.department}</Table.Td>
                <Table.Td>{emp.position}</Table.Td>
                <Table.Td>
                  <Badge color={emp.status === "active" ? "green" : "red"}>
                    {emp.status}
                  </Badge>
                </Table.Td>
                <Table.Td onClick={(e) => e.stopPropagation()}>
                  <Button 
                    size="xs" 
                    variant="outline"
                    onClick={() => onViewEmployee(emp)}
                  >
                    View Details
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Box>
  );
}

// Attendance Tab Component
function AttendanceTab({ attendance }: { attendance: AttendanceRecord[] }) {
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceForm, setAttendanceForm] = useState({
    employee_id: "",
    date: new Date().toISOString().split('T')[0],
    check_in_time: "",
    check_out_time: "",
    break_start_time: "",
    break_end_time: "",
    status: "present",
    notes: "",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/hr/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const markAttendance = async () => {
    try {
      const res = await fetch("/api/hr/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attendanceForm),
      });
      if (res.ok) {
        setShowMarkAttendance(false);
        setAttendanceForm({
          employee_id: "",
          date: new Date().toISOString().split('T')[0],
          check_in_time: "",
          check_out_time: "",
          break_start_time: "",
          break_end_time: "",
          status: "present",
          notes: "",
        });
        // Refresh attendance data
        window.location.reload();
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
    }
  };

  return (
    <Box>
      <Box style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <Text style={{ fontSize: "18px", fontWeight: "600" }}>Attendance Records</Text>
        <Box style={{ display: "flex", gap: "10px" }}>
          <Button 
            onClick={() => setShowMarkAttendance(true)}
            style={{ backgroundColor: "#000", color: "#fff" }}
          >
            Mark Attendance
          </Button>
          <Button variant="outline">
            Generate Report
          </Button>
        </Box>
      </Box>

      {!Array.isArray(attendance) || attendance.length === 0 ? (
        <Box style={{ padding: "40px", textAlign: "center", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
          <Text style={{ color: "#999", fontSize: "14px", marginBottom: "10px" }}>
            No attendance records found
          </Text>
          <Text style={{ color: "#666", fontSize: "12px" }}>
            Attendance tracking will appear here once employees start marking attendance.
          </Text>
        </Box>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Employee</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Check In</Table.Th>
              <Table.Th>Check Out</Table.Th>
              <Table.Th>Break Time</Table.Th>
              <Table.Th>Total Hours</Table.Th>
              <Table.Th>Overtime</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {attendance.map((record, idx) => (
              <Table.Tr key={record.id || idx}>
                <Table.Td>{record.employee_name || "Unknown"}</Table.Td>
                <Table.Td>{new Date(record.date).toLocaleDateString()}</Table.Td>
                <Table.Td>{record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : "N/A"}</Table.Td>
                <Table.Td>{record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : "N/A"}</Table.Td>
                <Table.Td>{record.break_hours || 0}h</Table.Td>
                <Table.Td>{record.total_hours || 0}h</Table.Td>
                <Table.Td>{record.overtime_hours || 0}h</Table.Td>
                <Table.Td>
                  <Badge color={
                    record.status === "present" ? "green" : 
                    record.status === "late" ? "yellow" :
                    record.status === "absent" ? "red" : "blue"
                  }>
                    {record.status}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      {/* Mark Attendance Modal */}
      <Modal
        opened={showMarkAttendance}
        onClose={() => setShowMarkAttendance(false)}
        title="Mark Attendance"
        size="md"
      >
        <Box style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <Select
            label="Employee"
            placeholder="Select employee"
            data={employees.map(emp => ({ 
              value: emp.id, 
              label: `${emp.first_name} ${emp.last_name} (${emp.employee_id})` 
            }))}
            value={attendanceForm.employee_id}
            onChange={(val) => setAttendanceForm({ ...attendanceForm, employee_id: val || "" })}
          />
          <Input
            label="Date"
            type="date"
            value={attendanceForm.date}
            onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.currentTarget.value })}
          />
          <Grid>
            <Grid.Col span={6}>
              <Input
                label="Check In Time"
                type="time"
                value={attendanceForm.check_in_time}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, check_in_time: e.currentTarget.value })}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Input
                label="Check Out Time"
                type="time"
                value={attendanceForm.check_out_time}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, check_out_time: e.currentTarget.value })}
              />
            </Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}>
              <Input
                label="Break Start"
                type="time"
                value={attendanceForm.break_start_time}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, break_start_time: e.currentTarget.value })}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Input
                label="Break End"
                type="time"
                value={attendanceForm.break_end_time}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, break_end_time: e.currentTarget.value })}
              />
            </Grid.Col>
          </Grid>
          <Select
            label="Status"
            data={[
              { value: "present", label: "Present" },
              { value: "late", label: "Late" },
              { value: "half_day", label: "Half Day" },
              { value: "absent", label: "Absent" }
            ]}
            value={attendanceForm.status}
            onChange={(val) => setAttendanceForm({ ...attendanceForm, status: val || "present" })}
          />
          <Textarea
            label="Notes"
            placeholder="Additional notes (optional)"
            value={attendanceForm.notes}
            onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.currentTarget.value })}
          />
          <Button onClick={markAttendance} style={{ backgroundColor: "#000", color: "#fff" }}>
            Mark Attendance
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}

// Leave Management Tab Component
function LeaveTab({ leaveRequests, onAddLeave }: { leaveRequests: LeaveRequest[], onAddLeave: () => void }) {
  return (
    <Box>
      <Box style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <Text style={{ fontSize: "18px", fontWeight: "600" }}>Leave Requests</Text>
        <Button onClick={onAddLeave} style={{ backgroundColor: "#000", color: "#fff" }}>
          + Submit Leave Request
        </Button>
      </Box>

      {!Array.isArray(leaveRequests) || leaveRequests.length === 0 ? (
        <Box style={{ padding: "40px", textAlign: "center", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
          <Text style={{ color: "#999", fontSize: "14px", marginBottom: "10px" }}>
            No leave requests found
          </Text>
          <Text style={{ color: "#666", fontSize: "12px" }}>
            Employee leave requests will appear here. Click "Submit Leave Request" to add one.
          </Text>
        </Box>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Employee</Table.Th>
              <Table.Th>Leave Type</Table.Th>
              <Table.Th>Start Date</Table.Th>
              <Table.Th>End Date</Table.Th>
              <Table.Th>Days</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {leaveRequests.map((leave, idx) => (
              <Table.Tr key={leave.id || idx}>
                <Table.Td>{leave.employee_name || "Unknown"}</Table.Td>
                <Table.Td>{leave.leave_type}</Table.Td>
                <Table.Td>{leave.start_date}</Table.Td>
                <Table.Td>{leave.end_date}</Table.Td>
                <Table.Td>{leave.total_days}</Table.Td>
                <Table.Td>
                  <Badge color={
                    leave.status === "approved" ? "green" : 
                    leave.status === "rejected" ? "red" : "yellow"
                  }>
                    {leave.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Button size="xs" variant="outline">Review</Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Box>
  );
}

// Payroll Tab Component
function PayrollTab() {
  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
  const [showGeneratePayroll, setShowGeneratePayroll] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollForm, setPayrollForm] = useState({
    employee_id: "",
    pay_period_start: "",
    pay_period_end: "",
    bonuses: 0,
    allowances: 0,
    deductions: 0,
  });

  useEffect(() => {
    fetchPayrollRecords();
    fetchEmployees();
  }, []);

  const fetchPayrollRecords = async () => {
    try {
      const res = await fetch("/api/hr/payroll");
      if (res.ok) {
        const data = await res.json();
        setPayrollRecords(data || []);
      }
    } catch (error) {
      console.error("Error fetching payroll:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/hr/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const generatePayroll = async () => {
    try {
      const res = await fetch("/api/hr/payroll/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payrollForm),
      });
      if (res.ok) {
        setShowGeneratePayroll(false);
        fetchPayrollRecords();
        setPayrollForm({
          employee_id: "",
          pay_period_start: "",
          pay_period_end: "",
          bonuses: 0,
          allowances: 0,
          deductions: 0,
        });
      }
    } catch (error) {
      console.error("Error generating payroll:", error);
    }
  };

  return (
    <Box>
      <Box style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <Text style={{ fontSize: "18px", fontWeight: "600" }}>Payroll Management</Text>
        <Box style={{ display: "flex", gap: "10px" }}>
          <Button 
            onClick={() => setShowGeneratePayroll(true)}
            style={{ backgroundColor: "#000", color: "#fff" }}
          >
            Generate Payroll
          </Button>
          <Button variant="outline">
            Bulk Generate
          </Button>
        </Box>
      </Box>

      {payrollRecords.length === 0 ? (
        <Box style={{ padding: "40px", textAlign: "center", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
          <Text style={{ color: "#999", fontSize: "14px", marginBottom: "10px" }}>
            No payroll records found
          </Text>
          <Text style={{ color: "#666", fontSize: "12px" }}>
            Generate payroll for employees based on their attendance and salary.
          </Text>
        </Box>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Employee</Table.Th>
              <Table.Th>Pay Period</Table.Th>
              <Table.Th>Regular Hours</Table.Th>
              <Table.Th>Overtime Hours</Table.Th>
              <Table.Th>Gross Salary</Table.Th>
              <Table.Th>Deductions</Table.Th>
              <Table.Th>Net Salary</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {payrollRecords.map((payroll, idx) => (
              <Table.Tr key={payroll.id || idx}>
                <Table.Td>{payroll.employee_name}</Table.Td>
                <Table.Td>
                  {new Date(payroll.pay_period_start).toLocaleDateString()} - {new Date(payroll.pay_period_end).toLocaleDateString()}
                </Table.Td>
                <Table.Td>{payroll.regular_hours}h</Table.Td>
                <Table.Td>{payroll.overtime_hours}h</Table.Td>
                <Table.Td>${payroll.gross_salary?.toLocaleString()}</Table.Td>
                <Table.Td>${(payroll.deductions + payroll.tax_deduction)?.toLocaleString()}</Table.Td>
                <Table.Td style={{ fontWeight: "600", color: "#2e7d32" }}>
                  ${payroll.net_salary?.toLocaleString()}
                </Table.Td>
                <Table.Td>
                  <Badge color={
                    payroll.status === "paid" ? "green" : 
                    payroll.status === "processed" ? "blue" : "yellow"
                  }>
                    {payroll.status}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      {/* Generate Payroll Modal */}
      <Modal
        opened={showGeneratePayroll}
        onClose={() => setShowGeneratePayroll(false)}
        title="Generate Payroll"
        size="md"
      >
        <Box style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <Select
            label="Employee"
            placeholder="Select employee"
            data={employees.map(emp => ({ 
              value: emp.id, 
              label: `${emp.first_name} ${emp.last_name} (${emp.employee_id})` 
            }))}
            value={payrollForm.employee_id}
            onChange={(val) => setPayrollForm({ ...payrollForm, employee_id: val || "" })}
          />
          <Grid>
            <Grid.Col span={6}>
              <Input
                label="Pay Period Start"
                type="date"
                value={payrollForm.pay_period_start}
                onChange={(e) => setPayrollForm({ ...payrollForm, pay_period_start: e.currentTarget.value })}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Input
                label="Pay Period End"
                type="date"
                value={payrollForm.pay_period_end}
                onChange={(e) => setPayrollForm({ ...payrollForm, pay_period_end: e.currentTarget.value })}
              />
            </Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={4}>
              <NumberInput
                label="Bonuses"
                placeholder="0"
                value={payrollForm.bonuses}
                onChange={(val) => setPayrollForm({ ...payrollForm, bonuses: val || 0 })}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <NumberInput
                label="Allowances"
                placeholder="0"
                value={payrollForm.allowances}
                onChange={(val) => setPayrollForm({ ...payrollForm, allowances: val || 0 })}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <NumberInput
                label="Deductions"
                placeholder="0"
                value={payrollForm.deductions}
                onChange={(val) => setPayrollForm({ ...payrollForm, deductions: val || 0 })}
              />
            </Grid.Col>
          </Grid>
          <Text style={{ fontSize: "12px", color: "#666" }}>
            Payroll will be calculated based on attendance records, salary, and overtime for the selected period.
          </Text>
          <Button onClick={generatePayroll} style={{ backgroundColor: "#000", color: "#fff" }}>
            Generate Payroll
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}

// Performance Tab Component
function PerformanceTab() {
  return (
    <Box>
      <Box style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <Text style={{ fontSize: "18px", fontWeight: "600" }}>Performance Reviews</Text>
        <Button style={{ backgroundColor: "#000", color: "#fff" }}>
          New Review
        </Button>
      </Box>
      <Box style={{ padding: "40px", textAlign: "center", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
        <Text style={{ color: "#999", fontSize: "14px", marginBottom: "10px" }}>
          Performance review system coming soon.
        </Text>
        <Text style={{ color: "#666", fontSize: "12px" }}>
          This section will handle employee performance evaluations, goal setting, and feedback.
        </Text>
      </Box>
    </Box>
  );
}