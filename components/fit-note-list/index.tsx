"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FitNote } from "@/types/database";
import { fetchFitNoteDownloadUrl } from "@/actions/fit-notes";
import { Download, FileText, AlertTriangle } from "lucide-react";

interface Props {
  fitNotes: FitNote[];
  caseId: string;
}

const STATUS_LABELS: Record<string, string> = {
  NOT_FIT: "Not fit for work",
  MAY_BE_FIT: "May be fit for work",
};

const EFFECT_LABELS: Record<string, string> = {
  phased_return: "Phased return",
  altered_hours: "Altered hours",
  amended_duties: "Amended duties",
  adapted_workplace: "Adapted workplace",
};

function getExpiryInfo(endDate: string | null): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } | null {
  if (!endDate) return null;

  const end = new Date(endDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: "Expired", variant: "destructive" };
  }
  if (diffDays <= 3) {
    return { label: `Expires in ${diffDays} day${diffDays !== 1 ? "s" : ""}`, variant: "destructive" };
  }
  if (diffDays <= 7) {
    return { label: `Expires in ${diffDays} days`, variant: "secondary" };
  }
  return { label: `Expires in ${diffDays} days`, variant: "default" };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function FitNoteList({ fitNotes, caseId }: Props) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = useCallback(
    async (fitNoteId: string) => {
      setDownloadingId(fitNoteId);
      try {
        const { signedUrl } = await fetchFitNoteDownloadUrl(caseId, fitNoteId);
        window.open(signedUrl, "_blank");
      } catch (error: any) {
        console.error("Download failed:", error.message);
      } finally {
        setDownloadingId(null);
      }
    },
    [caseId],
  );

  if (fitNotes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-500">No fit notes uploaded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {fitNotes.map((fitNote) => {
        const expiryInfo = getExpiryInfo(fitNote.endDate);
        const isExpiringSoon = expiryInfo && (expiryInfo.variant === "destructive" || expiryInfo.variant === "secondary");

        return (
          <Card key={fitNote.id} className={isExpiringSoon ? "border-amber-200" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{fitNote.fileName}</span>
                    <Badge variant={fitNote.fitNoteStatus === "NOT_FIT" ? "destructive" : "secondary"}>
                      {STATUS_LABELS[fitNote.fitNoteStatus] || fitNote.fitNoteStatus}
                    </Badge>
                    {expiryInfo && (
                      <Badge variant={expiryInfo.variant}>
                        {expiryInfo.variant === "destructive" && <AlertTriangle className="mr-1 h-3 w-3" />}
                        {expiryInfo.label}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span>Start: {formatDate(fitNote.startDate)}</span>
                    {fitNote.endDate && <span>End: {formatDate(fitNote.endDate)}</span>}
                    <span>Uploaded: {formatDate(fitNote.createdAt as unknown as string)}</span>
                  </div>

                  {fitNote.functionalEffects && fitNote.functionalEffects.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {fitNote.functionalEffects.map((effect) => (
                        <Badge key={effect} variant="outline" className="text-xs">
                          {EFFECT_LABELS[effect] || effect}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(fitNote.id)}
                  disabled={downloadingId === fitNote.id}
                >
                  <Download className="mr-1 h-3 w-3" />
                  {downloadingId === fitNote.id ? "Loading..." : "Download"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
