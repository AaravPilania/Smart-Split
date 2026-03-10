import { Link, useLocation } from "react-router-dom";
import { FiHome, FiUsers, FiDollarSign, FiUser } from "react-icons/fi";

export default function BottomNav() {
  const { pathname } = useLocation();
  const tabs = [
    { to: "/dashboard", Icon: FiHome,       label: "Home" },
    { to: "/groups",    Icon: FiUsers,      label: "Groups" },
    { to: "/expenses",  Icon: FiDollarSign, label: "Expenses" },
    { to: "/profile",   Icon: FiUser,       label: "Profile" },
  ];
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 z-50 flex"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {tabs.map(({ to, Icon, label }) => {
        const active = pathname === to;
        return (
          <Link key={to} to={to} className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative">
            {active && <span className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-full bg-gradient-to-r from-pink-500 to-orange-400" />}
            <Icon size={20} className={active ? "text-pink-500" : "text-gray-400"} />
            <span className={`text-[10px] font-semibold ${active ? "text-pink-500" : "text-gray-400"}`}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
