import React, { useState } from 'react';
import { Transaction } from '../types';
import { CURRENCY } from '../constants';
import { TrendingUp, TrendingDown, Calendar, FileSpreadsheet, Search, Filter, ChevronDown, ChevronUp, RotateCcw, X } from 'lucide-react';
import { exportToExcel } from '../utils/export';

interface FinancialsProps {
  transactions: Transaction[];
  onAddTransaction?: (transaction: Transaction) => void;
}

export const Financials: React.FC<FinancialsProps> = ({ transactions, onAddTransaction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('income');
  const [form, setForm] = useState({
      amount: '',
      category: '',
      description: '',
      notes: ''
  });

  // Filter transactions based on criteria
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesType = filterType === 'all' || t.type === filterType;
    
    const matchesStartDate = !startDate || t.date >= startDate;
    const matchesEndDate = !endDate || t.date <= endDate;

    return matchesSearch && matchesType && matchesStartDate && matchesEndDate;
  });

  // Calculate filtered totals
  const totalFilteredIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFilteredExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleOpenModal = (type: 'income' | 'expense') => {
      setModalType(type);
      setForm({ amount: '', category: '', description: '', notes: '' });
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!onAddTransaction) return;

      const newTransaction: Transaction = {
          id: Date.now().toString(),
          type: modalType,
          amount: parseFloat(form.amount),
          category: form.category,
          date: new Date().toISOString().split('T')[0],
          description: form.description,
          notes: form.notes
      };

      onAddTransaction(newTransaction);
      setIsModalOpen(false);
  };

  const handleExportExcel = () => {
    const exportData = filteredTransactions.map(t => ({
      'التاريخ': t.date,
      'الوصف': t.description,
      'التصنيف': t.category,
      'النوع': t.type === 'income' ? 'إيراد' : 'مصروف',
      'المبلغ': t.amount,
      'ملاحظات': t.notes || ''
    }));
    exportToExcel(exportData, `financial_report_${new Date().toISOString().split('T')[0]}`);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">الإدارة المالية</h2>
          <p className="text-slate-500 mt-1">تتبع الإيرادات والمصروفات وصافي الربح</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={handleExportExcel}
              className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center transition-colors shadow-sm whitespace-nowrap"
            >
                <FileSpreadsheet size={16} className="ml-2"/>
                تصدير Excel
            </button>
            <button 
                onClick={() => handleOpenModal('income')}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center shadow-sm shadow-emerald-600/20 whitespace-nowrap"
            >
                <TrendingUp size={16} className="ml-2"/>
                إضافة إيراد
            </button>
            <button 
                onClick={() => handleOpenModal('expense')}
                className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 flex items-center shadow-sm shadow-rose-600/20 whitespace-nowrap"
            >
                <TrendingDown size={16} className="ml-2"/>
                إضافة مصروف
            </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="بحث في المعاملات (الوصف، التصنيف، الملاحظات)..." 
                    className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white text-slate-900"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             <button 
                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                className={`flex items-center px-4 py-2.5 border rounded-lg transition-colors ${
                    isFilterPanelOpen || filterType !== 'all' || startDate || endDate
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
            >
                <Filter size={18} className="ml-2" />
                تصفية
                {isFilterPanelOpen ? <ChevronUp size={16} className="mr-2"/> : <ChevronDown size={16} className="mr-2"/>}
            </button>
        </div>

        {/* Filter Panel */}
         {isFilterPanelOpen && (
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-200">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">نوع المعاملة</label>
                    <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 text-sm"
                    >
                        <option value="all">الكل</option>
                        <option value="income">إيرادات</option>
                        <option value="expense">مصروفات</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">من تاريخ</label>
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">إلى تاريخ</label>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 bg-white"
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <p className="text-sm text-emerald-600 font-medium">مجموع الإيرادات</p>
              <p className="text-xl font-bold text-emerald-700">{totalFilteredIncome} {CURRENCY}</p>
          </div>
          <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
              <p className="text-sm text-rose-600 font-medium">مجموع المصروفات</p>
              <p className="text-xl font-bold text-rose-700">{totalFilteredExpense} {CURRENCY}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-600 font-medium">صافي الربح</p>
              <p className={`text-xl font-bold ${totalFilteredIncome - totalFilteredExpense >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                  {totalFilteredIncome - totalFilteredExpense} {CURRENCY}
              </p>
          </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">سجل المعاملات {filteredTransactions.length !== transactions.length ? `(${filteredTransactions.length})` : ''}</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-right">
                <thead className="bg-white text-slate-500 font-medium text-sm">
                    <tr>
                        <th className="p-4 border-b whitespace-nowrap">التاريخ</th>
                        <th className="p-4 border-b whitespace-nowrap">الوصف</th>
                        <th className="p-4 border-b whitespace-nowrap">التصنيف</th>
                        <th className="p-4 border-b whitespace-nowrap">النوع</th>
                        <th className="p-4 border-b whitespace-nowrap">المبلغ</th>
                        <th className="p-4 border-b whitespace-nowrap">ملاحظات</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTransactions.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400">لا توجد معاملات مطابقة للبحث</td>
                        </tr>
                    ) : (
                        filteredTransactions.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50">
                                <td className="p-4 border-b border-slate-50 text-slate-500 text-sm whitespace-nowrap">
                                    <div className="flex items-center">
                                        <Calendar size={14} className="ml-1"/>
                                        {t.date}
                                    </div>
                                </td>
                                <td className="p-4 border-b border-slate-50 font-medium text-slate-800">
                                    {t.description}
                                    {t.studentId && <div className="text-xs text-slate-400 mt-0.5">مرتبط بطالب</div>}
                                </td>
                                <td className="p-4 border-b border-slate-50">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs whitespace-nowrap">
                                        {t.category}
                                    </span>
                                </td>
                                <td className="p-4 border-b border-slate-50">
                                    <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                                        t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                    }`}>
                                        {t.type === 'income' ? 'إيراد' : 'مصروف'}
                                    </span>
                                </td>
                                <td className={`p-4 border-b border-slate-50 font-bold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {t.type === 'income' ? '+' : '-'} {t.amount} {CURRENCY}
                                </td>
                                <td className="p-4 border-b border-slate-50 text-sm text-slate-500 italic max-w-xs truncate">
                                    {t.notes || '-'}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

       {/* Add Transaction Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">
                  {modalType === 'income' ? 'إضافة إيراد جديد' : 'إضافة مصروف جديد'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">المبلغ ({CURRENCY})</label>
                <input 
                    type="number" 
                    required 
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg text-slate-900 bg-white" 
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({...form, amount: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الوصف</label>
                <input 
                    required 
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white" 
                    placeholder={modalType === 'income' ? "مثال: بيع كتب خارجية" : "مثال: فاتورة كهرباء"}
                    value={form.description}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">التصنيف</label>
                <select 
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                    value={form.category}
                    onChange={(e) => setForm({...form, category: e.target.value})}
                >
                    <option value="">اختر التصنيف</option>
                    {modalType === 'income' ? (
                        <>
                            <option value="اشتراكات">اشتراكات</option>
                            <option value="مذكرات">مذكرات/كتب</option>
                            <option value="اخرى">إيرادات أخرى</option>
                        </>
                    ) : (
                        <>
                            <option value="رواتب">رواتب</option>
                            <option value="ايجار">إيجار</option>
                            <option value="مرافق">كهرباء/مياه/انترنت</option>
                            <option value="صيانة">صيانة</option>
                            <option value="دعاية">دعاية وإعلان</option>
                            <option value="اخرى">نثريات/أخرى</option>
                        </>
                    )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات إضافية</label>
                <textarea 
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none text-slate-900 bg-white" 
                    value={form.notes}
                    onChange={(e) => setForm({...form, notes: e.target.value})}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className={`flex-1 text-white py-2.5 rounded-lg font-medium transition-colors ${
                    modalType === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}>
                    حفظ المعاملة
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-lg font-medium hover:bg-slate-200 transition-colors">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
