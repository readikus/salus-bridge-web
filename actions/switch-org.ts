export async function switchOrganisation(organisationId: string): Promise<void> {
  const res = await fetch("/api/auth/switch-org", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organisationId }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to switch organisation");
  }
}
