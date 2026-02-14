"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateOrganisationSchema, type CreateOrganisationInput } from "@/schemas/organisation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  onSubmit: (data: CreateOrganisationInput) => void;
  defaultValues?: Partial<CreateOrganisationInput>;
  isLoading?: boolean;
}

/**
 * Slugify a string: lowercase, replace spaces/special chars with hyphens, trim hyphens.
 */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function OrganisationForm({ onSubmit, defaultValues, isLoading = false }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateOrganisationInput>({
    resolver: zodResolver(CreateOrganisationSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      slug: defaultValues?.slug || "",
    },
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    // Auto-generate slug from name if slug hasn't been manually edited
    const currentSlug = watch("slug");
    const expectedSlug = slugify(watch("name"));

    // Only auto-update slug if it matches what would have been auto-generated
    if (!currentSlug || currentSlug === expectedSlug) {
      setValue("slug", slugify(name));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Organisation Name</Label>
        <Input
          id="name"
          placeholder="e.g. Acme Corporation"
          {...register("name", {
            onChange: handleNameChange,
          })}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">URL Slug</Label>
        <Input id="slug" placeholder="e.g. acme-corporation" {...register("slug")} />
        <p className="text-xs text-gray-400">This will be used in the organisation URL. Lowercase letters, numbers, and hyphens only.</p>
        {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Organisation"}
      </Button>
    </form>
  );
}
