"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RtwMeeting } from "@/types/database";
import { fetchRtwMeetings } from "@/actions/rtw-meetings";
import { RtwMeetingForm } from "@/components/rtw-meeting-form";
import { RtwQuestionnaire } from "@/components/rtw-questionnaire";
import { GuidancePanel } from "@/components/guidance-panel";

export default function RtwPage() {
  const params = useParams<{ id: string }>();
  const caseId = params.id;

  const [meetings, setMeetings] = useState<RtwMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState<string | null>(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  const loadMeetings = () => {
    if (!caseId) return;

    setIsLoading(true);
    fetchRtwMeetings(caseId)
      .then((response) => {
        setMeetings(response.meetings);
      })
      .catch((err: any) => {
        setHasError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadMeetings();
  }, [caseId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">Loading return-to-work data...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div>
        <Link
          href={`/sickness/${caseId}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Case Detail
        </Link>
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{hasError}</div>
      </div>
    );
  }

  // Find the active meeting (most recent non-cancelled)
  const activeMeeting = meetings.find((m) => m.status !== "CANCELLED");
  const canComplete = true; // Permission already checked at API level

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/sickness/${caseId}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Case Detail
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Return to Work</h1>
        <p className="mt-1 text-sm text-gray-500">
          Schedule and conduct a return-to-work meeting. Use the guidance panel to prepare for the conversation.
        </p>
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content (left) */}
        <div className="lg:col-span-2">
          {showQuestionnaire && activeMeeting?.status === "SCHEDULED" ? (
            <RtwQuestionnaire
              caseId={caseId}
              meetingId={activeMeeting.id}
              onComplete={() => {
                setShowQuestionnaire(false);
                loadMeetings();
              }}
            />
          ) : (
            <RtwMeetingForm
              caseId={caseId}
              existingMeeting={activeMeeting}
              canComplete={canComplete}
              onStartMeeting={() => setShowQuestionnaire(true)}
            />
          )}
        </div>

        {/* Guidance sidebar (right) */}
        <div className="lg:col-span-1">
          <GuidancePanel caseId={caseId} />
        </div>
      </div>
    </div>
  );
}
