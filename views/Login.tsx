import React, { useState } from 'react';
import { Lock, User, ArrowLeft, GraduationCap } from 'lucide-react';
import { APP_NAME } from '../constants';
import { UserProfile } from '../types';
import { db } from '../services/Database';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate a small delay for better UX (and to let the UI update to loading state)
    // even though SQL.js is synchronous.
    setTimeout(() => {
        try {
            const user = db.loginUser(username.toLowerCase().trim(), password);
            
            if (user) {
                onLogin(user);
            } else {
                setError('اسم المستخدم أو كلمة المرور غير صحيحة');
                setIsLoading(false);
            }
        } catch (e) {
            console.error(e);
            setError('حدث خطأ أثناء الاتصال بقاعدة البيانات');
            setIsLoading(false);
        }
    }, 600);
  };

  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 animate-in slide-in-from-right-8 duration-700">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/30">
               <GraduationCap size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">تسجيل الدخول</h1>
            <p className="text-slate-500">مرحباً بك في نظام {APP_NAME}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center">
                 <span className="ml-2">⚠️</span> {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">اسم المستخدم</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  placeholder="admin"
                  required
                />
                <User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">كلمة المرور</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  تسجيل الدخول
                  <ArrowLeft size={20} className="mr-2" />
                </>
              )}
            </button>
          </form>

      
        </div>
      </div>

      {/* Left Side - Decorative Image */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-purple-900/90 z-10"></div>
        <img 
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1500&q=80" 
            alt="Education" 
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
        />
        
        <div className="relative z-20 text-white max-w-lg text-center p-12">
            <h2 className="text-4xl font-bold mb-6 leading-tight">نظام إدارة تعليمي متكامل للمستقبل</h2>
            <p className="text-lg text-blue-100 leading-relaxed">
                تحكم كامل في الطلاب، المدرسين، الحصص، والماليات. كل ما تحتاجه لإدارة السنتر التعليمي بكفاءة واحترافية.
            </p>
            
            <div className="mt-12 flex justify-center gap-4">
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                    <p className="font-bold text-2xl">500+</p>
                    <p className="text-sm text-blue-200">طالب</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                    <p className="font-bold text-2xl">50+</p>
                    <p className="text-sm text-blue-200">مجموعة</p>
                </div>
                 <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                    <p className="font-bold text-2xl">100%</p>
                    <p className="text-sm text-blue-200">تحكم</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
