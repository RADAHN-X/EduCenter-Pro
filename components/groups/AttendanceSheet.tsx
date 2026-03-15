import React, { useState } from 'react';
import { ArrowRight, Edit2, CheckCircle, Clock, XCircle, UserPlus, StopCircle, AlertCircle, Check } from 'lucide-react';
import { Group, Session, Student, AttendanceRecord, AttendanceStatus } from '../../types';
import { SessionModal } from './SessionModal';

interface AttendanceSheetProps {
  group: Group;
  session: Session;
  students: Student[];
  attendance: AttendanceRecord[];
  onBack: () => void;
  onUpdateAttendance: (record: AttendanceRecord) => void;
  onUpdateSession: (session: Session) => void;
}

export const AttendanceSheet: React.FC<AttendanceSheetProps> = ({
  group,
  session,
  students,
  attendance,
  onBack,
  onUpdateAttendance,
  onUpdateSession
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);

  // Filter students belonging to this group
  const groupStudents = students.filter(s => group.studentIds.includes(s.id));

  // Compute stats
  const presentCount = groupStudents.filter(s => 
    attendance.find(a => a.sessionId === session.id && a.studentId === s.id)?.status === 'present'
  ).length;
  
  const attendancePercentage = groupStudents.length > 0 
    ? Math.round((presentCount / groupStudents.length) * 100) 
    : 0;

  // Handlers
  const markAttendance = (studentId: string, status: AttendanceStatus) => {
    const existingRecord = attendance.find(
      a => a.sessionId === session.id && a.studentId === studentId
    );

    const record: AttendanceRecord = {
      id: existingRecord ? existingRecord.id : Date.now().toString() + Math.random(),
      sessionId: session.id,
      studentId: studentId,
      status: status,
      timestamp: new Date().toISOString()
    };
    
    onUpdateAttendance(record);
  };

  const markAllPresent = () => {
    group.studentIds.forEach(sid => markAttendance(sid, 'present'));
  };

  const handleEditSubmit = (data: { topic: string; date: string; startTime: string }) => {
    onUpdateSession({
      ...session,
      topic: data.topic,
      date: data.date,
      startTime: data.startTime
    });
    setIsEditModalOpen(false);
  };

  const confirmEndSession = () => {
      onUpdateSession({
          ...session,
          status: 'completed'
      });
      setShowEndConfirmation(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
          <ArrowRight size={24} />
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800">تسجيل الحضور</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  session.status === 'active' ? 'bg-green-100 text-green-700' : 
                  session.status === 'completed' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'
              }`}>
                  {session.status === 'active' ? 'نشطة' : session.status === 'completed' ? 'منتهية' : 'مجدولة'}
              </span>
              
              {/* End Session Button with Inline Confirmation */}
              {session.status === 'active' && (
                  <div className="flex items-center gap-2 mr-2">
                      {!showEndConfirmation ? (
                          <button 
                            type="button"
                            onClick={() => setShowEndConfirmation(true)}
                            className="bg-rose-100 text-rose-700 hover:bg-rose-200 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center transition-colors border border-rose-200 shadow-sm"
                          >
                              <StopCircle size={14} className="ml-1" />
                              إنهاء الحصة
                          </button>
                      ) : (
                          <div className="flex items-center gap-2 bg-rose-50 p-1 rounded-lg border border-rose-100 animate-in fade-in zoom-in duration-200">
                              <span className="text-xs text-rose-700 font-medium px-2">تأكيد الإنهاء؟</span>
                              <button 
                                type="button"
                                onClick={confirmEndSession}
                                className="bg-rose-600 text-white px-3 py-1 rounded-md text-xs font-bold hover:bg-rose-700 transition-colors"
                              >
                                  نعم
                              </button>
                              <button 
                                type="button"
                                onClick={() => setShowEndConfirmation(false)}
                                className="bg-white text-slate-600 px-3 py-1 rounded-md text-xs font-bold hover:bg-slate-50 border border-slate-200 transition-colors"
                              >
                                  لا
                              </button>
                          </div>
                      )}
                  </div>
              )}

              <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-slate-400 hover:text-blue-600 p-2 rounded-lg transition-colors mr-auto bg-slate-50 hover:bg-blue-50"
                  title="تعديل تفاصيل الحصة"
              >
                  <Edit2 size={18} />
              </button>
          </div>
          <div className="flex items-center gap-2 mt-2 text-slate-500 text-sm">
              <span className="font-medium text-blue-600">{group.name}</span>
              <span className="text-slate-300">•</span>
              <span>{session.topic || 'بدون عنوان'}</span>
              <span className="text-slate-300">•</span>
              <span className="dir-ltr">{session.date}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student List */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800">قائمة الطلاب ({groupStudents.length})</h3>
                  {groupStudents.length > 0 && session.status !== 'completed' && (
                      <button 
                          onClick={markAllPresent}
                          className="text-blue-600 text-sm font-medium hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center"
                      >
                          <CheckCircle size={16} className="ml-1.5" />
                          تسجيل الجميع "حضور"
                      </button>
                  )}
              </div>
              
              {groupStudents.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                    <UserPlus size={48} className="mx-auto mb-3 opacity-20" />
                    <p className="font-medium">لا يوجد طلاب في هذه المجموعة.</p>
                    <p className="text-sm mt-1">يجب إضافة طلاب إلى المجموعة أولاً لتسجيل حضورهم.</p>
                    <button 
                        onClick={onBack}
                        className="mt-4 text-blue-600 hover:underline text-sm"
                    >
                        العودة لإدارة المجموعة
                    </button>
                  </div>
              ) : (
                  <div className="space-y-3">
                      {groupStudents.map(student => {
                          const record = attendance.find(a => a.sessionId === session.id && a.studentId === student.id);
                          const status = record?.status;

                          return (
                              <div key={student.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
                                          {student.name.charAt(0)}
                                      </div>
                                      <div>
                                          <p className="font-semibold text-slate-800">{student.name}</p>
                                          <p className="text-xs text-slate-500">{student.phone}</p>
                                      </div>
                                  </div>
                                  <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                                      <button 
                                          onClick={() => markAttendance(student.id, 'present')}
                                          disabled={session.status === 'completed'}
                                          className={`p-2 rounded-md transition-all ${status === 'present' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-emerald-600'} ${session.status === 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          title="حاضر"
                                      >
                                          <CheckCircle size={20} />
                                      </button>
                                      <button 
                                          onClick={() => markAttendance(student.id, 'late')}
                                          disabled={session.status === 'completed'}
                                          className={`p-2 rounded-md transition-all ${status === 'late' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-amber-600'} ${session.status === 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          title="تأخير"
                                      >
                                          <Clock size={20} />
                                      </button>
                                      <button 
                                          onClick={() => markAttendance(student.id, 'absent')}
                                          disabled={session.status === 'completed'}
                                          className={`p-2 rounded-md transition-all ${status === 'absent' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-rose-600'} ${session.status === 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          title="غائب"
                                      >
                                          <XCircle size={20} />
                                      </button>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              )}
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h3 className="font-bold text-slate-800 mb-4">إحصائيات الجلسة</h3>
                  <div className="space-y-4">
                      <div className="flex justify-between items-center">
                          <span className="text-slate-600 flex items-center"><CheckCircle size={16} className="ml-2 text-emerald-500"/>حضور</span>
                          <span className="font-bold text-slate-800">{presentCount}</span>
                      </div>
                       <div className="flex justify-between items-center">
                          <span className="text-slate-600 flex items-center"><XCircle size={16} className="ml-2 text-rose-500"/>غياب</span>
                          <span className="font-bold text-slate-800">
                              {groupStudents.length - groupStudents.filter(s => attendance.find(a => a.sessionId === session.id && a.studentId === s.id)).length}
                          </span>
                      </div>
                      <div className="pt-4 border-t border-slate-100">
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                              <div 
                                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                                  style={{ width: `${attendancePercentage}%` }}
                              ></div>
                          </div>
                          <p className="text-xs text-center mt-2 text-slate-500">
                              نسبة الحضور: {attendancePercentage}%
                          </p>
                      </div>
                  </div>
              </div>

              <div className={`rounded-2xl border p-4 transition-colors ${
                  session.status === 'completed' ? 'bg-slate-50 border-slate-200' : 'bg-blue-50 border-blue-100'
              }`}>
                  <h4 className={`font-bold text-sm mb-2 flex items-center ${
                      session.status === 'completed' ? 'text-slate-700' : 'text-blue-800'
                  }`}>
                      <AlertCircle size={16} className="ml-2" />
                      حالة الحصة
                  </h4>
                  <p className={`text-xs leading-relaxed ${
                       session.status === 'completed' ? 'text-slate-600' : 'text-blue-600'
                  }`}>
                      {session.status === 'completed' 
                        ? 'تم إنهاء هذه الحصة. تم إغلاق سجل الحضور ولا يمكن إجراء تعديلات إضافية.' 
                        : 'الحصة جارية الآن. يتم حفظ حالات الحضور تلقائياً. قم بإنهاء الحصة عند الانتهاء لإغلاق السجل.'}
                  </p>
                  {session.status === 'completed' && (
                      <div className="mt-3 flex items-center justify-center text-emerald-600 font-bold text-sm bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                          <Check size={16} className="ml-1" />
                          مكتملة
                      </div>
                  )}
              </div>
          </div>
      </div>

      <SessionModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={session}
        title="تعديل موعد الحصة"
        submitLabel="حفظ التعديلات"
      />
    </div>
  );
};
