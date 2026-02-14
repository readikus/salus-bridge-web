"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAssignAdmin, fetchRemoveAdmin } from "@/actions/organisations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, X } from "lucide-react";

interface AdminInfo {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface Props {
  slug: string;
  admins: AdminInfo[];
}

export function AdminManagement({ slug, admins: initialAdmins }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await fetchAssignAdmin(slug, email.trim());
      setEmail("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to assign admin");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this admin?")) return;

    try {
      await fetchRemoveAdmin(slug, userId);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to remove admin");
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Admin list */}
      {initialAdmins.length > 0 ? (
        <div className="mb-4 space-y-2">
          {initialAdmins.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between rounded-md border border-gray-200 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {[admin.firstName, admin.lastName].filter(Boolean).join(" ") || admin.email}
                </p>
                {(admin.firstName || admin.lastName) && <p className="text-xs text-gray-500">{admin.email}</p>}
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleRemove(admin.id)} className="text-red-500 hover:text-red-700">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-4 text-sm text-gray-500">No admins assigned yet.</p>
      )}

      {/* Add admin form */}
      <form onSubmit={handleAssign} className="flex items-center gap-2">
        <Input
          type="email"
          placeholder="admin@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit" size="sm" disabled={isLoading || !email.trim()}>
          <UserPlus className="mr-2 h-4 w-4" />
          {isLoading ? "Assigning..." : "Add Admin"}
        </Button>
      </form>
    </div>
  );
}
