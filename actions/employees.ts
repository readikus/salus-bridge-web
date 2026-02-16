import { EmployeeWithDetails, EmployeeFilters, DataSubjectRecord } from "@/types/database";
import { CreateEmployeeInput, UpdateEmployeeInput } from "@/schemas/employee";
import { ImportResult } from "@/schemas/csv-import";
import { UserRole } from "@/types/enums";

/**
 * Fetch all employees for the current organisation with optional filters.
 */
export async function fetchEmployees(filters?: EmployeeFilters): Promise<EmployeeWithDetails[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.departmentId) params.set("departmentId", filters.departmentId);

  const queryString = params.toString();
  const url = `/api/employees${queryString ? `?${queryString}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch employees");
  }

  const data = await res.json();
  return data.employees;
}

/**
 * Fetch a single employee by ID.
 */
export async function fetchEmployee(id: string): Promise<{ employee: EmployeeWithDetails; roles: UserRole[] }> {
  const res = await fetch(`/api/employees/${id}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch employee");
  }

  return res.json();
}

/**
 * Create a new employee.
 */
export async function fetchCreateEmployee(data: CreateEmployeeInput): Promise<EmployeeWithDetails> {
  const res = await fetch("/api/employees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const responseData = await res.json().catch(() => ({}));
    throw new Error(responseData.error || "Failed to create employee");
  }

  const responseData = await res.json();
  return responseData.employee;
}

/**
 * Update an employee's details and/or roles.
 */
export async function fetchUpdateEmployee(
  id: string,
  data: UpdateEmployeeInput & { roles?: UserRole[] },
): Promise<{ employee: EmployeeWithDetails; roles: UserRole[] }> {
  const res = await fetch(`/api/employees/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const responseData = await res.json().catch(() => ({}));
    throw new Error(responseData.error || "Failed to update employee");
  }

  return res.json();
}

/**
 * Deactivate an employee (soft delete).
 */
export async function fetchDeactivateEmployee(id: string): Promise<void> {
  const res = await fetch(`/api/employees/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to deactivate employee");
  }
}

/**
 * Send an invitation to a single employee.
 */
export async function fetchSendInvitation(employeeId: string): Promise<{ invitationUrl: string }> {
  const res = await fetch(`/api/employees/${employeeId}/invite`, {
    method: "POST",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to send invitation");
  }

  return res.json();
}

/**
 * Import employees with pre-parsed rows and confirmed column mapping.
 * Posts JSON payload instead of FormData -- used by the new import wizard.
 */
export async function fetchImportEmployeesWithMapping(
  rows: Record<string, string>[],
  mapping: Record<string, string>,
): Promise<ImportResult> {
  const res = await fetch("/api/employees/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows, mapping }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to import employees");
  }

  const data = await res.json();
  return data.result;
}

/**
 * Import employees from a CSV file (ORG-01). Legacy FormData path.
 */
export async function fetchImportEmployees(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/employees/import", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to import employees");
  }

  const data = await res.json();
  return data.result;
}

/**
 * Fetch all data held about the current user -- SAR readiness (COMP-05).
 */
export async function fetchMyData(): Promise<DataSubjectRecord> {
  const res = await fetch("/api/me/data");

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch my data");
  }

  const responseData = await res.json();
  return responseData.data;
}
