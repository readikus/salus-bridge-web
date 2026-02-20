"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { SicknessCase } from "@/types/database";
import { SicknessState } from "@/constants/sickness-states";
import { ABSENCE_TYPE_LABELS, AbsenceType } from "@/constants/absence-types";

interface Props {
  cases: SicknessCase[];
  total: number;
  hideEmployeeName?: boolean;
}

/**
 * Extended case type with employee name for display.
 * The API may return joined employee names in the future;
 * for now we display case fields only.
 */
type CaseRow = SicknessCase;

const columnHelper = createColumnHelper<CaseRow>();

const STATUS_STYLES: Record<string, string> = {
  REPORTED: "bg-yellow-100 text-yellow-800",
  TRACKING: "bg-blue-100 text-blue-800",
  FIT_NOTE_RECEIVED: "bg-purple-100 text-purple-800",
  RTW_SCHEDULED: "bg-indigo-100 text-indigo-800",
  RTW_COMPLETED: "bg-teal-100 text-teal-800",
  CLOSED: "bg-gray-100 text-gray-600",
};

function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return "---";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AbsenceHistory({ cases, total, hideEmployeeName }: Props) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([{ id: "absenceStartDate", desc: true }]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");

  const columns = [
    ...(hideEmployeeName
      ? []
      : [
          columnHelper.display({
            id: "employeeName",
            header: "Employee",
            cell: (info) => {
              const { employeeFirstName, employeeLastName } = info.row.original;
              return [employeeFirstName, employeeLastName].filter(Boolean).join(" ") || "---";
            },
          }),
        ]),
    columnHelper.accessor("absenceType", {
      header: "Absence Type",
      cell: (info) => ABSENCE_TYPE_LABELS[info.getValue() as AbsenceType] || info.getValue(),
      enableSorting: false,
    }),
    columnHelper.accessor("absenceStartDate", {
      header: ({ column }) => (
        <button
          className="flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Start Date
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: (info) => formatDate(info.getValue()),
    }),
    columnHelper.accessor("absenceEndDate", {
      header: "End Date",
      cell: (info) => formatDate(info.getValue()),
      enableSorting: false,
    }),
    columnHelper.accessor("workingDaysLost", {
      header: "Days Lost",
      cell: (info) => (info.getValue() !== null ? info.getValue() : "---"),
      enableSorting: false,
    }),
    columnHelper.accessor("status", {
      header: ({ column }) => (
        <button
          className="flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: (info) => {
        const status = info.getValue();
        return (
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              STATUS_STYLES[status] || "bg-gray-100 text-gray-500"
            }`}
          >
            {formatStatus(status)}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => (
        <button
          onClick={() => router.push(`/sickness/${info.row.original.id}`)}
          className="cursor-pointer text-sm text-blue-600 hover:text-blue-800"
        >
          View
        </button>
      ),
    }),
  ];

  // Client-side filtering
  const filteredCases = cases.filter((c) => {
    if (statusFilter && c.status !== statusFilter) return false;
    return true;
  });

  const table = useReactTable({
    data: filteredCases,
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

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex items-center gap-4">
        <div>
          <label htmlFor="status-filter" className="sr-only">
            Filter by status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            {Object.values(SicknessState).map((state) => (
              <option key={state} value={state}>
                {formatStatus(state)}
              </option>
            ))}
          </select>
        </div>
        <span className="text-sm text-gray-500">
          {filteredCases.length} case{filteredCases.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-gray-500">
                  No sickness cases found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/sickness/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
            <p className="text-sm text-gray-500">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
