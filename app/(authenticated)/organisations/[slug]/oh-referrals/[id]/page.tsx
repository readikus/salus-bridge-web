"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { fetchOhReferral, updateReferralStatus, addReferralCommunication } from "@/actions/oh-referrals";
import { ReferralStatusBadge } from "@/components/referral-status-badge";
import { CommunicationLog } from "@/components/communication-log";
import {
  ReferralStatus,
  VALID_REFERRAL_TRANSITIONS,
  REFERRAL_STATUS_LABELS,
} from "@/constants/referral-statuses";
import { OhReferralWithDetails, OhReferralCommunicationWithAuthor } from "@/types/database";
import { useAuth } from "@/hooks/use-auth";
import { PERMISSIONS } from "@/constants/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function OhReferralDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const id = params.id as string;
  const { can, isLoading: isAuthLoading } = useAuth();

  const [referral, setReferral] = useState<OhReferralWithDetails | null>(null);
  const [communications, setCommunications] = useState<OhReferralCommunicationWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showReportNotes, setShowReportNotes] = useState(false);
  const [reportNotes, setReportNotes] = useState("");

  const loadReferral = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchOhReferral(slug, id);
      setReferral(data.referral);
      setCommunications(data.communications);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [slug, id]);

  useEffect(() => {
    if (!isAuthLoading) {
      loadReferral();
    }
  }, [loadReferral, isAuthLoading]);

  const handleStatusTransition = async (newStatus: ReferralStatus) => {
    if (newStatus === ReferralStatus.REPORT_RECEIVED && !showReportNotes) {
      setShowReportNotes(true);
      return;
    }

    setIsTransitioning(true);
    try {
      await updateReferralStatus(slug, id, {
        status: newStatus,
        reportNotesEncrypted: newStatus === ReferralStatus.REPORT_RECEIVED ? reportNotes : undefined,
      });
      setShowReportNotes(false);
      setReportNotes("");
      loadReferral();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleAddCommunication = async (direction: string, message: string) => {
    await addReferralCommunication(slug, id, { direction: direction as "INBOUND" | "OUTBOUND", message });
    loadReferral();
  };

  const canManage = can(PERMISSIONS.CREATE_REFERRAL);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">Loading referral...</p>
      </div>
    );
  }

  if (!referral) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm text-red-600">{error || "Referral not found"}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const currentStatus = referral.status as ReferralStatus;
  const validNextStates = VALID_REFERRAL_TRANSITIONS[currentStatus] || [];

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Referrals
        </Button>

        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-gray-900">OH Referral</h1>
          <ReferralStatusBadge status={referral.status} />
          {referral.urgency === "URGENT" && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">Urgent</span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Referral Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Referral Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-gray-500">Employee</p>
                <p className="text-sm">{referral.employeeFirstName} {referral.employeeLastName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">OH Provider</p>
                <p className="text-sm">{referral.providerName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Absence Type</p>
                <p className="text-sm">{referral.absenceType || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Absence Start Date</p>
                <p className="text-sm">{referral.absenceStartDate || "N/A"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-gray-500">Reason for Referral</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{referral.reason}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Created</p>
                <p className="text-sm">{format(new Date(referral.createdAt), "dd MMM yyyy HH:mm")}</p>
              </div>
              {referral.reportReceivedAt && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Report Received</p>
                  <p className="text-sm">{format(new Date(referral.reportReceivedAt), "dd MMM yyyy HH:mm")}</p>
                </div>
              )}
              {referral.reportNotesEncrypted && referral.status === ReferralStatus.REPORT_RECEIVED && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-gray-500">Report Notes</p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{referral.reportNotesEncrypted}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Communication Log */}
          <Card>
            <CardContent className="pt-6">
              <CommunicationLog communications={communications} onAddCommunication={handleAddCommunication} />
            </CardContent>
          </Card>
        </div>

        {/* Status Transitions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canManage && validNextStates.length > 0 ? (
                <>
                  {validNextStates.map((nextStatus) => (
                    <div key={nextStatus}>
                      {nextStatus === ReferralStatus.REPORT_RECEIVED && showReportNotes ? (
                        <div className="space-y-3">
                          <Label>Report Notes</Label>
                          <Textarea
                            value={reportNotes}
                            onChange={(e) => setReportNotes(e.target.value)}
                            placeholder="Enter notes from the OH report..."
                            rows={4}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleStatusTransition(nextStatus)}
                              disabled={isTransitioning}
                            >
                              {isTransitioning ? "Saving..." : "Confirm"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowReportNotes(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          className="w-full"
                          variant={nextStatus === ReferralStatus.CLOSED ? "outline" : "default"}
                          onClick={() => handleStatusTransition(nextStatus)}
                          disabled={isTransitioning}
                        >
                          {REFERRAL_STATUS_LABELS[nextStatus]}
                        </Button>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  {referral.status === ReferralStatus.CLOSED
                    ? "This referral is closed."
                    : "No available transitions."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
