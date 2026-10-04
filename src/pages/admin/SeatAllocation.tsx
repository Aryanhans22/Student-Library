import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { SearchInput } from '../../components/ui/SearchInput';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useSeats } from '../../hooks/useSeats';
import { useStudents } from '../../hooks/useStudents';
import { useSeatAssignments } from '../../hooks/useSeatAssignments';
import { Search, User, MapPin, CheckCircle, ArrowRight, X, Armchair, Sparkles, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { Seat, Profile } from '../../types/database';

export default function SeatAllocation() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const studentIdParam = searchParams.get('student');
  
  const { students, isLoading: isLoadingStudents, fetchStudents } = useStudents();
  const { seats, isLoading: isLoadingSeats, fetchSeats } = useSeats();
  const { assignments, assignSeat, releaseSeat, changeSeat, fetchAssignments } = useSeatAssignments();

  const [studentSearch, setStudentSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const [seatStatusFilter, setSeatStatusFilter] = useState<'all' | 'available' | 'occupied'>('all');
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [releaseConfirmOpen, setReleaseConfirmOpen] = useState(false);

  // Auto-fetch data on component mount
  useEffect(() => {
    fetchStudents({ limit: 100 });
    fetchSeats();
    fetchAssignments();
  }, [fetchStudents, fetchSeats, fetchAssignments]);

  // Pre-select student if param exists
  useEffect(() => {
    if (studentIdParam && students && students.length > 0) {
      const student = students.find(s => s.id === studentIdParam);
      if (student) setSelectedStudent(student);
    }
  }, [studentIdParam, students]);

  // Derived data
  const activeStudents = useMemo(() => students?.filter(s => s.status === 'active') || [], [students]);
  
  // Show active students list, filter when search term is entered
  const filteredStudents = useMemo(() => {
    if (!activeStudents) return [];
    if (!studentSearch.trim()) return activeStudents.slice(0, 50);
    const query = studentSearch.toLowerCase().trim();
    return activeStudents.filter(s => 
      s.full_name?.toLowerCase().includes(query) ||
      s.student_id?.toLowerCase().includes(query) ||
      s.email?.toLowerCase().includes(query) ||
      (s.phone && s.phone.includes(query))
    ).slice(0, 50);
  }, [activeStudents, studentSearch]);

  const sections = useMemo(() => {
    if (!seats) return [];
    return Array.from(new Set(seats.map(s => s.section))).filter((s): s is string => Boolean(s)).sort();
  }, [seats]);

  const allFilteredSeats = useMemo(() => {
    if (!seats) return [];
    let list = [...seats];
    if (selectedSection !== 'all') {
      list = list.filter(s => s.section === selectedSection);
    }
    if (seatStatusFilter === 'available') {
      list = list.filter(s => s.status === 'available');
    } else if (seatStatusFilter === 'occupied') {
      list = list.filter(s => s.status === 'occupied');
    }
    return list;
  }, [seats, selectedSection, seatStatusFilter]);

  const availableSeatsCount = useMemo(() => {
    if (!seats) return 0;
    return seats.filter(s => s.status === 'available').length;
  }, [seats]);

  const occupiedSeatsCount = useMemo(() => {
    if (!seats) return 0;
    return seats.filter(s => s.status === 'occupied').length;
  }, [seats]);

  const getSeatAssignee = (seatId: string, seatNumber: string) => {
    if (!assignments) return null;
    const asgn = assignments.find((a: any) => 
      (a.seat_id === seatId || a.seat?.seat_number?.toUpperCase() === seatNumber.toUpperCase()) && a.status === 'active'
    );
    if (!asgn) return null;
    return asgn.student || students?.find(s => s.id === asgn.student_id) || null;
  };
  
  const studentCurrentAssignment = useMemo(() => {
    if (!selectedStudent || !assignments) return null;
    return assignments.find((a: any) => a.student_id === selectedStudent.id && a.status === 'active') || null;
  }, [selectedStudent, assignments]);

  const studentCurrentSeat = useMemo(() => {
    if (studentCurrentAssignment) {
      return (studentCurrentAssignment as any).seat || seats?.find(s => s.id === studentCurrentAssignment.seat_id) || null;
    }
    const studentActiveSeatNum = (selectedStudent as any)?.active_seat_number;
    if (studentActiveSeatNum && seats) {
      return seats.find(s => s.seat_number?.toUpperCase() === studentActiveSeatNum.toUpperCase()) || null;
    }
    return null;
  }, [studentCurrentAssignment, selectedStudent, seats]);

  // Actions
  const handleSelectStudent = (student: Profile) => {
    setSelectedStudent(student);
    setStudentSearch('');
    setSelectedSeat(null);
    setSearchParams({ student: student.id });
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setSelectedSeat(null);
    setSearchParams({});
  };

  const handleConfirmAssignment = async () => {
    if (!selectedStudent || !selectedSeat) return;
    setIsAssigning(true);
    try {
      let res: any;
      if (studentCurrentAssignment) {
        res = await changeSeat(selectedStudent.id, selectedSeat.id);
      } else {
        res = await assignSeat(selectedStudent.id, selectedSeat.id);
      }

      if (res && res.success === false) {
        toast.error(res.error || 'Failed to assign seat');
        return;
      }

      toast.success(`Seat ${selectedSeat.seat_number} allocated to ${selectedStudent.full_name} successfully!`);
      const newSeatNumber = selectedSeat.seat_number;
      setSelectedSeat(null);
      setSelectedStudent(prev => prev ? { ...prev, active_seat_number: newSeatNumber } as any : null);
      await Promise.all([
        fetchSeats(),
        fetchAssignments(),
        fetchStudents({ limit: 100 })
      ]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign seat');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleReleaseSeat = async () => {
    if (!studentCurrentAssignment && !(selectedStudent as any)?.active_seat_number) return;
    setIsReleasing(true);
    try {
      const assignmentId = studentCurrentAssignment?.id || assignments?.find((a: any) => a.student_id === selectedStudent?.id && a.status === 'active')?.id;
      if (assignmentId) {
        const res = await releaseSeat(assignmentId);
        if (res && res.success === false) {
          toast.error(res.error || 'Failed to release seat');
          return;
        }
      }
      toast.success('Seat released successfully');
      setReleaseConfirmOpen(false);
      setSelectedStudent(prev => prev ? { ...prev, active_seat_number: null } as any : null);
      await Promise.all([
        fetchSeats(),
        fetchAssignments(),
        fetchStudents({ limit: 100 })
      ]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to release seat');
    } finally {
      setIsReleasing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seat Allocation</h1>
          <p className="text-gray-500 text-sm">Assign, change, and manage student desk allocations</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            fetchStudents({ limit: 100 });
            fetchSeats();
            fetchAssignments();
            toast.success('Data refreshed');
          }}
          className="flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step 1: Student Selection (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className={cn("transition-all shadow-sm", selectedStudent ? "border-indigo-200" : "border-indigo-300 ring-2 ring-indigo-500/10")}>
            <CardHeader className="pb-3 border-b flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2 text-slate-900">
                <span className="bg-indigo-600 text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold">1</span>
                <span>Select Student</span>
              </h2>
              {activeStudents.length > 0 && (
                <span className="text-xs text-slate-500 font-medium">{activeStudents.length} Active Students</span>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              {!selectedStudent ? (
                <div className="space-y-3">
                  <SearchInput 
                    value={studentSearch} 
                    onChange={setStudentSearch} 
                    placeholder="Search by student name, ID, email..."
                  />

                  {isLoadingStudents ? (
                    <div className="space-y-2 py-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-2.5">
                          <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredStudents.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden shadow-xs max-h-[380px] overflow-y-auto">
                      {filteredStudents.map(student => {
                        const assignment = assignments?.find((a: any) => a.student_id === student.id && a.status === 'active');
                        const assignedSeat = assignment ? ((assignment as any).seat || seats?.find(s => s.id === assignment.seat_id)) : null;
                        const allocatedSeatNumber = assignedSeat?.seat_number || (student as any).active_seat_number;
                        const isSelected = studentIdParam === student.id;

                        return (
                          <div 
                            key={student.id} 
                            className={cn(
                              "p-3 hover:bg-indigo-50/70 cursor-pointer flex items-center justify-between gap-3 transition-colors",
                              isSelected ? "bg-indigo-50 font-medium border-l-4 border-indigo-600 pl-2.5" : ""
                            )}
                            onClick={() => handleSelectStudent(student)}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                                {student.full_name ? student.full_name.substring(0, 2).toUpperCase() : 'ST'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-slate-900 truncate">{student.full_name}</p>
                                <p className="text-xs text-slate-500 font-mono">{student.student_id || student.email}</p>
                              </div>
                            </div>
                            
                            {allocatedSeatNumber ? (
                              <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <Armchair className="w-3 h-3 text-emerald-600" />
                                Seat {allocatedSeatNumber}
                              </span>
                            ) : (
                              <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
                                Unallocated
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : activeStudents.length === 0 ? (
                    <div className="py-8 px-4 text-center text-sm border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <User className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-slate-700">No active students found</p>
                      <p className="text-xs text-slate-500 mt-1 mb-4">Add students to the library first to allocate desks.</p>
                      <Button 
                        size="sm" 
                        variant="primary" 
                        onClick={() => navigate('/admin/students?add=true')}
                        className="inline-flex items-center gap-1.5"
                      >
                        + Add Student
                      </Button>
                    </div>
                  ) : (
                    <div className="py-8 px-4 text-center text-sm border border-dashed border-slate-200 rounded-xl">
                      <User className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-slate-600 font-medium">No students match &quot;{studentSearch}&quot;</p>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setStudentSearch('')}
                        className="mt-2 text-xs text-indigo-600"
                      >
                        Clear search filter
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected Student Banner */}
                  <div className="flex items-center justify-between bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0">
                        {selectedStudent.full_name ? selectedStudent.full_name.substring(0, 2).toUpperCase() : 'ST'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{selectedStudent.full_name}</p>
                        <p className="text-xs text-indigo-700 font-mono">{selectedStudent.student_id || selectedStudent.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleClearStudent} 
                      className="p-1.5 hover:bg-indigo-100 rounded-xl text-slate-500 hover:text-slate-800 transition"
                      title="Change selected student"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Current Seat Status Card */}
                  <div className="p-4 rounded-2xl border bg-slate-50 space-y-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Allocation</p>
                    {studentCurrentSeat ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-indigo-900 font-bold text-base">
                            <Armchair className="w-5 h-5 text-indigo-600" />
                            <span>Allocated to Seat {studentCurrentSeat.seat_number}</span>
                          </div>
                          <Badge variant="primary">Active</Badge>
                        </div>
                        <p className="text-xs text-slate-600">
                          Section {studentCurrentSeat.section} • {studentCurrentSeat.floor}
                        </p>
                        <Button 
                          variant="danger" 
                          size="sm" 
                          className="w-full mt-2" 
                          onClick={() => setReleaseConfirmOpen(true)}
                        >
                          Release Current Desk
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-500 text-sm py-1">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>No seat allocated yet</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Step 2: Available & Allocated Seat Selection (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className={cn("transition-all shadow-sm", selectedStudent && !selectedSeat ? "border-indigo-300 ring-2 ring-indigo-500/10" : "")}>
            <CardHeader className="pb-3 border-b flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-bold flex items-center gap-2 text-slate-900">
                <span className={cn("w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold", selectedStudent ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600")}>2</span>
                <span>Select Desk & Floor Layout</span>
              </h2>

              {selectedStudent && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setSeatStatusFilter('all')}
                      className={cn(
                        "px-2.5 py-1 rounded-md font-medium transition cursor-pointer",
                        seatStatusFilter === 'all' ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      All ({seats?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeatStatusFilter('available')}
                      className={cn(
                        "px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1",
                        seatStatusFilter === 'available' ? "bg-emerald-600 text-white shadow-xs font-bold" : "text-emerald-700 hover:bg-emerald-50"
                      )}
                    >
                      <span>Available</span>
                      <span className="font-mono">({availableSeatsCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeatStatusFilter('occupied')}
                      className={cn(
                        "px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1",
                        seatStatusFilter === 'occupied' ? "bg-indigo-600 text-white shadow-xs font-bold" : "text-indigo-700 hover:bg-indigo-50"
                      )}
                    >
                      <span>Allocated</span>
                      <span className="font-mono">({occupiedSeatsCount})</span>
                    </button>
                  </div>

                  {sections.length > 1 && (
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="all">All Sections</option>
                      {sections.map(sec => (
                        <option key={sec} value={sec}>Section {sec}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-5">
              {!selectedStudent ? (
                <div className="text-center py-14 text-slate-400 flex flex-col items-center">
                  <User className="w-12 h-12 mb-3 opacity-25" />
                  <p className="font-medium text-sm text-slate-600">Please select a student first</p>
                  <p className="text-xs text-slate-400 mt-1">Choose a student from Step 1 to view and assign available desks.</p>
                </div>
              ) : isLoadingSeats ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : allFilteredSeats.length === 0 ? (
                <EmptyState 
                  title="No desks found" 
                  description={
                    seatStatusFilter === 'available'
                      ? "All seats in this section are currently occupied."
                      : seatStatusFilter === 'occupied'
                      ? "No seats in this section are currently allocated."
                      : "No seats found matching your criteria."
                  } 
                  icon={<Armchair className="w-10 h-10 text-slate-400" />} 
                />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <p>
                      {studentCurrentSeat ? 'Click an available desk below to REASSIGN:' : 'Click an available desk below to ALLOCATE:'}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Available
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-indigo-700 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Allocated
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-80 overflow-y-auto p-1">
                    {allFilteredSeats.map(seat => {
                      const isSelected = selectedSeat?.id === seat.id;
                      const isOccupied = seat.status === 'occupied';
                      const isMaintenance = seat.status === 'maintenance' || seat.status === 'disabled';
                      const assignee = getSeatAssignee(seat.id, seat.seat_number);
                      const isCurrentStudentsDesk = (studentCurrentSeat?.id === seat.id || studentCurrentSeat?.seat_number === seat.seat_number);

                      if (isOccupied) {
                        return (
                          <button
                            key={seat.id}
                            type="button"
                            onClick={() => {
                              if (isCurrentStudentsDesk) {
                                toast(`Seat ${seat.seat_number} is already allocated to ${selectedStudent.full_name}`, { icon: 'ℹ️' });
                              } else {
                                toast(`Seat ${seat.seat_number} is occupied by ${assignee?.full_name || 'another student'}.`, { icon: '🔒' });
                              }
                            }}
                            className={cn(
                              "py-3 px-2 rounded-xl border font-bold text-sm transition-all flex flex-col items-center justify-center gap-1 cursor-pointer",
                              isCurrentStudentsDesk
                                ? "bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500 text-indigo-950 shadow-xs"
                                : "bg-slate-100/90 text-slate-700 border-slate-300 hover:bg-slate-200/80"
                            )}
                          >
                            <Armchair className={cn("w-4 h-4", isCurrentStudentsDesk ? "text-indigo-600" : "text-slate-500")} />
                            <span className="font-mono text-base">{seat.seat_number}</span>
                            <span className={cn(
                              "text-[10px] font-semibold px-1.5 py-0.2 rounded truncate max-w-[90%]",
                              isCurrentStudentsDesk ? "bg-indigo-200 text-indigo-900" : "bg-slate-200 text-slate-700"
                            )}>
                              {isCurrentStudentsDesk ? 'Current' : assignee?.full_name ? assignee.full_name.split(' ')[0] : 'Occupied'}
                            </span>
                          </button>
                        );
                      }

                      if (isMaintenance) {
                        return (
                          <div
                            key={seat.id}
                            className="py-3 px-2 rounded-xl border font-bold text-sm bg-amber-50 text-amber-800 border-amber-200 flex flex-col items-center justify-center gap-1 opacity-70"
                          >
                            <Armchair className="w-4 h-4 text-amber-600" />
                            <span className="font-mono text-base">{seat.seat_number}</span>
                            <span className="text-[10px] font-normal text-amber-700">Maint.</span>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={seat.id}
                          type="button"
                          onClick={() => setSelectedSeat(seat)}
                          className={cn(
                            "py-3 px-2 rounded-xl border font-bold text-sm transition-all flex flex-col items-center justify-center gap-1 cursor-pointer",
                            isSelected 
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-105 ring-2 ring-indigo-400 ring-offset-1" 
                              : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80 hover:border-emerald-300"
                          )}
                        >
                          <Armchair className={cn("w-4 h-4", isSelected ? "text-white" : "text-emerald-600")} />
                          <span className="font-mono text-base">{seat.seat_number}</span>
                          <span className={cn("text-[10px] font-normal", isSelected ? "text-indigo-100" : "text-emerald-600")}>
                            Sec {seat.section || 'A'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Confirmation Banner */}
          {selectedStudent && selectedSeat && (
            <Card className="border-indigo-300 shadow-lg bg-gradient-to-r from-indigo-50/70 to-purple-50/70 border">
              <CardHeader className="pb-2">
                <h2 className="text-base font-bold flex items-center gap-2 text-indigo-950">
                  <span className="bg-indigo-600 text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold">3</span>
                  <span>Confirm Allocation</span>
                </h2>
              </CardHeader>
              <CardContent className="pt-2 space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-indigo-100 shadow-xs">
                  <div className="text-center flex-1">
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Student</p>
                    <p className="font-bold text-slate-900 text-base mt-0.5">{selectedStudent.full_name}</p>
                    <p className="text-xs text-slate-500 font-mono">{selectedStudent.student_id || selectedStudent.email}</p>
                  </div>
                  
                  <div className="px-4 text-indigo-400">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                  
                  <div className="text-center flex-1">
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">New Desk</p>
                    <p className="font-extrabold text-indigo-600 text-xl mt-0.5 font-mono">Seat {selectedSeat.seat_number}</p>
                    <p className="text-xs text-slate-500">Section {selectedSeat.section} • {selectedSeat.floor}</p>
                  </div>
                </div>
                
                {studentCurrentSeat && (
                  <div className="flex items-center gap-2 text-amber-800 text-xs bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>This will automatically release seat <strong>{studentCurrentSeat.seat_number}</strong> and reassign to <strong>{selectedSeat.seat_number}</strong>.</span>
                  </div>
                )}
                
                <Button 
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-md shadow-indigo-500/20 active:scale-[0.99] transition-all cursor-pointer" 
                  onClick={handleConfirmAssignment}
                  disabled={isAssigning}
                >
                  {isAssigning ? 'Allocating...' : studentCurrentSeat ? `Confirm Reassignment to Seat ${selectedSeat.seat_number}` : `Allocate Seat ${selectedSeat.seat_number}`}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={releaseConfirmOpen}
        title="Release Seat Allocation"
        message={`Are you sure you want to release seat ${studentCurrentSeat?.seat_number} from ${selectedStudent?.full_name}? The desk will become available for other students.`}
        onConfirm={handleReleaseSeat}
        onCancel={() => setReleaseConfirmOpen(false)}
        confirmText={isReleasing ? "Releasing..." : "Release Desk"}
        isDanger={true}
      />
    </div>
  );
}
