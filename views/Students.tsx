import React, { useState } from 'react';
import { Plus, Search, Filter, Phone, Trash2, Edit2, X, ArrowRight, User, Wallet, History, CreditCard, TrendingUp, TrendingDown, ChevronDown, ChevronUp, RotateCcw, Calendar, AlertCircle, Printer, Download } from 'lucide-react';
import { Student, Transaction } from '../types';
import { CURRENCY } from '../constants';
import { exportToExcel } from '../utils/export';

interface StudentsProps {
  students: Student[];
  transactions: Transaction[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onAddTransaction: (transaction: Transaction) => void;
}

export const Students: React.FC<StudentsProps> = ({ 
    students, 
    transactions, 
    onAddStudent, 
    onUpdateStudent,
    onDeleteStudent,
    onAddTransaction 
}) => {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filterGrade, setFilterGrade] = useState('');
  const [filterMinBalance, setFilterMinBalance] = useState('');
  const [filterMaxBalance, setFilterMaxBalance] = useState('');

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  // Selection State for Profile View
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Transaction Modal State
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
      amount: '',
      type: 'income' as 'income' | 'expense',
      description: '',
      notes: ''
  });

  // Derived Data
  const selectedStudent = students.find(s => s.id === selectedStudentId);
  
  const studentTransactions = transactions
    .filter(t => t.studentId === selectedStudentId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest first

  const filteredStudents = students.filter(s => {
    // 1. Text Search
    const matchesSearch = 
      s.name.includes(searchTerm) || 
      s.phone.includes(searchTerm) || 
      s.parentPhone.includes(searchTerm);

    // 2. Grade Filter
    const matchesGrade = filterGrade ? s.grade === filterGrade : true;

    // 3. Balance Range Filter
    const minBal = filterMinBalance !== '' ? parseFloat(filterMinBalance) : -Infinity;
    const maxBal = filterMaxBalance !== '' ? parseFloat(filterMaxBalance) : Infinity;
    const matchesBalance = s.balance >= minBal && s.balance <= maxBal;

    return matchesSearch && matchesGrade && matchesBalance;
  });

  // Handlers
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
    const parentPhone = (form.elements.namedItem('parentPhone') as HTMLInputElement).value;
    const grade = (form.elements.namedItem('grade') as HTMLSelectElement).value;

    if (name && phone) {
      if (editingStudent) {
        onUpdateStudent({
          ...editingStudent,
          name,
          phone,
          parentPhone,
          grade
        });
      } else {
        onAddStudent({
          id: Date.now().toString(),
          name,
          phone,
          parentPhone,
          grade,
          balance: 0,
          joinedAt: new Date().toISOString().split('T')[0]
        });
      }
      setIsStudentModalOpen(false);
      setEditingStudent(null);
    }
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setIsStudentModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setIsStudentModalOpen(true);
  };

  const handleTransactionSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedStudentId || !transactionForm.amount) return;

      const newTransaction: Transaction = {
          id: Date.now().toString(),
          studentId: selectedStudentId,
          amount: parseFloat(transactionForm.amount),
          type: transactionForm.type,
          category: transactionForm.type === 'income' ? 'دفعات طلاب' : 'استرداد/خصم',
          date: new Date().toISOString().split('T')[0],
          description: transactionForm.description || (transactionForm.type === 'income' ? 'دفعة نقدية' : 'خصم من الرصيد'),
          notes: transactionForm.notes
      };

      onAddTransaction(newTransaction);
      setIsTransactionModalOpen(false);
      setTransactionForm({ amount: '', type: 'income', description: '', notes: '' });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterGrade('');
    setFilterMinBalance('');
    setFilterMaxBalance('');
  };

  // Render Logic
  const renderStudentList = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">إدارة الطلاب</h2>
          <p className="text-slate-500 mt-1">عرض وإدارة بيانات الطلاب والاشتراكات</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const exportData = filteredStudents.map(s => ({
                'الاسم': s.name,
                'رقم الهاتف': s.phone,
                'رقم ولي الأمر': s.parentPhone,
                'المرحلة الدراسية': s.grade,
                'الرصيد': s.balance,
                'تاريخ الانضمام': s.joinedAt
              }));
              exportToExcel(exportData, 'الطلاب');
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Download size={20} className="ml-2" />
            تصدير Excel
          </button>
          <button 
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium flex items-center shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus size={20} className="ml-2" />
            طالب جديد
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
                type="text" 
                placeholder="بحث باسم الطالب، رقم الهاتف، أو رقم ولي الأمر..." 
                className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>
            <button 
                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                className={`flex items-center px-4 py-2.5 border rounded-lg transition-colors ${
                    isFilterPanelOpen || filterGrade || filterMinBalance || filterMaxBalance 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
            >
            <Filter size={18} className="ml-2" />
            تصفية متقدمة
            {isFilterPanelOpen ? <ChevronUp size={16} className="mr-2"/> : <ChevronDown size={16} className="mr-2"/>}
            </button>
        </div>

        {/* Advanced Filter Panel */}
        {isFilterPanelOpen && (
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-200">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">المرحلة الدراسية</label>
                    <select 
                        value={filterGrade}
                        onChange={(e) => setFilterGrade(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                    >
                        <option value="">كل المراحل</option>
                        <option value="الابتدائية">الابتدائية</option>
                        <option value="الإعدادية">الإعدادية</option>
                        <option value="الثانوية العامة">الثانوية العامة</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الحد الأدنى للرصيد</label>
                    <input 
                        type="number" 
                        placeholder="مثال: -100"
                        value={filterMinBalance}
                        onChange={(e) => setFilterMinBalance(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الحد الأقصى للرصيد</label>
                    <input 
                        type="number" 
                        placeholder="مثال: 500"
                        value={filterMaxBalance}
                        onChange={(e) => setFilterMaxBalance(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                </div>
                <div className="flex items-end">
                    <button 
                        onClick={resetFilters}
                        className="w-full p-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center font-medium text-sm"
                    >
                        <RotateCcw size={16} className="ml-2" />
                        إعادة تعيين
                    </button>
                </div>
            </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
            <tr>
              <th className="p-5">اسم الطالب</th>
              <th className="p-5">المرحلة الدراسية</th>
              <th className="p-5">رقم الهاتف</th>
              <th className="p-5">الرصيد المالي</th>
              <th className="p-5 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedStudentId(student.id)}>
                <td className="p-5">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm ml-3">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{student.name}</p>
                      <p className="text-xs text-slate-500">كود: {student.id}</p>
                    </div>
                  </div>
                </td>
                <td className="p-5 text-slate-600">{student.grade}</td>
                <td className="p-5">
                  <div className="flex flex-col text-sm">
                    <span className="flex items-center text-slate-600"><Phone size={12} className="ml-1"/> {student.phone}</span>
                    <span className="text-xs text-slate-400 mt-1">ولي الأمر: {student.parentPhone}</span>
                  </div>
                </td>
                <td className="p-5">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    student.balance < 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {Math.abs(student.balance)} {CURRENCY} {student.balance < 0 ? '(مدين)' : '(دائن)'}
                  </span>
                </td>
                <td className="p-5">
                  <div className="flex justify-center gap-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedStudentId(student.id); }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="عرض الملف"
                    >
                      <User size={18} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); openEditModal(student); }}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="تعديل"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteStudent(student.id); }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredStudents.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            لا توجد بيانات مطابقة للبحث
          </div>
        )}
      </div>

      {/* Add/Edit Student Modal */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">
                {editingStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
              </h3>
              <button onClick={() => setIsStudentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleStudentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم الطالب رباعي</label>
                <input 
                  name="name" 
                  required 
                  defaultValue={editingStudent?.name}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم الطالب</label>
                  <input 
                    name="phone" 
                    required 
                    defaultValue={editingStudent?.phone}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم ولي الأمر</label>
                  <input 
                    name="parentPhone" 
                    defaultValue={editingStudent?.parentPhone}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">المرحلة الدراسية</label>
                <select 
                  name="grade" 
                  defaultValue={editingStudent?.grade}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                >
                  <option value="">اختر المرحلة</option>
                  <option value="الابتدائية">الابتدائية</option>
                  <option value="الإعدادية">الإعدادية</option>
                  <option value="الثانوية العامة">الثانوية العامة</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  {editingStudent ? 'حفظ التعديلات' : 'حفظ البيانات'}
                </button>
                <button type="button" onClick={() => setIsStudentModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-lg font-medium hover:bg-slate-200 transition-colors">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const handlePrintReport = () => {
    if (!selectedStudent) return;
    
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <title>تقرير الطالب - ${selectedStudent.name}</title>
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
            <h2>تقرير شامل للطالب: ${selectedStudent.name}</h2>
            <div class="meta">تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</div>
          </div>

          <div class="section">
            <div class="section-title">البيانات الشخصية</div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              <div><strong>المرحلة الدراسية:</strong> ${selectedStudent.grade}</div>
              <div><strong>رقم الهاتف:</strong> ${selectedStudent.phone}</div>
              <div><strong>ولي الأمر:</strong> ${selectedStudent.parentPhone}</div>
              <div><strong>تاريخ الانضمام:</strong> ${selectedStudent.joinedAt}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">الملخص المالي</div>
            <div class="grid">
              <div class="card">
                <div class="card-label">الرصيد الحالي</div>
                <div class="card-value ${selectedStudent.balance < 0 ? 'red' : 'green'}">${selectedStudent.balance} ${CURRENCY}</div>
              </div>
              <div class="card">
                <div class="card-label">حالة الاشتراك</div>
                <div class="card-value">${selectedStudent.subscriptionExpiryDate ? (new Date(selectedStudent.subscriptionExpiryDate) > new Date() ? 'ساري' : 'منتهي') : 'غير مشترك'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">سجل المعاملات المالية (${studentTransactions.length})</div>
            ${studentTransactions.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>النوع</th>
                  <th>المبلغ</th>
                  <th>الوصف</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                ${studentTransactions.map(t => `
                  <tr>
                    <td>${t.date}</td>
                    <td>${t.type === 'income' ? 'إيداع' : 'خصم'}</td>
                    <td style="color: ${t.type === 'income' ? '#059669' : '#e11d48'}; font-weight: bold;">${t.amount} ${CURRENCY}</td>
                    <td>${t.description}</td>
                    <td>${t.notes || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ` : '<p style="color: #64748b; text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px;">لا توجد معاملات مسجلة</p>'}
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

  const renderStudentProfile = () => {
      if (!selectedStudent) return null;

      // Logic for subscription status
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let subscriptionStatus: 'active' | 'expiring' | 'expired' | 'none' = 'none';
      let daysDiff = 0;

      if (selectedStudent.subscriptionExpiryDate) {
          const expiryDate = new Date(selectedStudent.subscriptionExpiryDate);
          expiryDate.setHours(0, 0, 0, 0);
          
          const timeDiff = expiryDate.getTime() - today.getTime();
          daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
          
          if (daysDiff < 0) {
              subscriptionStatus = 'expired';
          } else if (daysDiff <= 7) {
              subscriptionStatus = 'expiring';
          } else {
              subscriptionStatus = 'active';
          }
      }

      return (
          <div className="space-y-6">
              {/* Header Actions */}
              <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedStudentId(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                      <ArrowRight size={24} />
                  </button>
                  <div className="flex-1">
                      <h2 className="text-2xl font-bold text-slate-800">{selectedStudent.name}</h2>
                      <p className="text-slate-500 mt-1">الملف الشخصي والسجل المالي</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        const exportData = studentTransactions.map(t => ({
                          'التاريخ': t.date,
                          'الوصف': t.description,
                          'النوع': t.type === 'income' ? 'إيراد' : 'مصروف',
                          'المبلغ': t.amount,
                          'ملاحظات': t.notes || ''
                        }));
                        exportToExcel(exportData, `سجل_معاملات_${selectedStudent.name}`);
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Info Card */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
                      <div className="flex items-center gap-4 mb-6">
                          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl">
                              {selectedStudent.name.charAt(0)}
                          </div>
                          <div>
                              <div className="text-sm text-slate-500">الرصيد الحالي</div>
                              <div className={`text-2xl font-bold ${selectedStudent.balance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                  {selectedStudent.balance} {CURRENCY}
                              </div>
                          </div>
                      </div>
                      
                      <div className="space-y-4 border-t border-slate-100 pt-4">
                          <div className="flex justify-between">
                              <span className="text-slate-500">رقم الهاتف</span>
                              <span className="font-medium">{selectedStudent.phone}</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-slate-500">ولي الأمر</span>
                              <span className="font-medium">{selectedStudent.parentPhone}</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-slate-500">المرحلة</span>
                              <span className="font-medium">{selectedStudent.grade}</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-slate-500">تاريخ الانضمام</span>
                              <span className="font-medium">{selectedStudent.joinedAt}</span>
                          </div>

                          {/* Subscription Status Section */}
                          {subscriptionStatus !== 'none' && (
                              <div className={`mt-4 p-4 rounded-xl border ${
                                  subscriptionStatus === 'expired' ? 'bg-red-50 border-red-100' :
                                  subscriptionStatus === 'expiring' ? 'bg-amber-50 border-amber-100' :
                                  'bg-emerald-50 border-emerald-100'
                              }`}>
                                  <div className="flex justify-between items-center mb-2">
                                      <div className="flex items-center gap-1.5">
                                        <Calendar size={14} className={
                                          subscriptionStatus === 'expired' ? 'text-red-600' :
                                          subscriptionStatus === 'expiring' ? 'text-amber-600' :
                                          'text-emerald-600'
                                        }/>
                                        <span className={`text-xs font-bold ${
                                            subscriptionStatus === 'expired' ? 'text-red-700' :
                                            subscriptionStatus === 'expiring' ? 'text-amber-700' :
                                            'text-emerald-700'
                                        }`}>حالة الاشتراك</span>
                                      </div>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                           subscriptionStatus === 'expired' ? 'bg-red-100 text-red-700' :
                                           subscriptionStatus === 'expiring' ? 'bg-amber-100 text-amber-700' :
                                           'bg-emerald-100 text-emerald-700'
                                      }`}>
                                          {subscriptionStatus === 'expired' ? 'منتهي' : 
                                           subscriptionStatus === 'expiring' ? 'قارب على الانتهاء' : 'ساري'}
                                      </span>
                                  </div>
                                  
                                  <div className="flex justify-between text-sm items-center">
                                       <span className="text-slate-500 text-xs">تاريخ الانتهاء:</span>
                                       <span className="font-bold dir-ltr font-mono text-slate-800 text-sm">{selectedStudent.subscriptionExpiryDate}</span>
                                  </div>

                                   {/* Status Message */}
                                   <div className={`text-xs mt-3 pt-2 border-t font-medium flex items-center ${
                                        subscriptionStatus === 'expired' ? 'border-red-100 text-red-600' : 
                                        subscriptionStatus === 'expiring' ? 'border-amber-100 text-amber-600' :
                                        'border-emerald-100 text-emerald-600'
                                   }`}>
                                       <AlertCircle size={12} className="ml-1" />
                                       {subscriptionStatus === 'expired' 
                                           ? `انتهى الاشتراك منذ ${Math.abs(daysDiff)} يوم` 
                                           : subscriptionStatus === 'expiring'
                                           ? `متبقي ${daysDiff} أيام على انتهاء الاشتراك`
                                           : `الاشتراك ساري لمدة ${daysDiff} يوم`}
                                   </div>
                              </div>
                          )}
                      </div>

                      <div className="mt-6 pt-6 border-t border-slate-100 flex gap-2">
                           <button 
                               onClick={() => {
                                   setTransactionForm({ amount: '', type: 'income', description: '', notes: '' });
                                   setIsTransactionModalOpen(true);
                               }}
                               className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-medium flex items-center justify-center text-sm shadow-lg shadow-emerald-600/20"
                           >
                               <Wallet size={16} className="ml-2" />
                               دفع رسوم
                           </button>
                           <button 
                               onClick={() => openEditModal(selectedStudent)}
                               className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
                           >
                               <Edit2 size={18} />
                           </button>
                      </div>
                  </div>

                  {/* Transactions History */}
                  <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                          <h3 className="font-bold text-slate-800 flex items-center">
                              <History size={20} className="ml-2 text-slate-400"/>
                              سجل المعاملات المالية
                          </h3>
                          <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">
                              {studentTransactions.length} عملية
                          </span>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-slate-50 text-slate-500 font-medium text-sm">
                                <tr>
                                    <th className="p-4">التاريخ</th>
                                    <th className="p-4">الوصف</th>
                                    <th className="p-4">ملاحظات</th>
                                    <th className="p-4">النوع</th>
                                    <th className="p-4">المبلغ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {studentTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-400">
                                            لا توجد معاملات مسجلة لهذا الطالب
                                        </td>
                                    </tr>
                                )}
                                {studentTransactions.map(t => (
                                    <tr key={t.id} className="hover:bg-slate-50">
                                        <td className="p-4 text-slate-600 text-sm">{t.date}</td>
                                        <td className="p-4 font-medium text-slate-800">{t.description}</td>
                                        <td className="p-4 text-sm text-slate-500">{t.notes || '-'}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                            }`}>
                                                {t.type === 'income' ? 'دفعة (إيداع)' : 'خصم (مصروف)'}
                                            </span>
                                        </td>
                                        <td className={`p-4 font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {t.type === 'income' ? '+' : '-'} {t.amount} {CURRENCY}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      </div>
                  </div>
              </div>

               {/* Add Transaction Modal */}
              {isTransactionModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-slate-800">إضافة معاملة جديدة</h3>
                      <button onClick={() => setIsTransactionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                      </button>
                    </div>
                    <form onSubmit={handleTransactionSubmit} className="p-6 space-y-4">
                       <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                           <button 
                               type="button"
                               onClick={() => setTransactionForm({...transactionForm, type: 'income'})}
                               className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                                   transactionForm.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                               }`}
                           >
                               <TrendingUp size={16} className="inline ml-1" />
                               إضافة رصيد (دفعة)
                           </button>
                           <button 
                               type="button"
                               onClick={() => setTransactionForm({...transactionForm, type: 'expense'})}
                               className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                                   transactionForm.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                               }`}
                           >
                               <TrendingDown size={16} className="inline ml-1" />
                               خصم رصيد
                           </button>
                       </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">المبلغ ({CURRENCY})</label>
                        <input 
                            type="number" 
                            required 
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg bg-white text-slate-900"
                            placeholder="0.00"
                            value={transactionForm.amount}
                            onChange={e => setTransactionForm({...transactionForm, amount: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">الوصف</label>
                        <input 
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                            placeholder={transactionForm.type === 'income' ? 'مثال: اشتراك شهر أكتوبر' : 'مثال: ثمن مذكرة'}
                            value={transactionForm.description}
                            onChange={e => setTransactionForm({...transactionForm, description: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات</label>
                        <textarea 
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none bg-white text-slate-900"
                            placeholder="أي تفاصيل إضافية..."
                            value={transactionForm.notes}
                            onChange={e => setTransactionForm({...transactionForm, notes: e.target.value})}
                        />
                      </div>

                      <div className="pt-2">
                        <button type="submit" className={`w-full text-white py-3 rounded-xl font-bold transition-colors shadow-lg ${
                            transactionForm.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                        }`}>
                            تأكيد المعاملة
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
          </div>
      );
  };

  if (selectedStudentId) return renderStudentProfile();
  return renderStudentList();
};
