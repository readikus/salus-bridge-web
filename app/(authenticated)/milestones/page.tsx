"use client";

import { useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSessionMilestones,
  createSessionMilestoneOverride,
  updateSessionMilestoneOverride,
  deleteSessionMilestoneOverride,
} from "@/actions/milestones";
import {
  updateMilestoneConfigSchema,
  milestoneGuidanceSchema,
  UpdateMilestoneConfigInput,
} from "@/schemas/milestone-config";
import { MilestoneConfigWithGuidance } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, RotateCcw, Plus, X } from "lucide-react";

const formSchema = updateMilestoneConfigSchema.extend({
  guidance: milestoneGuidanceSchema
    .extend({
      instructions: z.array(z.object({ value: z.string().min(1) })).min(1).max(20),
    })
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

function SessionMilestoneConfigForm({
  milestone,
  onSave,
  onCancel,
}: {
  milestone: MilestoneConfigWithGuidance;
  onSave: (milestone: MilestoneConfigWithGuidance, data: UpdateMilestoneConfigInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: milestone.label,
      dayOffset: milestone.dayOffset,
      description: milestone.description ?? "",
      isActive: milestone.isActive,
      guidance: milestone.guidance
        ? {
            actionTitle: milestone.guidance.actionTitle,
            managerGuidance: milestone.guidance.managerGuidance,
            suggestedText: milestone.guidance.suggestedText,
            instructions: milestone.guidance.instructions.map((i) => ({ value: i })),
            employeeView: milestone.guidance.employeeView,
          }
        : undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "guidance.instructions",
  });

  const handleFormSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const submitData: UpdateMilestoneConfigInput = {
        label: data.label,
        dayOffset: data.dayOffset,
        description: data.description,
        isActive: data.isActive,
      };

      if (data.guidance) {
        submitData.guidance = {
          actionTitle: data.guidance.actionTitle,
          managerGuidance: data.guidance.managerGuidance,
          suggestedText: data.guidance.suggestedText,
          instructions: data.guidance.instructions.map((i) => i.value),
          employeeView: data.guidance.employeeView,
        };
      }

      await onSave(milestone, submitData);
    } catch (err: any) {
      setError(err.message || "Failed to save milestone config");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Tabs defaultValue="configuration">
        <TabsList className="w-full">
          <TabsTrigger value="configuration" className="flex-1">
            Configuration
          </TabsTrigger>
          <TabsTrigger value="guidance" className="flex-1">
            Guidance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4 pt-2">
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
        </TabsContent>

        <TabsContent value="guidance" className="max-h-[60vh] space-y-4 overflow-y-auto pt-2">
          <div className="space-y-2">
            <Label htmlFor="guidance.actionTitle">Action Title</Label>
            <Input
              id="guidance.actionTitle"
              placeholder="e.g., Check in with employee"
              {...register("guidance.actionTitle")}
            />
            {errors.guidance?.actionTitle && (
              <p className="text-sm text-red-500">{errors.guidance.actionTitle.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guidance.managerGuidance">Manager Guidance</Label>
            <Textarea
              id="guidance.managerGuidance"
              placeholder="Guidance for the manager at this milestone..."
              rows={4}
              {...register("guidance.managerGuidance")}
            />
            {errors.guidance?.managerGuidance && (
              <p className="text-sm text-red-500">{errors.guidance.managerGuidance.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guidance.suggestedText">Suggested Text</Label>
            <Textarea
              id="guidance.suggestedText"
              placeholder="Suggested message text for the manager to send..."
              rows={4}
              {...register("guidance.suggestedText")}
            />
            {errors.guidance?.suggestedText && (
              <p className="text-sm text-red-500">{errors.guidance.suggestedText.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Instructions</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ value: "" })}
                disabled={fields.length >= 20}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input
                    placeholder={`Step ${index + 1}`}
                    {...register(`guidance.instructions.${index}.value`)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            {errors.guidance?.instructions && (
              <p className="text-sm text-red-500">
                {typeof errors.guidance.instructions.message === "string"
                  ? errors.guidance.instructions.message
                  : "At least one instruction is required"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guidance.employeeView">Employee View</Label>
            <Textarea
              id="guidance.employeeView"
              placeholder="What the employee sees at this milestone..."
              rows={4}
              {...register("guidance.employeeView")}
            />
            {errors.guidance?.employeeView && (
              <p className="text-sm text-red-500">{errors.guidance.employeeView.message}</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

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
  const [editingMilestone, setEditingMilestone] = useState<MilestoneConfigWithGuidance | null>(null);

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

  const handleSave = async (milestone: MilestoneConfigWithGuidance, data: UpdateMilestoneConfigInput) => {
    if (milestone.isDefault) {
      await createSessionMilestoneOverride({
        milestoneKey: milestone.milestoneKey,
        label: data.label ?? milestone.label,
        dayOffset: data.dayOffset ?? milestone.dayOffset,
        description: data.description ?? milestone.description ?? undefined,
        isActive: data.isActive ?? milestone.isActive,
        guidance: data.guidance,
      });
    } else {
      await updateSessionMilestoneOverride(milestone.id, data);
    }
    queryClient.invalidateQueries({ queryKey: ["session-milestones"] });
    setEditingMilestone(null);
  };

  const handleResetToDefault = (milestone: MilestoneConfigWithGuidance) => {
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
          <Card
            key={milestone.milestoneKey}
            className={`relative ${!milestone.isActive ? "opacity-50" : ""}`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{milestone.label}</CardTitle>
                  <Badge variant="secondary" className={milestone.isDefault ? "bg-gray-100" : "bg-blue-50 text-blue-700"}>
                    {milestone.isDefault ? "Default" : "Custom"}
                  </Badge>
                  {!milestone.isActive && (
                    <Badge variant="secondary" className="bg-red-50 text-red-600">
                      Inactive
                    </Badge>
                  )}
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
              <div className="flex flex-col gap-1 text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="font-medium text-gray-700">Day {milestone.dayOffset}</span>
                  {milestone.description && <span>{milestone.description}</span>}
                </div>
                {milestone.guidance?.actionTitle && (
                  <span className="text-xs text-gray-400">Guidance: {milestone.guidance.actionTitle}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingMilestone} onOpenChange={(open) => !open && setEditingMilestone(null)}>
        <DialogContent className="max-w-2xl">
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
