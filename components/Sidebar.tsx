import React from 'react';
import { LogOut } from 'lucide-react';
import { MENU_ITEMS, APP_NAME } from '../constants';
import { UserProfile } from '../types';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  currentUser: UserProfile;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, currentUser, onLogout }) => {
  return (
    <div className="w-64 bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] h-screen flex flex-col shadow-xl fixed right-0 top-0 z-50 transition-all duration-300">
      <div className="p-6 border-b border-[var(--sidebar-border)] flex items-center justify-center">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center ml-3 shadow-lg shadow-blue-500/30">
          <span className="text-xl font-bold">E</span>
        </div>
        <h1 className="text-xl font-bold tracking-wide">{APP_NAME}</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center p-3 rounded-xl border transition-all duration-200 ${
                isActive 
                  ? 'bg-[var(--sidebar-active-bg)] border-[var(--sidebar-active-border)] text-[var(--sidebar-active-text)] shadow-lg translate-x-1' 
                  : 'border-transparent text-[var(--sidebar-item-text)] hover:bg-[var(--sidebar-item-hover-bg)] hover:text-[var(--sidebar-item-hover-text)]'
              }`}
            >
              <Icon size={20} className="ml-3" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--sidebar-border)]">
        <div className="flex items-center p-3 rounded-lg bg-[var(--sidebar-item-hover-bg)] mb-3">
          <div className="w-10 h-10 rounded-full bg-slate-600 overflow-hidden flex items-center justify-center text-xs ml-3 border-2 border-[var(--sidebar-border)]">
             {currentUser.avatar ? (
                 <img src={currentUser.avatar} alt="User" className="w-full h-full object-cover" />
             ) : (
                 currentUser.name.charAt(0)
             )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser.name}</p>
            <p className="text-xs text-[var(--sidebar-item-text)] truncate">{currentUser.role}</p>
          </div>
        </div>
        
        <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center p-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition-colors text-sm font-medium"
        >
            <LogOut size={16} className="ml-2" />
            تسجيل الخروج
        </button>
      </div>
    </div>
  );
};
