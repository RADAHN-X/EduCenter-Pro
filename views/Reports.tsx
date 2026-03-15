import React, { useRef } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { Printer, TrendingUp, Users, Calendar, AlertCircle, Download } from 'lucide-react';
import { Student, Teacher, Transaction, AttendanceRecord, Group, Session } from '../types';
import { CURRENCY, APP_NAME } from '../constants';
import { exportToExcel } from '../utils/export';

interface ReportsProps {
  students: Student[];
  teachers: Teacher[];
  transactions: Transaction[];
  attendance: AttendanceRecord[];
  groups: Group[];
  sessions: Session[];
}

export const Reports: React.FC<ReportsProps> = ({
  students,
  teachers,
  transactions,
  attendance,
  groups,
  sessions
}) => {
  // Debug: log transactions when Reports renders (remove in production)
  if (typeof window !== 'undefined') {
    // Log small sample to avoid huge console output
    // eslint-disable-next-line no-console
    console.log('Reports: transactions count=', transactions.length, 'sample=', transactions.slice(0,5));
  }
  const handlePrint = async () => {
    // In packaged Electron use native PDF preview, otherwise fallback to iframe print
    const electronApi = (window as any).electron;
    if (electronApi && typeof electronApi.printPreview === 'function') {
      try {
        const res = await electronApi.printPreview();
        if (!res || !res.ok) {
          console.error('Print preview failed', res?.error);
          // fallback to native print if preview fails
          if (electronApi.print) electronApi.print();
        }
      } catch (e) {
        console.error('printPreview error', e);
        if (electronApi.print) electronApi.print();
      }
    } else if (electronApi && typeof electronApi.print === 'function') {
      electronApi.print();
    } else {
      // Create a hidden iframe to print just the report content
      const printContent = document.getElementById('printable-report')?.innerHTML;
      if (!printContent) {
        window.print();
        return;
      }

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      if (iframe.contentWindow) {
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(`
          <!DOCTYPE html>
          <html dir="rtl">
            <head>
              <title>تقرير شامل - ${APP_NAME}</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
                body { font-family: 'Cairo', system-ui, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
                /* Add basic Tailwind-like utility classes used in the report */
                .text-center { text-align: center; }
                .border-b { border-bottom: 1px solid #e2e8f0; }
                .pb-6 { padding-bottom: 1.5rem; }
                .mb-6 { margin-bottom: 1.5rem; }
                .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
                .font-bold { font-weight: 700; }
                .text-slate-900 { color: #0f172a; }
                .mb-2 { margin-bottom: 0.5rem; }
                .text-slate-500 { color: #64748b; }
                .grid { display: grid; }
                .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
                .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                .gap-6 { gap: 1.5rem; }
                .bg-white { background-color: #fff; }
                .p-6 { padding: 1.5rem; }
                .rounded-2xl { border-radius: 1rem; }
                .border { border-width: 1px; }
                .border-slate-100 { border-color: #f1f5f9; }
                .flex { display: flex; }
                .items-center { align-items: center; }
                .gap-4 { gap: 1rem; }
                .p-3 { padding: 0.75rem; }
                .bg-emerald-100 { background-color: #d1fae5; }
                .text-emerald-600 { color: #059669; }
                .rounded-lg { border-radius: 0.5rem; }
                .font-medium { font-weight: 500; }
                .mt-2 { margin-top: 0.5rem; }
                .text-slate-800 { color: #1e293b; }
                .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
                .text-slate-400 { color: #94a3b8; }
                .mt-4 { margin-top: 1rem; }
                .text-xs { font-size: 0.75rem; line-height: 1rem; }
                .justify-between { justify-content: space-between; }
                .bg-blue-100 { background-color: #dbeafe; }
                .text-blue-600 { color: #2563eb; }
                .bg-amber-100 { background-color: #fef3c7; }
                .text-amber-600 { color: #d97706; }
                .w-full { width: 100%; }
                .bg-slate-100 { background-color: #f1f5f9; }
                .rounded-full { border-radius: 9999px; }
                .h-1\\.5 { height: 0.375rem; }
                .bg-amber-500 { background-color: #f59e0b; }
                .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                .h-64 { height: 16rem; }
                .overflow-x-auto { overflow-x: auto; }
                .text-right { text-align: right; }
                .bg-slate-50 { background-color: #f8fafc; }
                .rounded-r-lg { border-top-right-radius: 0.5rem; border-bottom-right-radius: 0.5rem; }
                .rounded-l-lg { border-top-left-radius: 0.5rem; border-bottom-left-radius: 0.5rem; }
                .divide-y > :not([hidden]) ~ :not([hidden]) { border-top-width: 1px; border-color: #f1f5f9; }
                .border-slate-200 { border-color: #e2e8f0; }
                .pb-2 { padding-bottom: 0.5rem; }
                .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
                
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 12px; text-align: right; }
                th { border-bottom: 2px solid #e2e8f0; color: #64748b; font-weight: 600; }
                td { border-bottom: 1px solid #f1f5f9; }
                
                .hidden { display: none !important; }
                .print\\:block { display: block !important; }
                .print\\:hidden { display: none !important; }
                
                @media print {
                  body { padding: 0; }
                  .break-inside-avoid { break-inside: avoid; }
                  .print\\:bg-transparent { background-color: transparent !important; }
                  .print\\:p-0 { padding: 0 !important; }
                  .print\\:border { border-width: 1px !important; }
                  .print\\:shadow-none { box-shadow: none !important; }
                  .print\\:border-slate-200 { border-color: #e2e8f0 !important; }
                  .print\\:bg-black { background-color: #000 !important; }
                  .print\\:border-b { border-bottom-width: 1px !important; }
                }
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
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
    }
  };

  // --- Calculations ---

  // 1. Financials by Category
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

  const expenseData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  }));

  // 2. Income vs Expense
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  // 3. Attendance Rate
  const totalAttendanceRecords = attendance.length;
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const attendanceRate = totalAttendanceRecords ? Math.round((presentCount / totalAttendanceRecords) * 100) : 0;

  // COLORS
  const COLORS = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header - Hidden in Print */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">التقارير والإحصائيات</h2>
          <p className="text-slate-500 mt-1">نظرة شاملة على أداء السنتر التعليمي</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const exportData = teachers.map(teacher => {
                const teacherGroups = groups.filter(g => g.teacherId === teacher.id);
                const teacherSessions = sessions.filter(s => teacherGroups.some(g => g.id === s.groupId) && s.status === 'completed');
                return {
                  'المدرس': teacher.name,
                  'عدد المجموعات': teacherGroups.length,
                  'الحصص المكتملة': teacherSessions.length
                };
              });
              exportToExcel(exportData, 'أداء_المدرسين');
            }}
            className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center shadow-lg hover:bg-emerald-700 transition-all"
          >
            <Download size={20} className="ml-2" />
            تصدير أداء المدرسين
          </button>
          <button 
            onClick={handlePrint}
            className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-medium flex items-center shadow-lg hover:bg-slate-700 transition-all"
          >
            <Printer size={20} className="ml-2" />
            طباعة التقرير
          </button>
        </div>
      </div>

      {/* Printable Content */}
      <div id="printable-report" className="space-y-8">
        
        {/* Print Header (Visible only in Print) */}
        <div className="hidden print:block text-center border-b pb-6 mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{APP_NAME}</h1>
          <p className="text-slate-500">تقرير شامل - {new Date().toLocaleDateString('ar-EG')}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print:border print:shadow-none break-inside-avoid">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg print:bg-transparent print:p-0">
                <TrendingUp size={24} />
              </div>
              <span className="text-slate-500 font-medium">صافي الأرباح</span>
            </div>
            <p className="text-3xl font-bold text-slate-800 mt-2">{netProfit.toLocaleString()} <span className="text-sm text-slate-400">{CURRENCY}</span></p>
            <div className="mt-4 text-xs text-slate-500 flex justify-between">
              <span>الدخل: {totalIncome.toLocaleString()}</span>
              <span>المصروف: {totalExpense.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print:border print:shadow-none break-inside-avoid">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg print:bg-transparent print:p-0">
                <Users size={24} />
              </div>
              <span className="text-slate-500 font-medium">نشاط الطلاب</span>
            </div>
            <p className="text-3xl font-bold text-slate-800 mt-2">{students.length}</p>
            <div className="mt-4 text-xs text-slate-500">
              <span>عدد المجموعات: {groups.length}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print:border print:shadow-none break-inside-avoid">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-lg print:bg-transparent print:p-0">
                <Calendar size={24} />
              </div>
              <span className="text-slate-500 font-medium">نسبة الحضور العامة</span>
            </div>
            <p className="text-3xl font-bold text-slate-800 mt-2">{attendanceRate}%</p>
            <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5 print:border print:border-slate-200">
              <div className="bg-amber-500 h-1.5 rounded-full print:bg-black" style={{width: `${attendanceRate}%`}}></div>
            </div>
          </div>
        </div>

        {/* Charts & Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block">
          
          {/* Expenses Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print:border print:shadow-none break-inside-avoid mb-6 print:hidden">
            <h3 className="font-bold text-slate-800 mb-6">توزيع المصروفات</h3>
            <div className="h-64">
              {expenseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expenseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#64748b', fontSize: 12}} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#64748b', fontSize: 12}} 
                        />
                        <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                            formatter={(value: number) => [`${value} ${CURRENCY}`, 'القيمة']}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                            {expenseData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <AlertCircle size={32} className="mb-2 opacity-50"/>
                    <p className="text-sm">لا توجد بيانات مصروفات للعرض</p>
                </div>
              )}
            </div>
          </div>

          {/* Teacher Performance Table */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print:border print:shadow-none break-inside-avoid mb-6">
            <h3 className="font-bold text-slate-800 mb-6">أداء المدرسين</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-500 print:bg-transparent print:border-b">
                  <tr>
                    <th className="p-3 rounded-r-lg">المدرس</th>
                    <th className="p-3">المجموعات</th>
                    <th className="p-3 rounded-l-lg">الحصص المكتملة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teachers.map(teacher => {
                    const teacherGroups = groups.filter(g => g.teacherId === teacher.id);
                    const teacherSessions = sessions.filter(s => teacherGroups.some(g => g.id === s.groupId) && s.status === 'completed');
                    
                    return (
                      <tr key={teacher.id}>
                        <td className="p-3 font-medium text-slate-800">{teacher.name}</td>
                        <td className="p-3 text-slate-600">{teacherGroups.length}</td>
                        <td className="p-3 text-slate-600">{teacherSessions.length}</td>
                      </tr>
                    );
                  })}
                  {teachers.length === 0 && (
                      <tr>
                          <td colSpan={3} className="p-6 text-center text-slate-400">لا يوجد مدرسين مسجلين</td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Detailed Financial Table for Print */}
        <div className="hidden print:block bg-white p-6 rounded-2xl border border-slate-200 mt-6 break-inside-avoid">
           <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">ملخص المعاملات المالية الأخيرة</h3>
           <table className="w-full text-sm text-right">
             <thead>
               <tr className="border-b border-slate-200">
                 <th className="pb-2">التاريخ</th>
                 <th className="pb-2">الوصف</th>
                 <th className="pb-2">النوع</th>
                 <th className="pb-2">المبلغ</th>
               </tr>
             </thead>
             <tbody>
               {transactions.length === 0 ? (
                 <tr>
                   <td colSpan={4} className="p-6 text-center text-slate-400">لا يوجد بيانات للعرض هنا</td>
                 </tr>
               ) : (
                 transactions.slice(0, 15).map(t => (
                   <tr key={t.id} className="border-b border-slate-100">
                     <td className="py-2 text-slate-600">{t.date}</td>
                     <td className="py-2 text-slate-800">{t.description}</td>
                     <td className="py-2 text-slate-600">{t.type === 'income' ? 'إيراد' : 'مصروف'}</td>
                     <td className="py-2 font-bold">{t.amount}</td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
        </div>

      </div>

      <style>{`
         @media print {
            /* Reset Global Page styles */
            @page { 
                margin: 0.5cm; 
                size: auto;
            }

            /* Hide everything initially */
            body * {
                visibility: hidden;
            }

            /* Unhide the report container and its children */
            #printable-report, #printable-report * {
                visibility: visible;
            }

            /* Position the report at the top left */
            #printable-report {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 0;
            }

            /* Reset container constraints that might clip content */
            body, html, #root, main {
                overflow: visible !important;
                height: auto !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                display: block !important;
            }
            
            /* Explicitly hide Sidebar, Header buttons, etc */
            nav, aside, button, .print\\:hidden {
                display: none !important;
            }
            
            /* Ensure charts have size */
            .recharts-wrapper {
                width: 100% !important;
            }

            /* Avoid page breaks inside cards */
            .break-inside-avoid {
                break-inside: avoid;
            }
         }
      `}</style>
    </div>
  );
};
