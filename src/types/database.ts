export type UserRole = 'student' | 'admin';
export type AccountStatus = 'active' | 'inactive' | 'suspended';
export type SeatStatus = 'available' | 'occupied' | 'maintenance' | 'disabled';
export type AssignmentStatus = 'active' | 'released';

export interface Profile {
  id: string;
  auth_user_id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  student_id: string | null;
  date_of_birth: string | null;
  address: string | null;
  emergency_contact: string | null;
  profile_image_url: string | null;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface Seat {
  id: string;
  seat_number: string;
  floor: string | null;
  section: string | null;
  row_number: number | null;
  column_number: number | null;
  status: SeatStatus;
  created_at: string;
  updated_at: string;
}

export interface SeatAssignment {
  id: string;
  student_id: string;
  seat_id: string;
  assigned_by: string | null;
  assigned_at: string;
  released_at: string | null;
  status: AssignmentStatus;
  created_at: string;
  updated_at: string;
  // Joined data
  seat?: Seat;
  student?: Profile;
}

export interface AuditLog {
  id: string;
  admin_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

export interface DashboardStats {
  total_students: number;
  active_students: number;
  total_seats: number;
  occupied_seats: number;
  available_seats: number;
  maintenance_seats: number;
  occupancy_rate: number;
}

export interface RegisterFormData {
  full_name: string;
  email: string;
  phone?: string;
  mobile_number?: string;
  password: string;
  confirm_password: string;
  student_id?: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact?: string;
}

export interface SeatFormData {
  seat_number: string;
  floor: string;
  section: string;
  row_number: number | null;
  column_number: number | null;
  status: SeatStatus;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}

export type SubscriptionStatus = 'active' | 'expiring_soon' | 'expired' | 'cancelled';

export interface SubscriptionPlan {
  id: string;
  name: string;
  duration_days: number;
  price: number;
  description: string;
  features: string[];
}

export interface StudentSubscription {
  id: string;
  student_id: string;
  plan_name: string;
  amount_paid: number;
  start_date: string;
  end_date: string;
  status: SubscriptionStatus;
  days_remaining?: number;
  auto_renew?: boolean;
  created_at: string;
  updated_at?: string;
  student?: Profile;
}

export type NotificationType = 'subscription_expiry' | 'seat_allocated' | 'seat_released' | 'chat_message' | 'system' | 'demo_booking';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export type DemoBookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface DemoBooking {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  organization_name: string;
  role: string;
  seat_capacity: string;
  preferred_date: string;
  preferred_time: string;
  features_of_interest: string[];
  notes?: string;
  status: DemoBookingStatus;
  created_at: string;
}

export interface DemoBookingFormData {
  full_name: string;
  email: string;
  phone: string;
  organization_name: string;
  role: string;
  seat_capacity: string;
  preferred_date: string;
  preferred_time: string;
  features_of_interest: string[];
  notes?: string;
}

