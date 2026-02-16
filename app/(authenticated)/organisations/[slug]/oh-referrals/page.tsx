"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Eye } from "lucide-react";
import { format } from "date-fns";
import { fetchOhReferrals, createOhReferral, OhReferralFilters } from "@/actions/oh-referrals";
import { fetchOhProviders } from "@/actions/oh-providers";
import { fetchSicknessCases } from "@/actions/sickness-cases";
import { OhReferralForm } from "@/components/oh-referral-form";
import { ReferralStatusBadge } from "@/components/referral-status-badge";
import { CreateOhReferralInput } from "@/schemas/oh-referral";
import { OhReferralWithDetails, OhProvider, SicknessCase } from "@/types/database";
import { ReferralStatus, REFERRAL_STATUS_LABELS } from "@/constants/referral-statuses";
import { useAuth } from "@/hooks/use-auth";
import { PERMISSIONS } from "@/constants/permissions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function OhReferralsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { can, isLoading: isAuthLoading } = useAuth();

  const [referrals, setReferrals] = useState<OhReferralWithDetails[]>([]);
  const [providers, setProviders] = useState<OhProvider[]>([]);
  const [sicknessCases, setSicknessCases] = useState<SicknessCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadReferrals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const filters: OhReferralFilters = {};
      if (statusFilter !== "ALL") filters.status = statusFilter;

      const data = await fetchOhReferrals(slug, filters);
      setReferrals(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [slug, statusFilter]);

  const loadFormData = useCallback(async () => {
    try {
      const [provs, cases] = await Promise.all([
        fetchOhProviders(slug),
        fetchSicknessCases(),
      ]);
      setProviders(provs);
      setSicknessCases(cases.cases);
    } catch (err: any) {
      console.error("Failed to load form data:", err);
    }
  }, [slug]);

  useEffect(() => {
    if (!isAuthLoading) {
      loadReferrals();
      loadFormData();
    }
  }, [loadReferrals, loadFormData, isAuthLoading]);

  const handleCreate = async (data: CreateOhReferralInput) => {
    setIsSubmitting(true);
    try {
      await createOhReferral(slug, data);
      setDialogOpen(false);
      loadReferrals();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCreate = can(PERMISSIONS.CREATE_REFERRAL);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">OH Referrals</h1>
          <p className="mt-1 text-sm text-gray-500">Track occupational health referrals for sickness cases.</p>
        </div>
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Referral
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create OH Referral</DialogTitle>
                <DialogDescription>
                  Create a new referral to an occupational health provider for a sickness case.
                </DialogDescription>
              </DialogHeader>
              <OhReferralForm
                onSubmit={handleCreate}
                providers={providers}
                sicknessCases={sicknessCases}
                isLoading={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="mb-4 flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.entries(REFERRAL_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-gray-500">Loading referrals...</p>
        </div>
      ) : referrals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-12">
          <p className="text-sm text-gray-500">No referrals found.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.map((referral) => (
                <TableRow key={referral.id}>
                  <TableCell className="font-medium">
                    {referral.employeeFirstName} {referral.employeeLastName}
                  </TableCell>
                  <TableCell>{referral.providerName}</TableCell>
                  <TableCell>
                    <ReferralStatusBadge status={referral.status} />
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        referral.urgency === "URGENT"
                          ? "text-sm font-medium text-red-600"
                          : "text-sm text-gray-600"
                      }
                    >
                      {referral.urgency === "URGENT" ? "Urgent" : "Standard"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {format(new Date(referral.createdAt), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/organisations/${slug}/oh-referrals/${referral.id}`)
                      }
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
