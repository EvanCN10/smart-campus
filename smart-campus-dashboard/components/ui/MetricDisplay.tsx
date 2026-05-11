import * as React from "react";

export function MetricDisplay({
  label,
  value,
  unit,
  className,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  className?: string;
}) {
  return (
    <div
      className={["flex flex-col gap-1", className].filter(Boolean).join(" ")}
    >
      <div className="text-xs text-zinc-600 dark:text-zinc-400">{label}</div>
      <div className="flex items-baseline gap-1">
        <div className="text-2xl font-semibold leading-none text-black dark:text-white">
          {value}
        </div>
        {unit ? (
          <div className="text-xs text-zinc-600 dark:text-zinc-400">{unit}</div>
        ) : null}
      </div>
    </div>
  );
}
