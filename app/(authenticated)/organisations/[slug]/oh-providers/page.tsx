"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Plus, Pencil, Trash2, Mail, Phone, MapPin } from "lucide-react";
import { fetchOhProviders, createOhProvider, updateOhProvider, deleteOhProvider } from "@/actions/oh-providers";
import { OhProviderForm } from "@/components/oh-provider-form";
import { OhProviderInput } from "@/schemas/oh-provider";
import { OhProvider } from "@/types/database";
import { useAuth } from "@/hooks/use-auth";
import { PERMISSIONS } from "@/constants/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function OhProvidersPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { can, isLoading: isAuthLoading } = useAuth();

  const [providers, setProviders] = useState<OhProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<OhProvider | null>(null);

  const loadProviders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchOhProviders(slug);
      setProviders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!isAuthLoading) {
      loadProviders();
    }
  }, [loadProviders, isAuthLoading]);

  const handleCreate = async (data: OhProviderInput) => {
    setIsSubmitting(true);
    try {
      await createOhProvider(slug, data);
      setDialogOpen(false);
      loadProviders();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: OhProviderInput) => {
    if (!editingProvider) return;
    setIsSubmitting(true);
    try {
      await updateOhProvider(slug, editingProvider.id, data);
      setEditingProvider(null);
      setDialogOpen(false);
      loadProviders();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this provider? All associated referrals will also be deleted.")) {
      return;
    }
    try {
      await deleteOhProvider(slug, id);
      loadProviders();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEdit = (provider: OhProvider) => {
    setEditingProvider(provider);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingProvider(null);
    setDialogOpen(true);
  };

  const canManage = can(PERMISSIONS.MANAGE_OH_PROVIDERS);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">OH Providers</h1>
          <p className="mt-1 text-sm text-gray-500">Manage occupational health providers linked to your organisation.</p>
        </div>
        {canManage && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Provider
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingProvider ? "Edit Provider" : "Add OH Provider"}</DialogTitle>
                <DialogDescription>
                  {editingProvider ? "Update the provider details below." : "Enter the details for the new OH provider."}
                </DialogDescription>
              </DialogHeader>
              <OhProviderForm
                onSubmit={editingProvider ? handleUpdate : handleCreate}
                initialValues={
                  editingProvider
                    ? {
                        name: editingProvider.name,
                        contactEmail: editingProvider.contactEmail || "",
                        contactPhone: editingProvider.contactPhone || "",
                        address: editingProvider.address || "",
                        notes: editingProvider.notes || "",
                      }
                    : undefined
                }
                isLoading={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-gray-500">Loading providers...</p>
        </div>
      ) : providers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-12">
          <p className="text-sm text-gray-500">No OH providers configured yet.</p>
          {canManage && (
            <Button variant="outline" className="mt-4" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add your first provider
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <Card key={provider.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{provider.name}</CardTitle>
                  {canManage && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(provider)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(provider.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                {provider.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{provider.contactEmail}</span>
                  </div>
                )}
                {provider.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{provider.contactPhone}</span>
                  </div>
                )}
                {provider.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                    <span className="whitespace-pre-line">{provider.address}</span>
                  </div>
                )}
                {provider.notes && <p className="mt-2 text-xs text-gray-400 italic">{provider.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
