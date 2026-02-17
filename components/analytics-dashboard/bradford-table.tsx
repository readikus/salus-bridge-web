"use client";

import { useState } from "react";
import { BradfordFactorBadge } from "@/components/bradford-factor-badge";
import { ChevronDown, ChevronUp } from "lucide-react";

interface BradfordRow {
  employeeId: string;
  firstName: string | null;
  lastName: string | null;
  departmentName: string | null;
  score: number;
  spells: number;
  totalDays: number;
  riskLevel: string;
}

interface Props {
  data: BradfordRow[];
}

type SortColumn = "score" | "spells" | "totalDays";
type SortDirection = "asc" | "desc";

/**
 * BradfordTable -- sortable table displaying Bradford Factor scores per employee.
 * Default sort: score descending. Sortable columns: score, spells, totalDays.
 * Uses BradfordFactorBadge from 03-01 for risk-level display.
 */
export function BradfordTable({ data }: Props) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  if (data.length === 0) {
    return <p className="text-sm text-gray-500">No Bradford Factor data available.</p>;
  }

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    return sortDirection === "desc" ? bVal - aVal : aVal - bVal;
  });

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  }

  function SortIcon({ column }: { column: SortColumn }) {
    if (sortColumn !== column) {
      return <ChevronDown className="ml-1 inline h-3 w-3 text-gray-300" />;
    }
    return sortDirection === "desc" ? (
      <ChevronDown className="ml-1 inline h-3 w-3" />
    ) : (
      <ChevronUp className="ml-1 inline h-3 w-3" />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
            <th className="px-3 py-2">Employee Name</th>
            <th className="px-3 py-2">Department</th>
            <th
              className="cursor-pointer px-3 py-2 text-right hover:text-gray-700"
              onClick={() => handleSort("score")}
            >
              Bradford Score
              <SortIcon column="score" />
            </th>
            <th
              className="cursor-pointer px-3 py-2 text-right hover:text-gray-700"
              onClick={() => handleSort("spells")}
            >
              Spells
              <SortIcon column="spells" />
            </th>
            <th
              className="cursor-pointer px-3 py-2 text-right hover:text-gray-700"
              onClick={() => handleSort("totalDays")}
            >
              Days Lost
              <SortIcon column="totalDays" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row) => {
            const name = [row.firstName, row.lastName].filter(Boolean).join(" ") || "Unknown";
            return (
              <tr key={row.employeeId} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{name}</td>
                <td className="px-3 py-2 text-gray-600">{row.departmentName || "—"}</td>
                <td className="px-3 py-2 text-right">
                  <BradfordFactorBadge score={row.score} />
                </td>
                <td className="px-3 py-2 text-right">{row.spells}</td>
                <td className="px-3 py-2 text-right">{row.totalDays}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
