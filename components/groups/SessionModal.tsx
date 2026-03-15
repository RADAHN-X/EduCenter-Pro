import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Session } from '../../types';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { topic: string; date: string; startTime: string }) => void;
  initialData?: Partial<Session>;
  title: string;
  submitLabel: string;
}

export const SessionModal: React.FC<SessionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
  submitLabel
}) => {
  const [formData, setFormData] = useState({
    topic: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '16:00'
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        topic: initialData?.topic || '',
        date: initialData?.date || new Date().toISOString().split('T')[0],
        startTime: initialData?.startTime || '16:00'
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">موضوع الحصة</label>
            <input 
              required
              placeholder="مثال: مراجعة الوحدة الأولى"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.topic}
              onChange={e => setFormData({...formData, topic: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">التاريخ</label>
              <input 
                type="date"
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">الوقت</label>
              <input 
                type="time"
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.startTime}
                onChange={e => setFormData({...formData, startTime: e.target.value})}
              />
            </div>
          </div>
          
          <div className="pt-4 flex gap-3">
            <button 
              type="submit" 
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {submitLabel}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
