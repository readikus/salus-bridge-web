"use client";

import { useState, useEffect } from "react";
import { fetchConsent, submitConsent, fetchGpDetails } from "@/actions/gp-details";
import { MedicalRecordsConsent } from "@/types/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  employeeId: string;
  onChanged?: () => void;
}

export function ConsentForm({ employeeId, onChanged }: Props) {
  const [consent, setConsent] = useState<MedicalRecordsConsent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);

  useEffect(() => {
    fetchConsent(employeeId)
      .then((data) => {
        setConsent(data);
      })
      .catch((err) => {
        console.error("Failed to load consent:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [employeeId]);

  const handleGrant = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Check GP details exist first
      const gpDetails = await fetchGpDetails(employeeId);
      if (!gpDetails?.gpName) {
        setErrorMessage("Please add your GP details above before granting consent.");
        setIsSubmitting(false);
        return;
      }

      const result = await submitConsent(employeeId, {
        consentStatus: "GRANTED",
        notes: notes || undefined,
      });
      setConsent(result);
      setNotes("");
      onChanged?.();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to grant consent.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setRevokeDialogOpen(false);

    try {
      const result = await submitConsent(employeeId, {
        consentStatus: "REVOKED",
        notes: notes || undefined,
      });
      setConsent(result);
      setNotes("");
      onChanged?.();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to revoke consent.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Medical Records Consent</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medical Records Consent</CardTitle>
        <CardDescription>
          Manage your consent for medical records access by your employer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current status display */}
        {consent?.consentStatus === "GRANTED" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="success">Consent Granted</Badge>
              {consent.consentDate && (
                <span className="text-sm text-gray-500">on {formatDate(consent.consentDate)}</span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              You have granted permission for your employer to request medical records from your GP on your behalf.
            </p>
          </div>
        )}

        {consent?.consentStatus === "REVOKED" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="warning">Consent Revoked</Badge>
              {consent.revokedDate && (
                <span className="text-sm text-gray-500">on {formatDate(consent.revokedDate)}</span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              You have revoked consent for medical records access. You can re-grant consent at any time.
            </p>
          </div>
        )}

        {!consent && (
          <div className="space-y-3">
            <Badge variant="outline">No Consent</Badge>
            <p className="text-sm text-gray-600">
              By granting consent, you authorise your employer to request relevant medical records from your GP in
              relation to your absence from work. This consent can be revoked at any time. Your GP details must be
              provided before consent can be granted.
            </p>
          </div>
        )}

        {/* Notes field */}
        <div>
          <Label htmlFor="consentNotes">Notes (optional)</Label>
          <Textarea
            id="consentNotes"
            placeholder="Add any notes..."
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {(!consent || consent.consentStatus === "REVOKED") && (
            <Button onClick={handleGrant} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : consent ? "Re-grant Consent" : "Grant Consent"}
            </Button>
          )}

          {consent?.consentStatus === "GRANTED" && (
            <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" disabled={isSubmitting}>
                  Revoke Consent
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Revoke Medical Records Consent</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to revoke consent? Your employer will no longer be able to request medical
                    records from your GP. You can re-grant consent at any time.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRevokeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleRevoke} disabled={isSubmitting}>
                    {isSubmitting ? "Revoking..." : "Confirm Revoke"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
