"use client";

import { useRef } from "react";
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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function OrganisationForm({ onSubmit, defaultValues, isLoading = false }: Props) {
  const slugManuallyEdited = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateOrganisationInput>({
    resolver: zodResolver(CreateOrganisationSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      slug: defaultValues?.slug || "",
    },
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!slugManuallyEdited.current) {
      setValue("slug", slugify(e.target.value));
    }
  };

  const handleSlugChange = () => {
    slugManuallyEdited.current = true;
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
        <Input id="slug" placeholder="e.g. acme-corporation" {...register("slug", { onChange: handleSlugChange })} />
        <p className="text-xs text-gray-400">This will be used in the organisation URL. Lowercase letters, numbers, and hyphens only.</p>
        {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Organisation"}
      </Button>
    </form>
  );
}
