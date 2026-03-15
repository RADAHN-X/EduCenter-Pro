import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
          {trend && <p className="text-xs text-green-600 mt-2 font-medium flex items-center">
            <span className="bg-green-100 px-1.5 py-0.5 rounded text-green-700 ml-1">+{trend}</span> 
            عن الشهر الماضي
          </p>}
        </div>
        <div className={`p-4 rounded-xl ${color} bg-opacity-10 text-white`}>
          <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
      </div>
    </div>
  );
};
