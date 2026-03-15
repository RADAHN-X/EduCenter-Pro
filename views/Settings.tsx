import React, { useRef, useState, useEffect } from 'react';
import { db } from '../services/Database';
import { Save, Upload, Database, AlertCircle, Check, Download, Info, User, Lock, Camera } from 'lucide-react';
import { UserProfile } from '../types';

interface SettingsProps {
    currentUser: UserProfile;
    onUpdateProfile: (data: Partial<UserProfile>) => void;
}

export const Settings: React.FC<SettingsProps> = ({ currentUser, onUpdateProfile }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<{type: 'success' | 'error' | 'loading' | null, message: string}>({ type: null, message: '' });

    // Profile State
    const [profileName, setProfileName] = useState(currentUser?.name || '');
    const [profileRole, setProfileRole] = useState(currentUser?.role || '');
    const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatar || '');
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (currentUser) {
            setProfileName(currentUser.name);
            setProfileRole(currentUser.role);
            setProfileAvatar(currentUser.avatar || '');
        }
    }, [currentUser]);

    const handleUpdateProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateProfile({
            name: profileName,
            avatar: profileAvatar,
            // In a real app, role changes might be restricted, but we allow it here for the "edit name" request
        });
        setStatus({ type: 'success', message: 'تم تحديث البيانات الشخصية بنجاح' });
        setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 200;
                    const MAX_HEIGHT = 200;
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
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    setProfileAvatar(dataUrl);
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChangePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setStatus({ type: 'error', message: 'كلمة المرور الجديدة غير متطابقة' });
            setTimeout(() => setStatus({ type: null, message: '' }), 3000);
            return;
        }
        if (newPassword.length < 6) {
            setStatus({ type: 'error', message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
            setTimeout(() => setStatus({ type: null, message: '' }), 3000);
            return;
        }

        const success = db.updateUserPassword(currentUser.id, currentPassword, newPassword);
        if (success) {
            setStatus({ type: 'success', message: 'تم تغيير كلمة المرور بنجاح' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setStatus({ type: 'error', message: 'كلمة المرور الحالية غير صحيحة' });
        }
        setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    };

    const handleBackup = () => {
        try {
            const data = db.exportDatabase();
            if (data) {
                // Ensure we have a Uint8Array backed by an ArrayBuffer (not SharedArrayBuffer)
                const bytes = data instanceof Uint8Array ? data : new Uint8Array(data as any);
                // Make a copy (slice) so the underlying buffer is a plain ArrayBuffer
                const copy = bytes.slice();
                const blob = new Blob([copy], { type: 'application/x-sqlite3' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `educenter_backup_${new Date().toISOString().split('T')[0]}.db`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                setStatus({ type: 'success', message: 'تم تحميل ملف النسخ الاحتياطي بنجاح' });
            } else {
                setStatus({ type: 'error', message: 'فشل في تصدير قاعدة البيانات' });
            }
        } catch (e) {
            console.error(e);
            setStatus({ type: 'error', message: 'حدث خطأ أثناء النسخ الاحتياطي' });
        }
    };

    const handleRestoreTrigger = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!window.confirm('تحذير: استعادة قاعدة البيانات ستقوم باستبدال كافة البيانات الحالية. هل أنت متأكد من الاستمرار؟')) {
            if(fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        try {
            setStatus({ type: 'loading', message: 'جاري استعادة البيانات...' });
            await db.importDatabase(file);
            setStatus({ type: 'success', message: 'تم استعادة البيانات بنجاح. جاري تحديث النظام...' });
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: 'فشل في قراءة ملف قاعدة البيانات. تأكد من صحة الملف.' });
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">إعدادات النظام</h2>
                <p className="text-slate-500 mt-1">الملف الشخصي، النسخ الاحتياطي، وإدارة البيانات</p>
            </div>

            {status.type && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                    status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                    status.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' :
                    'bg-blue-50 border-blue-100 text-blue-700'
                }`}>
                    {status.type === 'success' && <Check size={20} />}
                    {status.type === 'error' && <AlertCircle size={20} />}
                    {status.type === 'loading' && <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
                    <span className="font-medium">{status.message}</span>
                </div>
            )}

            {/* Profile Settings Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                    <User size={24} className="text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-800">تعديل الملف الشخصي</h3>
                </div>
                
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                            <img 
                                src={profileAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName)}&background=0D8ABC&color=fff`} 
                                alt="Profile" 
                                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                            />
                            <button 
                                onClick={() => avatarInputRef.current?.click()}
                                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-colors"
                                title="تغيير الصورة"
                            >
                                <Camera size={16} />
                            </button>
                            <input 
                                type="file" 
                                accept="image/*" 
                                ref={avatarInputRef} 
                                className="hidden" 
                                onChange={handleAvatarChange}
                            />
                        </div>
                        <span className="text-sm text-slate-500">صورة الحساب</span>
                    </div>

                    {/* Form Section */}
                    <form onSubmit={handleUpdateProfileSubmit} className="flex-1 flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-full md:w-1/2 space-y-2">
                                <label className="text-sm font-medium text-slate-700">الاسم الظاهر</label>
                                <input 
                                    type="text" 
                                    value={profileName}
                                    onChange={(e) => setProfileName(e.target.value)}
                                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white"
                                    placeholder="اسمك الكامل"
                                />
                            </div>
                            <div className="w-full md:w-1/2 space-y-2">
                                <label className="text-sm font-medium text-slate-700">المسمى الوظيفي</label>
                                 <input 
                                    type="text" 
                                    value={profileRole}
                                    disabled
                                    className="w-full p-2.5 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg cursor-not-allowed"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button 
                                type="submit"
                                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                حفظ التغييرات
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Password Settings Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                    <Lock size={24} className="text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-800">تغيير كلمة المرور</h3>
                </div>
                
                <form onSubmit={handleChangePasswordSubmit} className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="w-full md:w-1/4 space-y-2">
                        <label className="text-sm font-medium text-slate-700">كلمة المرور الحالية</label>
                        <input 
                            type="password" 
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white"
                            required
                        />
                    </div>
                    <div className="w-full md:w-1/4 space-y-2">
                        <label className="text-sm font-medium text-slate-700">كلمة المرور الجديدة</label>
                        <input 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white"
                            required
                        />
                    </div>
                    <div className="w-full md:w-1/4 space-y-2">
                        <label className="text-sm font-medium text-slate-700">تأكيد كلمة المرور</label>
                        <input 
                            type="password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white"
                            required
                        />
                    </div>
                    <div className="w-full md:w-1/4">
                        <button 
                            type="submit"
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            تغيير كلمة المرور
                        </button>
                    </div>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Backup Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                        <Download size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">النسخ الاحتياطي</h3>
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                        قم بتحميل نسخة كاملة من قاعدة البيانات (ملف .db) وحفظها على جهازك الشخصي لضمان عدم ضياع البيانات.
                    </p>
                    <button 
                        onClick={handleBackup}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                        <Save size={18} />
                        تحميل نسخة احتياطية
                    </button>
                </div>

                {/* Restore Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                        <Upload size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">استعادة البيانات</h3>
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                        استرجع البيانات من ملف نسخ احتياطي سابق. سيؤدي هذا إلى استبدال جميع البيانات الحالية.
                    </p>
                    <input 
                        type="file" 
                        accept=".db,.sqlite" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileChange}
                    />
                    <button 
                        onClick={handleRestoreTrigger}
                        className="w-full py-3 bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                        <Upload size={18} />
                        اختيار ملف للاستعادة
                    </button>
                </div>
            </div>
        </div>
    );
};
