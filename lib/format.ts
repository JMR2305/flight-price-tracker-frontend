export function formatCurrency(
    price: number | null | undefined,
    currency: string | null | undefined,
  ): string {
    if (price == null || currency == null) return "—";
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(price);
    } catch {
      return `${currency} ${price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
  }

  export function formatRelativeTime(iso: string | null | undefined): string {
    if (!iso) return "Never";
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(iso);
  }

  export function formatDate(
    iso: string,
    opts?: Intl.DateTimeFormatOptions,
  ): string {
    return new Date(iso).toLocaleDateString("en-US", opts ?? {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  export function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  export function formatNumber(n: number): string {
    return n.toLocaleString("en-US");
  }

  export function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  export function formatChartDate(iso: string): string {
    const d = new Date(iso);
    const dd  = String(d.getDate()).padStart(2, "0");
    const mmm = MONTHS[d.getMonth()];
    const hh  = String(d.getHours()).padStart(2, "0");
    const day = DAYS[d.getDay()];
    return `${dd}-${mmm} (${hh}) | ${day}`;
  }

  export function formatINR(usdPrice: number | null | undefined, usdToInr: number): string {
    if (usdPrice == null) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(usdPrice * usdToInr);
  }
  