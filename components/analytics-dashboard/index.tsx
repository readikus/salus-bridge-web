"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAnalytics, exportAnalyticsCSV, exportAnalyticsPDF } from "@/actions/analytics";
import { AbsenceRateChart } from "./absence-rate-chart";
import { TrendChart } from "./trend-chart";
import { BradfordTable } from "./bradford-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Loader2 } from "lucide-react";

interface Props {
  slug: string;
}

/**
 * AnalyticsDashboard -- main analytics layout with filters, charts, and export.
 * Uses TanStack Query to fetch analytics data with configurable period/groupBy/department.
 */
export function AnalyticsDashboard({ slug }: Props) {
  const [period, setPeriod] = useState<string>("12m");
  const [groupBy, setGroupBy] = useState<string>("department");
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics", slug, period, groupBy],
    queryFn: () => fetchAnalytics(slug, { period, groupBy }),
  });

  async function handleExportCSV() {
    setIsExporting(true);
    try {
      await exportAnalyticsCSV(slug, { period, groupBy });
    } catch (err) {
      console.error("CSV export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleExportPDF() {
    setIsExporting(true);
    try {
      await exportAnalyticsPDF(slug, { period, groupBy });
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load analytics data. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top bar: filters and export buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Period</label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">3 months</SelectItem>
              <SelectItem value="6m">6 months</SelectItem>
              <SelectItem value="12m">12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Group by</label>
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="team">Team</SelectItem>
              <SelectItem value="department">Department</SelectItem>
              <SelectItem value="organisation">Organisation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={isExporting || isLoading}>
            {isExporting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExporting || isLoading}>
            {isExporting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FileText className="mr-1 h-4 w-4" />}
            PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading analytics...</span>
        </div>
      ) : data ? (
        <>
          {/* Section 1: Absence Rates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Absence Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <AbsenceRateChart data={data.absenceRates} />
            </CardContent>
          </Card>

          {/* Section 2: Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart data={data.trends} />
            </CardContent>
          </Card>

          {/* Section 3: Bradford Factor Scores */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bradford Factor Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <BradfordTable data={data.bradfordScores} />
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
