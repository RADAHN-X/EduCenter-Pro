import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Wallet, 
  Settings, 
  FileText 
} from 'lucide-react';

export const APP_NAME = "EduCenter";
export const CURRENCY = "ج.م";

export const MENU_ITEMS = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { id: 'students', label: 'إدارة الطلاب', icon: Users },
  { id: 'teachers', label: 'المدرسين', icon: GraduationCap },
  { id: 'groups', label: 'المجموعات والحصص', icon: BookOpen },
  { id: 'financials', label: 'الإدارة المالية', icon: Wallet },
  { id: 'reports', label: 'التقارير', icon: FileText },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];
