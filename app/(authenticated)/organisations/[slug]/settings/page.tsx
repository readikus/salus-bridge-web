"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrgSettingsSchema, type OrgSettings } from "@/schemas/organisation";
import { fetchOrgSettings, fetchUpdateOrgSettings } from "@/actions/organisations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrganisationSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrgSettings>({
    resolver: zodResolver(OrgSettingsSchema),
  });

  useEffect(() => {
    fetchOrgSettings(slug)
      .then((settings) => {
        // Parse settings with defaults from schema
        const parsed = OrgSettingsSchema.safeParse(settings);
        if (parsed.success) {
          reset(parsed.data);
        } else {
          reset(OrgSettingsSchema.parse({}));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [slug, reset]);

  const onSubmit = async (data: OrgSettings) => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await fetchUpdateOrgSettings(slug, data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Organisation Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Configure absence triggers and notification preferences.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3">
          <p className="text-sm text-green-600">Settings saved successfully.</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Absence Trigger Thresholds</CardTitle>
            <CardDescription>Define when absence triggers should fire based on duration and frequency.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shortTermDays">Short-term Absence (days)</Label>
                <Input
                  id="shortTermDays"
                  type="number"
                  {...register("absenceTriggerThresholds.shortTermDays", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longTermDays">Long-term Absence (days)</Label>
                <Input
                  id="longTermDays"
                  type="number"
                  {...register("absenceTriggerThresholds.longTermDays", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequencyCount">Frequency Count</Label>
                <Input
                  id="frequencyCount"
                  type="number"
                  {...register("absenceTriggerThresholds.frequencyCount", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequencyPeriodDays">Frequency Period (days)</Label>
                <Input
                  id="frequencyPeriodDays"
                  type="number"
                  {...register("absenceTriggerThresholds.frequencyPeriodDays", { valueAsNumber: true })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notification Preferences</CardTitle>
            <CardDescription>Choose which email notifications the organisation receives.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300" {...register("notificationPreferences.emailOnAbsenceReport")} />
                <span className="text-sm">Email when an employee reports an absence</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300" {...register("notificationPreferences.emailOnReturnToWork")} />
                <span className="text-sm">Email when an employee returns to work</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300" {...register("notificationPreferences.emailOnThresholdBreach")} />
                <span className="text-sm">Email when absence thresholds are breached</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300" {...register("notificationPreferences.dailyDigest")} />
                <span className="text-sm">Daily digest of all absences</span>
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
