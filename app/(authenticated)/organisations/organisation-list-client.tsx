"use client";

import { OrganisationList } from "@/components/organisation-list";
import { Organisation } from "@/types/database";

interface Props {
  organisations: (Organisation & { employeeCount: number })[];
}

export function OrganisationListClient({ organisations }: Props) {
  return <OrganisationList organisations={organisations} />;
}
