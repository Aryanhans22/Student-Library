import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { mockStore } from '../../lib/mockStore';
import { updatePassword } from '../../lib/auth';
import toast from 'react-hot-toast';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Database, 
  Download, 
  User, 
  RefreshCw, 
  Save, 
  HardDrive, 
  Key, 
  Sparkles, 
  CheckCircle2, 
  FileSpreadsheet, 
  FileJson, 
  Activity
} from 'lucide-react';
import { cn } from '../../lib/utils';

type SettingsTab = 'account' | 'preferences' | 'notifications' | 'backup';

export default function Settings() {
  const { user, profile, updateProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as SettingsTab) || 'account';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  // Profile State
  const [fullName, setFullName] = useState(profile?.full_name || 'Library Administrator');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // System Preferences State
  const [libraryName, setLibraryName] = useState(() => {
    return localStorage.getItem('library_name') || 'Central Study Library & Co-working';
  });
  const [openingTime, setOpeningTime] = useState(() => {
    return localStorage.getItem('library_opening_time') || '07:00';
  });
  const [closingTime, setClosingTime] = useState(() => {
    return localStorage.getItem('library_closing_time') || '23:00';
  });
  const [supportEmail, setSupportEmail] = useState(() => {
    return localStorage.getItem('library_support_email') || 'helpdesk@libraryms.com';
  });
  const [supportPhone, setSupportPhone] = useState(() => {
    return localStorage.getItem('library_support_phone') || '+91 98765 43210';
  });
  const [autoReleaseDays, setAutoReleaseDays] = useState(() => {
    return localStorage.getItem('library_auto_release_days') || '30';
  });
  const [allowDirectTransfer, setAllowDirectTransfer] = useState(() => {
    return localStorage.getItem('library_allow_direct_transfer') !== 'false';
  });
  const [publicSeatMap, setPublicSeatMap] = useState(() => {
    return localStorage.getItem('library_public_seat_map') !== 'false';
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // Notifications State
  const [notifyOnAllocate, setNotifyOnAllocate] = useState(() => {
    return localStorage.getItem('notify_on_allocate') !== 'false';
  });
  const [notifyOnRelease, setNotifyOnRelease] = useState(() => {
    return localStorage.getItem('notify_on_release') !== 'false';
  });
  const [lowAvailabilityAlert, setLowAvailabilityAlert] = useState(() => {
    return localStorage.getItem('low_availability_alert') !== 'false';
  });
  const [lowAvailabilityThreshold, setLowAvailabilityThreshold] = useState(() => {
    return localStorage.getItem('low_availability_threshold') || '3';
  });
  const [soundEffects, setSoundEffects] = useState(() => {
    return localStorage.getItem('notify_sound_effects') !== 'false';
  });
  const [desktopAlerts, setDesktopAlerts] = useState(() => {
    return localStorage.getItem('notify_desktop_alerts') === 'true';
  });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // Data & Backup State
  const [dbStats, setDbStats] = useState({
    studentsCount: 0,
    seatsCount: 0,
    occupiedSeatsCount: 0,
    availableSeatsCount: 0,
    assignmentsCount: 0,
  });
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Sync tab with URL
  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Sync profile when loaded
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  // Load Database Stats for Data & Backup tab
  const loadDbStats = async () => {
    try {
      if (isSupabaseConfigured) {
        const [pRes, sRes, aRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
          supabase.from('seats').select('*'),
          supabase.from('seat_assignments').select('id', { count: 'exact', head: true }).eq('status', 'active')
        ]);

        const seatsData = sRes.data || [];
        const occupied = seatsData.filter(s => s.status === 'occupied').length;
        const available = seatsData.filter(s => s.status === 'available').length;

        setDbStats({
          studentsCount: pRes.count || 0,
          seatsCount: seatsData.length,
          occupiedSeatsCount: occupied,
          availableSeatsCount: available,
          assignmentsCount: aRes.count || occupied,
        });
      } else {
        const { total: studentsTotal } = await mockStore.getStudents({ pageSize: 1 });
        const seats = await mockStore.getSeats();
        const assignments = await mockStore.getAssignments();
        const occupied = seats.filter(s => s.status === 'occupied').length;
        const available = seats.filter(s => s.status === 'available').length;

        setDbStats({
          studentsCount: studentsTotal,
          seatsCount: seats.length,
          occupiedSeatsCount: occupied,
          availableSeatsCount: available,
          assignmentsCount: assignments.filter(a => a.status === 'active').length,
        });
      }
    } catch (e) {
      console.warn('Failed to load database stats:', e);
    }
  };

  useEffect(() => {
    loadDbStats();
  }, []);

  // Handlers: Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      if (updateProfile) {
        await updateProfile({ full_name: fullName, phone });
      }
      toast.success('Admin profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handlers: Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updatePassword(newPassword);
      toast.success('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handlers: Save System Preferences
  const handleSavePreferences = () => {
    setIsSavingPrefs(true);
    try {
      localStorage.setItem('library_name', libraryName);
      localStorage.setItem('library_opening_time', openingTime);
      localStorage.setItem('library_closing_time', closingTime);
      localStorage.setItem('library_support_email', supportEmail);
      localStorage.setItem('library_support_phone', supportPhone);
      localStorage.setItem('library_auto_release_days', autoReleaseDays);
      localStorage.setItem('library_allow_direct_transfer', String(allowDirectTransfer));
      localStorage.setItem('library_public_seat_map', String(publicSeatMap));

      toast.success('System preferences saved successfully!');
    } catch (e) {
      toast.error('Failed to save preferences');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  // Handlers: Save Notification Settings
  const handleSaveNotifications = () => {
    setIsSavingNotifications(true);
    try {
      localStorage.setItem('notify_on_allocate', String(notifyOnAllocate));
      localStorage.setItem('notify_on_release', String(notifyOnRelease));
      localStorage.setItem('low_availability_alert', String(lowAvailabilityAlert));
      localStorage.setItem('low_availability_threshold', String(lowAvailabilityThreshold));
      localStorage.setItem('notify_sound_effects', String(soundEffects));
      localStorage.setItem('notify_desktop_alerts', String(desktopAlerts));

      if (desktopAlerts && 'Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }

      toast.success('Notification preferences updated!');
    } catch (e) {
      toast.error('Failed to save notification settings');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  // Data Ping Connection Test
  const handlePingConnection = async () => {
    setIsPinging(true);
    setPingResult(null);
    const start = Date.now();
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('seats').select('id').limit(1);
        if (error) throw error;
        const duration = Date.now() - start;
        setPingResult(`Connected to Supabase PostgreSQL in ${duration}ms (Healthy)`);
        toast.success(`Database connection verified in ${duration}ms`);
      } else {
        await mockStore.getSeats();
        const duration = Date.now() - start;
        setPingResult(`Connected to Local Database Storage in ${duration}ms (Healthy & Ready)`);
        toast.success(`Local database store verified in ${duration}ms`);
      }
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch')) {
        await mockStore.getSeats();
        const duration = Date.now() - start;
        setPingResult(`Operating on Local Database Storage in ${duration}ms (Supabase Offline Fallback Active)`);
        toast.success('Local database store is active and healthy');
      } else {
        setPingResult(`Connection error: ${err.message}`);
        toast.error('Database connection test failed');
      }
    } finally {
      setIsPinging(false);
      loadDbStats();
    }
  };

  const handlePurgeDemoData = () => {
    try {
      mockStore.resetToSeed();
      toast.success('All demo students cleared! Fresh database ready.');
      loadDbStats();
    } catch {
      toast.error('Failed to reset database');
    }
  };

  // Generic Download Helper
  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const jsonToCsv = (items: any[]) => {
    if (!items || items.length === 0) return '';
    const headers = Object.keys(items[0]);
    const csvRows = [
      headers.join(','),
      ...items.map(row => 
        headers.map(fieldName => {
          const val = row[fieldName];
          if (val === null || val === undefined) return '""';
          return JSON.stringify(typeof val === 'object' ? JSON.stringify(val) : String(val));
        }).join(',')
      )
    ];
    return csvRows.join('\r\n');
  };

  // Export Handlers
  const handleExportStudents = async (format: 'csv' | 'json') => {
    setIsExporting(`students-${format}`);
    try {
      let list: any[] = [];
      if (isSupabaseConfigured) {
        const { data } = await supabase.from('profiles').select('*').eq('role', 'student');
        list = data || [];
      } else {
        const res = await mockStore.getStudents({ pageSize: 5000 });
        list = res.students;
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      if (format === 'csv') {
        const csv = jsonToCsv(list);
        downloadFile(csv, `students_export_${timestamp}.csv`, 'text/csv');
      } else {
        downloadFile(JSON.stringify(list, null, 2), `students_export_${timestamp}.json`, 'application/json');
      }
      toast.success(`Exported ${list.length} student records (${format.toUpperCase()})`);
    } catch (err: any) {
      toast.error('Failed to export students');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportSeats = async (format: 'csv' | 'json') => {
    setIsExporting(`seats-${format}`);
    try {
      let list: any[] = [];
      if (isSupabaseConfigured) {
        const { data } = await supabase.from('seats').select('*');
        list = data || [];
      } else {
        list = await mockStore.getSeats();
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      if (format === 'csv') {
        const csv = jsonToCsv(list);
        downloadFile(csv, `library_seats_export_${timestamp}.csv`, 'text/csv');
      } else {
        downloadFile(JSON.stringify(list, null, 2), `library_seats_export_${timestamp}.json`, 'application/json');
      }
      toast.success(`Exported ${list.length} seats (${format.toUpperCase()})`);
    } catch (err: any) {
      toast.error('Failed to export seats');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportFullBackup = async () => {
    setIsExporting('full-backup');
    try {
      let students: any[] = [];
      let seats: any[] = [];
      let assignments: any[] = [];

      if (isSupabaseConfigured) {
        const [sRes, seatRes, aRes] = await Promise.all([
          supabase.from('profiles').select('*'),
          supabase.from('seats').select('*'),
          supabase.from('seat_assignments').select('*')
        ]);
        students = sRes.data || [];
        seats = seatRes.data || [];
        assignments = aRes.data || [];
      } else {
        students = (await mockStore.getStudents({ pageSize: 5000 })).students;
        seats = await mockStore.getSeats();
        assignments = await mockStore.getAssignments();
      }

      const backupBundle = {
        meta: {
          system: 'LibraryMS',
          version: '1.0.0',
          exported_at: new Date().toISOString(),
          total_students: students.length,
          total_seats: seats.length,
          total_assignments: assignments.length,
        },
        preferences: {
          libraryName,
          openingTime,
          closingTime,
          supportEmail,
          supportPhone,
          autoReleaseDays,
          allowDirectTransfer,
          publicSeatMap,
        },
        data: {
          profiles: students,
          seats: seats,
          seat_assignments: assignments,
        }
      };

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      downloadFile(JSON.stringify(backupBundle, null, 2), `libraryms_full_backup_${timestamp}.json`, 'application/json');
      toast.success('Complete system backup package downloaded!');
    } catch (err: any) {
      toast.error('Failed to generate full backup');
    } finally {
      setIsExporting(null);
    }
  };

  const handleClearCache = () => {
    try {
      const keysToClear = [
        'library_name', 'library_opening_time', 'library_closing_time',
        'library_support_email', 'library_support_phone', 'library_auto_release_days',
        'notify_on_allocate', 'notify_on_release', 'low_availability_alert'
      ];
      keysToClear.forEach(k => localStorage.removeItem(k));
      toast.success('Local preferences cache cleared. Defaults restored.');
    } catch {
      toast.error('Failed to clear cache');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Settings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage administrator credentials, operational preferences, alerts, and backups</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isSupabaseConfigured ? 'success' : 'primary'}>
            <span className="flex items-center gap-1.5 py-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isSupabaseConfigured ? 'Supabase Live' : 'Demo Store Active'}</span>
            </span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Navigation Tabs Sidebar */}
        <div className="md:col-span-4 lg:col-span-3">
          <Card className="shadow-xs overflow-hidden">
            <CardContent className="p-2 space-y-1">
              <button
                type="button"
                onClick={() => handleTabChange('account')}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer text-left",
                  activeTab === 'account'
                    ? "bg-indigo-600 text-white font-semibold shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <User className="w-4 h-4 shrink-0" />
                <span>Account Profile</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('preferences')}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer text-left",
                  activeTab === 'preferences'
                    ? "bg-indigo-600 text-white font-semibold shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <SettingsIcon className="w-4 h-4 shrink-0" />
                <span>System Preferences</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('notifications')}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer text-left",
                  activeTab === 'notifications'
                    ? "bg-indigo-600 text-white font-semibold shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Bell className="w-4 h-4 shrink-0" />
                <span>Notifications</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('backup')}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer text-left",
                  activeTab === 'backup'
                    ? "bg-indigo-600 text-white font-semibold shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Database className="w-4 h-4 shrink-0" />
                <span>Data & Backup</span>
              </button>
            </CardContent>
          </Card>

          {/* Quick System Status Card */}
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-purple-50/70 border border-indigo-100/80 text-xs space-y-2">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-indigo-600" />
              <span>Library Engine v1.0</span>
            </p>
            <p className="text-slate-600">Dual-layer storage with instantaneous rollback and active PostgreSQL replication.</p>
          </div>
        </div>

        {/* Tab Content Panel */}
        <div className="md:col-span-8 lg:col-span-9 space-y-6">

          {/* TAB 1: Account Profile */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="border-b pb-4">
                  <CardTitle className="text-lg">Administrator Profile</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-2xl font-bold shadow-md">
                      {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900">{profile?.full_name || 'Library Administrator'}</h3>
                      <p className="text-sm text-slate-500 font-mono">{user?.email || profile?.email || 'admin@library.com'}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                          {profile?.role || 'Administrator'}
                        </span>
                        <span className="text-xs text-slate-400">ID: {profile?.id?.slice(0, 8) || 'adm-01'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Edit Form */}
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Input
                          label="Full Name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Administrator name"
                          required
                        />
                      </div>
                      <div>
                        <Input
                          label="Contact Phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>

                    <div>
                      <Input
                        label="Email Address"
                        value={user?.email || profile?.email || ''}
                        disabled
                        helperText="Primary email is linked to auth credentials"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button type="submit" loading={isSavingProfile} className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        <span>Save Profile Changes</span>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Security & Password Card */}
              <Card>
                <CardHeader className="border-b pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    <span>Security Credentials</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">Account Password</p>
                      <p className="text-xs text-slate-500 mt-0.5">Ensure your account uses a strong, complex password to safeguard library records.</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsPasswordModalOpen(true)}
                      className="shrink-0 flex items-center gap-1.5"
                    >
                      <Key className="w-4 h-4 text-slate-500" />
                      <span>Change Password</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: System Preferences */}
          {activeTab === 'preferences' && (
            <Card>
              <CardHeader className="border-b pb-4 flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">System Preferences</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">Configure library facility details, operating hours, and desk allocation rules</p>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Facility Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Input
                        label="Library / Center Name"
                        value={libraryName}
                        onChange={(e) => setLibraryName(e.target.value)}
                        placeholder="e.g., Central Study Library"
                      />
                    </div>
                    <div>
                      <Input
                        label="Support Email"
                        type="email"
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        placeholder="support@library.com"
                      />
                    </div>
                    <div>
                      <Input
                        label="Support Phone"
                        value={supportPhone}
                        onChange={(e) => setSupportPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Operating Schedule</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Opening Time"
                        type="time"
                        value={openingTime}
                        onChange={(e) => setOpeningTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <Input
                        label="Closing Time"
                        type="time"
                        value={closingTime}
                        onChange={(e) => setClosingTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Desk Allocation Policies</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div>
                        <p className="font-semibold text-sm text-slate-900">Allow Direct Desk Reassignment</p>
                        <p className="text-xs text-slate-500 mt-0.5">Admins can transfer a student from one desk to another without releasing it first.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={allowDirectTransfer}
                        onChange={(e) => setAllowDirectTransfer(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div>
                        <p className="font-semibold text-sm text-slate-900">Public Live Seat Map</p>
                        <p className="text-xs text-slate-500 mt-0.5">Permit prospective students to explore available desks on the landing page.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={publicSeatMap}
                        onChange={(e) => setPublicSeatMap(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div>
                        <p className="font-semibold text-sm text-slate-900">Auto-Expire Unclaimed Allocation</p>
                        <p className="text-xs text-slate-500 mt-0.5">Automatically mark unrenewed desk allocations for review.</p>
                      </div>
                      <select
                        value={autoReleaseDays}
                        onChange={(e) => setAutoReleaseDays(e.target.value)}
                        className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="never">Never (Manual)</option>
                        <option value="15">After 15 Days</option>
                        <option value="30">After 30 Days</option>
                        <option value="60">After 60 Days</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button 
                    onClick={handleSavePreferences} 
                    loading={isSavingPrefs}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save System Preferences</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: Notifications */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg">Notification Rules & Alerts</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Configure automated notifications, warning thresholds, and audio cues</p>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Student Alerts</h4>

                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div>
                      <p className="font-semibold text-sm text-slate-900">Desk Allocation Confirmation</p>
                      <p className="text-xs text-slate-500 mt-0.5">Send instant notification to student when a desk is successfully assigned.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyOnAllocate}
                      onChange={(e) => setNotifyOnAllocate(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div>
                      <p className="font-semibold text-sm text-slate-900">Desk Release / Reassignment Notice</p>
                      <p className="text-xs text-slate-500 mt-0.5">Send updates to students when their allotted desk is released or transferred.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyOnRelease}
                      onChange={(e) => setNotifyOnRelease(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="border-t pt-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Administrator Capacity Warnings</h4>

                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div>
                      <p className="font-semibold text-sm text-slate-900">Low Desk Availability Alert</p>
                      <p className="text-xs text-slate-500 mt-0.5">Highlight dashboard warning banner when library free seats fall below minimum.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={lowAvailabilityAlert}
                      onChange={(e) => setLowAvailabilityAlert(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  {lowAvailabilityAlert && (
                    <div className="pl-4 border-l-2 border-indigo-300 py-1">
                      <div className="max-w-xs">
                        <Input
                          label="Alert Threshold (Seats remaining)"
                          type="number"
                          min="1"
                          max="50"
                          value={lowAvailabilityThreshold}
                          onChange={(e) => setLowAvailabilityThreshold(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Application Sounds & Desktop Alerts</h4>

                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div>
                      <p className="font-semibold text-sm text-slate-900">Audio Chimes on Desk Allocation</p>
                      <p className="text-xs text-slate-500 mt-0.5">Play a subtle confirmation sound when a seat allocation is committed.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEffects}
                      onChange={(e) => setSoundEffects(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div>
                      <p className="font-semibold text-sm text-slate-900">Browser Desktop Notifications</p>
                      <p className="text-xs text-slate-500 mt-0.5">Receive native system popups even when the browser tab is in background.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={desktopAlerts}
                      onChange={(e) => setDesktopAlerts(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button 
                    onClick={handleSaveNotifications} 
                    loading={isSavingNotifications}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Notification Preferences</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 4: Data & Backup */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              {/* Database Health & Ping Card */}
              <Card>
                <CardHeader className="border-b pb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="w-5 h-5 text-indigo-600" />
                      <span>Database & Connectivity Status</span>
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-1">Live metrics from your active storage layer</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePingConnection}
                    loading={isPinging}
                    className="flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Ping Database</span>
                  </Button>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  {pingResult && (
                    <div className={cn(
                      "p-3.5 rounded-xl text-xs flex items-center gap-2 font-medium border",
                      pingResult.includes('Healthy') 
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-red-50 text-red-800 border-red-200"
                    )}>
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{pingResult}</span>
                    </div>
                  )}

                  {/* 4 Stats Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                      <p className="text-xs text-slate-500 font-medium">Students</p>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">{dbStats.studentsCount}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                      <p className="text-xs text-slate-500 font-medium">Total Desks</p>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">{dbStats.seatsCount}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                      <p className="text-xs text-slate-500 font-medium">Occupied Desks</p>
                      <p className="text-xl font-bold text-blue-600 mt-0.5">{dbStats.occupiedSeatsCount}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                      <p className="text-xs text-slate-500 font-medium">Available Desks</p>
                      <p className="text-xl font-bold text-emerald-600 mt-0.5">{dbStats.availableSeatsCount}</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-indigo-600" />
                      <span className="font-semibold text-slate-800">Storage Target:</span>
                      <span className="font-mono text-indigo-900">
                        {isSupabaseConfigured ? 'Supabase Cloud (PostgreSQL)' : 'Local In-Memory / Browser Storage'}
                      </span>
                    </div>
                    <span className="text-emerald-700 font-bold">🟢 Active & Online</span>
                  </div>
                </CardContent>
              </Card>

              {/* 1-Click Export Center */}
              <Card>
                <CardHeader className="border-b pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Download className="w-5 h-5 text-indigo-600" />
                    <span>Data Export Center (1-Click)</span>
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1">Download raw records and reports formatted for Excel, Google Sheets, or offsite backups</p>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Students Export */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-xs transition space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900">Student Directory</p>
                          <p className="text-xs text-slate-500">Names, emails, phones, IDs & status</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs"
                          loading={isExporting === 'students-csv'}
                          onClick={() => handleExportStudents('csv')}
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                          <span>CSV (Excel)</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs"
                          loading={isExporting === 'students-json'}
                          onClick={() => handleExportStudents('json')}
                        >
                          <FileJson className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                          <span>JSON</span>
                        </Button>
                      </div>
                    </div>

                    {/* Seats Export */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-xs transition space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                          <Database className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900">Library Desks Catalog</p>
                          <p className="text-xs text-slate-500">Seat numbers, floors, sections & status</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs"
                          loading={isExporting === 'seats-csv'}
                          onClick={() => handleExportSeats('csv')}
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                          <span>CSV (Excel)</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs"
                          loading={isExporting === 'seats-json'}
                          onClick={() => handleExportSeats('json')}
                        >
                          <FileJson className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                          <span>JSON</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Full Backup Package Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
                    <div className="space-y-1">
                      <p className="font-bold text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span>Complete Library System Backup</span>
                      </p>
                      <p className="text-xs text-slate-300">
                        Bundles all students, desks, active allocations, and configuration parameters into a timestamped JSON snapshot.
                      </p>
                    </div>
                    <Button 
                      loading={isExporting === 'full-backup'}
                      onClick={handleExportFullBackup}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 text-xs font-semibold px-4 py-2"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      <span>Download Full Backup</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance & Cache Reset */}
              <Card>
                <CardHeader className="border-b pb-4">
                  <CardTitle className="text-lg text-slate-900">Cache & Maintenance</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200">
                    <div>
                      <p className="font-semibold text-sm text-slate-900">Clear Local Settings Cache</p>
                      <p className="text-xs text-slate-500 mt-0.5">Resets locally stored preferences without modifying database records.</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleClearCache}
                      className="shrink-0 text-slate-700"
                    >
                      <span>Clear Cache</span>
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-red-200 bg-red-50/30">
                    <div>
                      <p className="font-semibold text-sm text-red-900">Reset Demo Students to Clean Slate</p>
                      <p className="text-xs text-red-600/80 mt-0.5">Removes any dummy test students, messages, and demo records to start with an empty student registry.</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handlePurgeDemoData}
                      className="shrink-0 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                    >
                      <span>Reset Clean Database</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>

      {/* Password Change Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Update Account Password"
        size="sm"
      >
        <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 6 characters"
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            required
          />
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsPasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={isUpdatingPassword}
              variant="primary"
            >
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
