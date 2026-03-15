import React, { useState } from 'react';
import { Group, Session, Student, AttendanceRecord, Teacher } from '../types';
import { GroupList } from '../components/groups/GroupList';
import { GroupDetails } from '../components/groups/GroupDetails';
import { AttendanceSheet } from '../components/groups/AttendanceSheet';
import { StudentSelectionModal } from '../components/groups/StudentSelectionModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { X } from 'lucide-react';

interface GroupsProps {
  groups: Group[];
  students: Student[];
  sessions: Session[];
  attendance: AttendanceRecord[];
  teachers: Teacher[]; 
  onAddSession: (session: Session) => void;
  onUpdateSession: (session: Session) => void;
  onDeleteSession: (id: string) => void;
  onUpdateAttendance: (record: AttendanceRecord) => void;
  onAddGroup: (group: Group) => void; 
  onDeleteGroup: (id: string) => void;
}

export const Groups: React.FC<GroupsProps> = ({ 
  groups, 
  students, 
  sessions, 
  attendance,
  teachers,
  onAddSession,
  onUpdateSession,
  onDeleteSession,
  onUpdateAttendance,
  onAddGroup,
  onDeleteGroup
}) => {
  // Navigation State (Router Logic)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Modal State
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [managingGroupId, setManagingGroupId] = useState<string | null>(null);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  
  const [newGroupForm, setNewGroupForm] = useState({
      name: '',
      subject: '',
      teacherId: '',
      schedule: ''
  });

  // --- Handlers ---
  const handleGroupSelect = (id: string) => {
    setSelectedGroupId(id);
    setSelectedSessionId(null); // Reset session when changing group
  };

  const handleSessionSelect = (id: string) => {
    setSelectedSessionId(id);
  };

  const handleBackToGroups = () => {
    setSelectedGroupId(null);
    setSelectedSessionId(null);
  };

  const handleBackToGroupDetails = () => {
    setSelectedSessionId(null);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteGroupId(id);
  };

  const handleConfirmDelete = () => {
    if (deleteGroupId) {
        onDeleteGroup(deleteGroupId);
        setDeleteGroupId(null);
    }
  };

  const handleCreateGroup = (e: React.FormEvent) => {
      e.preventDefault();
      const newGroup: Group = {
          id: Date.now().toString(),
          name: newGroupForm.name,
          subject: newGroupForm.subject,
          teacherId: newGroupForm.teacherId,
          schedule: newGroupForm.schedule,
          studentIds: [] // Start with no students, add later
      };
      onAddGroup(newGroup);
      setIsAddGroupModalOpen(false);
      setNewGroupForm({ name: '', subject: '', teacherId: '', schedule: '' });
  };

  const handleUpdateGroupStudents = (studentIds: string[]) => {
      if (managingGroupId) {
          const group = groups.find(g => g.id === managingGroupId);
          if (group) {
              onAddGroup({
                  ...group,
                  studentIds
              });
          }
          setManagingGroupId(null);
      }
  };

  // --- Render Logic (View Routing) ---

  // 1. Attendance View (Deepest Level)
  if (selectedSessionId && selectedGroupId) {
    const session = sessions.find(s => s.id === selectedSessionId);
    const group = groups.find(g => g.id === selectedGroupId);
    
    if (session && group) {
      return (
        <AttendanceSheet 
          group={group}
          session={session}
          students={students}
          attendance={attendance}
          onBack={handleBackToGroupDetails}
          onUpdateAttendance={onUpdateAttendance}
          onUpdateSession={onUpdateSession}
        />
      );
    }
  }

  // 2. Group Details View (Middle Level)
  if (selectedGroupId) {
    const group = groups.find(g => g.id === selectedGroupId);
    const groupSessions = sessions.filter(s => s.groupId === selectedGroupId);
    
    if (group) {
      return (
        <>
            <GroupDetails 
              group={group}
              sessions={groupSessions}
              students={students}
              onBack={handleBackToGroups}
              onSessionClick={handleSessionSelect}
              onAddSession={onAddSession}
              onUpdateSession={onUpdateSession}
              onUpdateGroup={onAddGroup}
              onManageStudents={() => setManagingGroupId(group.id)}
              onDeleteSession={onDeleteSession}
            />
            {/* Student Management Modal (Rendered here to be on top of details if needed, though details usually handles its own. 
                But since we moved state up, we render it here or pass control down. 
                Actually, if we render it here, it covers the details view. 
            */}
             {managingGroupId && (
                <StudentSelectionModal 
                    isOpen={true}
                    onClose={() => setManagingGroupId(null)}
                    allStudents={students}
                    selectedIds={groups.find(g => g.id === managingGroupId)?.studentIds || []}
                    onSave={handleUpdateGroupStudents}
                    groupName={groups.find(g => g.id === managingGroupId)?.name}
                />
            )}
        </>
      );
    }
  }

  // 3. Group List View (Root Level)
  return (
    <>
        <GroupList 
          groups={groups} 
          onGroupClick={handleGroupSelect} 
          onAddGroupClick={() => setIsAddGroupModalOpen(true)}
          onDeleteGroupClick={handleDeleteClick}
          onManageStudents={(groupId) => setManagingGroupId(groupId)}
        />

        {/* Create Group Modal */}
        {isAddGroupModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800">إنشاء مجموعة جديدة</h3>
                        <button onClick={() => setIsAddGroupModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={24} />
                        </button>
                    </div>
                    <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">اسم المجموعة</label>
                            <input 
                                required
                                placeholder="مثال: مجموعة التفوق - 3 ثانوي"
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white"
                                value={newGroupForm.name}
                                onChange={e => setNewGroupForm({...newGroupForm, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">المادة</label>
                            <input 
                                required
                                placeholder="مثال: لغة عربية"
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white"
                                value={newGroupForm.subject}
                                onChange={e => setNewGroupForm({...newGroupForm, subject: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">المدرس المسؤول</label>
                            <select 
                                required
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                                value={newGroupForm.teacherId}
                                onChange={e => setNewGroupForm({...newGroupForm, teacherId: e.target.value})}
                            >
                                <option value="">اختر المدرس</option>
                                {teachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">المواعيد</label>
                            <input 
                                required
                                placeholder="مثال: الأحد والأربعاء 6 مساءً"
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white"
                                value={newGroupForm.schedule}
                                onChange={e => setNewGroupForm({...newGroupForm, schedule: e.target.value})}
                            />
                        </div>
                        
                        <div className="pt-4 flex gap-3">
                            <button 
                                type="submit" 
                                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                                إنشاء المجموعة
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setIsAddGroupModalOpen(false)}
                                className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Student Management Modal (For List View) */}
        {managingGroupId && (
            <StudentSelectionModal 
                isOpen={true}
                onClose={() => setManagingGroupId(null)}
                allStudents={students}
                selectedIds={groups.find(g => g.id === managingGroupId)?.studentIds || []}
                onSave={handleUpdateGroupStudents}
                groupName={groups.find(g => g.id === managingGroupId)?.name}
            />
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
            isOpen={!!deleteGroupId}
            onClose={() => setDeleteGroupId(null)}
            onConfirm={handleConfirmDelete}
            title="حذف المجموعة"
            message="هل أنت متأكد من حذف هذه المجموعة؟ سيتم حذف جميع الحصص المرتبطة بها ولا يمكن التراجع عن هذا الإجراء."
            confirmText="حذف"
            cancelText="إلغاء"
            isDestructive={true}
        />
    </>
  );
};
