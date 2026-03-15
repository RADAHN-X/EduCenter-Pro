import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Plus } from 'lucide-react';
import { Session } from '../../types';

interface SessionCalendarProps {
  sessions: Session[];
  onSessionClick: (id: string) => void;
  onAddSession: (date: string) => void;
}

export const SessionCalendar: React.FC<SessionCalendarProps> = ({ 
  sessions, 
  onSessionClick, 
  onAddSession 
}) => {
  const [calendarDate, setCalendarDate] = useState(new Date());

  const changeMonth = (offset: number) => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCalendarDate(newDate);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(calendarDate);
  const firstDay = getFirstDayOfMonth(calendarDate); 
  // Sat=0, Sun=1... Fri=6 adjustment for RTL/Arabic week start
  const startOffset = (firstDay + 1) % 7; 

  const emptyDays = Array(startOffset).fill(null);
  const actualDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weekDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-in fade-in zoom-in duration-300">
        {/* Calendar Header */}
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
                <h3 className="text-xl font-bold text-slate-800">
                    {calendarDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex bg-slate-100 rounded-lg p-1">
                    <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white rounded-md transition-all shadow-sm">
                        <ChevronRight size={20} className="text-slate-600"/>
                    </button>
                    <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white rounded-md transition-all shadow-sm">
                        <ChevronLeft size={20} className="text-slate-600"/>
                    </button>
                </div>
            </div>
            <button 
                onClick={() => onAddSession(new Date().toISOString().split('T')[0])}
                className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100 transition-colors"
            >
                إضافة حدث
            </button>
        </div>

        {/* Grid Header */}
        <div className="grid grid-cols-7 mb-2">
            {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-medium text-slate-400 py-2">
                    {day}
                </div>
            ))}
        </div>

        {/* Grid Body */}
        <div className="grid grid-cols-7 gap-2">
            {emptyDays.map((_, index) => (
                <div key={`empty-${index}`} className="h-28 bg-slate-50/50 rounded-xl border border-transparent"></div>
            ))}
            {actualDays.map(day => {
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const daySessions = sessions.filter(s => s.date === dateStr);
                const isToday = new Date().toISOString().split('T')[0] === dateStr;

                return (
                    <div 
                        key={day} 
                        onClick={() => onAddSession(dateStr)}
                        className={`h-28 border rounded-xl p-2 relative group hover:border-blue-400 transition-all cursor-pointer ${
                            isToday ? 'bg-blue-50/30 border-blue-200' : 'bg-white border-slate-100'
                        }`}
                    >
                        <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                            isToday ? 'bg-blue-600 text-white' : 'text-slate-600 group-hover:bg-slate-100'
                        }`}>
                            {day}
                        </span>
                        
                        <div className="mt-2 space-y-1 overflow-y-auto max-h-[calc(100%-32px)]">
                            {daySessions.map(session => (
                                <div 
                                    key={session.id}
                                    onClick={(e) => { e.stopPropagation(); onSessionClick(session.id); }}
                                    className={`text-[10px] p-1.5 rounded-md truncate border-l-2 cursor-pointer transition-colors ${
                                        session.status === 'completed' 
                                        ? 'bg-slate-100 border-slate-400 text-slate-600'
                                        : session.status === 'active'
                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-medium'
                                        : 'bg-blue-50 border-blue-500 text-blue-700'
                                    }`}
                                >
                                    {session.topic || 'حصة'}
                                </div>
                            ))}
                        </div>
                        
                        {/* Hover Add Icon */}
                        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <Plus size={14} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};
