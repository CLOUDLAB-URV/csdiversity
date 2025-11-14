import React from "react";

interface CountryTooltipProps {
  active?: boolean;
  payload?: Array<any> | null;
  label?: string;
  colorMap?: Map<string, string>;
  labelFormatter?: (label: string) => string;
  valueFormatter?: (value: number) => string;
  title?: string;
}

export function CountryTooltip({
  active,
  payload,
  label,
  colorMap,
  labelFormatter,
  valueFormatter,
  title,
}: CountryTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const rows = payload
    .filter((item) => item && typeof item.value === "number" && item.value > 0)
    .map((item) => {
      const name = String(item.dataKey ?? item.name ?? "");
      const value = Number(item.value ?? 0);
      const color = colorMap?.get(name) ?? item.color ?? "#94a3b8";
      return { name, value, color };
    })
    .sort((a, b) => b.value - a.value);

  if (rows.length === 0) {
    return null;
  }

  const formatValue = valueFormatter ?? ((value: number) => `${value.toFixed(2)}%`);
  const formattedLabel = labelFormatter ? labelFormatter(String(label ?? "")) : label;

  return (
    <div className="rounded-lg border border-gray-200 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
      <div className="mb-3">
        {title ? <div className="text-xs uppercase text-muted-foreground">{title}</div> : null}
        <div className="text-sm font-semibold text-foreground">{formattedLabel}</div>
      </div>
      <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: row.color }} />
              <span className="text-sm text-foreground/90">{row.name}</span>
            </div>
            <span className="text-sm font-medium text-foreground">{formatValue(row.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

