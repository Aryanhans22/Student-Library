import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { SearchInput } from '../../components/ui/SearchInput';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton';
import { useSeats } from '../../hooks/useSeats';
import { useSeatAssignments } from '../../hooks/useSeatAssignments';
import { LayoutGrid, List as ListIcon, Plus, CheckCircle, User, Wrench, XCircle, Search, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { Seat, SeatStatus, SeatFormData } from '../../types/database';

export default function Seats() {
  const { seats, isLoading, fetchSeats, createSeat, updateSeat, deleteSeat } = useSeats();
  const { assignments } = useSeatAssignments();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SeatStatus | 'all'>('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null);
  const [deletingSeat, setDeletingSeat] = useState<Seat | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);

  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  // Derive unique sections
  const sections = useMemo(() => {
    if (!seats) return [];
    return Array.from(new Set(seats.map(s => s.section))).filter(Boolean).sort();
  }, [seats]);

  // Filter seats
  const filteredSeats = useMemo(() => {
    if (!seats) return [];
    return seats.filter(seat => {
      const matchesSearch = seat.seat_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            seat.section?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            seat.floor?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || seat.status === statusFilter;
      const matchesSection = sectionFilter === 'all' || seat.section === sectionFilter;
      return matchesSearch && matchesStatus && matchesSection;
    });
  }, [seats, searchQuery, statusFilter, sectionFilter]);

  // Group seats by section for grid view
  const groupedSeats = useMemo(() => {
    const groups: Record<string, Seat[]> = {};
    filteredSeats.forEach(seat => {
      const key = seat.section || 'Unassigned Section';
      if (!groups[key]) groups[key] = [];
      groups[key].push(seat);
    });
    // Sort groups
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredSeats]);

  const getStatusIcon = (status: SeatStatus) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'occupied': return <User className="w-6 h-6 text-blue-500" />;
      case 'maintenance': return <Wrench className="w-6 h-6 text-amber-500" />;
      case 'disabled': return <XCircle className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: SeatStatus) => {
    switch (status) {
      case 'available': return 'bg-green-50 border-green-200 hover:shadow-green-100';
      case 'occupied': return 'bg-blue-50 border-blue-200 hover:shadow-blue-100';
      case 'maintenance': return 'bg-amber-50 border-amber-200 hover:shadow-amber-100';
      case 'disabled': return 'bg-gray-100 border-gray-200 hover:shadow-gray-100';
    }
  };

  const getStatusText = (status: SeatStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleCreateSeat = async (data: any) => {
    try {
      await createSeat(data);
      await fetchSeats();
      setIsCreateModalOpen(false);
      toast.success(`Seat ${data.seat_number} created successfully`);
    } catch (error: any) {
      if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint') || error.message?.includes('seats_seat_number_key')) {
        toast.error(`Seat "${data.seat_number}" already exists in the library!`);
      } else {
        toast.error(error.message || 'Failed to create seat');
      }
    }
  };

  const handleUpdateSeat = async (data: any) => {
    if (!editingSeat) return;
    try {
      await updateSeat(editingSeat.id, data);
      await fetchSeats();
      setEditingSeat(null);
      if (selectedSeat && selectedSeat.id === editingSeat.id) {
         setSelectedSeat({...selectedSeat, ...data});
      }
      toast.success('Seat updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update seat');
    }
  };

  const handleDeleteSeat = async () => {
    if (!deletingSeat) return;
    try {
      await deleteSeat(deletingSeat.id);
      await fetchSeats();
      setDeletingSeat(null);
      if (selectedSeat && selectedSeat.id === deletingSeat.id) {
        setSelectedSeat(null);
      }
      toast.success('Seat deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete seat');
    }
  };

  const renderSeatGrid = () => (
    <div className="space-y-8">
      {groupedSeats.map(([section, sectionSeats]) => (
        <div key={section} className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">
            Section {section} 
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({sectionSeats[0]?.floor || 'No Floor'})
            </span>
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {sectionSeats.map(seat => (
              <button
                key={seat.id}
                onClick={() => setSelectedSeat(seat)}
                className={cn(
                  "flex flex-col items-center justify-center p-4 border rounded-xl transition-all duration-200 aspect-square hover:-translate-y-1 hover:shadow-md",
                  getStatusColor(seat.status)
                )}
                aria-label={`Seat ${seat.seat_number}, Status: ${seat.status}`}
              >
                <span className="text-lg font-bold text-gray-800 mb-2">{seat.seat_number}</span>
                {getStatusIcon(seat.status)}
                <span className="text-xs font-medium text-gray-600 mt-2">{getStatusText(seat.status)}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      {filteredSeats.length === 0 && (
        <EmptyState 
          title="No seats found" 
          description="Try adjusting your search or filters." 
          icon={<Search className="w-12 h-12 text-gray-400" />}
        />
      )}
    </div>
  );

  const renderSeatList = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seat Number</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredSeats.map((seat) => (
            <tr key={seat.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{seat.seat_number}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{seat.section || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{seat.floor || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={seat.status === 'available' ? 'success' : seat.status === 'occupied' ? 'primary' : seat.status === 'maintenance' ? 'warning' : 'secondary'}>
                  {getStatusText(seat.status)}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedSeat(seat)}>View</Button>
                <Button variant="outline" size="sm" onClick={() => setEditingSeat(seat)}>Edit</Button>
                {seat.status !== 'occupied' && (
                  <Button variant="outline" size="sm" onClick={() => setDeletingSeat(seat)} className="text-red-600 hover:text-red-700">Delete</Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredSeats.length === 0 && (
        <EmptyState 
          title="No seats found" 
          description="Try adjusting your search or filters." 
          icon={<Search className="w-12 h-12 text-gray-400" />}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seats</h1>
          <p className="text-gray-500">Manage library seating and capacity ({seats?.length || 0} total)</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={cn("p-2 rounded-md transition-colors", viewMode === 'grid' ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-900")}
              title="Grid View"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn("p-2 rounded-md transition-colors", viewMode === 'list' ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-900")}
              title="List View"
            >
              <ListIcon className="w-5 h-5" />
            </button>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Seat
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-4 items-center border-b">
          <div className="w-full sm:w-64">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search seat, section, floor..."
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'available', label: 'Available' },
                { value: 'occupied', label: 'Occupied' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'disabled', label: 'Disabled' },
              ]}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Sections' },
                ...sections.map(s => ({ value: s as string, label: `Section ${s}` }))
              ]}
            />
          </div>
        </CardContent>
        <div className="bg-gray-50 px-4 py-3 border-b flex gap-6 text-sm">
           <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> <span className="text-gray-700">Available</span></div>
           <div className="flex items-center gap-2"><User className="w-4 h-4 text-blue-500" /> <span className="text-gray-700">Occupied</span></div>
           <div className="flex items-center gap-2"><Wrench className="w-4 h-4 text-amber-500" /> <span className="text-gray-700">Maintenance</span></div>
           <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-gray-500" /> <span className="text-gray-700">Disabled</span></div>
        </div>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} className="aspect-square" />)}
            </div>
          ) : viewMode === 'grid' ? renderSeatGrid() : renderSeatList()}
        </CardContent>
      </Card>

      {/* Seat Detail Modal */}
      <Modal isOpen={!!selectedSeat} onClose={() => setSelectedSeat(null)} title="Seat Details">
        {selectedSeat && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-bold text-gray-900">{selectedSeat.seat_number}</h2>
                <p className="text-gray-500 text-lg">Section {selectedSeat.section} • {selectedSeat.floor}</p>
              </div>
              <Badge variant={selectedSeat.status === 'available' ? 'success' : selectedSeat.status === 'occupied' ? 'primary' : selectedSeat.status === 'maintenance' ? 'warning' : 'secondary'} className="text-lg px-4 py-2">
                {getStatusText(selectedSeat.status)}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Row</p>
                <p className="font-medium">{selectedSeat.row_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Column</p>
                <p className="font-medium">{selectedSeat.column_number || '-'}</p>
              </div>
            </div>

            {selectedSeat.status === 'occupied' && (
               <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center gap-4">
                 <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                    <User className="w-6 h-6" />
                 </div>
                 <div>
                   <p className="text-sm font-medium text-blue-900">Occupied by</p>
                   <p className="text-blue-800">Student Info Loading...</p>
                 </div>
               </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => { setEditingSeat(selectedSeat); setSelectedSeat(null); }}>
                <Edit2 className="w-4 h-4 mr-2" /> Edit Seat
              </Button>
              {selectedSeat.status !== 'occupied' && (
                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => { setDeletingSeat(selectedSeat); setSelectedSeat(null); }}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <SeatFormModal 
        isOpen={isCreateModalOpen || !!editingSeat} 
        onClose={() => { setIsCreateModalOpen(false); setEditingSeat(null); }} 
        seat={editingSeat}
        onSubmit={editingSeat ? handleUpdateSeat : handleCreateSeat}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingSeat}
        title="Delete Seat"
        message={`Are you sure you want to delete seat ${deletingSeat?.seat_number}? This cannot be undone.`}
        onConfirm={handleDeleteSeat}
        onCancel={() => setDeletingSeat(null)}
        confirmText="Delete Seat"
        isDanger={true}
      />
    </div>
  );
}

function SeatFormModal({ isOpen, onClose, seat, onSubmit }: { isOpen: boolean, onClose: () => void, seat: Seat | null, onSubmit: (data: any) => Promise<void> }) {
  const [formData, setFormData] = useState<Partial<SeatFormData>>({
    seat_number: '',
    section: '',
    floor: '',
    row_number: undefined,
    column_number: undefined,
    status: 'available'
  });

  React.useEffect(() => {
    if (seat) {
      setFormData({
        seat_number: seat.seat_number,
        section: seat.section || '',
        floor: seat.floor || '',
        row_number: seat.row_number ?? undefined,
        column_number: seat.column_number ?? undefined,
        status: seat.status,
      });
    } else {
      setFormData({ seat_number: '', section: '', floor: '', row_number: undefined, column_number: undefined, status: 'available' });
    }
  }, [seat, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={seat ? "Edit Seat" : "Add New Seat"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          label="Seat Number" 
          required 
          value={formData.seat_number || ''} 
          onChange={e => setFormData({...formData, seat_number: e.target.value})} 
          placeholder="e.g. A01"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Section" 
            value={formData.section || ''} 
            onChange={e => setFormData({...formData, section: e.target.value})} 
            placeholder="e.g. A"
          />
          <Input 
            label="Floor" 
            value={formData.floor || ''} 
            onChange={e => setFormData({...formData, floor: e.target.value})} 
            placeholder="e.g. Ground Floor"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Row Number" 
            type="number"
            value={formData.row_number || ''} 
            onChange={e => setFormData({...formData, row_number: parseInt(e.target.value) || undefined})} 
          />
          <Input 
            label="Column Number" 
            type="number"
            value={formData.column_number || ''} 
            onChange={e => setFormData({...formData, column_number: parseInt(e.target.value) || undefined})} 
          />
        </div>
        {seat && (
          <Select 
            label="Status"
            value={formData.status || 'available'}
            onChange={e => setFormData({...formData, status: e.target.value as any})}
            options={[
              { value: 'available', label: 'Available' },
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'disabled', label: 'Disabled' },
            ]}
          />
        )}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{seat ? 'Save Changes' : 'Create Seat'}</Button>
        </div>
      </form>
    </Modal>
  );
}
