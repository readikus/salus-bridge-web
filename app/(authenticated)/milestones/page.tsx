"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSessionMilestones,
  createSessionMilestoneOverride,
  updateSessionMilestoneOverride,
  deleteSessionMilestoneOverride,
} from "@/actions/milestones";
import { updateMilestoneConfigSchema, UpdateMilestoneConfigInput } from "@/schemas/milestone-config";
import { MilestoneConfig } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Pencil, RotateCcw } from "lucide-react";

function SessionMilestoneConfigForm({
  milestone,
  onSave,
  onCancel,
}: {
  milestone: MilestoneConfig;
  onSave: (milestone: MilestoneConfig, data: UpdateMilestoneConfigInput) => Promise<void>;
  onCancel: () => void;
}) {
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
      await onSave(milestone, data);
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

export default function MilestonesPage() {
  const queryClient = useQueryClient();
  const [editingMilestone, setEditingMilestone] = useState<MilestoneConfig | null>(null);

  const {
    data: milestonesData,
    isLoading,
    error: loadError,
  } = useQuery({
    queryKey: ["session-milestones"],
    queryFn: () => fetchSessionMilestones(),
  });

  const resetMutation = useMutation({
    mutationFn: (id: string) => deleteSessionMilestoneOverride(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-milestones"] });
    },
  });

  const milestones = milestonesData?.milestones || [];

  const handleSave = async (milestone: MilestoneConfig, data: UpdateMilestoneConfigInput) => {
    if (milestone.isDefault) {
      await createSessionMilestoneOverride({
        milestoneKey: milestone.milestoneKey,
        label: data.label ?? milestone.label,
        dayOffset: data.dayOffset ?? milestone.dayOffset,
        description: data.description ?? milestone.description ?? undefined,
        isActive: data.isActive ?? milestone.isActive,
      });
    } else {
      await updateSessionMilestoneOverride(milestone.id, data);
    }
    queryClient.invalidateQueries({ queryKey: ["session-milestones"] });
    setEditingMilestone(null);
  };

  const handleResetToDefault = (milestone: MilestoneConfig) => {
    resetMutation.mutate(milestone.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">Loading milestone configuration...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {loadError.message}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Milestone Timeline Configuration</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure when milestone actions are triggered during employee absence. Customise timings for your
          organisation or use the system defaults.
        </p>
      </div>

      <div className="grid gap-3">
        {milestones.map((milestone) => (
          <Card key={milestone.milestoneKey} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{milestone.label}</CardTitle>
                  <Badge variant="secondary" className={milestone.isDefault ? "bg-gray-100" : "bg-blue-50 text-blue-700"}>
                    {milestone.isDefault ? "Default" : "Custom"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditingMilestone(milestone)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  {!milestone.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResetToDefault(milestone)}
                      disabled={resetMutation.isPending}
                    >
                      <RotateCcw className="mr-1 h-3.5 w-3.5" />
                      {resetMutation.isPending ? "Resetting..." : "Reset"}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="font-medium text-gray-700">Day {milestone.dayOffset}</span>
                {milestone.description && <span>{milestone.description}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingMilestone} onOpenChange={(open) => !open && setEditingMilestone(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMilestone?.isDefault ? "Create Milestone Override" : "Edit Milestone"}
            </DialogTitle>
          </DialogHeader>
          {editingMilestone && (
            <SessionMilestoneConfigForm
              milestone={editingMilestone}
              onSave={handleSave}
              onCancel={() => setEditingMilestone(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
