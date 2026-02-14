"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrganisationForm } from "@/components/organisation-form";
import { fetchCreateOrganisation } from "@/actions/organisations";
import { CreateOrganisationInput } from "@/schemas/organisation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewOrganisationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateOrganisationInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const org = await fetchCreateOrganisation(data);
      router.push(`/organisations/${org.slug}`);
    } catch (err: any) {
      setError(err.message || "Failed to create organisation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">New Organisation</h1>
        <p className="mt-1 text-sm text-gray-500">Create a new organisation on the platform.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Organisation Details</CardTitle>
          <CardDescription>Enter the basic details for the new organisation. You can assign admins after creation.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <OrganisationForm onSubmit={handleSubmit} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
