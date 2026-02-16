"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTriggerConfigSchema, CreateTriggerConfigInput, TriggerType } from "@/schemas/trigger-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Props {
  onSubmit: (data: CreateTriggerConfigInput) => void;
  initialValues?: Partial<CreateTriggerConfigInput>;
  isLoading?: boolean;
}

const TRIGGER_TYPE_OPTIONS = [
  { value: TriggerType.FREQUENCY, label: "Frequency (absence count)" },
  { value: TriggerType.BRADFORD_FACTOR, label: "Bradford Factor (score)" },
  { value: TriggerType.DURATION, label: "Duration (working days lost)" },
];

const THRESHOLD_LABELS: Record<string, string> = {
  [TriggerType.FREQUENCY]: "Number of absences",
  [TriggerType.BRADFORD_FACTOR]: "Bradford Factor score",
  [TriggerType.DURATION]: "Working days lost",
};

export function TriggerConfigForm({ onSubmit, initialValues, isLoading }: Props) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateTriggerConfigInput>({
    resolver: zodResolver(createTriggerConfigSchema),
    defaultValues: {
      name: initialValues?.name || "",
      triggerType: initialValues?.triggerType || TriggerType.FREQUENCY,
      thresholdValue: initialValues?.thresholdValue || 3,
      periodDays: initialValues?.periodDays || 90,
      isActive: initialValues?.isActive ?? true,
    },
  });

  const triggerType = watch("triggerType");
  const showPeriodDays = triggerType !== TriggerType.BRADFORD_FACTOR;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="e.g., Frequent Absence Alert" {...register("name")} />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="triggerType">Trigger Type</Label>
        <Controller
          name="triggerType"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Select trigger type" />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.triggerType && <p className="text-sm text-red-500">{errors.triggerType.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="thresholdValue">{THRESHOLD_LABELS[triggerType] || "Threshold value"}</Label>
        <Input
          id="thresholdValue"
          type="number"
          min={1}
          {...register("thresholdValue", { valueAsNumber: true })}
        />
        {errors.thresholdValue && <p className="text-sm text-red-500">{errors.thresholdValue.message}</p>}
      </div>

      {showPeriodDays && (
        <div className="space-y-2">
          <Label htmlFor="periodDays">Lookback period (days)</Label>
          <Input
            id="periodDays"
            type="number"
            min={1}
            placeholder="e.g., 90"
            {...register("periodDays", { valueAsNumber: true })}
          />
          {errors.periodDays && <p className="text-sm text-red-500">{errors.periodDays.message}</p>}
          <p className="text-xs text-muted-foreground">How far back to look when evaluating this trigger</p>
        </div>
      )}

      {triggerType === TriggerType.BRADFORD_FACTOR && (
        <p className="text-sm text-muted-foreground">
          Bradford Factor always uses a rolling 52-week lookback period.
        </p>
      )}

      <div className="flex items-center space-x-2">
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Saving..." : initialValues ? "Update Trigger" : "Create Trigger"}
      </Button>
    </form>
  );
}
