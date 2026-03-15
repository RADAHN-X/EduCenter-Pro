import React, { useState, useEffect } from 'react';
import { Search, X, Check } from 'lucide-react';
import { Student } from '../../types';

interface StudentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  allStudents: Student[];
  selectedIds: string[];
  onSave: (ids: string[]) => void;
  groupName?: string;
}

export const StudentSelectionModal: React.FC<StudentSelectionModalProps> = ({
  isOpen,
  onClose,
  allStudents,
  selectedIds,
  onSave,
  groupName
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSelected, setCurrentSelected] = useState<Set<string>>(new Set(selectedIds));

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentSelected(new Set(selectedIds));
      setSearchTerm('');
    }
  }, [isOpen, selectedIds]);

  if (!isOpen) return null;

  const toggleSelection = (id: string) => {
    const newSelected = new Set(currentSelected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setCurrentSelected(newSelected);
  };

  const filteredStudents = allStudents.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.phone.includes(searchTerm)
  );

  const handleSave = () => {
    onSave(Array.from(currentSelected));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              {groupName ? `إدارة طلاب: ${groupName}` : 'إدارة طلاب المجموعة'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">تم تحديد {currentSelected.size} طالب</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="بحث عن طالب (الاسم أو رقم الهاتف)..." 
              className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
           <div className="space-y-1">
             {filteredStudents.map(student => {
               const isSelected = currentSelected.has(student.id);
               return (
                 <div 
                    key={student.id}
                    onClick={() => toggleSelection(student.id)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                      isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50 border-transparent'
                    }`}
                 >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isSelected ? <Check size={20} /> : student.name.charAt(0)}
                      </div>
                      <div>
                        <p className={`font-semibold ${isSelected ? 'text-blue-800' : 'text-slate-800'}`}>{student.name}</p>
                        <p className="text-xs text-slate-500">{student.grade} • {student.phone}</p>
                      </div>
                    </div>
                 </div>
               );
             })}
           </div>
           {filteredStudents.length === 0 && (
             <div className="p-8 text-center text-slate-400">
                {searchTerm ? 'لا توجد نتائج مطابقة للبحث' : 'لا يوجد طلاب'}
             </div>
           )}
        </div>

        <div className="p-4 border-t border-slate-100 flex gap-3 shrink-0">
          <button 
            onClick={handleSave}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            حفظ التغييرات
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-lg font-medium hover:bg-slate-200 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
