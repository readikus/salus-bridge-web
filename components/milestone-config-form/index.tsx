"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateMilestoneConfigSchema, UpdateMilestoneConfigInput } from "@/schemas/milestone-config";
import { MilestoneConfig } from "@/types/database";
import { updateMilestoneOverride, createMilestoneOverride } from "@/actions/milestones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

interface Props {
  milestone: MilestoneConfig;
  slug: string;
  onSave: () => void;
  onCancel: () => void;
}

export function MilestoneConfigForm({ milestone, slug, onSave, onCancel }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UpdateMilestoneConfigInput>({
    resolver: zodResolver(updateMilestoneConfigSchema),
    defaultValues: {
      label: milestone.label,
      dayOffset: milestone.dayOffset,
      description: milestone.description ?? "",
      isActive: milestone.isActive,
    },
  });

  const handleFormSubmit = async (data: UpdateMilestoneConfigInput) => {
    setIsLoading(true);
    setError(null);

    try {
      if (milestone.isDefault) {
        // Creating a new org override from a default
        await createMilestoneOverride(slug, {
          milestoneKey: milestone.milestoneKey,
          label: data.label ?? milestone.label,
          dayOffset: data.dayOffset ?? milestone.dayOffset,
          description: data.description ?? milestone.description ?? undefined,
          isActive: data.isActive ?? milestone.isActive,
        });
      } else {
        // Updating an existing org override
        await updateMilestoneOverride(slug, milestone.id, data);
      }
      onSave();
    } catch (err: any) {
      setError(err.message || "Failed to save milestone config");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="label">Label</Label>
        <Input id="label" placeholder="e.g., Day 7 - Long-Term Transition" {...register("label")} />
        {errors.label && <p className="text-sm text-red-500">{errors.label.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dayOffset">Trigger at day</Label>
        <Input id="dayOffset" type="number" min={1} {...register("dayOffset", { valueAsNumber: true })} />
        {errors.dayOffset && <p className="text-sm text-red-500">{errors.dayOffset.message}</p>}
        <p className="text-xs text-muted-foreground">Number of days from absence start date</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe what should happen at this milestone..."
          {...register("description")}
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} />}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "Saving..." : milestone.isDefault ? "Create Override" : "Update Milestone"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
