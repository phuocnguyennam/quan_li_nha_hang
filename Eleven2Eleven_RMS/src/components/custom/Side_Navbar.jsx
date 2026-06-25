import React from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext"
import e2eLogo from "@/assets/e2e.svg";
import { 
    FlaskConical,
    Users,
    NotebookPen,
    CalendarPlus, // Icon cho đặt bàn mới
    ListChecks,    // Icon cho xem danh sách
    Coffee,
    Package,
    LayoutDashboard, // Thêm icon cho Dashboard/Payment
} from "lucide-react";

export default function Side_Navbar() {
    const location = useLocation();
    const iconStyle = "!w-6 !h-6 group-hover:text-emerald-500";
    const navigate = useNavigate()
    const auth = useAuth()
    const roleName = auth?.user?.role_name || auth?.user?.roleName || auth?.user?.role || ''
    const items = [
        { name: "Payment & Sales", icon: <LayoutDashboard className={iconStyle} />, path: "/dashboard" },
        { name: "Order Management", icon: <NotebookPen className={iconStyle} />, path: "/orders"},
        { name: "Order Statement", icon: <NotebookPen className={iconStyle} />, path: "/kitchen"},
        { name: "Seating Management", icon: <FlaskConical className={iconStyle} />, path: "/seating"},
        { name: "Table Reservation", icon: <CalendarPlus className={iconStyle} />, path: "/reservation" },
        { name: "Reservation Info", icon: <ListChecks className={iconStyle} />, path: "/table-info" },
        { name: "Menu Management", icon: <Coffee className={iconStyle} />, path: "/menu"},
        { name: "Ingredient Management", icon: <Package className={iconStyle} />, path: "/ingredients"},
        { name: "User Management", icon: <Users className={iconStyle} />, path: "/users"},
    ];
    function canAccess(path) {
        if (!roleName) return false
        const rn = roleName.toLowerCase()
        if (rn === 'admin') return true
        if (rn === 'manager') return path !== '/users'
        if (rn.includes('kitchen')) return ['/orders','/ingredients','/kitchen'].includes(path)
        if (rn === 'staff' || rn === 'waiter') return ['/orders','/reservation','/table-info', '/payment'].includes(path)
        return false
    }
    
    const active_user = {name: "Hai Le", role: "Manager"};

    return (
        <aside className="flex flex-col w-80 min-h-screen h-auto bg-gray-200 border-r">
            <div className="flex-1 flex flex-col">
                <div className="p-6 w-full h-50 border-b items-center justify-center flex flex-col gap-2">
                    <Link to="/" className="no-underline flex flex-col items-center gap-2">
                        <img src={e2eLogo} alt="logo" className="h-20 w-20" />
                        <h1 className="text-2xl font-bold text-gray-800">Eleven2Eleven</h1>
                    </Link>
                </div>

                <div className="px-12 mb-6">
                    <Separator className="my-2 bg-black" />
                </div>
    
                <nav className="flex-1 overflow-auto">
                    <ul className="flex flex-col">
                        {items.filter(i => canAccess(i.path)).map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <li key={item.name} className="items-center">
                                    <Link to={item.path} className="no-underline">
                                        <Button 
                                            variant="ghost" 
                                            className={`group justify-start p-7 text-xl w-full font-bold gap-5 rounded-none hover:bg-white ${isActive ? "bg-white text-emerald-600" : ""}`}
                                        >
                                            {React.cloneElement(item.icon, {
                                                className: `${iconStyle} ${isActive ? "text-emerald-500" : ""}`
                                            })}
                                            <p className="text-center">{item.name}</p>
                                        </Button>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>
            {/* Phần Footer User */}
            <div className="px-4 pb-4 border-t border-gray-300 mt-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">{auth.user?.full_name?.[0]?.toUpperCase() || auth.user?.username?.[0]?.toUpperCase() || 'U'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold">{auth.user?.roleName || auth.user?.role || 'User'}</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{auth.user?.full_name || auth.user?.username || 'Not signed in'}</p>
                    </div>
                    {auth.user && (
                        <button 
                            onClick={() => { auth.logout(); navigate('/'); }}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline whitespace-nowrap"

                        >
                            Logout
                        </button>
                    )}
                </div>
            </div>
        </aside>
    )
}