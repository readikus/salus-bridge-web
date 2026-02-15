"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getDaysInMonth, startOfMonth, getDay, format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AbsenceEntry {
  employeeName: string;
  startDate: string;
  endDate?: string;
  status: string;
  absenceType: string;
  caseId: string;
}

interface Props {
  absences: AbsenceEntry[];
  month: number;
  year: number;
}

const STATUS_COLOURS: Record<string, { bg: string; text: string; label: string }> = {
  REPORTED: { bg: "bg-amber-200", text: "text-amber-800", label: "Reported" },
  TRACKING: { bg: "bg-blue-200", text: "text-blue-800", label: "Tracking" },
  FIT_NOTE_RECEIVED: { bg: "bg-purple-200", text: "text-purple-800", label: "Fit Note" },
  RTW_SCHEDULED: { bg: "bg-teal-200", text: "text-teal-800", label: "RTW Scheduled" },
  RTW_COMPLETED: { bg: "bg-teal-100", text: "text-teal-600", label: "RTW Completed" },
  CLOSED: { bg: "bg-gray-200", text: "text-gray-600", label: "Closed" },
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getPrivacySafeName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] || "";
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export function AbsenceCalendar({ absences, month, year }: Props) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date(year, month - 1, 1));

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = startOfMonth(currentDate);
  // getDay returns 0 for Sunday, we want Monday = 0
  const startDayIndex = (getDay(firstDayOfMonth) + 6) % 7;

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Build day-to-absences map
  const dayAbsences = useMemo(() => {
    const map: Record<number, AbsenceEntry[]> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      map[d] = [];
    }

    for (const absence of absences) {
      const absStart = new Date(absence.startDate);
      const absEnd = absence.endDate ? new Date(absence.endDate) : new Date(currentYear, currentMonth + 1, 0);

      const monthStart = new Date(currentYear, currentMonth, 1);
      const monthEnd = new Date(currentYear, currentMonth, daysInMonth);

      // Check if absence overlaps with this month
      if (absStart > monthEnd || absEnd < monthStart) continue;

      const overlapStart = Math.max(absStart.getDate(), absStart < monthStart ? 1 : absStart.getDate());
      const overlapEnd = Math.min(
        absEnd > monthEnd ? daysInMonth : absEnd.getDate(),
        daysInMonth,
      );

      // Handle cases where the absence starts in a previous month
      const effectiveStart = absStart < monthStart ? 1 : overlapStart;

      for (let d = effectiveStart; d <= overlapEnd; d++) {
        if (map[d]) {
          // Avoid duplicates for the same case
          if (!map[d].some((a) => a.caseId === absence.caseId)) {
            map[d].push(absence);
          }
        }
      }
    }

    return map;
  }, [absences, currentMonth, currentYear, daysInMonth]);

  // Build blank cells for offset
  const blanks = Array.from({ length: startDayIndex }, (_, i) => i);

  // Desktop: calendar grid
  const renderCalendarGrid = () => (
    <div className="hidden sm:block">
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {/* Day headers */}
        {DAY_NAMES.map((day) => (
          <div key={day} className="bg-gray-50 px-2 py-2 text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}

        {/* Blank cells for offset */}
        {blanks.map((i) => (
          <div key={`blank-${i}`} className="bg-white min-h-[80px]" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const dayAbs = dayAbsences[day] || [];
          return (
            <div key={day} className="bg-white min-h-[80px] p-1">
              <div className="text-xs font-medium text-gray-400 mb-1">{day}</div>
              <div className="space-y-0.5">
                {dayAbs.slice(0, 3).map((absence) => {
                  const statusStyle = STATUS_COLOURS[absence.status] || STATUS_COLOURS.REPORTED;
                  return (
                    <button
                      key={absence.caseId}
                      onClick={() => router.push(`/sickness/${absence.caseId}`)}
                      className={`w-full rounded px-1 py-0.5 text-left text-[10px] leading-tight truncate ${statusStyle.bg} ${statusStyle.text} hover:opacity-80 transition-opacity`}
                    >
                      {getPrivacySafeName(absence.employeeName)}
                    </button>
                  );
                })}
                {dayAbs.length > 3 && (
                  <div className="text-[10px] text-gray-400 px-1">+{dayAbs.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Mobile: list view
  const renderListView = () => {
    const daysWithAbsences = Object.entries(dayAbsences)
      .filter(([, abs]) => abs.length > 0)
      .sort(([a], [b]) => Number(a) - Number(b));

    return (
      <div className="sm:hidden space-y-2">
        {daysWithAbsences.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">No absences this month.</p>
        )}
        {daysWithAbsences.map(([day, abs]) => (
          <div key={day} className="rounded-lg border border-gray-200 p-3">
            <div className="text-xs font-medium text-gray-500 mb-2">
              {format(new Date(currentYear, currentMonth, Number(day)), "EEEE d MMMM")}
            </div>
            <div className="space-y-1">
              {abs.map((absence) => {
                const statusStyle = STATUS_COLOURS[absence.status] || STATUS_COLOURS.REPORTED;
                return (
                  <button
                    key={absence.caseId}
                    onClick={() => router.push(`/sickness/${absence.caseId}`)}
                    className={`w-full rounded px-2 py-1.5 text-left text-xs ${statusStyle.bg} ${statusStyle.text} hover:opacity-80 transition-opacity`}
                  >
                    {getPrivacySafeName(absence.employeeName)} - {statusStyle.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Legend
  const renderLegend = () => (
    <div className="flex flex-wrap gap-3 mt-4">
      {Object.entries(STATUS_COLOURS).map(([status, style]) => (
        <div key={status} className="flex items-center gap-1.5">
          <div className={`h-3 w-3 rounded ${style.bg}`} />
          <span className="text-xs text-gray-600">{style.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={handlePrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <Button variant="outline" size="sm" onClick={handleNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {renderCalendarGrid()}
      {renderListView()}
      {renderLegend()}
    </div>
  );
}
