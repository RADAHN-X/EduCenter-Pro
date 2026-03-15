import React from 'react';
import { Clock, ChevronRight, Edit2, FileText, Trash2 } from 'lucide-react';
import { Session } from '../../types';

interface SessionListProps {
  sessions: Session[];
  onSessionClick: (id: string) => void;
  onEditSession: (session: Session) => void;
  onDeleteSession: (id: string) => void;
  emptyMessage?: string;
}

export const SessionList: React.FC<SessionListProps> = ({ 
  sessions, 
  onSessionClick, 
  onEditSession,
  onDeleteSession,
  emptyMessage = "لا توجد حصص في هذه القائمة"
}) => {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <FileText size={24} />
        </div>
        <p className="text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-h-[300px] animate-in fade-in slide-in-from-bottom-2 duration-300">
      {sessions.map(session => (
        <div 
            key={session.id} 
            onClick={() => onSessionClick(session.id)}
            className="bg-white p-4 rounded-xl border border-slate-100 hover:border-blue-300 hover:shadow-sm cursor-pointer flex items-center justify-between transition-all group"
        >
            <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold text-white shadow-sm ${
                session.status === 'completed' ? 'bg-slate-500' : 
                session.status === 'active' ? 'bg-emerald-500' : 'bg-blue-500'
            }`}>
                <span className="text-lg leading-none">{new Date(session.date).getDate()}</span>
                <span className="text-[10px] font-normal opacity-80 mt-1">
                    {new Date(session.date).toLocaleDateString('ar-EG', { month: 'short' })}
                </span>
            </div>
            <div>
                <h4 className="font-bold text-slate-800 text-lg">{session.topic || 'بدون عنوان'}</h4>
                <div className="flex items-center text-sm text-slate-500 mt-1">
                <Clock size={14} className="ml-1" /> 
                {session.startTime}
                <span className="mx-2 text-slate-300">|</span>
                <span className={`${
                    session.status === 'active' ? 'text-emerald-600 font-medium' : ''
                }`}>
                    {session.status === 'active' ? 'جارية الآن' : 
                    session.status === 'scheduled' ? 'مجدولة' : 'منتهية'}
                </span>
                </div>
            </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); onEditSession(session); }}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="تعديل الموعد"
                >
                    <Edit2 size={18} />
                </button>
                <button
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        if (window.confirm('هل أنت متأكد من حذف هذه الحصة؟ سيتم حذف سجل الحضور المرتبط بها.')) {
                            onDeleteSession(session.id);
                        }
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="حذف الحصة"
                >
                    <Trash2 size={18} />
                </button>
                {session.status === 'active' && (
                    <span className="animate-pulse w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                )}
                <ChevronRight size={20} className="text-slate-300" />
            </div>
        </div>
      ))}
    </div>
  );
};
