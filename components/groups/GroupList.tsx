import React, { useState } from 'react';
import { Users, Calendar as CalendarIcon, Plus, Trash2, Download } from 'lucide-react';
import { Group } from '../../types';
import { exportToExcel } from '../../utils/export';

interface GroupListProps {
  groups: Group[];
  onGroupClick: (id: string) => void;
  onAddGroupClick?: () => void;
  onDeleteGroupClick: (id: string) => void;
  onManageStudents: (groupId: string) => void;
}

export const GroupList: React.FC<GroupListProps> = ({ groups, onGroupClick, onAddGroupClick, onDeleteGroupClick, onManageStudents }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">المجموعات الدراسية</h2>
          <p className="text-slate-500 mt-1">إدارة الحصص، الجداول، وتسجيل الحضور</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const exportData = groups.map(g => ({
                'اسم المجموعة': g.name,
                'المادة': g.subject,
                'المواعيد': g.schedule,
                'عدد الطلاب': g.studentIds.length
              }));
              exportToExcel(exportData, 'المجموعات');
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Download size={20} className="ml-2" />
            تصدير Excel
          </button>
          <button 
            onClick={onAddGroupClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium flex items-center shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus size={20} className="ml-2" />
            مجموعة جديدة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map(group => (
          <div 
            key={group.id}
            onClick={() => onGroupClick(group.id)}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 cursor-pointer transition-all group relative"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users size={24} />
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">
                    {group.studentIds.length} طلاب
                </span>
                <div className="flex gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onManageStudents(group.id);
                        }}
                        className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="إدارة الطلاب"
                    >
                        <Users size={18} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteGroupClick(group.id);
                        }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="حذف المجموعة"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{group.name}</h3>
            <p className="text-slate-500 text-sm mb-4">{group.subject}</p>
            <div className="pt-4 border-t border-slate-50 flex items-center text-slate-500 text-sm">
              <CalendarIcon size={16} className="ml-2" />
              {group.schedule}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <div className="col-span-full text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
             <p className="text-slate-400">لا توجد مجموعات حالياً. قم بإنشاء واحدة جديدة.</p>
          </div>
        )}
      </div>
    </div>
  );
};
