export default function StatsCard({ title, value, subtext, icon, accent = "pink" }) {
  const bg   = accent === "red" ? "bg-red-50 ring-red-200" : accent === "green" ? "bg-emerald-50 ring-emerald-200" : "bg-pink-50 ring-pink-200";
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`flex-shrink-0 h-12 w-12 rounded-xl ${bg} ring-1 flex items-center justify-center`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>
      </div>
    </div>
  );
}
