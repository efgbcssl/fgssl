import {
    Sun, Moon, Menu, Bell, User, Settings, LogOut,
    Heart, Repeat, CalendarCheck, Mail, TrendingUp,
    Plus, CalendarPlus, FileText, Monitor, BarChart3,
    HelpCircle, DollarSign, Calendar, MessageSquare,
    Users, LayoutDashboard
} from 'lucide-react';


export const Icons = {
    dashboard: LayoutDashboard,
    calendar: Calendar,
    message: MessageSquare,
    bell: Bell,
    donate: DollarSign,
    users: Users,
    settings: Settings,
    fileText: FileText,
    barChart: BarChart3,
    menu: Menu,
    sun: Sun,
    moon: Moon,
    user: User,
    monitor: Monitor,
    logout: LogOut,
    heart: Heart,
    repeat: Repeat,
    calendarCheck: CalendarCheck,
    mail: Mail,
    trendingUp: TrendingUp,
    plus: Plus,
    calendarPlus: CalendarPlus,
    helpCircle: HelpCircle,
    logo: ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="currentColor" className={`h-6 w-6 ${className}`}>
            <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" />
        </svg>
    ),
    report: ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="currentColor" className={`h-5 w-5 ${className}`}>
            <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
};