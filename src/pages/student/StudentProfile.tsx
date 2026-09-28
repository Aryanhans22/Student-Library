import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentSeat } from '../../hooks/useStudentSeat';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Calendar, MapPin, AlertCircle, Key, Save, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar, AvatarFallback } from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export function StudentProfile() {
  const { profile, updateProfile, updatePassword } = useAuth();
  const { assignment, seat, isLoading: isSeatLoading } = useStudentSeat();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    date_of_birth: profile?.date_of_birth || '',
    address: profile?.address || '',
    emergency_contact: profile?.emergency_contact || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: '',
  });

  const getInitials = (name: string) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      if (updateProfile) {
        await updateProfile(formData);
        toast.success('Profile updated successfully');
        setIsEditing(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const handleSavePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (passwordData.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      if (updatePassword) {
        await updatePassword(passwordData.new_password);
        toast.success('Password updated successfully');
        setIsPasswordModalOpen(false);
        setPasswordData({ new_password: '', confirm_password: '' });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/student/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Profile</h1>
        </div>
        <Button
          variant={isEditing ? 'outline' : 'primary'}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? (
            <>
              <X className="mr-2 h-4 w-4" /> Cancel
            </>
          ) : (
            <>
              <User className="mr-2 h-4 w-4" /> Edit Profile
            </>
          )}
        </Button>
      </div>

      {/* Profile Display / Header Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <Avatar className="h-28 w-28 border-4 border-indigo-50">
          <AvatarFallback className="text-3xl bg-indigo-100 text-indigo-700 font-semibold">
            {profile?.full_name ? getInitials(profile.full_name) : 'ST'}
          </AvatarFallback>
        </Avatar>
        
        <div className="text-center sm:text-left flex-1">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{profile?.full_name}</h2>
          <div className="flex flex-col sm:flex-row gap-3 items-center sm:items-start text-gray-500">
            <span className="font-mono bg-gray-100 px-3 py-1 rounded-md text-sm">ID: {profile?.student_id}</span>
            <Badge variant={profile?.status === 'active' ? 'success' : 'secondary'} className="px-3 py-1 text-sm">
              {profile?.status?.toUpperCase() || 'ACTIVE'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <User className="mr-2 h-5 w-5 text-gray-500" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <Input name="full_name" value={formData.full_name} onChange={handleInputChange} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-gray-700">Phone Number</label>
                      <Input name="phone" value={formData.phone} onChange={handleInputChange} />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                      <Input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">Address</label>
                    <Input name="address" value={formData.address} onChange={handleInputChange} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">Emergency Contact</label>
                    <Input name="emergency_contact" value={formData.emergency_contact} onChange={handleInputChange} />
                  </div>
                  
                  {/* Disabled Fields */}
                  <div className="grid gap-2 pt-4 border-t mt-4">
                    <label className="text-sm font-medium text-gray-400">Email Address (Cannot be changed)</label>
                    <Input value={profile?.email || ''} disabled className="bg-gray-50" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                      <span className="block text-sm text-gray-500 mb-1">Full Name</span>
                      <span className="text-gray-900 font-medium">{profile?.full_name || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-sm text-gray-500 mb-1">Email Address</span>
                      <span className="text-gray-900 font-medium">{profile?.email || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-sm text-gray-500 mb-1">Phone Number</span>
                      <span className="text-gray-900 font-medium">{profile?.phone || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-sm text-gray-500 mb-1">Date of Birth</span>
                      <span className="text-gray-900 font-medium">{profile?.date_of_birth ? formatDate(profile.date_of_birth) : '-'}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="block text-sm text-gray-500 mb-1">Address</span>
                      <span className="text-gray-900 font-medium">{profile?.address || '-'}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="block text-sm text-gray-500 mb-1">Emergency Contact</span>
                      <span className="text-gray-900 font-medium">{profile?.emergency_contact || '-'}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            {isEditing && (
              <CardFooter className="flex justify-end gap-3 bg-gray-50 py-4 border-t">
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleSaveProfile}>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
              </CardFooter>
            )}
          </Card>
          
          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Key className="mr-2 h-5 w-5 text-gray-500" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-md font-medium text-gray-900">Password</h4>
                  <p className="text-sm text-gray-500">Update your password to keep your account secure.</p>
                </div>
                <Button variant="outline" onClick={() => setIsPasswordModalOpen(true)}>
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          {/* Seat Information Card */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Seat Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {isSeatLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
              ) : seat ? (
                <div className="space-y-4">
                  <div className="text-center pb-4 border-b">
                    <span className="block text-sm text-gray-500 mb-1">Assigned Seat</span>
                    <span className="text-4xl font-bold text-indigo-600">{seat.seat_number}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Section:</span>
                      <span className="font-medium">{seat.section}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Floor:</span>
                      <span className="font-medium">{seat.floor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Assigned:</span>
                      <span className="font-medium">{assignment?.assigned_at ? formatDate(assignment.assigned_at) : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-gray-500">Status:</span>
                      <Badge variant="success">Assigned</Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 flex flex-col items-center">
                  <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
                  <p>No seat currently assigned</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Information Card */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Account Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Student ID</span>
                <span className="font-mono text-gray-900">{profile?.student_id || '-'}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Email</span>
                <span className="text-gray-900 truncate block w-full">{profile?.email || '-'}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Account Status</span>
                <Badge variant={profile?.status === 'active' ? 'success' : 'secondary'}>
                  {profile?.status || 'Unknown'}
                </Badge>
              </div>
              <div>
                <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Member Since</span>
                <span className="text-gray-900">{profile?.created_at ? formatDate(profile.created_at) : '-'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Password Change Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Password"
      >
        <div className="space-y-4 my-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">New Password</label>
            <Input
              type="password"
              name="new_password"
              placeholder="Enter new password"
              value={passwordData.new_password}
              onChange={handlePasswordChange}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
            <Input
              type="password"
              name="confirm_password"
              placeholder="Confirm new password"
              value={passwordData.confirm_password}
              onChange={handlePasswordChange}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSavePassword}>
            Update Password
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default StudentProfile;
