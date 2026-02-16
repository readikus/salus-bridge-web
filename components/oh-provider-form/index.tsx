"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ohProviderSchema, OhProviderInput } from "@/schemas/oh-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  onSubmit: (data: OhProviderInput) => void;
  initialValues?: Partial<OhProviderInput>;
  isLoading: boolean;
}

export function OhProviderForm({ onSubmit, initialValues, isLoading }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OhProviderInput>({
    resolver: zodResolver(ohProviderSchema),
    defaultValues: {
      name: initialValues?.name || "",
      contactEmail: initialValues?.contactEmail || "",
      contactPhone: initialValues?.contactPhone || "",
      address: initialValues?.address || "",
      notes: initialValues?.notes || "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Provider Name *</Label>
        <Input id="name" {...register("name")} placeholder="e.g. Occupational Health Solutions Ltd" />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactEmail">Contact Email</Label>
        <Input id="contactEmail" type="email" {...register("contactEmail")} placeholder="contact@provider.com" />
        {errors.contactEmail && <p className="text-sm text-red-600">{errors.contactEmail.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactPhone">Contact Phone</Label>
        <Input id="contactPhone" {...register("contactPhone")} placeholder="+44 1234 567890" />
        {errors.contactPhone && <p className="text-sm text-red-600">{errors.contactPhone.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" {...register("address")} placeholder="Full postal address" rows={3} />
        {errors.address && <p className="text-sm text-red-600">{errors.address.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register("notes")} placeholder="Any additional notes about the provider" rows={3} />
        {errors.notes && <p className="text-sm text-red-600">{errors.notes.message}</p>}
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : initialValues ? "Update Provider" : "Add Provider"}
      </Button>
    </form>
  );
}
