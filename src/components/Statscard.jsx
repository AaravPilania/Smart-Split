export default function StatsCard({ title, value, subtext, icon }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 flex justify-between items-center hover:shadow-md transition-shadow duration-200">
      <div className="min-w-0 flex-1">
        <h3 className="text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-wider">{title}</h3>
        <p className="text-xl sm:text-2xl font-bold mt-1.5 truncate dark:text-white">{value}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtext}</p>
      </div>
      <div className="h-11 w-11 rounded-xl bg-gray-50 dark:bg-gray-700/60 flex items-center justify-center flex-shrink-0 ml-4">
        {icon}
      </div>
    </div>
  );
}
