"use client";

interface TrendItem {
  month: string;
  absenceCount: number;
  uniqueEmployees: number;
  totalDaysLost: number;
}

interface Props {
  data: TrendItem[];
}

/**
 * TrendChart -- monthly absence trend visualization.
 * Displays a sparkline-style bar row above a detailed table.
 * Bars are proportional to absenceCount.
 */
export function TrendChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-500">No trend data available for this period.</p>;
  }

  const maxCount = Math.max(...data.map((d) => d.absenceCount), 1);

  return (
    <div className="space-y-4">
      {/* Sparkline bar row */}
      <div className="flex items-end gap-1" style={{ height: 80 }}>
        {data.map((item) => {
          const heightPercent = (item.absenceCount / maxCount) * 100;
          return (
            <div key={item.month} className="group relative flex flex-1 flex-col items-center justify-end">
              <div
                className="w-full rounded-t bg-indigo-400 transition-colors group-hover:bg-indigo-500"
                style={{ height: `${Math.max(heightPercent, 4)}%` }}
              />
              <span className="mt-1 text-[10px] text-gray-500">{item.month.slice(5)}</span>
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block">
                {item.absenceCount} absences
              </div>
            </div>
          );
        })}
      </div>

      {/* Data table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
              <th className="px-3 py-2">Month</th>
              <th className="px-3 py-2 text-right">New Absences</th>
              <th className="px-3 py-2 text-right">Unique Employees</th>
              <th className="px-3 py-2 text-right">Days Lost</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.month} className="border-b border-gray-100">
                <td className="px-3 py-2 font-medium">{item.month}</td>
                <td className="px-3 py-2 text-right">{item.absenceCount}</td>
                <td className="px-3 py-2 text-right">{item.uniqueEmployees}</td>
                <td className="px-3 py-2 text-right">{item.totalDaysLost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
