"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { switchOrganisation } from "@/actions/switch-org";

interface Organisation {
  id: string;
  name: string;
}

interface Props {
  currentOrganisationId: string;
  organisations: Organisation[];
}

export function OrgSwitcher({ currentOrganisationId, organisations }: Props) {
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);

  const currentOrg = organisations.find((o) => o.id === currentOrganisationId);

  // Single org — just show the name, no dropdown
  if (organisations.length <= 1) {
    return <p className="truncate text-xs text-gray-500">{currentOrg?.name}</p>;
  }

  const handleSwitch = async (orgId: string) => {
    if (orgId === currentOrganisationId || isSwitching) return;
    setIsSwitching(true);
    try {
      await switchOrganisation(orgId);
      router.refresh();
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-1 truncate text-xs text-gray-500 hover:text-gray-700 transition-colors"
        disabled={isSwitching}
      >
        <span className="truncate">{isSwitching ? "Switching..." : currentOrg?.name}</span>
        <ChevronDown className="h-3 w-3 flex-shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {organisations.map((org) => (
          <DropdownMenuCheckboxItem
            key={org.id}
            checked={org.id === currentOrganisationId}
            onSelect={() => handleSwitch(org.id)}
          >
            <span className="truncate">{org.name}</span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
