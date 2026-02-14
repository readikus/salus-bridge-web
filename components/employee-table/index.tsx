"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Mail,
  Pencil,
  UserX,
} from "lucide-react";
import { EmployeeWithDetails } from "@/types/database";
import { EmployeeStatus } from "@/types/enums";

interface Props {
  employees: EmployeeWithDetails[];
  onInvite?: (employeeId: string) => void;
  onDeactivate?: (employeeId: string) => void;
  isLoading?: boolean;
}

const columnHelper = createColumnHelper<EmployeeWithDetails>();

function StatusBadge({ status }: { status: EmployeeStatus }) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    INVITED: "bg-yellow-100 text-yellow-700",
    DEACTIVATED: "bg-gray-100 text-gray-500",
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-500"}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function EmployeeTable({ employees, onInvite, onDeactivate, isLoading }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const columns = [
    columnHelper.accessor(
      (row) => [row.firstName, row.lastName].filter(Boolean).join(" ") || "---",
      {
        id: "name",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: (info) => (
          <Link
            href={`/employees/${info.row.original.id}`}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            {info.getValue()}
          </Link>
        ),
      },
    ),
    columnHelper.accessor("email", {
      header: "Email",
      cell: (info) => <span className="text-gray-600">{info.getValue() || "---"}</span>,
    }),
    columnHelper.accessor("jobTitle", {
      header: "Job Title",
      cell: (info) => <span className="text-gray-600">{info.getValue() || "---"}</span>,
    }),
    columnHelper.accessor("departmentName", {
      header: "Department",
      cell: (info) => <span className="text-gray-600">{info.getValue() || "---"}</span>,
    }),
    columnHelper.accessor(
      (row) =>
        [row.managerFirstName, row.managerLastName].filter(Boolean).join(" ") || null,
      {
        id: "manager",
        header: "Manager",
        cell: (info) => <span className="text-gray-600">{info.getValue() || "---"}</span>,
      },
    ),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const employee = row.original;
        const isOpen = openMenuId === employee.id;

        return (
          <div className="relative">
            <button
              onClick={() => setOpenMenuId(isOpen ? null : employee.id)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {isOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setOpenMenuId(null)}
                />
                <div className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                  <Link
                    href={`/employees/${employee.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setOpenMenuId(null)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    View / Edit
                  </Link>
                  {employee.status !== EmployeeStatus.ACTIVE && onInvite && (
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => {
                        onInvite(employee.id);
                        setOpenMenuId(null);
                      }}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Send Invitation
                    </button>
                  )}
                  {employee.status !== EmployeeStatus.DEACTIVATED && onDeactivate && (
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      onClick={() => {
                        onDeactivate(employee.id);
                        setOpenMenuId(null);
                      }}
                    >
                      <UserX className="h-3.5 w-3.5" />
                      Deactivate
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: employees,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: { pageSize: 20 },
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center">
        <p className="text-gray-500">No employees found. Add your first employee to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-gray-200 bg-gray-50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="whitespace-nowrap px-4 py-3 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <p className="text-sm text-gray-600">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              employees.length,
            )}{" "}
            of {employees.length} employees
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-md border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-600">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-md border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
