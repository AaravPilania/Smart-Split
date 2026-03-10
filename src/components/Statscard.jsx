export default function StatsCard({ title, value, subtext, icon }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 flex justify-between border items-center">
      <div className="min-w-0 flex-1">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <p className="text-xl sm:text-2xl font-bold mt-1 truncate">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{subtext}</p>
      </div>
      <div className="bg-gray-100 h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
        {icon}
      </div>
    </div>
  );
}
