import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Menu as MenuIcon, 
  LayoutDashboard, 
  ChevronLeft, 
  ChevronRight, 
  Bell, 
  GraduationCap,
  LogOut
} from 'lucide-react';

export default function DashboardLayout({ activeTab, setActiveTab, children }) {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'perfiles', label: 'Perfiles', icon: ShieldCheck },
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'menu-options', label: 'Opciones Menú', icon: MenuIcon },
  ];

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      {/* Sidebar Lateral */}
      <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white transition-all duration-300 flex flex-col justify-between border-r border-slate-800 shrink-0`}>
        <div>
          {/* Logo y Titulo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-indigo-600 p-2 rounded-xl text-white shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              {!collapsed && (
                <div className="leading-tight">
                  <span className="font-bold text-base text-white tracking-wide">Acade<span className="text-indigo-400">Sys</span></span>
                  <span className="block text-[10px] text-slate-400 font-medium">SaaS Educativo</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Botones de Navegacion */}
          <nav className="p-3 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Boton Cerrar Sesion */}
        <div className="p-3 border-t border-slate-800">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl transition">
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Contenedor Derecho */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <div className="text-sm text-slate-500 font-medium">
            Intranet Escolar <span className="mx-2 text-slate-300">/</span> <span className="text-slate-800 capitalize font-semibold">{activeTab}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                AD
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <span className="block text-xs font-semibold text-slate-800">Admin General</span>
                <span className="block text-[11px] text-slate-400">admin@acadesys.edu</span>
              </div>
            </div>
          </div>
        </header>

        {/* Vista activa */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}