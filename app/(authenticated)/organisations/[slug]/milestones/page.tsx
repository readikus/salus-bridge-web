"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { fetchMilestones, deleteMilestoneOverride } from "@/actions/milestones";
import { MilestoneConfig } from "@/types/database";
import { MilestoneConfigForm } from "@/components/milestone-config-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, RotateCcw } from "lucide-react";

export default function MilestonesPage() {
  const params = useParams<{ slug: string }>();
  const [milestones, setMilestones] = useState<MilestoneConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState<string | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneConfig | null>(null);
  const [isResetting, setIsResetting] = useState<string | null>(null);

  const loadMilestones = useCallback(async () => {
    if (!params.slug) return;
    try {
      setIsLoading(true);
      const res = await fetchMilestones(params.slug);
      setMilestones(res.milestones);
      setHasError(null);
    } catch (err: any) {
      setHasError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [params.slug]);

  useEffect(() => {
    loadMilestones();
  }, [loadMilestones]);

  const handleResetToDefault = async (milestone: MilestoneConfig) => {
    if (!params.slug) return;
    setIsResetting(milestone.id);
    try {
      await deleteMilestoneOverride(params.slug, milestone.id);
      await loadMilestones();
    } catch (err: any) {
      setHasError(err.message);
    } finally {
      setIsResetting(null);
    }
  };

  const handleSave = () => {
    setEditingMilestone(null);
    loadMilestones();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">Loading milestone configuration...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{hasError}</div>
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
                      disabled={isResetting === milestone.id}
                    >
                      <RotateCcw className="mr-1 h-3.5 w-3.5" />
                      {isResetting === milestone.id ? "Resetting..." : "Reset"}
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
            <MilestoneConfigForm
              milestone={editingMilestone}
              slug={params.slug}
              onSave={handleSave}
              onCancel={() => setEditingMilestone(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
