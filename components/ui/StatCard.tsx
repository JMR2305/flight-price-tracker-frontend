interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconBg = "bg-brand-50 text-brand-600",
  loading = false,
}: StatCardProps) {
  return (
    <div className="group bg-white rounded-xl border border-gray-200 p-5 transition-all duration-150 hover:shadow-md hover:-translate-y-px">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {title}
        </p>
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}
        >
          {icon}
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-20 bg-gray-100 rounded animate-pulse mt-1 mb-2" />
      ) : (
        <p className="text-2xl font-bold text-gray-900 leading-none mb-1">
          {value}
        </p>
      )}
      {subtitle && (
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
