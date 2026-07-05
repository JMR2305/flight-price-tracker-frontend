interface StatusBadgeProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  size?: "sm" | "md";
}

export function StatusBadge({
  active,
  activeLabel = "Monitoring",
  inactiveLabel = "Paused",
  size = "sm",
}: StatusBadgeProps) {
  const text = size === "sm" ? "text-xs" : "text-sm";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full ${text} ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60"
          : "bg-gray-100 text-gray-500 ring-1 ring-gray-200/60"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          active ? "bg-emerald-500" : "bg-gray-400"
        }`}
      />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
