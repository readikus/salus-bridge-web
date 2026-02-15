"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createSicknessCaseSchema, CreateSicknessCaseInput } from "@/schemas/sickness-case";
import { fetchCreateSicknessCase } from "@/actions/sickness-cases";
import { AbsenceType, ABSENCE_TYPE_LABELS } from "@/constants/absence-types";
import { EmployeeWithDetails } from "@/types/database";

interface Props {
  employees?: EmployeeWithDetails[];
  currentEmployeeId?: string;
  isManagerReporting?: boolean;
}

export function SicknessReportForm({ employees = [], currentEmployeeId, isManagerReporting }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSicknessCaseInput>({
    resolver: zodResolver(createSicknessCaseSchema),
    defaultValues: {
      employeeId: currentEmployeeId || "",
      absenceType: undefined,
      absenceStartDate: new Date().toISOString().split("T")[0],
      absenceEndDate: undefined,
      notes: "",
    },
  });

  const onSubmit = async (data: CreateSicknessCaseInput) => {
    try {
      setIsLoading(true);
      setHasError(null);
      // Clean up optional fields
      const cleanData = {
        ...data,
        absenceEndDate: data.absenceEndDate || undefined,
        notes: data.notes || undefined,
      };
      const sicknessCase = await fetchCreateSicknessCase(cleanData);
      router.push(`/sickness/${sicknessCase.id}`);
    } catch (err: any) {
      setHasError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {hasError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{hasError}</div>
      )}

      {/* Employee select (only shown for managers/HR) */}
      {isManagerReporting && employees.length > 0 ? (
        <div>
          <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
            Employee <span className="text-red-500">*</span>
          </label>
          <select
            id="employeeId"
            {...register("employeeId")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select an employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {[emp.firstName, emp.lastName].filter(Boolean).join(" ")} {emp.email ? `(${emp.email})` : ""}
              </option>
            ))}
          </select>
          {errors.employeeId && <p className="mt-1 text-sm text-red-600">{errors.employeeId.message}</p>}
        </div>
      ) : (
        <input type="hidden" {...register("employeeId")} />
      )}

      {/* Absence Type */}
      <div>
        <label htmlFor="absenceType" className="block text-sm font-medium text-gray-700">
          Absence Type <span className="text-red-500">*</span>
        </label>
        <select
          id="absenceType"
          {...register("absenceType")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select absence type</option>
          {Object.entries(ABSENCE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.absenceType && <p className="mt-1 text-sm text-red-600">{errors.absenceType.message}</p>}
      </div>

      {/* Start Date */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="absenceStartDate" className="block text-sm font-medium text-gray-700">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            id="absenceStartDate"
            type="date"
            {...register("absenceStartDate")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.absenceStartDate && (
            <p className="mt-1 text-sm text-red-600">{errors.absenceStartDate.message}</p>
          )}
        </div>

        {/* End Date (optional) */}
        <div>
          <label htmlFor="absenceEndDate" className="block text-sm font-medium text-gray-700">
            End Date <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="absenceEndDate"
            type="date"
            {...register("absenceEndDate")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.absenceEndDate && <p className="mt-1 text-sm text-red-600">{errors.absenceEndDate.message}</p>}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes <span className="text-gray-400">(optional, max 2000 characters)</span>
        </label>
        <textarea
          id="notes"
          rows={4}
          maxLength={2000}
          {...register("notes")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Any additional details about the absence..."
        />
        {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? "Reporting..." : "Report Sickness"}
        </button>
      </div>
    </form>
  );
}
