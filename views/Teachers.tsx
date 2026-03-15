import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit2, X, Phone, GraduationCap, Briefcase, Percent, User, Users, ArrowRight, Wallet, DollarSign, Calendar, TrendingDown, Printer, Download } from 'lucide-react';
import { Teacher, Group, Session, Transaction, AttendanceRecord } from '../types';
import { CURRENCY } from '../constants';
import { exportToExcel } from '../utils/export';

interface TeachersProps {
  teachers: Teacher[];
  groups: Group[];
  sessions: Session[];
  transactions: Transaction[];
  attendance: AttendanceRecord[];
  onAddTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
  onAddTransaction: (transaction: Transaction) => void;
}

export const Teachers: React.FC<TeachersProps> = ({ 
    teachers, 
    groups,
    sessions,
    transactions,
    attendance,
    onAddTeacher, 
    onDeleteTeacher,
    onAddTransaction
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Selection State for Profile View
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'financials' | 'groups' | 'sessions'>('financials');

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', description: '', notes: '' });

  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{isOpen: boolean, teacherId: string | null}>({
      isOpen: false, 
      teacherId: null
  });

  const filteredTeachers = teachers.filter(t => 
    t.name.includes(searchTerm) || t.subject.includes(searchTerm) || t.phone.includes(searchTerm)
  );

  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

  const handleOpenModal = (teacher?: Teacher) => {
    if (teacher) {
        setEditingTeacher(teacher);
        setAvatarPreview(teacher.avatar || null);
    } else {
        setEditingTeacher(null);
        setAvatarPreview(null);
    }
    setIsModalOpen(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 150;
          const MAX_HEIGHT = 150;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setAvatarPreview(compressedDataUrl);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteClick = (teacherId: string) => {
      setDeleteConfirmation({ isOpen: true, teacherId });
  };

  const confirmDelete = () => {
      if (deleteConfirmation.teacherId) {
          onDeleteTeacher(deleteConfirmation.teacherId);
          setDeleteConfirmation({ isOpen: false, teacherId: null });
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const subject = (form.elements.namedItem('subject') as HTMLInputElement).value;
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
    const percentage = parseFloat((form.elements.namedItem('percentage') as HTMLInputElement).value);

    const newTeacher: Teacher = {
        id: editingTeacher ? editingTeacher.id : Date.now().toString(),
        name,
        subject,
        phone,
        percentage: isNaN(percentage) ? 0 : percentage,
        avatar: avatarPreview || undefined
    };

    onAddTeacher(newTeacher);
    setIsModalOpen(false);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedTeacherId) return;

      const newTransaction: Transaction = {
          id: Date.now().toString(),
          type: 'expense',
          amount: parseFloat(paymentForm.amount),
          category: 'رواتب',
          teacherId: selectedTeacherId,
          date: new Date().toISOString().split('T')[0],
          description: paymentForm.description || `صرف مستحقات للمدرس ${selectedTeacher?.name}`,
          notes: paymentForm.notes
      };

      onAddTransaction(newTransaction);
      setIsPaymentModalOpen(false);
      setPaymentForm({ amount: '', description: '', notes: '' });
  };

  // Helper to calculate stats
  const getTeacherStats = (teacherId: string) => {
      const teacherGroups = groups.filter(g => g.teacherId === teacherId);
      const groupIds = teacherGroups.map(g => g.id);
      const teacherSessions = sessions.filter(s => groupIds.includes(s.groupId));
      const completedSessions = teacherSessions.filter(s => s.status === 'completed');
      
      const activeStudents = new Set();
      teacherGroups.forEach(g => g.studentIds.forEach(sid => activeStudents.add(sid)));
      const studentIdsArray = Array.from(activeStudents);

      // --- Financial Calculations ---
      const teacherObj = teachers.find(t => t.id === teacherId);
      const percentage = teacherObj ? teacherObj.percentage : 0;

      // 1. Calculate Revenue generated by students in this teacher's groups
      // Note: This is an estimation. We sum INCOME transactions from students who are in this teacher's groups.
      // In a real app, transactions might be linked to specific groups. Here we assume generic student payments.
      const studentIncome = transactions
        .filter(t => t.type === 'income' && t.studentId && studentIdsArray.includes(t.studentId))
        .reduce((sum, t) => sum + t.amount, 0);

      const totalEarnings = Math.round(studentIncome * (percentage / 100));

      // 2. Calculate Payments made to the teacher
      const teacherPayments = transactions
        .filter(t => t.type === 'expense' && t.teacherId === teacherId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const totalPaid = teacherPayments.reduce((sum, t) => sum + t.amount, 0);
      const remainingDues = totalEarnings - totalPaid;

      return {
          groupsCount: teacherGroups.length,
          sessionsCount: teacherSessions.length,
          completedSessionsCount: completedSessions.length,
          studentsCount: activeStudents.size,
          totalEarnings,
          totalPaid,
          remainingDues,
          teacherPayments,
          teacherGroups,
          teacherSessions
      };
  };

  const renderTeacherList = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">إدارة المدرسين</h2>
          <p className="text-slate-500 mt-1">بيانات المدرسين، التخصصات، ونسب الأرباح</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const exportData = filteredTeachers.map(t => {
                const stats = getTeacherStats(t.id);
                return {
                  'الاسم': t.name,
                  'المادة': t.subject,
                  'رقم الهاتف': t.phone,
                  'النسبة المئوية': `${t.percentage}%`,
                  'عدد المجموعات': stats.groupsCount,
                  'عدد الطلاب': stats.studentsCount,
                  'إجمالي الأرباح': stats.totalEarnings,
                  'المدفوع': stats.totalPaid,
                  'المتبقي': stats.remainingDues
                };
              });
              exportToExcel(exportData, 'المدرسين');
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Download size={20} className="ml-2" />
            تصدير Excel
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium flex items-center shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus size={20} className="ml-2" />
            مدرس جديد
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
                type="text" 
                placeholder="بحث باسم المدرس أو المادة..." 
                className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.map(teacher => {
            const stats = getTeacherStats(teacher.id);
            return (
                <div 
                    key={teacher.id} 
                    onClick={() => setSelectedTeacherId(teacher.id)}
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                >
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform overflow-hidden">
                                {teacher.avatar ? (
                                    <img src={teacher.avatar} alt={teacher.name} className="w-full h-full object-cover" />
                                ) : (
                                    teacher.name.charAt(0)
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleOpenModal(teacher); }}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(teacher.id); }}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        
                        <h3 className="text-lg font-bold text-slate-800">{teacher.name}</h3>
                        <p className="text-slate-500 text-sm mb-4 flex items-center">
                            <Briefcase size={14} className="ml-1.5"/>
                            {teacher.subject}
                        </p>
                        
                        <div className="flex flex-col gap-2 text-sm text-slate-600 border-t border-slate-50 pt-4">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center text-slate-400"><Phone size={14} className="ml-1.5"/> الهاتف</span>
                                <span className="font-medium dir-ltr">{teacher.phone}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center text-slate-400"><Percent size={14} className="ml-1.5"/> النسبة</span>
                                <span className="font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">{teacher.percentage}%</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Stats Footer */}
                    <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-around">
                        <div className="text-center">
                            <p className="text-xs text-slate-400 mb-1">المجموعات</p>
                            <p className="font-bold text-slate-700">{stats.groupsCount}</p>
                        </div>
                        <div className="text-center border-x border-slate-200 px-6">
                            <p className="text-xs text-slate-400 mb-1">الحصص</p>
                            <p className="font-bold text-slate-700">{stats.sessionsCount}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-slate-400 mb-1">مستحقات</p>
                            <p className={`font-bold ${stats.remainingDues > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {stats.remainingDues}
                            </p>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>

      {filteredTeachers.length === 0 && (
          <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <User size={32} className="mx-auto mb-3 opacity-50"/>
              <p>لا يوجد مدرسين مطابقين للبحث</p>
          </div>
      )}
    </div>
  );

  const handlePrintReport = () => {
    if (!selectedTeacher) return;
    const stats = getTeacherStats(selectedTeacher.id);
    
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <title>تقرير المدرس - ${selectedTeacher.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
            body { font-family: 'Cairo', system-ui, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
            .header h1 { color: #2563eb; margin: 0 0 10px 0; font-size: 24px; }
            .header h2 { font-size: 20px; margin: 0 0 10px 0; }
            .meta { color: #64748b; font-size: 14px; }
            
            .section { margin-bottom: 40px; break-inside: avoid; }
            .section-title { font-size: 18px; font-weight: 700; border-right: 4px solid #2563eb; padding-right: 12px; margin-bottom: 20px; color: #0f172a; }
            
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px; }
            .card { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; }
            .card-label { color: #64748b; font-size: 14px; margin-bottom: 8px; }
            .card-value { font-size: 24px; font-weight: 700; color: #0f172a; }
            .card-value.green { color: #059669; }
            .card-value.red { color: #e11d48; }
            
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
            <h2>تقرير شامل للمدرس: ${selectedTeacher.name}</h2>
            <div class="meta">تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</div>
          </div>

          <div class="section">
            <div class="section-title">البيانات الشخصية</div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              <div><strong>المادة:</strong> ${selectedTeacher.subject}</div>
              <div><strong>الهاتف:</strong> ${selectedTeacher.phone}</div>
              <div><strong>نسبة الربح:</strong> ${selectedTeacher.percentage}%</div>
              <div><strong>تاريخ الانضمام:</strong> ${selectedTeacher.joinDate}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">الملخص المالي</div>
            <div class="grid">
              <div class="card">
                <div class="card-label">إجمالي الاستحقاق</div>
                <div class="card-value">${stats.totalEarnings} ${CURRENCY}</div>
              </div>
              <div class="card">
                <div class="card-label">تم صرفه</div>
                <div class="card-value green">${stats.totalPaid} ${CURRENCY}</div>
              </div>
              <div class="card">
                <div class="card-label">المتبقي</div>
                <div class="card-value ${stats.remainingDues > 0 ? 'red' : 'green'}">${stats.remainingDues} ${CURRENCY}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">المجموعات الدراسية (${stats.teacherGroups.length})</div>
            ${stats.teacherGroups.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>اسم المجموعة</th>
                  <th>المادة</th>
                  <th>عدد الطلاب</th>
                  <th>المرحلة</th>
                </tr>
              </thead>
              <tbody>
                ${stats.teacherGroups.map(g => `
                  <tr>
                    <td>${g.name}</td>
                    <td>${g.subject}</td>
                    <td>${g.studentIds.length}</td>
                    <td>${g.level || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ` : '<p style="color: #64748b; text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px;">لا توجد مجموعات مسجلة</p>'}
          </div>

          <div class="section">
            <div class="section-title">سجل المدفوعات (${stats.teacherPayments.length})</div>
            ${stats.teacherPayments.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>المبلغ</th>
                  <th>الوصف</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                ${stats.teacherPayments.map(p => `
                  <tr>
                    <td>${p.date}</td>
                    <td>${p.amount} ${CURRENCY}</td>
                    <td>${p.description}</td>
                    <td>${p.notes || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ` : '<p style="color: #64748b; text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px;">لا توجد مدفوعات مسجلة</p>'}
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

  const renderTeacherProfile = () => {
      if (!selectedTeacher) return null;
      const stats = getTeacherStats(selectedTeacher.id);

      return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Header Actions */}
              <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedTeacherId(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                      <ArrowRight size={24} />
                  </button>
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl overflow-hidden shadow-sm">
                      {selectedTeacher.avatar ? (
                          <img src={selectedTeacher.avatar} alt={selectedTeacher.name} className="w-full h-full object-cover" />
                      ) : (
                          selectedTeacher.name.charAt(0)
                      )}
                  </div>
                  <div className="flex-1">
                      <h2 className="text-2xl font-bold text-slate-800">{selectedTeacher.name}</h2>
                      <p className="text-slate-500 mt-1">الملف الشخصي</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        const exportData = stats.teacherPayments.map(t => ({
                          'التاريخ': t.date,
                          'الوصف': t.description,
                          'المبلغ': t.amount,
                          'ملاحظات': t.notes || ''
                        }));
                        exportToExcel(exportData, `مدفوعات_المدرس_${selectedTeacher.name}`);
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

              {/* Tabs Content */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="flex border-b border-slate-100">
                      <button 
                        onClick={() => setActiveTab('financials')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'financials' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                          البيانات المالية
                      </button>
                      <button 
                        onClick={() => setActiveTab('groups')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'groups' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                          المجموعات الدراسية
                      </button>
                      <button 
                        onClick={() => setActiveTab('sessions')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'sessions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                          سجل الحصص
                      </button>
                  </div>

                  <div className="p-6">
                      {activeTab === 'financials' && (
                          <div className="space-y-8">
                              {/* Financial Cards */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                      <div className="flex items-center gap-4 mb-2">
                                          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                              <DollarSign size={24} />
                                          </div>
                                          <span className="text-slate-500 font-medium">إجمالي الاستحقاق</span>
                                      </div>
                                      <p className="text-2xl font-bold text-slate-800 mt-2">{stats.totalEarnings} {CURRENCY}</p>
                                      <p className="text-xs text-slate-400 mt-2">بناءً على نسبة {selectedTeacher.percentage}% من دخل الطلاب</p>
                                  </div>

                                   <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                      <div className="flex items-center gap-4 mb-2">
                                          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                                              <Wallet size={24} />
                                          </div>
                                          <span className="text-slate-500 font-medium">تم صرفه</span>
                                      </div>
                                      <p className="text-2xl font-bold text-emerald-600 mt-2">{stats.totalPaid} {CURRENCY}</p>
                                      <p className="text-xs text-slate-400 mt-2">مجموع المدفوعات المسجلة</p>
                                  </div>

                                   <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                      <div className="flex items-center gap-4 mb-2">
                                          <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                                              <TrendingDown size={24} />
                                          </div>
                                          <span className="text-slate-500 font-medium">مستحقات متبقية</span>
                                      </div>
                                      <p className={`text-2xl font-bold mt-2 ${stats.remainingDues > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                          {stats.remainingDues} {CURRENCY}
                                      </p>
                                      <div className="mt-4">
                                          <button 
                                            onClick={() => setIsPaymentModalOpen(true)}
                                            className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                                          >
                                              صرف مستحقات
                                          </button>
                                      </div>
                                  </div>
                              </div>

                              {/* Payments Table */}
                              <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-slate-800">سجل المدفوعات التفصيلي</h3>
                                        <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">
                                            {stats.teacherPayments.length} عملية
                                        </span>
                                    </div>
                                    <table className="w-full text-right text-sm border border-slate-100 rounded-xl overflow-hidden">
                                        <thead className="bg-slate-50 text-slate-500 font-medium">
                                            <tr>
                                                <th className="p-4 border-b border-slate-100">التاريخ</th>
                                                <th className="p-4 border-b border-slate-100">المبلغ</th>
                                                <th className="p-4 border-b border-slate-100">الوصف</th>
                                                <th className="p-4 border-b border-slate-100">ملاحظات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {stats.teacherPayments.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-slate-400">لا توجد مدفوعات سابقة</td>
                                                </tr>
                                            )}
                                            {stats.teacherPayments.map(payment => (
                                                <tr key={payment.id} className="hover:bg-slate-50">
                                                    <td className="p-4 text-slate-600 flex items-center">
                                                        <Calendar size={14} className="ml-1.5 text-slate-400"/>
                                                        {payment.date}
                                                    </td>
                                                    <td className="p-4 font-bold text-emerald-600">
                                                        {payment.amount} {CURRENCY}
                                                    </td>
                                                    <td className="p-4 text-slate-800">{payment.description}</td>
                                                    <td className="p-4 text-slate-500 italic">{payment.notes || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                              </div>
                          </div>
                      )}

                      {activeTab === 'groups' && (
                          <div className="space-y-8">
                              {/* Groups Section */}
                              <div>
                                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                      <Users size={20} className="text-blue-600"/>
                                      المجموعات الدراسية ({stats.teacherGroups.length})
                                  </h3>
                                  {stats.teacherGroups.length === 0 ? (
                                      <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                                          لا توجد مجموعات مسندة لهذا المدرس
                                      </div>
                                  ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {stats.teacherGroups.map(group => (
                                              <div key={group.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                                                  <div>
                                                      <h4 className="font-bold text-slate-800">{group.name}</h4>
                                                      <p className="text-sm text-slate-500">{group.subject}</p>
                                                  </div>
                                                  <span className="bg-white px-3 py-1 rounded-lg text-xs font-medium text-slate-600 shadow-sm border border-slate-100">
                                                      {group.studentIds.length} طالب
                                                  </span>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}

                      {activeTab === 'sessions' && (
                          <div className="space-y-8">
                              {/* Sessions History */}
                              <div>
                                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                      <Calendar size={20} className="text-blue-600"/>
                                      سجل الحصص ({stats.teacherSessions.length})
                                  </h3>
                                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                                      <table className="w-full text-right text-sm">
                                          <thead className="bg-slate-50 text-slate-500 font-medium">
                                              <tr>
                                                  <th className="p-4 border-b border-slate-100">التاريخ</th>
                                                  <th className="p-4 border-b border-slate-100">المجموعة</th>
                                                  <th className="p-4 border-b border-slate-100">الموضوع</th>
                                                  <th className="p-4 border-b border-slate-100">الحالة</th>
                                              </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100 bg-white">
                                              {stats.teacherSessions.length === 0 ? (
                                                  <tr>
                                                      <td colSpan={4} className="p-8 text-center text-slate-400">لا توجد حصص مسجلة</td>
                                                  </tr>
                                              ) : (
                                                  stats.teacherSessions
                                                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                      .map(session => {
                                                          const groupName = groups.find(g => g.id === session.groupId)?.name || 'مجموعة محذوفة';
                                                          return (
                                                              <tr key={session.id} className="hover:bg-slate-50">
                                                                  <td className="p-4 text-slate-600">{session.date}</td>
                                                                  <td className="p-4 font-medium text-slate-800">{groupName}</td>
                                                                  <td className="p-4 text-slate-600">{session.topic || '-'}</td>
                                                                  <td className="p-4">
                                                                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                                          session.status === 'completed' ? 'bg-slate-100 text-slate-600' :
                                                                          session.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                                                          'bg-blue-100 text-blue-700'
                                                                      }`}>
                                                                          {session.status === 'completed' ? 'منتهية' :
                                                                           session.status === 'active' ? 'نشطة' : 'مجدولة'}
                                                                      </span>
                                                                  </td>
                                                              </tr>
                                                          );
                                                      })
                                              )}
                                          </tbody>
                                      </table>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  return (
    <>
        {selectedTeacherId ? renderTeacherProfile() : renderTeacherList()}

        {/* Edit/Add Teacher Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">
                    {editingTeacher ? 'تعديل بيانات مدرس' : 'إضافة مدرس جديد'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="flex justify-center mb-6">
                    <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                        {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                        <User size={32} className="text-slate-400" />
                        )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                        <Plus size={16} />
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الاسم بالكامل</label>
                    <input 
                        name="name" 
                        required 
                        defaultValue={editingTeacher?.name}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">التخصص (المادة)</label>
                    <input 
                        name="subject" 
                        required 
                        defaultValue={editingTeacher?.subject}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                    <input 
                        name="phone" 
                        defaultValue={editingTeacher?.phone}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">نسبة المدرس (%)</label>
                    <div className="relative">
                        <input 
                            name="percentage" 
                            type="number"
                            min="0"
                            max="100"
                            required 
                            defaultValue={editingTeacher?.percentage}
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pl-10" 
                        />
                        <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">تستخدم هذه النسبة لحساب مستحقات المدرس من الحصص.</p>
                </div>
                <div className="pt-4 flex gap-3">
                    <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        {editingTeacher ? 'حفظ التعديلات' : 'إضافة المدرس'}
                    </button>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-lg font-medium hover:bg-slate-200 transition-colors">إلغاء</button>
                </div>
                </form>
            </div>
            </div>
        )}

        {/* Pay Teacher Modal */}
        {isPaymentModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800">صرف مستحقات</h3>
                        <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={24} />
                        </button>
                    </div>
                    <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
                        <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm mb-4">
                            جاري صرف مستحقات للمدرس: <strong>{selectedTeacher?.name}</strong>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">المبلغ ({CURRENCY})</label>
                            <input 
                                type="number" 
                                required 
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg bg-white text-slate-900"
                                placeholder="0.00"
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">الوصف</label>
                            <input 
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                                placeholder="مثال: دفعة من حساب شهر أكتوبر"
                                value={paymentForm.description}
                                onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات</label>
                            <textarea 
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none bg-white text-slate-900"
                                value={paymentForm.notes}
                                onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                            />
                        </div>
                        <div className="pt-2">
                            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-600/20">
                                تأكيد الصرف
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        {/* Delete Confirmation Modal */}
        {deleteConfirmation.isOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">حذف المدرس؟</h3>
                        <p className="text-slate-500 mb-6">
                            هل أنت متأكد من رغبتك في حذف هذا المدرس؟ لا يمكن التراجع عن هذا الإجراء.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors"
                            >
                                نعم، حذف
                            </button>
                            <button 
                                onClick={() => setDeleteConfirmation({ isOpen: false, teacherId: null })}
                                className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};
