import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Users, DollarSign, Wallet, BookOpen, AlertTriangle, Clock, X } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { Student, Transaction, Session } from '../types';
import { CURRENCY } from '../constants';

interface DashboardProps {
  students: Student[];
  transactions: Transaction[];
  sessions: Session[];
}

export const Dashboard: React.FC<DashboardProps> = ({ students, transactions, sessions }) => {
  const [showToast, setShowToast] = useState(true);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Calculate active sessions (e.g., sessions scheduled for today or in the future)
  const todayDateStr = new Date().toISOString().split('T')[0];
  const activeSessionsCount = sessions.filter(s => s.date >= todayDateStr).length;

  // Calculate weekly financial data
  const getLast7Days = () => {
    const days = [];
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        dateStr,
        name: dayNames[d.getDay()],
        income: 0,
        expenses: 0
      });
    }
    return days;
  };

  const weeklyData = getLast7Days();
  transactions.forEach(t => {
    const day = weeklyData.find(d => d.dateStr === t.date);
    if (day) {
      if (t.type === 'income') day.income += t.amount;
      if (t.type === 'expense') day.expenses += t.amount;
    }
  });

  // Logic for Subscription Expiry
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const warningThresholdDays = 5;

  const subscriptionAlerts = students.reduce((acc, student) => {
      if (!student.subscriptionExpiryDate) return acc;
      
      const expiryDate = new Date(student.subscriptionExpiryDate);
      // Treat the expiry date as local midnight to avoid timezone offsets
      const expiryLocal = new Date(expiryDate.getUTCFullYear(), expiryDate.getUTCMonth(), expiryDate.getUTCDate());
      
      const timeDiff = expiryLocal.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysDiff < 0) {
          acc.push({ type: 'expired', student, days: Math.abs(daysDiff) });
      } else if (daysDiff <= warningThresholdDays) {
          acc.push({ type: 'expiring', student, days: daysDiff });
      }
      return acc;
  }, [] as { type: 'expired' | 'expiring', student: Student, days: number }[]);

  const expiredCount = subscriptionAlerts.filter(a => a.type === 'expired').length;
  const expiringCount = subscriptionAlerts.filter(a => a.type === 'expiring').length;

  return (
    <div className="space-y-6 relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="إجمالي الطلاب" 
          value={students.length} 
          icon={Users} 
          color="bg-blue-600"
          trend="12%"
        />
        <StatCard 
          title="الدخل الشهري" 
          value={`${totalIncome.toLocaleString()} ${CURRENCY}`} 
          icon={DollarSign} 
          color="bg-emerald-600"
          trend="8%"
        />
        <StatCard 
          title="المصروفات" 
          value={`${totalExpense.toLocaleString()} ${CURRENCY}`} 
          icon={Wallet} 
          color="bg-rose-600"
        />
        <StatCard 
          title="الحصص النشطة" 
          value={activeSessionsCount} 
          icon={BookOpen} 
          color="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">الأداء المالي الأسبوعي</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" name="الدخل" />
                <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" name="المصروفات" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center justify-between">
            <span>تنبيهات عاجلة</span>
            {(expiredCount > 0 || expiringCount > 0) && (
              <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full animate-pulse">
                {expiredCount + expiringCount} تنبيه
              </span>
            )}
          </h3>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px]">
            
            {/* Subscription Alerts */}
            {subscriptionAlerts.length > 0 ? (
                subscriptionAlerts.map((alert, idx) => (
                    <div key={idx} className={`flex items-start p-3 rounded-xl border ${
                        alert.type === 'expired' 
                        ? 'bg-red-50 border-red-100' 
                        : 'bg-amber-50 border-amber-100'
                    }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ml-3 shrink-0 ${
                            alert.type === 'expired' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                            {alert.type === 'expired' ? <AlertTriangle size={16}/> : <Clock size={16}/>}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">
                                {alert.type === 'expired' ? 'اشتراك منتهي' : 'قرب انتهاء الاشتراك'}
                            </p>
                            <p className="text-xs text-slate-600 mt-1">
                                الطالب <span className="font-bold">{alert.student.name}</span>
                                {alert.type === 'expired' 
                                 ? ` انتهى اشتراكه منذ ${alert.days} يوم.` 
                                 : ` ينتهي اشتراكه خلال ${alert.days} يوم.`}
                            </p>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-4 text-slate-400 text-sm">لا توجد تنبيهات اشتراكات حالياً</div>
            )}

            {/* Existing Alerts */}
            <div className="flex items-start p-3 bg-blue-50 rounded-xl border border-blue-100">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 ml-3 shrink-0"></div>
              <div>
                <p className="text-sm font-semibold text-slate-800">حصة قادمة</p>
                <p className="text-xs text-slate-500 mt-1">مجموعة اللغة الإنجليزية (أ) تبدأ خلال 30 دقيقة.</p>
              </div>
            </div>
             <div className="flex items-start p-3 bg-purple-50 rounded-xl border border-purple-100">
              <div className="w-2 h-2 mt-2 rounded-full bg-purple-500 ml-3 shrink-0"></div>
              <div>
                <p className="text-sm font-semibold text-slate-800">نسخ احتياطي</p>
                <p className="text-xs text-slate-500 mt-1">تم إجراء النسخ الاحتياطي التلقائي بنجاح.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification for Critical Alerts */}
      {showToast && (expiredCount > 0 || expiringCount > 0) && (
        <div className="fixed bottom-8 right-8 left-8 md:left-auto md:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 animate-in slide-in-from-bottom-5 duration-500 z-50 flex gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-slate-800">تنبيهات الاشتراكات</h4>
                <p className="text-sm text-slate-500 mt-1">
                    يوجد {expiredCount} اشتراك منتهي و {expiringCount} اشتراك يوشك على الانتهاء. يرجى مراجعة الطلاب.
                </p>
            </div>
            <button 
                onClick={() => setShowToast(false)}
                className="text-slate-400 hover:text-slate-600 h-fit"
            >
                <X size={20} />
            </button>
        </div>
      )}
    </div>
  );
};
