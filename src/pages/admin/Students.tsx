import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStudents } from '../../hooks/useStudents';
import { SearchInput } from '../../components/ui/SearchInput';
import { Pagination } from '../../components/ui/Pagination';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { formatDate, getInitials, cn } from '../../lib/utils';
import type { AccountStatus } from '../../types/database';
import { Eye, Edit, Armchair, Plus, Search, FilterX, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Students() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { students, total, loading, fetchStudents, createStudent, updateStudent, deleteStudent } = useStudents();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [seatFilter, setSeatFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('add') === 'true');
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [formData, setFormData] = useState<{
    full_name: string;
    email: string;
    phone: string;
    student_id: string;
    date_of_birth: string;
    address: string;
    emergency_contact: string;
    status: AccountStatus;
  }>({
    full_name: '',
    email: '',
    phone: '',
    student_id: '',
    date_of_birth: '',
    address: '',
    emergency_contact: '',
    status: 'active'
  });

  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, student: any, action: 'activate' | 'deactivate' | 'suspend'}>({
    isOpen: false,
    student: null,
    action: 'activate'
  });

  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ isOpen: boolean; student: any }>({
    isOpen: false,
    student: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setIsModalOpen(true);
      setEditingStudent(null);
      resetForm();
    }
  }, [searchParams]);

  useEffect(() => {
    fetchStudents({
      page,
      limit: pageSize,
      search,
      status: statusFilter,
      seatFilter: (seatFilter as 'all' | 'assigned' | 'unassigned') || 'all',
      sortBy: sortField,
      sortOrder: sortDirection
    });
  }, [page, pageSize, search, statusFilter, seatFilter, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      student_id: '',
      date_of_birth: '',
      address: '',
      emergency_contact: '',
      status: 'active'
    });
  };

  const handleOpenEdit = (student: any) => {
    setEditingStudent(student);
    setFormData({
      full_name: student.full_name,
      email: student.email,
      phone: student.phone || '',
      student_id: student.student_id,
      date_of_birth: student.date_of_birth || '',
      address: student.address || '',
      emergency_contact: student.emergency_contact || '',
      status: student.status
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    resetForm();
    if (searchParams.get('add')) {
      searchParams.delete('add');
      setSearchParams(searchParams);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, formData);
        toast.success('Student updated successfully');
      } else {
        await createStudent(formData);
        toast.success('Student created successfully');
      }
      handleCloseModal();
      fetchStudents({ page, limit: pageSize, search, status: statusFilter, sortBy: sortField, sortOrder: sortDirection });
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    }
  };

  const handleStatusToggle = async () => {
    if (!confirmDialog.student) return;
    try {
      const newStatus = confirmDialog.action === 'activate' ? 'active' : 'inactive';
      await updateStudent(confirmDialog.student.id, { status: newStatus as any });
      toast.success(`Student ${confirmDialog.action}d successfully`);
      setConfirmDialog({ ...confirmDialog, isOpen: false });
      fetchStudents({ page, limit: pageSize, search, status: statusFilter, sortBy: sortField, sortOrder: sortDirection });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteConfirmDialog.student) return;
    try {
      setIsDeleting(true);
      await deleteStudent(deleteConfirmDialog.student.id);
      toast.success(`Student ${deleteConfirmDialog.student.full_name} deleted successfully`);
      setDeleteConfirmDialog({ isOpen: false, student: null });
      fetchStudents({ page, limit: pageSize, search, status: statusFilter, sortBy: sortField, sortOrder: sortDirection });
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete student');
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSeatFilter('');
    setPage(1);
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
        <Button onClick={() => { setIsModalOpen(true); resetForm(); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Student
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchInput 
            value={search} 
            onChange={(v) => { setSearch(v); setPage(1); }} 
            placeholder="Search by name, email, ID or phone..." 
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-full sm:w-40">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </Select>
          <Select value={seatFilter} onChange={(e) => { setSeatFilter(e.target.value); setPage(1); }} className="w-full sm:w-40">
            <option value="">All Seats</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </Select>
          <Button variant="outline" onClick={clearFilters} className="whitespace-nowrap">
            <FilterX className="w-4 h-4 mr-2" /> Clear
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => handleSort('student_id')}>
                  <div className="flex items-center">Student ID {renderSortIcon('student_id')}</div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => handleSort('full_name')}>
                  <div className="flex items-center">Name {renderSortIcon('full_name')}</div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seat
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => handleSort('created_at')}>
                  <div className="flex items-center">Joined {renderSortIcon('created_at')}</div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap text-right"><div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 inline-block animate-pulse"></div></td>
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {student.student_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar name={student.full_name} fallback={getInitials(student.full_name)} />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{student.full_name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 font-medium">
                      {(student as any).active_seat_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={student.status === 'active' ? 'success' : student.status === 'suspended' ? 'destructive' : 'secondary'}>
                        {student.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(student.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/students/${student.id}`)} title="View Details">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(student)} title="Edit">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/seat-allocation?student=${student.id}`)} title="Assign Seat">
                          <Armchair className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={student.status === 'active' ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}
                          onClick={() => setConfirmDialog({
                            isOpen: true,
                            student,
                            action: student.status === 'active' ? 'deactivate' : 'activate'
                          })}
                        >
                          {student.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Delete Student"
                          onClick={() => setDeleteConfirmDialog({
                            isOpen: true,
                            student,
                          })}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {total > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(page * pageSize, total)}</span> of <span className="font-medium">{total}</span> results
            </div>
            <Pagination currentPage={page} totalPages={Math.ceil(total / pageSize)} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingStudent ? 'Edit Student' : 'Add New Student'}>
        <form onSubmit={handleSave} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Full Name *" 
              value={formData.full_name} 
              onChange={e => setFormData({...formData, full_name: e.target.value})} 
              required 
            />
            {editingStudent && (
              <Input 
                label="Student ID" 
                value={formData.student_id} 
                disabled
              />
            )}
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
            {editingStudent && (
              <div className="md:col-span-2">
                <Select label="Status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as AccountStatus})}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </Select>
              </div>
            )}
            <div className="md:col-span-2">
              <Input 
                label="Address" 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit">{editingStudent ? 'Save Changes' : 'Create Student'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={handleStatusToggle}
        title={`${confirmDialog.action === 'activate' ? 'Activate' : 'Deactivate'} Student`}
        message={`Are you sure you want to ${confirmDialog.action} ${confirmDialog.student?.full_name}? ${confirmDialog.action === 'deactivate' ? 'They will no longer be able to log in or book seats.' : ''}`}
        confirmText={`Yes, ${confirmDialog.action}`}
        cancelText="Cancel"
        type={confirmDialog.action === 'deactivate' ? 'danger' : 'info'}
      />

      <ConfirmDialog
        isOpen={deleteConfirmDialog.isOpen}
        onClose={() => setDeleteConfirmDialog({ isOpen: false, student: null })}
        onConfirm={handleDeleteStudent}
        title="Delete Student Record"
        message={`Are you sure you want to permanently delete "${deleteConfirmDialog.student?.full_name}" (${deleteConfirmDialog.student?.student_id || 'No ID'})? Any assigned desk will be released and records cleared.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Student'}
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
