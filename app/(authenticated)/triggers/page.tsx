"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSessionTriggerConfigs,
  createSessionTriggerConfig,
  updateSessionTriggerConfig,
  deleteSessionTriggerConfig,
  fetchSessionTriggerAlerts,
  acknowledgeSessionTriggerAlert,
} from "@/actions/triggers";
import { TriggerConfigForm } from "@/components/trigger-config-form";
import { BradfordFactorBadge } from "@/components/bradford-factor-badge";
import { TriggerConfig } from "@/types/database";
import { CreateTriggerConfigInput } from "@/schemas/trigger-config";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, CheckCircle } from "lucide-react";

const TRIGGER_TYPE_LABELS: Record<string, string> = {
  FREQUENCY: "Frequency",
  BRADFORD_FACTOR: "Bradford Factor",
  DURATION: "Duration",
};

export default function TriggersPage() {
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<TriggerConfig | null>(null);
  const [showOnlyUnacknowledged, setShowOnlyUnacknowledged] = useState(false);

  // Fetch trigger configs
  const { data: configsData, isLoading: isLoadingConfigs } = useQuery({
    queryKey: ["session-trigger-configs"],
    queryFn: () => fetchSessionTriggerConfigs(),
  });

  // Fetch trigger alerts
  const { data: alertsData, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ["session-trigger-alerts", showOnlyUnacknowledged],
    queryFn: () =>
      fetchSessionTriggerAlerts({
        acknowledged: showOnlyUnacknowledged ? false : undefined,
      }),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTriggerConfigInput) => createSessionTriggerConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-trigger-configs"] });
      setIsCreateOpen(false);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateTriggerConfigInput }) =>
      updateSessionTriggerConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-trigger-configs"] });
      setEditingConfig(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSessionTriggerConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-trigger-configs"] });
    },
  });

  // Acknowledge mutation
  const acknowledgeMutation = useMutation({
    mutationFn: (alertId: string) => acknowledgeSessionTriggerAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-trigger-alerts"] });
    },
  });

  const configs = configsData?.configs || [];
  const alerts = alertsData?.alerts || [];

  const handleCreate = (data: CreateTriggerConfigInput) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (data: CreateTriggerConfigInput) => {
    if (!editingConfig) return;
    updateMutation.mutate({ id: editingConfig.id, data });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this trigger?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trigger Points</h1>
        <p className="text-muted-foreground">
          Configure absence trigger thresholds and view alerts when employees breach them.
        </p>
      </div>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Trigger Rules</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {alerts.filter((a) => !a.acknowledgedAt).length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alerts.filter((a) => !a.acknowledgedAt).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Trigger Rules</CardTitle>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Trigger
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Trigger Rule</DialogTitle>
                    <DialogDescription>
                      Define a new absence trigger threshold for your organisation.
                    </DialogDescription>
                  </DialogHeader>
                  <TriggerConfigForm onSubmit={handleCreate} isLoading={createMutation.isPending} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoadingConfigs ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : configs.length === 0 ? (
                <p className="text-muted-foreground">No trigger rules configured yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Threshold</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {configs.map((config) => (
                      <TableRow key={config.id}>
                        <TableCell className="font-medium">{config.name}</TableCell>
                        <TableCell>{TRIGGER_TYPE_LABELS[config.triggerType] || config.triggerType}</TableCell>
                        <TableCell>{config.thresholdValue}</TableCell>
                        <TableCell>
                          {config.triggerType === "BRADFORD_FACTOR"
                            ? "52 weeks"
                            : config.periodDays
                              ? `${config.periodDays} days`
                              : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.isActive ? "default" : "secondary"}>
                            {config.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog
                              open={editingConfig?.id === config.id}
                              onOpenChange={(open) => !open && setEditingConfig(null)}
                            >
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => setEditingConfig(config)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Trigger Rule</DialogTitle>
                                  <DialogDescription>Update the trigger threshold configuration.</DialogDescription>
                                </DialogHeader>
                                <TriggerConfigForm
                                  onSubmit={handleUpdate}
                                  initialValues={{
                                    name: config.name,
                                    triggerType: config.triggerType as any,
                                    thresholdValue: config.thresholdValue,
                                    periodDays: config.periodDays || undefined,
                                    isActive: config.isActive,
                                  }}
                                  isLoading={updateMutation.isPending}
                                />
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(config.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Trigger Alerts</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOnlyUnacknowledged(!showOnlyUnacknowledged)}
              >
                {showOnlyUnacknowledged ? "Show All" : "Show Unacknowledged Only"}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingAlerts ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : alerts.length === 0 ? (
                <p className="text-muted-foreground">No trigger alerts.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Trigger</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-medium">
                          {alert.employeeFirstName} {(alert.employeeLastName || "")[0]}
                        </TableCell>
                        <TableCell>{alert.triggerName}</TableCell>
                        <TableCell>
                          {alert.triggerType === "BRADFORD_FACTOR" ? (
                            <BradfordFactorBadge score={alert.triggeredValue} />
                          ) : (
                            <span>
                              {alert.triggeredValue} / {alert.thresholdValue}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(alert.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          {alert.acknowledgedAt ? (
                            <Badge variant="secondary">Acknowledged</Badge>
                          ) : (
                            <Badge variant="destructive">Unacknowledged</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!alert.acknowledgedAt && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => acknowledgeMutation.mutate(alert.id)}
                              disabled={acknowledgeMutation.isPending}
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Acknowledge
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
