import React, { useState } from 'react';
import { ArrowRight, Play, Calendar as CalendarIcon, List, Users, Printer, Download } from 'lucide-react';
import { Group, Session, Student } from '../../types';
import { SessionList } from './SessionList';
import { SessionCalendar } from './SessionCalendar';
import { SessionModal } from './SessionModal';
import { exportToExcel } from '../../utils/export';

interface GroupDetailsProps {
  group: Group;
  sessions: Session[];
  students: Student[];
  onBack: () => void;
  onSessionClick: (id: string) => void;
  onAddSession: (session: Session) => void;
  onUpdateSession: (session: Session) => void;
  onUpdateGroup: (group: Group) => void;
  onManageStudents: () => void;
  onDeleteSession: (id: string) => void;
}

export const GroupDetails: React.FC<GroupDetailsProps> = ({
  group,
  sessions,
  students,
  onBack,
  onSessionClick,
  onAddSession,
  onUpdateSession,
  onUpdateGroup,
  onManageStudents,
  onDeleteSession
}) => {
  // UI State (Localized)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [initialDate, setInitialDate] = useState<string | undefined>(undefined);

  // Derived Data
  const upcomingSessions = sessions
    .filter(s => s.status !== 'completed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const historySessions = sessions
    .filter(s => s.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Handlers
  const handleQuickStart = () => {
    const newSession: Session = {
      id: Date.now().toString(),
      groupId: group.id,
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit" }),
      status: 'active',
      topic: 'حصة جديدة - ' + new Date().toLocaleDateString('ar-EG')
    };
    onAddSession(newSession);
    onSessionClick(newSession.id);
  };

  const handleOpenAddModal = (date?: string) => {
    setEditingSession(null);
    setInitialDate(date);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (session: Session) => {
    setEditingSession(session);
    setInitialDate(undefined);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (data: { topic: string; date: string; startTime: string }) => {
    if (editingSession) {
      onUpdateSession({
        ...editingSession,
        ...data
      });
    } else {
      onAddSession({
        id: Date.now().toString(),
        groupId: group.id,
        status: 'scheduled',
        ...data
      });
    }
    setIsModalOpen(false);
  };

  const handlePrintReport = () => {
    const groupStudents = students.filter(s => group.studentIds.includes(s.id));
    
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <title>تقرير المجموعة - ${group.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
            body { font-family: 'Cairo', system-ui, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
            .header h1 { color: #2563eb; margin: 0 0 10px 0; font-size: 24px; }
            .header h2 { font-size: 20px; margin: 0 0 10px 0; }
            .meta { color: #64748b; font-size: 14px; }
            
            .section { margin-bottom: 40px; break-inside: avoid; }
            .section-title { font-size: 18px; font-weight: 700; border-right: 4px solid #2563eb; padding-right: 12px; margin-bottom: 20px; color: #0f172a; }
            
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
            
            table { width: 100%; border-collapse: collapse; font-size: 14px; }
            th { background-color: #f1f5f9; color: #475569; font-weight: 600; text-align: right; padding: 12px; border-bottom: 2px solid #e2e8f0; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
            tr:last-child td { border-bottom: none; }
            
            .footer { margin-top: 60px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>EduCenter Pro</h1>
            <h2>تقرير مجموعة: ${group.name}</h2>
            <div class="meta">تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</div>
          </div>

          <div class="section">
            <div class="section-title">بيانات المجموعة</div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              <div><strong>المادة:</strong> ${group.subject}</div>
              <div><strong>المواعيد:</strong> ${group.schedule}</div>
              <div><strong>عدد الطلاب:</strong> ${group.studentIds.length}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">قائمة الطلاب (${groupStudents.length})</div>
            ${groupStudents.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>اسم الطالب</th>
                  <th>رقم الهاتف</th>
                  <th>ولي الأمر</th>
                  <th>المرحلة</th>
                </tr>
              </thead>
              <tbody>
                ${groupStudents.map(s => `
                  <tr>
                    <td>${s.name}</td>
                    <td>${s.phone}</td>
                    <td>${s.parentPhone}</td>
                    <td>${s.grade}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ` : '<p style="color: #64748b; text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px;">لا يوجد طلاب في هذه المجموعة</p>'}
          </div>

          <div class="section">
            <div class="section-title">سجل الحصص المكتملة (${historySessions.length})</div>
            ${historySessions.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>الموضوع</th>
                  <th>الحضور</th>
                </tr>
              </thead>
              <tbody>
                ${historySessions.map(s => `
                  <tr>
                    <td>${s.date}</td>
                    <td>${s.topic || '-'}</td>
                    <td>${s.attendanceCount || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ` : '<p style="color: #64748b; text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px;">لا توجد حصص مكتملة</p>'}
          </div>

          <div class="footer">
            تم استخراج هذا التقرير من نظام EduCenter Pro في ${new Date().toLocaleString('ar-EG')}
          </div>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    if (iframe.contentWindow) {
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(printContent);
      iframe.contentWindow.document.close();
      
      iframe.onload = () => {
        if (iframe.contentWindow) {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        }
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
          <ArrowRight size={24} />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800">{group.name}</h2>
          <p className="text-slate-500 mt-1">إدارة الحصص والجداول</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const groupStudents = students.filter(s => group.studentIds.includes(s.id));
              const exportData = groupStudents.map(s => ({
                'اسم الطالب': s.name,
                'رقم الهاتف': s.phone,
                'رقم ولي الأمر': s.parentPhone,
                'الرصيد': s.balance
              }));
              exportToExcel(exportData, `طلاب_مجموعة_${group.name}`);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Download size={18} />
            <span>تصدير Excel</span>
          </button>
          <button 
            onClick={handlePrintReport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
          >
            <Printer size={18} />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <button 
            onClick={handleQuickStart}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-xl font-bold flex items-center justify-center shadow-lg shadow-emerald-600/20 transition-all"
        >
            <Play size={20} className="ml-2 fill-current" />
            بدء حصة فورية
        </button>
        <button 
            onClick={() => handleOpenAddModal()}
            className="flex-1 bg-white border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-slate-600 p-4 rounded-xl font-medium flex items-center justify-center transition-all"
        >
            <CalendarIcon size={20} className="ml-2" />
            جدولة حصة جديدة
        </button>
        <button 
            onClick={onManageStudents}
            className="flex-1 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-600 p-4 rounded-xl font-medium flex items-center justify-center transition-all shadow-sm"
        >
            <Users size={20} className="ml-2" />
            إدارة الطلاب ({group.studentIds?.length || 0})
        </button>
      </div>

      {/* View Toggle & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-center border-b border-slate-200 mt-6 gap-4">
        <div className="flex gap-6 w-full sm:w-auto">
            <button 
                onClick={() => setActiveTab('upcoming')}
                className={`pb-3 font-medium text-sm transition-colors relative ${
                    activeTab === 'upcoming' && viewMode === 'list' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}
                disabled={viewMode === 'calendar'}
            >
                الحصص القادمة
                {activeTab === 'upcoming' && viewMode === 'list' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
            </button>
            <button 
                 onClick={() => setActiveTab('history')}
                 className={`pb-3 font-medium text-sm transition-colors relative ${
                    activeTab === 'history' && viewMode === 'list' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}
                disabled={viewMode === 'calendar'}
            >
                سجل الحصص السابقة
                {activeTab === 'history' && viewMode === 'list' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
            </button>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg mb-2 sm:mb-0">
            <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${
                    viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                <List size={16} />
                قائمة
            </button>
            <button 
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${
                    viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                <CalendarIcon size={16} />
                تقويم
            </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'calendar' ? (
        <SessionCalendar 
          sessions={sessions}
          onSessionClick={onSessionClick}
          onAddSession={handleOpenAddModal}
        />
      ) : (
        <SessionList 
          sessions={activeTab === 'upcoming' ? upcomingSessions : historySessions}
          onSessionClick={onSessionClick}
          onEditSession={handleOpenEditModal}
          onDeleteSession={onDeleteSession}
        />
      )}

      {/* Session Modal */}
      <SessionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editingSession ? editingSession : { date: initialDate }}
        title={editingSession ? 'تعديل موعد الحصة' : 'جدولة حصة جديدة'}
        submitLabel={editingSession ? 'حفظ التعديلات' : 'حفظ الحصة'}
      />
    </div>
  );
};
