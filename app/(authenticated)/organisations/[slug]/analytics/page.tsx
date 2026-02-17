import { AnalyticsDashboard } from "@/components/analytics-dashboard";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Analytics dashboard page.
 * Displays absence patterns and reporting for the organisation.
 */
export default async function AnalyticsPage({ params }: Props) {
  const { slug } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-gray-500">Absence patterns and reporting</p>
      </div>
      <AnalyticsDashboard slug={slug} />
    </div>
  );
}
