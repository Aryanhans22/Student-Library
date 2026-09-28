import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudents } from '../../hooks/useStudents';
import { useSeatAssignments } from '../../hooks/useSeatAssignments';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { ArrowLeft, Edit, Armchair, AlertTriangle, Calendar, Phone, Mail, MapPin, MessageSquare, CreditCard, Clock, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton';
import { formatDate, getInitials } from '../../lib/utils';
import type { AccountStatus } from '../../types/database';
import toast from 'react-hot-toast';

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getStudent, updateStudent, loading: studentLoading } = useStudents();
  const { getStudentAssignment, releaseSeat, loading: seatLoading } = useSeatAssignments();
  const { fetchStudentSubscription, subscription: studentSub, loading: subLoading } = useSubscriptions();

  const [student, setStudent] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReleaseConfirmOpen, setIsReleaseConfirmOpen] = useState(false);
  
  const [formData, setFormData] = useState<{
    full_name: string;
    email: string;
    phone: string;
    date_of_birth: string;
    address: string;
    emergency_contact: string;
    status: AccountStatus;
  }>({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    emergency_contact: '',
    status: 'active'
  });

  const fetchData = async () => {
    if (!id) return;
    try {
      const studentData = await getStudent(id);
      if (!studentData) {
        toast.error('Student not found');
        navigate('/admin/students');
        return;
      }
      setStudent(studentData);
      setFormData({
        full_name: studentData.full_name,
        email: studentData.email,
        phone: studentData.phone || '',
        date_of_birth: studentData.date_of_birth || '',
        address: studentData.address || '',
        emergency_contact: studentData.emergency_contact || '',
        status: studentData.status
      });

      const assignmentData = await getStudentAssignment(id);
      setAssignment(assignmentData);

      await fetchStudentSubscription(id);
    } catch (error: any) {
      toast.error('Failed to load student details');
      navigate('/admin/students');
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await updateStudent(id, formData);
      toast.success('Student updated successfully');
      setIsEditModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update student');
    }
  };

  const handleReleaseSeat = async () => {
    if (!assignment?.id) return;
    try {
      await releaseSeat(assignment.id);
      toast.success('Seat released successfully');
      setIsReleaseConfirmOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to release seat');
    }
  };

  if (studentLoading && !student) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="w-10 h-10 rounded-md" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard className="md:col-span-1 h-64" />
          <SkeletonCard className="md:col-span-2 h-64" />
        </div>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/students')} className="shrink-0">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{student.full_name}</h1>
            <Badge variant={student.status === 'active' ? 'success' : student.status === 'suspended' ? 'destructive' : 'secondary'}>
              {student.status}
            </Badge>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => navigate(`/admin/messages?student=${student.id}`)}>
            <MessageSquare className="w-4 h-4 mr-2 text-indigo-600" /> Chat
          </Button>
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
            <Edit className="w-4 h-4 mr-2" /> Edit Student
          </Button>
          {!assignment ? (
            <Button onClick={() => navigate(`/admin/seat-allocation?student=${student.id}`)}>
              <Armchair className="w-4 h-4 mr-2" /> Assign Seat
            </Button>
          ) : (
            <Button onClick={() => navigate(`/admin/seat-allocation?student=${student.id}`)}>
              Change Seat
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <Card className="md:col-span-1">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Avatar fallback={getInitials(student.full_name)} className="w-24 h-24 text-2xl mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{student.full_name}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{student.student_id}</p>
            <div className="w-full border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Status</span>
                <Badge variant={student.status === 'active' ? 'success' : student.status === 'suspended' ? 'destructive' : 'secondary'}>
                  {student.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Account Created</span>
                <span className="text-sm font-medium">{formatDate(student.created_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Personal Information</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-500 flex items-center mb-1">
                    <Mail className="w-4 h-4 mr-2" /> Email Address
                  </div>
                  <div className="font-medium">{student.email}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 flex items-center mb-1">
                    <Phone className="w-4 h-4 mr-2" /> Phone Number
                  </div>
                  <div className="font-medium">{student.phone || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 flex items-center mb-1">
                    <Calendar className="w-4 h-4 mr-2" /> Date of Birth
                  </div>
                  <div className="font-medium">{student.date_of_birth ? formatDate(student.date_of_birth) : 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 flex items-center mb-1">
                    <AlertTriangle className="w-4 h-4 mr-2" /> Emergency Contact
                  </div>
                  <div className="font-medium">{student.emergency_contact || 'Not provided'}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-sm text-gray-500 flex items-center mb-1">
                    <MapPin className="w-4 h-4 mr-2" /> Address
                  </div>
                  <div className="font-medium">{student.address || 'Not provided'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seat Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Seat Information</h3>
            </CardHeader>
            <CardContent>
              {seatLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ) : assignment ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-6 mb-4 sm:mb-0">
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg flex flex-col items-center justify-center min-w-[100px]">
                      <span className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold uppercase">Seat</span>
                      <span className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">{assignment.seat?.seat_number}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-lg">Section {assignment.seat?.section}, Floor {assignment.seat?.floor}</p>
                      <p className="text-sm text-gray-500">Assigned: {formatDate(assignment.assigned_at || assignment.created_at)}</p>
                      <div className="mt-2">
                        <Badge variant="success">Active Assignment</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button variant="outline" onClick={() => navigate(`/admin/seat-allocation?student=${student.id}`)}>
                      Change Seat
                    </Button>
                    <Button variant="danger" onClick={() => setIsReleaseConfirmOpen(true)}>
                      Release Seat
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                  <Armchair className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Seat Assigned</h4>
                  <p className="text-gray-500 mb-4">This student doesn't have an active seat assignment.</p>
                  <Button onClick={() => navigate(`/admin/seat-allocation?student=${student.id}`)}>
                    <Armchair className="w-4 h-4 mr-2" /> Assign a Seat Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Membership & Subscription Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                Library Subscription
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/subscriptions')}
              >
                Manage Subscriptions
              </Button>
            </CardHeader>
            <CardContent>
              {subLoading ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ) : studentSub ? (
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-base">{studentSub.plan_name}</span>
                        <span className="font-semibold text-emerald-600 text-sm">₹{studentSub.amount_paid}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Validity: {formatDate(studentSub.start_date)} to {formatDate(studentSub.end_date)}
                      </p>
                    </div>
                    <div>
                      {(studentSub.days_remaining ?? 0) <= 0 ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Expired
                        </span>
                      ) : (studentSub.days_remaining ?? 0) <= 5 ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 animate-pulse">
                          <Clock className="h-3.5 w-3.5" />
                          Expiring in {studentSub.days_remaining} days
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <Clock className="h-3.5 w-3.5" />
                          {studentSub.days_remaining} days remaining
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">No active subscription plan</p>
                  <p className="text-xs text-gray-500 mt-0.5 mb-3">Assign a study pass to this student</p>
                  <Button size="sm" onClick={() => navigate('/admin/subscriptions')}>
                    Assign Plan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Student Profile">
        <form onSubmit={handleUpdate} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Full Name *" 
              value={formData.full_name} 
              onChange={e => setFormData({...formData, full_name: e.target.value})} 
              required 
            />
            <Input 
              label="Student ID" 
              value={student.student_id} 
              disabled 
              readOnly
            />
            <Input 
              label="Email *" 
              type="email" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              required 
            />
            <Input 
              label="Phone *" 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              required 
            />
            <Input 
              label="Date of Birth" 
              type="date" 
              value={formData.date_of_birth} 
              onChange={e => setFormData({...formData, date_of_birth: e.target.value})} 
            />
            <Input 
              label="Emergency Contact" 
              value={formData.emergency_contact} 
              onChange={e => setFormData({...formData, emergency_contact: e.target.value})} 
            />
            <div className="md:col-span-2">
              <Select label="Status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as AccountStatus})}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Input 
                label="Address" 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isReleaseConfirmOpen}
        onClose={() => setIsReleaseConfirmOpen(false)}
        onConfirm={handleReleaseSeat}
        title="Release Seat"
        message={`Are you sure you want to release seat ${assignment?.seat?.seat_number} from ${student.full_name}? The seat will become available for other students.`}
        confirmText="Release Seat"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
