"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EmployeeForm } from "@/components/employee-form";
import { fetchCreateEmployee, fetchEmployees } from "@/actions/employees";
import { CreateEmployeeInput } from "@/schemas/employee";
import { EmployeeWithDetails } from "@/types/database";

export default function NewEmployeePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allEmployees, setAllEmployees] = useState<EmployeeWithDetails[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    // Load existing employees (for manager select) and departments
    fetchEmployees()
      .then((employees) => {
        setAllEmployees(employees);
        const depts = [...new Set(employees.map((e) => e.departmentName).filter(Boolean))] as string[];
        setDepartments(depts);
      })
      .catch(() => {
        // Non-critical, form still works without suggestions
      });
  }, []);

  const handleSubmit = async (data: CreateEmployeeInput) => {
    try {
      setIsLoading(true);
      setError(null);
      const employee = await fetchCreateEmployee(data);
      router.push(`/employees/${employee.id}`);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/employees"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Employees
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Add Employee</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new employee record. You can send them an invitation afterwards.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <EmployeeForm
          onSubmit={handleSubmit}
          departments={departments}
          managers={allEmployees}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
