export default function StatsCard({ title, value, subtext, icon }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex justify-between border items-center">
      <div>
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <p className="text-3xl font-bold mt-1">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{subtext}</p>
      </div>
      <div className="bg-gray-100 h-10 w-10 rounded-full flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}
