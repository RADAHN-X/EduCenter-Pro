import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './views/Dashboard';
import { Students } from './views/Students';
import { Financials } from './views/Financials';
import { Groups } from './views/Groups';
import { Teachers } from './views/Teachers';
import { Reports } from './views/Reports';
import { Settings } from './views/Settings';
import { Login } from './views/Login';
import { Student, Session, AttendanceRecord, Transaction, Group, Teacher, UserProfile } from './types';
import { db } from './services/Database';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [activeView, setActiveView] = useState('dashboard');
  const [isDbReady, setIsDbReady] = useState(false);
  
  // State populated from DB
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Check for saved session
  useEffect(() => {
    const savedUser = localStorage.getItem('educenter_user');
    if (savedUser) {
        try {
            setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
            console.error("Invalid user session");
            localStorage.removeItem('educenter_user');
        }
    }
    setIsLoadingAuth(false);
  }, []);

  // Initialize DB on mount
  useEffect(() => {
    const initData = async () => {
        await db.init();
        refreshData();
        setIsDbReady(true);
    };
    initData();
  }, []);

  const handleLogin = (user: UserProfile) => {
      setCurrentUser(user);
      localStorage.setItem('educenter_user', JSON.stringify(user));
  };

  const handleLogout = () => {
      setCurrentUser(null);
      localStorage.removeItem('educenter_user');
      setActiveView('dashboard'); // Reset view on logout
  };

  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
      if (!currentUser) return;
      const updatedUser = { ...currentUser, ...updates };
      
      // 1. Update React State
      setCurrentUser(updatedUser);
      // 2. Update Browser Session Storage
      localStorage.setItem('educenter_user', JSON.stringify(updatedUser));
      // 3. Persist to SQL Database
      db.updateUser(updatedUser);
  };

  const refreshData = () => {
      setStudents(db.getAllStudents());
      setTransactions(db.getAllTransactions());
      setGroups(db.getAllGroups());
      setSessions(db.getAllSessions());
      setAttendance(db.getAllAttendance());
      setTeachers(db.getAllTeachers());
  };

  const handleAddStudent = (newStudent: Student) => {
    db.addStudent(newStudent);
    refreshData();
  };

  const handleDeleteStudent = (id: string) => {
    db.deleteStudent(id);
    refreshData();
  };

  const handleAddSession = (newSession: Session) => {
    db.addSession(newSession);
    refreshData();
  };

  const handleUpdateSession = (updatedSession: Session) => {
    db.addSession(updatedSession); // addSession uses REPLACE
    refreshData();
  };

  const handleDeleteSession = (id: string) => {
    db.deleteSession(id);
    refreshData();
  };

  const handleUpdateAttendance = (record: AttendanceRecord) => {
    db.addAttendance(record);
    refreshData();
  };

  const handleAddTransaction = (newTransaction: Transaction) => {
    db.addTransaction(newTransaction);
    
    // Update Student Balance logic via DB
    if (newTransaction.studentId) {
        // Fetch fresh data from DB to ensure balance is accurate
        const currentStudents = db.getAllStudents();
        const student = currentStudents.find(s => s.id === newTransaction.studentId);
        
        if (student) {
            const change = newTransaction.type === 'income' ? newTransaction.amount : -newTransaction.amount;
            const newBalance = student.balance + change;
            db.updateStudentBalance(student.id, newBalance);
        }
    }
    refreshData();
  };

  const handleAddTeacher = (teacher: Teacher) => {
    db.addTeacher(teacher);
    refreshData();
  };

  const handleDeleteTeacher = (id: string) => {
    db.deleteTeacher(id);
    refreshData();
  };

  const handleAddGroup = (group: Group) => {
    db.addGroup(group);
    refreshData();
  };

  const handleDeleteGroup = (id: string) => {
    db.deleteGroup(id);
    refreshData();
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard students={students} transactions={transactions} sessions={sessions} />;
      case 'students':
        return (
            <Students 
                students={students} 
                transactions={transactions}
                onAddStudent={handleAddStudent} 
                onUpdateStudent={handleAddStudent}
                onDeleteStudent={handleDeleteStudent}
                onAddTransaction={handleAddTransaction}
            />
        );
      case 'teachers':
        return (
          <Teachers 
            teachers={teachers} 
            groups={groups}
            sessions={sessions}
            transactions={transactions}
            attendance={attendance}
            onAddTeacher={handleAddTeacher}
            onDeleteTeacher={handleDeleteTeacher}
            onAddTransaction={handleAddTransaction}
          />
        );
      case 'groups':
        return (
          <Groups 
            groups={groups} 
            students={students} 
            sessions={sessions} 
            attendance={attendance}
            teachers={teachers}
            onAddSession={handleAddSession}
            onUpdateSession={handleUpdateSession}
            onDeleteSession={handleDeleteSession}
            onUpdateAttendance={handleUpdateAttendance}
            onAddGroup={handleAddGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        );
      case 'financials':
        return (
          <Financials 
            transactions={transactions} 
            onAddTransaction={handleAddTransaction}
          />
        );
      case 'reports':
        return (
          <Reports 
             students={students}
             teachers={teachers}
             transactions={transactions}
             attendance={attendance}
             groups={groups}
             sessions={sessions}
          />
        );
      case 'settings':
        return <Settings currentUser={currentUser} onUpdateProfile={handleUpdateProfile} />;
      default:
        return <Dashboard students={students} transactions={transactions} sessions={sessions} />;
    }
  };

  // 1. Loading State
  if (isLoadingAuth || (!isDbReady && currentUser)) {
      return (
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600 gap-4">
              <Loader2 className="animate-spin text-blue-600" size={48} />
              <p className="font-medium">
                  {!isDbReady ? 'جاري تحميل قاعدة البيانات...' : 'جاري التحقق من الدخول...'}
              </p>
          </div>
      );
  }

  // 2. Login View
  if (!currentUser) {
      return <Login onLogin={handleLogin} />;
  }

  // 3. Main App View
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
          activeView={activeView} 
          setActiveView={setActiveView} 
          currentUser={currentUser}
          onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 mr-64 h-screen overflow-y-auto p-8 relative">
        <header className="flex justify-between items-center mb-8 print:hidden">
          <div>
             {/* Breadcrumbs or Title could go here */}
          </div>
          <div className="flex items-center gap-4">
             <div className="text-left hidden md:block">
                <p className="text-sm font-bold text-slate-700">{currentUser.name}</p>
                <p className="text-xs text-slate-500">نشط الآن</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
                 {currentUser.avatar ? (
                     <img src={currentUser.avatar} alt="User" className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold">
                        {currentUser.name.charAt(0)}
                    </div>
                 )}
             </div>
          </div>
        </header>
        
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
