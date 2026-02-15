"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, XCircle, CheckCircle2, FileText } from "lucide-react";
import { RtwMeeting } from "@/types/database";
import { fetchScheduleRtwMeeting, fetchCancelRtwMeeting } from "@/actions/rtw-meetings";

interface Props {
  caseId: string;
  existingMeeting?: RtwMeeting;
  canComplete: boolean;
  onStartMeeting?: () => void;
}

/**
 * RTW meeting form -- handles scheduling, viewing, and cancelling meetings.
 * For completed meetings, shows a read-only summary.
 */
export function RtwMeetingForm({ caseId, existingMeeting, canComplete, onStartMeeting }: Props) {
  const router = useRouter();
  const [scheduledDate, setScheduledDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate) return;

    setIsLoading(true);
    setHasError(null);

    try {
      await fetchScheduleRtwMeeting(caseId, new Date(scheduledDate).toISOString());
      setSuccessMessage("RTW meeting scheduled successfully");
      setTimeout(() => router.refresh(), 1000);
    } catch (err: any) {
      setHasError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!existingMeeting) return;

    setIsLoading(true);
    setHasError(null);

    try {
      await fetchCancelRtwMeeting(caseId, existingMeeting.id);
      setSuccessMessage("RTW meeting cancelled");
      setTimeout(() => router.refresh(), 1000);
    } catch (err: any) {
      setHasError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // No existing meeting: show scheduling form
  if (!existingMeeting) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Schedule RTW Meeting</h2>
        </div>

        <p className="mb-4 text-sm text-gray-600">
          Schedule a return-to-work meeting with the employee. This will move the case to the RTW Scheduled state.
        </p>

        {hasError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {hasError}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSchedule}>
          <label className="mb-1 block text-sm font-medium text-gray-700">Meeting Date and Time</label>
          <input
            type="datetime-local"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="mb-4 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />

          <button
            type="submit"
            disabled={isLoading || !scheduledDate}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Calendar className="h-4 w-4" />
            {isLoading ? "Scheduling..." : "Schedule Meeting"}
          </button>
        </form>
      </div>
    );
  }

  // Meeting exists and is SCHEDULED
  if (existingMeeting.status === "SCHEDULED") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-gray-900">RTW Meeting Scheduled</h2>
        </div>

        <div className="mb-4 rounded-md border border-amber-100 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">
            <span className="font-medium">Scheduled for:</span>{" "}
            {new Date(existingMeeting.scheduledDate).toLocaleDateString("en-GB", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {hasError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {hasError}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <div className="flex gap-3">
          {canComplete && (
            <button
              onClick={onStartMeeting}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <FileText className="h-4 w-4" />
              Start Meeting
            </button>
          )}

          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            {isLoading ? "Cancelling..." : "Cancel Meeting"}
          </button>
        </div>
      </div>
    );
  }

  // Meeting COMPLETED: show read-only summary
  if (existingMeeting.status === "COMPLETED") {
    const adjustments = existingMeeting.adjustments || [];

    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">RTW Meeting Completed</h2>
        </div>

        <div className="mb-4 rounded-md border border-green-100 bg-green-50 px-4 py-3">
          <p className="text-sm text-green-800">
            <span className="font-medium">Completed on:</span>{" "}
            {existingMeeting.completedDate
              ? new Date(existingMeeting.completedDate).toLocaleDateString("en-GB", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "Date not recorded"}
          </p>
        </div>

        {adjustments.length > 0 && (
          <div className="mb-4">
            <h3 className="mb-2 text-sm font-medium text-gray-900">Agreed Adjustments</h3>
            <ul className="space-y-2">
              {adjustments.map((adj, idx) => (
                <li key={idx} className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                  <span className="text-sm font-medium text-gray-700">{adj.type.replace(/_/g, " ")}</span>
                  <p className="text-sm text-gray-600">{adj.description}</p>
                  {adj.reviewDate && (
                    <p className="mt-1 text-xs text-gray-500">
                      Review: {new Date(adj.reviewDate).toLocaleDateString("en-GB")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {adjustments.length === 0 && (
          <p className="text-sm text-gray-500">No workplace adjustments were recorded.</p>
        )}
      </div>
    );
  }

  // Meeting CANCELLED
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <XCircle className="h-5 w-5 text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900">RTW Meeting Cancelled</h2>
      </div>
      <p className="text-sm text-gray-500">This meeting was cancelled. You can schedule a new one if needed.</p>
    </div>
  );
}
