"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { gpDetailsSchema, GpDetailsInput } from "@/schemas/gp-details";
import { fetchGpDetails, updateGpDetails } from "@/actions/gp-details";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Props {
  employeeId: string;
  onSaved?: () => void;
}

export function GpDetailsForm({ employeeId, onSaved }: Props) {
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GpDetailsInput>({
    resolver: zodResolver(gpDetailsSchema),
    defaultValues: {
      gpName: null,
      gpAddress: null,
      gpPhone: null,
    },
  });

  useEffect(() => {
    fetchGpDetails(employeeId)
      .then((details) => {
        if (details) {
          reset({
            gpName: details.gpName,
            gpAddress: details.gpAddress,
            gpPhone: details.gpPhone,
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load GP details:", err);
      })
      .finally(() => {
        setIsLoadingData(false);
      });
  }, [employeeId, reset]);

  const onSubmit = async (data: GpDetailsInput) => {
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await updateGpDetails(employeeId, data);
      setSuccessMessage("GP details saved successfully.");
      onSaved?.();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save GP details.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>GP Details</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>GP Details</CardTitle>
        <CardDescription>
          Your registered GP information. This is used if we need to request medical records.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="gpName">GP Name / Practice Name</Label>
            <Input id="gpName" placeholder="Enter GP or practice name" {...register("gpName")} className="mt-1" />
            {errors.gpName && <p className="mt-1 text-sm text-red-600">{errors.gpName.message}</p>}
          </div>

          <div>
            <Label htmlFor="gpAddress">GP Address</Label>
            <Textarea
              id="gpAddress"
              placeholder="Enter GP surgery address"
              rows={3}
              {...register("gpAddress")}
              className="mt-1"
            />
            {errors.gpAddress && <p className="mt-1 text-sm text-red-600">{errors.gpAddress.message}</p>}
          </div>

          <div>
            <Label htmlFor="gpPhone">GP Phone Number</Label>
            <Input id="gpPhone" placeholder="Enter GP phone number" {...register("gpPhone")} className="mt-1" />
            {errors.gpPhone && <p className="mt-1 text-sm text-red-600">{errors.gpPhone.message}</p>}
          </div>

          {successMessage && (
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errorMessage}
            </div>
          )}

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save GP Details"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
