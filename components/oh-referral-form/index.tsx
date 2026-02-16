"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOhReferralSchema, CreateOhReferralInput } from "@/schemas/oh-referral";
import { ReferralUrgency } from "@/constants/referral-statuses";
import { OhProvider, SicknessCase } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  onSubmit: (data: CreateOhReferralInput) => void;
  providers: OhProvider[];
  sicknessCases: SicknessCase[];
  isLoading: boolean;
}

export function OhReferralForm({ onSubmit, providers, sicknessCases, isLoading }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateOhReferralInput>({
    resolver: zodResolver(createOhReferralSchema),
    defaultValues: {
      urgency: ReferralUrgency.STANDARD,
    },
  });

  const selectedUrgency = watch("urgency");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Sickness Case *</Label>
        <Select onValueChange={(value) => setValue("sicknessCaseId", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a sickness case" />
          </SelectTrigger>
          <SelectContent>
            {sicknessCases.map((sc) => (
              <SelectItem key={sc.id} value={sc.id}>
                {sc.absenceType} - Started {sc.absenceStartDate} ({sc.status})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.sicknessCaseId && <p className="text-sm text-red-600">{errors.sicknessCaseId.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>OH Provider *</Label>
        <Select onValueChange={(value) => setValue("providerId", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a provider" />
          </SelectTrigger>
          <SelectContent>
            {providers.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.providerId && <p className="text-sm text-red-600">{errors.providerId.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Reason for Referral *</Label>
        <Textarea
          id="reason"
          {...register("reason")}
          placeholder="Describe the reason for this OH referral (minimum 10 characters)"
          rows={4}
        />
        {errors.reason && <p className="text-sm text-red-600">{errors.reason.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Urgency</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="STANDARD"
              checked={selectedUrgency === ReferralUrgency.STANDARD}
              onChange={() => setValue("urgency", ReferralUrgency.STANDARD)}
              className="h-4 w-4 border-gray-300 text-blue-600"
            />
            <span className="text-sm">Standard</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="URGENT"
              checked={selectedUrgency === ReferralUrgency.URGENT}
              onChange={() => setValue("urgency", ReferralUrgency.URGENT)}
              className="h-4 w-4 border-gray-300 text-red-600"
            />
            <span className="text-sm text-red-600 font-medium">Urgent</span>
          </label>
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Referral"}
      </Button>
    </form>
  );
}
