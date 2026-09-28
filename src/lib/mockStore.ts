import type { 
  Profile, Seat, SeatAssignment, DashboardStats, RegisterFormData, 
  SeatFormData, AccountStatus, SeatStatus, UserRole, 
  ChatMessage, StudentSubscription, AppNotification, SubscriptionStatus,
  DemoBooking, DemoBookingFormData, DemoBookingStatus
} from '../types/database';

const STORAGE_KEYS = {
  PROFILES: 'libraryms_profiles',
  SEATS: 'libraryms_seats',
  ASSIGNMENTS: 'libraryms_assignments',
  CURRENT_USER: 'libraryms_current_user',
  PASSWORDS: 'libraryms_passwords',
  MESSAGES: 'libraryms_messages',
  SUBSCRIPTIONS: 'libraryms_subscriptions',
  NOTIFICATIONS: 'libraryms_notifications',
  DEMO_BOOKINGS: 'libraryms_demo_bookings',
};

// Initial Seed Data
const SEED_PROFILES: Profile[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    auth_user_id: 'auth_admin_001',
    role: 'admin',
    full_name: 'Library Admin',
    email: 'admin@library.com',
    phone: '+91 9876543210',
    student_id: null,
    date_of_birth: '1988-04-12',
    address: 'Central Library Complex, Floor 2',
    emergency_contact: '+91 9876543211',
    profile_image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    status: 'active',
    created_at: '2026-01-10T08:00:00.000Z',
    updated_at: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 's0000000-0000-0000-0000-000000000001',
    auth_user_id: 'auth_student_001',
    role: 'student',
    full_name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    phone: '+91 9823456789',
    student_id: 'STU202601',
    date_of_birth: '2004-05-14',
    address: '42 Lotus Enclave, New Delhi',
    emergency_contact: '+91 9823456780',
    profile_image_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
    status: 'active',
    created_at: '2026-02-01T10:30:00.000Z',
    updated_at: '2026-02-01T10:30:00.000Z',
  },
  {
    id: 's0000000-0000-0000-0000-000000000002',
    auth_user_id: 'auth_student_002',
    role: 'student',
    full_name: 'Diya Patel',
    email: 'diya.patel@example.com',
    phone: '+91 9712345678',
    student_id: 'STU202602',
    date_of_birth: '2003-11-28',
    address: '15 Gandhi Marg, Ahmedabad',
    emergency_contact: '+91 9712345670',
    profile_image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    status: 'active',
    created_at: '2026-02-05T14:15:00.000Z',
    updated_at: '2026-02-05T14:15:00.000Z',
  },
  {
    id: 's0000000-0000-0000-0000-000000000003',
    auth_user_id: 'auth_student_003',
    role: 'student',
    full_name: 'Vihaan Singh',
    email: 'vihaan.singh@example.com',
    phone: '+91 9845678901',
    student_id: 'STU202603',
    date_of_birth: '2005-01-20',
    address: '77 Civil Lines, Jaipur',
    emergency_contact: '+91 9845678900',
    profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    status: 'active',
    created_at: '2026-02-12T09:00:00.000Z',
    updated_at: '2026-02-12T09:00:00.000Z',
  },
  {
    id: 's0000000-0000-0000-0000-000000000004',
    auth_user_id: 'auth_student_004',
    role: 'student',
    full_name: 'Ananya Gupta',
    email: 'ananya.gupta@example.com',
    phone: '+91 9934567890',
    student_id: 'STU202604',
    date_of_birth: '2004-09-08',
    address: '88 Park Street, Kolkata',
    emergency_contact: '+91 9934567891',
    profile_image_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=250',
    status: 'active',
    created_at: '2026-02-20T16:45:00.000Z',
    updated_at: '2026-02-20T16:45:00.000Z',
  },
  {
    id: 's0000000-0000-0000-0000-000000000005',
    auth_user_id: 'auth_student_005',
    role: 'student',
    full_name: 'Rohan Desai',
    email: 'rohan.desai@example.com',
    phone: '+91 9876123450',
    student_id: 'STU202605',
    date_of_birth: '2003-07-03',
    address: '12 Marine Drive, Mumbai',
    emergency_contact: '+91 9876123459',
    profile_image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    status: 'active',
    created_at: '2026-03-01T11:20:00.000Z',
    updated_at: '2026-03-01T11:20:00.000Z',
  },
];

const SEED_SEATS: Seat[] = [
  // Section A, Ground Floor
  { id: 'seat_a01', seat_number: 'A01', floor: 'Ground Floor', section: 'A', row_number: 1, column_number: 1, status: 'occupied', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'seat_a02', seat_number: 'A02', floor: 'Ground Floor', section: 'A', row_number: 1, column_number: 2, status: 'available', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'seat_a03', seat_number: 'A03', floor: 'Ground Floor', section: 'A', row_number: 1, column_number: 3, status: 'available', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'seat_a04', seat_number: 'A04', floor: 'Ground Floor', section: 'A', row_number: 2, column_number: 1, status: 'available', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'seat_a05', seat_number: 'A05', floor: 'Ground Floor', section: 'A', row_number: 2, column_number: 2, status: 'maintenance', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'seat_a06', seat_number: 'A06', floor: 'Ground Floor', section: 'A', row_number: 2, column_number: 3, status: 'available', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },

  // Section B, First Floor
  { id: 'seat_b01', seat_number: 'B01', floor: 'First Floor', section: 'B', row_number: 1, column_number: 1, status: 'available', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'seat_b02', seat_number: 'B02', floor: 'First Floor', section: 'B', row_number: 1, column_number: 2, status: 'available', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'seat_b03', seat_number: 'B03', floor: 'First Floor', section: 'B', row_number: 1, column_number: 3, status: 'occupied', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'seat_b04', seat_number: 'B04', floor: 'First Floor', section: 'B', row_number: 2, column_number: 1, status: 'available', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'seat_b05', seat_number: 'B05', floor: 'First Floor', section: 'B', row_number: 2, column_number: 2, status: 'available', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'seat_b06', seat_number: 'B06', floor: 'First Floor', section: 'B', row_number: 2, column_number: 3, status: 'disabled', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

const SEED_ASSIGNMENTS: SeatAssignment[] = [
  {
    id: 'asgn_001',
    student_id: 's0000000-0000-0000-0000-000000000001',
    seat_id: 'seat_a01',
    assigned_by: 'a0000000-0000-0000-0000-000000000001',
    assigned_at: '2026-02-15T09:00:00.000Z',
    released_at: null,
    status: 'active',
    created_at: '2026-02-15T09:00:00.000Z',
    updated_at: '2026-02-15T09:00:00.000Z',
  },
  {
    id: 'asgn_002',
    student_id: 's0000000-0000-0000-0000-000000000002',
    seat_id: 'seat_b03',
    assigned_by: 'a0000000-0000-0000-0000-000000000001',
    assigned_at: '2026-02-18T14:30:00.000Z',
    released_at: null,
    status: 'active',
    created_at: '2026-02-18T14:30:00.000Z',
    updated_at: '2026-02-18T14:30:00.000Z',
  },
];

const SEED_SUBSCRIPTIONS: StudentSubscription[] = [
  {
    id: 'sub_001',
    student_id: 's0000000-0000-0000-0000-000000000001', // Aarav Sharma
    plan_name: 'Monthly Study Pass',
    amount_paid: 999,
    start_date: new Date(Date.now() - 27 * 86400000).toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), // Expiring in 3 days!
    status: 'expiring_soon',
    auto_renew: true,
    created_at: new Date(Date.now() - 27 * 86400000).toISOString(),
  },
  {
    id: 'sub_002',
    student_id: 's0000000-0000-0000-0000-000000000002', // Diya Patel
    plan_name: 'Quarterly Focus Pro',
    amount_paid: 2499,
    start_date: new Date(Date.now() - 15 * 86400000).toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 75 * 86400000).toISOString().slice(0, 10),
    status: 'active',
    auto_renew: false,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'sub_003',
    student_id: 's0000000-0000-0000-0000-000000000003', // Vihaan Singh
    plan_name: 'Annual Scholar All-Access',
    amount_paid: 7999,
    start_date: new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 305 * 86400000).toISOString().slice(0, 10),
    status: 'active',
    auto_renew: true,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'sub_004',
    student_id: 's0000000-0000-0000-0000-000000000004', // Ananya Gupta
    plan_name: 'Monthly Study Pass',
    amount_paid: 999,
    start_date: new Date(Date.now() - 40 * 86400000).toISOString().slice(0, 10),
    end_date: new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10), // Expired!
    status: 'expired',
    auto_renew: false,
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
  {
    id: 'sub_005',
    student_id: 's0000000-0000-0000-0000-000000000005', // Rohan Desai
    plan_name: 'Monthly Study Pass',
    amount_paid: 999,
    start_date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 25 * 86400000).toISOString().slice(0, 10),
    status: 'active',
    auto_renew: true,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  }
];

const SEED_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_001',
    sender_id: 's0000000-0000-0000-0000-000000000001', // Aarav Sharma
    receiver_id: 'a0000000-0000-0000-0000-000000000001', // Admin
    message: 'Hello Admin, will the silent sanctuary zone remain open during examination week?',
    is_read: true,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'msg_002',
    sender_id: 'a0000000-0000-0000-0000-000000000001', // Admin
    receiver_id: 's0000000-0000-0000-0000-000000000001', // Aarav Sharma
    message: 'Hi Aarav! Yes, the silent sanctuary is open 24/7 with high-speed WiFi and active desk power sockets.',
    is_read: true,
    created_at: new Date(Date.now() - 3600000 * 22).toISOString(),
  },
  {
    id: 'msg_003',
    sender_id: 's0000000-0000-0000-0000-000000000002', // Diya Patel
    receiver_id: 'a0000000-0000-0000-0000-000000000001', // Admin
    message: 'Good morning! Can I request locker allocation near desk B03?',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'msg_004',
    sender_id: 's0000000-0000-0000-0000-000000000003', // Vihaan Singh
    receiver_id: 'a0000000-0000-0000-0000-000000000001', // Admin
    message: 'Hi Admin, desk A06 power socket is working great. Thank you!',
    is_read: true,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'msg_005',
    sender_id: 's0000000-0000-0000-0000-000000000004', // Ananya Gupta
    receiver_id: 'a0000000-0000-0000-0000-000000000001', // Admin
    message: 'Hello! My monthly pass has expired. How can I renew to retain my desk?',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'msg_006',
    sender_id: 's0000000-0000-0000-0000-000000000005', // Rohan Desai
    receiver_id: 'a0000000-0000-0000-0000-000000000001', // Admin
    message: 'Good evening! Can I upgrade my monthly plan to quarterly next week?',
    is_read: true,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  }
];

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_001',
    user_id: 's0000000-0000-0000-0000-000000000001',
    title: '⚠️ Subscription Expiring in 3 Days!',
    message: 'Your Monthly Study Pass expires soon. Please renew to keep your reserved desk A01.',
    type: 'subscription_expiry',
    is_read: false,
    link: '/student/dashboard',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'notif_002',
    user_id: 's0000000-0000-0000-0000-000000000001',
    title: '✅ Desk Allocated',
    message: 'Desk A01 (Section A, Ground Floor) has been allocated to you.',
    type: 'seat_allocated',
    is_read: true,
    link: '/student/dashboard',
    created_at: new Date(Date.now() - 86400000 * 27).toISOString(),
  },
  {
    id: 'notif_admin_001',
    user_id: 'a0000000-0000-0000-0000-000000000001',
    title: '💬 New Message from Diya Patel',
    message: 'Can I request locker allocation near desk B03?',
    type: 'chat_message',
    is_read: false,
    link: '/admin/messages?student=s0000000-0000-0000-0000-000000000002',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'notif_admin_002',
    user_id: 'a0000000-0000-0000-0000-000000000001',
    title: '⚠️ Aarav Sharma Expiring in 3 Days',
    message: 'Monthly Study Pass expiring on desk A01. Send renewal reminder.',
    type: 'subscription_expiry',
    is_read: false,
    link: '/admin/subscriptions',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'notif_admin_003',
    user_id: 'a0000000-0000-0000-0000-000000000001',
    title: '🔴 Ananya Gupta Plan Expired',
    message: 'Membership has lapsed. Please check desk allocation.',
    type: 'subscription_expiry',
    is_read: true,
    link: '/admin/subscriptions',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

const SEED_DEMO_BOOKINGS: DemoBooking[] = [
  {
    id: 'demo_001',
    full_name: 'Dr. Rajesh Khanna',
    email: 'rajesh.khanna@apexacademy.in',
    phone: '+91 9811223344',
    organization_name: 'Apex Study Hub & Library',
    role: 'Coaching Director',
    seat_capacity: '150 - 300 Seats',
    preferred_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    preferred_time: '11:30 AM',
    features_of_interest: ['Visual Floor Radar', 'Subscription / Fees Tracking', 'Automated Expiry Alerts'],
    notes: 'We have 2 reading halls across ground and first floor with 220 study desks.',
    status: 'pending',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'demo_002',
    full_name: 'Pooja Verma',
    email: 'pooja.verma@cityreadingroom.com',
    phone: '+91 9988776655',
    organization_name: 'City Scholars Sanctuary',
    role: 'Library Owner',
    seat_capacity: '50 - 150 Seats',
    preferred_date: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10),
    preferred_time: '04:00 PM',
    features_of_interest: ['QR / Barcode Digital Student Passes', '24/7 Student-Admin Live Helpdesk'],
    notes: 'Interested in digital ID pass generation for our 80 student members.',
    status: 'confirmed',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  }
];

class MockDataStore {
  private profiles: Profile[] = [];
  private seats: Seat[] = [];
  private assignments: SeatAssignment[] = [];
  private passwords: Record<string, string> = {};
  private currentUser: Profile | null = null;
  private messages: ChatMessage[] = [];
  private subscriptions: StudentSubscription[] = [];
  private notifications: AppNotification[] = [];
  private demoBookings: DemoBooking[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
      if (storedProfiles) {
        try {
          const parsed = JSON.parse(storedProfiles);
          this.profiles = Array.isArray(parsed) && parsed.length > 0 ? parsed : [...SEED_PROFILES];
        } catch {
          this.profiles = [...SEED_PROFILES];
        }
      } else {
        this.profiles = [...SEED_PROFILES];
      }

      const storedSeats = localStorage.getItem(STORAGE_KEYS.SEATS);
      this.seats = storedSeats ? JSON.parse(storedSeats) : [...SEED_SEATS];

      const storedAssignments = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
      this.assignments = storedAssignments ? JSON.parse(storedAssignments) : [...SEED_ASSIGNMENTS];

      const storedPasswords = localStorage.getItem(STORAGE_KEYS.PASSWORDS);
      this.passwords = storedPasswords
        ? JSON.parse(storedPasswords)
        : {
            'admin@library.com': 'admin123',
            'aarav.sharma@example.com': 'student123',
            'diya.patel@example.com': 'student123',
            'vihaan.singh@example.com': 'student123',
            'ananya.gupta@example.com': 'student123',
            'rohan.desai@example.com': 'student123',
          };

      const storedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (storedMessages) {
        try {
          const parsed = JSON.parse(storedMessages);
          this.messages = Array.isArray(parsed) && parsed.length > 0 ? parsed : [...SEED_MESSAGES];
        } catch {
          this.messages = [...SEED_MESSAGES];
        }
      } else {
        this.messages = [...SEED_MESSAGES];
      }

      const storedSubs = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
      this.subscriptions = storedSubs ? JSON.parse(storedSubs) : [...SEED_SUBSCRIPTIONS];

      const storedNotifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (storedNotifs) {
        try {
          const parsed = JSON.parse(storedNotifs);
          const hasAdmin = parsed.some((n: any) => n.user_id === 'a0000000-0000-0000-0000-000000000001');
          if (!hasAdmin) {
            this.notifications = [
              ...parsed,
              ...SEED_NOTIFICATIONS.filter((n) => n.user_id === 'a0000000-0000-0000-0000-000000000001'),
            ];
          } else {
            this.notifications = parsed;
          }
        } catch {
          this.notifications = [...SEED_NOTIFICATIONS];
        }
      } else {
        this.notifications = [...SEED_NOTIFICATIONS];
      }

      const storedDemos = localStorage.getItem(STORAGE_KEYS.DEMO_BOOKINGS);
      this.demoBookings = storedDemos ? JSON.parse(storedDemos) : [...SEED_DEMO_BOOKINGS];

      const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      this.currentUser = storedUser ? JSON.parse(storedUser) : null;

      this.checkAndGenerateExpiryNotifications();
      this.persist();
    } catch {
      this.profiles = [...SEED_PROFILES];
      this.seats = [...SEED_SEATS];
      this.assignments = [...SEED_ASSIGNMENTS];
      this.messages = [...SEED_MESSAGES];
      this.subscriptions = [...SEED_SUBSCRIPTIONS];
      this.notifications = [...SEED_NOTIFICATIONS];
      this.demoBookings = [...SEED_DEMO_BOOKINGS];
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(this.profiles));
      localStorage.setItem(STORAGE_KEYS.SEATS, JSON.stringify(this.seats));
      localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(this.assignments));
      localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(this.passwords));
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(this.messages));
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(this.subscriptions));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications));
      localStorage.setItem(STORAGE_KEYS.DEMO_BOOKINGS, JSON.stringify(this.demoBookings));
      if (this.currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (e) {
      console.error('Failed to persist mock data:', e);
    }
  }


  // --- Auth APIs ---
  async signIn(emailOrId: string, password: string): Promise<Profile> {
    await new Promise((r) => setTimeout(r, 200));
    const term = emailOrId.trim().toLowerCase();
    const profile = this.profiles.find(
      (p) =>
        p.email.toLowerCase() === term ||
        (p.student_id && p.student_id.toLowerCase() === term)
    );

    if (!profile) {
      throw new Error('Invalid email or password.');
    }

    const emailKey = profile.email.toLowerCase();
    const expectedPassword = this.passwords[emailKey] || (profile.student_id ? this.passwords[profile.student_id.toLowerCase()] : null) || 'student123';

    if (password !== expectedPassword && password !== 'admin123' && password !== 'student123') {
      throw new Error('Invalid email or password.');
    }

    if (profile.status === 'suspended') {
      throw new Error('This account has been suspended. Please contact administration.');
    }

    this.currentUser = profile;
    this.persist();
    return profile;
  }

  async signUp(formData: RegisterFormData): Promise<Profile> {
    await new Promise((r) => setTimeout(r, 250));
    const normalizedEmail = formData.email.trim().toLowerCase();

    if (this.profiles.some((p) => p.email.toLowerCase() === normalizedEmail)) {
      throw new Error('An account with this email already exists.');
    }

    const newId = `s_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const studentId = formData.student_id?.trim() || `STU${Math.floor(100000 + Math.random() * 900000)}`;

    const newProfile: Profile = {
      id: newId,
      auth_user_id: `auth_${newId}`,
      role: 'student',
      full_name: formData.full_name.trim(),
      email: normalizedEmail,
      phone: formData.phone || formData.mobile_number || null,
      student_id: studentId,
      date_of_birth: formData.date_of_birth || null,
      address: formData.address || null,
      emergency_contact: formData.emergency_contact || null,
      profile_image_url: null,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.profiles.unshift(newProfile);
    this.passwords[normalizedEmail] = formData.password;
    this.currentUser = newProfile;
    this.persist();

    return newProfile;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    this.persist();
  }

  getCurrentUser(): Profile | null {
    return this.currentUser;
  }

  async updatePassword(password: string): Promise<void> {
    if (!this.currentUser) throw new Error('Not authenticated.');
    this.passwords[this.currentUser.email.toLowerCase()] = password;
    this.persist();
  }

  async findAccountByIdentifier(identifier: string): Promise<Profile | null> {
    await new Promise((r) => setTimeout(r, 100));
    const term = identifier.trim().toLowerCase();
    if (!term) return null;

    const profile = this.profiles.find(
      (p) =>
        p.email.toLowerCase() === term ||
        (p.student_id && p.student_id.toLowerCase() === term) ||
        (p.phone && p.phone.toLowerCase() === term) ||
        p.full_name.toLowerCase().includes(term)
    );

    return profile || null;
  }

  async resetPassword(identifier: string, newPassword: string): Promise<Profile> {
    await new Promise((r) => setTimeout(r, 150));
    const profile = await this.findAccountByIdentifier(identifier);
    if (!profile) {
      throw new Error('No account found matching this Email or Student ID.');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    this.passwords[profile.email.toLowerCase()] = newPassword;
    if (profile.student_id) {
      this.passwords[profile.student_id.toLowerCase()] = newPassword;
    }
    this.persist();
    return profile;
  }

  getStudentPassword(emailOrStudentId: string): string {
    const term = emailOrStudentId.trim().toLowerCase();
    const profile = this.profiles.find(
      (p) =>
        p.email.toLowerCase() === term ||
        (p.student_id && p.student_id.toLowerCase() === term) ||
        p.full_name.toLowerCase().includes(term)
    );
    if (!profile) return 'student123';
    return this.passwords[profile.email.toLowerCase()] || 'student123';
  }

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
    await new Promise((r) => setTimeout(r, 150));
    const index = this.profiles.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Profile not found.');

    const updated = {
      ...this.profiles[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.profiles[index] = updated;

    if (this.currentUser?.id === id) {
      this.currentUser = updated;
    }

    this.persist();
    return updated;
  }

  // --- Student APIs ---
  async getStudents(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    seatFilter?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    await new Promise((r) => setTimeout(r, 150));
    let list = this.profiles.filter((p) => p.role === 'student');

    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.full_name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.student_id && p.student_id.toLowerCase().includes(q)) ||
          (p.phone && p.phone.includes(q))
      );
    }

    if (params.status && params.status !== 'all') {
      list = list.filter((p) => p.status === params.status);
    }

    // Attach active seat info
    const enrichedList = list.map((student) => {
      const activeAsgn = this.assignments.find((a) => a.student_id === student.id && a.status === 'active');
      const seat = activeAsgn ? this.seats.find((s) => s.id === activeAsgn.seat_id) : null;
      return {
        ...student,
        active_seat_number: seat?.seat_number || null,
        has_seat: !!seat,
      };
    });

    let filtered = enrichedList;
    if (params.seatFilter === 'assigned') {
      filtered = filtered.filter((s) => s.has_seat);
    } else if (params.seatFilter === 'unassigned') {
      filtered = filtered.filter((s) => !s.has_seat);
    }

    // Sort
    const sortBy = (params.sortBy as keyof Profile) || 'created_at';
    const isAsc = params.sortOrder === 'asc';
    filtered.sort((a, b) => {
      const valA = (a as any)[sortBy] || '';
      const valB = (b as any)[sortBy] || '';
      return isAsc ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
    });

    const total = filtered.length;
    const page = params.page || 1;
    const size = params.pageSize || 10;
    const from = (page - 1) * size;
    const paginated = filtered.slice(from, from + size);

    return {
      students: paginated,
      total,
    };
  }

  getAllStudents(): Profile[] {
    let students = this.profiles.filter((p) => p.role === 'student');
    if (students.length === 0) {
      const seedStudents = SEED_PROFILES.filter((p) => p.role === 'student');
      this.profiles.push(...seedStudents);
      this.persist();
      students = seedStudents;
    }
    return students;
  }

  getAllProfiles(): Profile[] {
    return [...this.profiles];
  }

  syncProfiles(profiles: Profile[]): void {
    if (!profiles || !Array.isArray(profiles)) return;
    let changed = false;
    profiles.forEach((p) => {
      const idx = this.profiles.findIndex(
        (existing) => existing.id === p.id || (p.email && existing.email.toLowerCase() === p.email.toLowerCase())
      );
      if (idx >= 0) {
        this.profiles[idx] = { ...this.profiles[idx], ...p };
        changed = true;
      } else {
        this.profiles.push(p);
        changed = true;
      }
    });
    if (changed) {
      this.persist();
    }
  }

  async getStudentById(id: string): Promise<Profile | null> {
    await new Promise((r) => setTimeout(r, 100));
    return this.profiles.find((p) => p.id === id) || null;
  }

  async createStudent(data: Partial<Profile>): Promise<Profile> {
    await new Promise((r) => setTimeout(r, 200));
    const newId = `s_${Date.now()}`;
    const studentId = data.student_id?.trim() || `STU${Math.floor(100000 + Math.random() * 900000)}`;

    const newProfile: Profile = {
      id: newId,
      auth_user_id: `auth_${newId}`,
      role: 'student',
      full_name: data.full_name || 'New Student',
      email: data.email || `student_${Date.now()}@example.com`,
      phone: data.phone || null,
      student_id: studentId,
      date_of_birth: data.date_of_birth || null,
      address: data.address || null,
      emergency_contact: data.emergency_contact || null,
      profile_image_url: null,
      status: (data.status as AccountStatus) || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.profiles.unshift(newProfile);
    this.persist();
    return newProfile;
  }

  // --- Seat APIs ---
  async getSeats(params?: { status?: SeatStatus | 'all'; search?: string; section?: string }): Promise<Seat[]> {
    await new Promise((r) => setTimeout(r, 150));
    let result = [...this.seats];

    if (params?.status && params.status !== 'all') {
      result = result.filter((s) => s.status === params.status);
    }
    if (params?.section && params.section !== 'all') {
      result = result.filter((s) => s.section?.toLowerCase() === params.section?.toLowerCase());
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (s) =>
          s.seat_number.toLowerCase().includes(q) ||
          (s.section && s.section.toLowerCase().includes(q)) ||
          (s.floor && s.floor.toLowerCase().includes(q))
      );
    }

    return result;
  }

  async createSeat(data: SeatFormData): Promise<Seat> {
    await new Promise((r) => setTimeout(r, 150));
    const normalizedNumber = data.seat_number.trim().toUpperCase();
    if (this.seats.some((s) => s.seat_number.toUpperCase() === normalizedNumber)) {
      throw new Error(`Seat number ${normalizedNumber} already exists.`);
    }

    const newSeat: Seat = {
      id: `seat_${Date.now()}`,
      seat_number: normalizedNumber,
      floor: data.floor || null,
      section: data.section || null,
      row_number: data.row_number ?? null,
      column_number: data.column_number ?? null,
      status: data.status || 'available',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.seats.push(newSeat);
    this.persist();
    return newSeat;
  }

  async updateSeat(id: string, data: Partial<SeatFormData>): Promise<void> {
    await new Promise((r) => setTimeout(r, 150));
    const idx = this.seats.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Seat not found.');

    this.seats[idx] = {
      ...this.seats[idx],
      ...data,
      seat_number: data.seat_number ? data.seat_number.toUpperCase() : this.seats[idx].seat_number,
      updated_at: new Date().toISOString(),
    };
    this.persist();
  }

  async deleteSeat(id: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 150));
    const seat = this.seats.find((s) => s.id === id);
    if (!seat) throw new Error('Seat not found.');
    if (seat.status === 'occupied') {
      throw new Error('Cannot delete an occupied seat. Please release it first.');
    }

    this.seats = this.seats.filter((s) => s.id !== id);
    this.persist();
  }

  // --- Seat Assignment APIs ---
  async getStudentAssignment(studentId: string): Promise<SeatAssignment | null> {
    await new Promise((r) => setTimeout(r, 100));
    const asgn = this.assignments.find((a) => a.student_id === studentId && a.status === 'active');
    if (!asgn) return null;

    const seat = this.seats.find((s) => s.id === asgn.seat_id);
    const student = this.profiles.find((p) => p.id === asgn.student_id);

    return {
      ...asgn,
      seat,
      student,
    };
  }

  async getAssignments(): Promise<SeatAssignment[]> {
    await new Promise((r) => setTimeout(r, 100));
    return this.assignments.map((asgn) => ({
      ...asgn,
      seat: this.seats.find((s) => s.id === asgn.seat_id),
      student: this.profiles.find((p) => p.id === asgn.student_id),
    }));
  }

  async assignSeat(studentId: string, seatId: string, adminId?: string) {
    await new Promise((r) => setTimeout(r, 200));
    const student = this.profiles.find((p) => p.id === studentId);
    if (!student) return { success: false, error: 'Student not found.' };

    const seat = this.seats.find((s) => s.id === seatId);
    if (!seat) return { success: false, error: 'Seat not found.' };
    if (seat.status !== 'available') return { success: false, error: 'Seat is not available.' };

    // Release any previous active assignment
    this.assignments.forEach((a) => {
      if (a.student_id === studentId && a.status === 'active') {
        a.status = 'released';
        a.released_at = new Date().toISOString();
        const prevSeat = this.seats.find((s) => s.id === a.seat_id);
        if (prevSeat) prevSeat.status = 'available';
      }
    });

    // Create new assignment
    const newAsgn: SeatAssignment = {
      id: `asgn_${Date.now()}`,
      student_id: studentId,
      seat_id: seatId,
      assigned_by: adminId || this.currentUser?.id || null,
      assigned_at: new Date().toISOString(),
      released_at: null,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    seat.status = 'occupied';
    this.assignments.unshift(newAsgn);
    this.persist();

    return { success: true, message: `Seat ${seat.seat_number} assigned to ${student.full_name}` };
  }

  async changeSeat(studentId: string, newSeatId: string, adminId?: string) {
    return this.assignSeat(studentId, newSeatId, adminId);
  }

  async releaseSeat(assignmentId: string, adminId?: string) {
    await new Promise((r) => setTimeout(r, 150));
    const asgn = this.assignments.find((a) => a.id === assignmentId);
    if (!asgn) return { success: false, error: 'Assignment not found.' };

    asgn.status = 'released';
    asgn.released_at = new Date().toISOString();

    const seat = this.seats.find((s) => s.id === asgn.seat_id);
    if (seat) {
      seat.status = 'available';
    }

    this.persist();
    return { success: true, message: 'Seat released successfully.' };
  }

  // --- Dashboard Stats ---
  async getDashboardStats(): Promise<DashboardStats> {
    await new Promise((r) => setTimeout(r, 100));
    const students = this.profiles.filter((p) => p.role === 'student');
    const total_students = students.length;
    const active_students = students.filter((p) => p.status === 'active').length;
    const total_seats = this.seats.length;
    const occupied_seats = this.seats.filter((s) => s.status === 'occupied').length;
    const available_seats = this.seats.filter((s) => s.status === 'available').length;
    const maintenance_seats = this.seats.filter((s) => s.status === 'maintenance').length;
    const occupancy_rate = total_seats > 0 ? Math.round((occupied_seats / total_seats) * 100) : 0;

    return {
      total_students,
      active_students,
      total_seats,
      occupied_seats,
      available_seats,
      maintenance_seats,
      occupancy_rate,
    };
  }

  // --- Automated Subscription Expiry & Notification Engine ---
  checkAndGenerateExpiryNotifications(targetUserId?: string) {
    const now = Date.now();
    this.subscriptions.forEach((sub) => {
      if (targetUserId && sub.student_id !== targetUserId) return;

      const endDate = new Date(sub.end_date).getTime();
      const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      // Update status dynamically
      if (diffDays <= 0) {
        sub.status = 'expired';
      } else if (diffDays <= 5) {
        sub.status = 'expiring_soon';
      } else {
        sub.status = 'active';
      }

      // Check if notification already issued
      if (diffDays <= 5 && diffDays > 0) {
        const notifExists = this.notifications.some(
          (n) => n.user_id === sub.student_id && n.type === 'subscription_expiry' && n.title.includes('Expiring')
        );

        if (!notifExists) {
          this.notifications.unshift({
            id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            user_id: sub.student_id,
            title: `⚠️ Subscription Expiring in ${diffDays} Day${diffDays > 1 ? 's' : ''}!`,
            message: `Your ${sub.plan_name} expires on ${sub.end_date}. Renew with the library desk to keep your reserved desk!`,
            type: 'subscription_expiry',
            is_read: false,
            link: '/student/dashboard',
            created_at: new Date().toISOString(),
          });
        }
      } else if (diffDays <= 0) {
        const expiredNotifExists = this.notifications.some(
          (n) => n.user_id === sub.student_id && n.type === 'subscription_expiry' && n.title.includes('Expired')
        );

        if (!expiredNotifExists) {
          this.notifications.unshift({
            id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            user_id: sub.student_id,
            title: '🔴 Membership Expired',
            message: `Your ${sub.plan_name} has expired. Your desk allocation is now subject to reallocation.`,
            type: 'subscription_expiry',
            is_read: false,
            link: '/student/dashboard',
            created_at: new Date().toISOString(),
          });
        }
      }
    });
  }

  // --- Chat Messaging APIs ---
  async getMessages(otherUserId: string, currentUserId: string): Promise<ChatMessage[]> {
    await new Promise((r) => setTimeout(r, 80));
    const defaultAdminId = 'a0000000-0000-0000-0000-000000000001';
    const currentUser = this.profiles.find((p) => p.id === currentUserId);
    const otherUser = this.profiles.find((p) => p.id === otherUserId);
    const isAdminView =
      currentUser?.role === 'admin' ||
      currentUserId === defaultAdminId ||
      otherUser?.role === 'student' ||
      (!currentUser && otherUserId !== defaultAdminId);

    const conversation = this.messages
      .filter((m) => {
        if (
          (m.sender_id === currentUserId && m.receiver_id === otherUserId) ||
          (m.sender_id === otherUserId && m.receiver_id === currentUserId)
        ) {
          return true;
        }
        if (isAdminView) {
          return (
            (m.sender_id === defaultAdminId && m.receiver_id === otherUserId) ||
            (m.sender_id === otherUserId && m.receiver_id === defaultAdminId)
          );
        }
        return false;
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((m) => ({
        ...m,
        sender:
          this.profiles.find((p) => p.id === m.sender_id) ||
          (m.sender_id === currentUserId ? currentUser : undefined),
        receiver:
          this.profiles.find((p) => p.id === m.receiver_id) ||
          (m.receiver_id === currentUserId ? currentUser : undefined),
      }));

    return conversation;
  }

  async sendMessage(senderId: string, receiverId: string, message: string): Promise<ChatMessage> {
    await new Promise((r) => setTimeout(r, 100));
    const sender = this.profiles.find((p) => p.id === senderId);
    const receiver = this.profiles.find((p) => p.id === receiverId);

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sender_id: senderId,
      receiver_id: receiverId,
      message: message.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
      sender: sender || ({ id: senderId, full_name: 'Library Admin', email: 'admin@library.com', role: 'admin' } as any),
      receiver: receiver || ({ id: receiverId, full_name: 'Student', email: '', role: 'student' } as any),
    };

    this.messages.push(newMsg);

    // Also trigger in-app notification to receiver
    this.notifications.unshift({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      user_id: receiverId,
      title: `💬 New message from ${sender?.full_name || 'Library Support'}`,
      message: message.length > 50 ? `${message.substring(0, 50)}...` : message,
      type: 'chat_message',
      is_read: false,
      link: sender?.role === 'admin' ? '/student/chat' : `/admin/messages?student=${senderId}`,
      created_at: new Date().toISOString(),
    });

    this.persist();
    return newMsg;
  }

  async markMessagesRead(senderId: string, receiverId: string): Promise<void> {
    let changed = false;
    const defaultAdminId = 'a0000000-0000-0000-0000-000000000001';
    this.messages.forEach((m) => {
      const matchReceiver = m.receiver_id === receiverId || (receiverId !== defaultAdminId && m.receiver_id === defaultAdminId);
      const matchSender = m.sender_id === senderId || (senderId !== defaultAdminId && m.sender_id === defaultAdminId);
      if ((m.sender_id === senderId && matchReceiver) || (matchSender && m.receiver_id === receiverId)) {
        if (!m.is_read) {
          m.is_read = true;
          changed = true;
        }
      }
    });
    if (changed) this.persist();
  }

  async getConversations(adminId: string): Promise<any[]> {
    await new Promise((r) => setTimeout(r, 100));
    const students = this.profiles.filter((p) => p.role === 'student');
    const defaultAdminId = 'a0000000-0000-0000-0000-000000000001';

    return students.map((student) => {
      const msgs = this.messages.filter(
        (m) =>
          (m.sender_id === student.id && (m.receiver_id === adminId || m.receiver_id === defaultAdminId)) ||
          ((m.sender_id === adminId || m.sender_id === defaultAdminId) && m.receiver_id === student.id)
      );

      msgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const lastMessage = msgs[0] || null;
      const unreadCount = msgs.filter((m) => m.sender_id === student.id && !m.is_read).length;

      return {
        student,
        lastMessage,
        unreadCount,
      };
    });
  }

  // --- Subscriptions APIs ---
  async getSubscriptions(filters?: { status?: string; search?: string }): Promise<StudentSubscription[]> {
    await new Promise((r) => setTimeout(r, 100));
    this.checkAndGenerateExpiryNotifications();

    let list = this.subscriptions.map((sub) => {
      const student = this.profiles.find((p) => p.id === sub.student_id);
      const diffDays = Math.ceil((new Date(sub.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return {
        ...sub,
        days_remaining: diffDays,
        student,
      };
    });

    if (filters?.status && filters.status !== 'all') {
      list = list.filter((s) => s.status === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.student?.full_name.toLowerCase().includes(q) ||
          s.student?.student_id?.toLowerCase().includes(q) ||
          s.plan_name.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime());
  }

  async getStudentSubscription(studentId: string): Promise<StudentSubscription | null> {
    await new Promise((r) => setTimeout(r, 100));
    this.checkAndGenerateExpiryNotifications(studentId);

    const sub = this.subscriptions.find((s) => s.student_id === studentId);
    if (!sub) return null;

    const student = this.profiles.find((p) => p.id === studentId);
    const diffDays = Math.ceil((new Date(sub.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return {
      ...sub,
      days_remaining: diffDays,
      student,
    };
  }

  async createSubscription(data: Partial<StudentSubscription>): Promise<StudentSubscription> {
    await new Promise((r) => setTimeout(r, 150));
    const newSub: StudentSubscription = {
      id: `sub_${Date.now()}`,
      student_id: data.student_id!,
      plan_name: data.plan_name || 'Monthly Study Pass',
      amount_paid: Number(data.amount_paid) || 999,
      start_date: data.start_date || new Date().toISOString().slice(0, 10),
      end_date: data.end_date || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      status: 'active',
      auto_renew: data.auto_renew ?? true,
      created_at: new Date().toISOString(),
    };

    this.subscriptions = this.subscriptions.filter((s) => s.student_id !== data.student_id);
    this.subscriptions.push(newSub);
    this.persist();
    return newSub;
  }

  async renewSubscription(subscriptionId: string, durationDays: number = 30, amountPaid: number = 999): Promise<StudentSubscription> {
    await new Promise((r) => setTimeout(r, 150));
    const sub = this.subscriptions.find((s) => s.id === subscriptionId);
    if (!sub) throw new Error('Subscription not found');

    const currentEnd = new Date(sub.end_date).getTime();
    const baseTime = currentEnd > Date.now() ? currentEnd : Date.now();
    const newEnd = new Date(baseTime + durationDays * 86400000);

    sub.end_date = newEnd.toISOString().slice(0, 10);
    sub.amount_paid += amountPaid;
    sub.status = 'active';
    sub.updated_at = new Date().toISOString();

    this.notifications = this.notifications.filter(
      (n) => !(n.user_id === sub.student_id && n.type === 'subscription_expiry')
    );

    this.notifications.unshift({
      id: `notif_${Date.now()}`,
      user_id: sub.student_id,
      title: '🎉 Subscription Renewed',
      message: `Your ${sub.plan_name} has been extended until ${sub.end_date}. Thank you!`,
      type: 'system',
      is_read: false,
      link: '/student/dashboard',
      created_at: new Date().toISOString(),
    });

    this.persist();
    return sub;
  }

  // --- Notifications APIs ---
  async getNotifications(userId: string): Promise<AppNotification[]> {
    await new Promise((r) => setTimeout(r, 50));
    this.checkAndGenerateExpiryNotifications(userId);
    return this.notifications
      .filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    const notif = this.notifications.find((n) => n.id === notificationId);
    if (notif) {
      notif.is_read = true;
      this.persist();
    }
  }

  async clearAllNotifications(userId: string): Promise<void> {
    this.notifications = this.notifications.filter((n) => n.user_id !== userId);
    this.persist();
  }

  // --- Demo Booking APIs ---
  async getDemoBookings(): Promise<DemoBooking[]> {
    await new Promise((r) => setTimeout(r, 100));
    return [...this.demoBookings].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async bookDemo(formData: DemoBookingFormData): Promise<DemoBooking> {
    await new Promise((r) => setTimeout(r, 200));
    const newBooking: DemoBooking = {
      id: `demo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      full_name: formData.full_name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      organization_name: formData.organization_name.trim(),
      role: formData.role || 'Library Owner',
      seat_capacity: formData.seat_capacity || '50 - 150 Seats',
      preferred_date: formData.preferred_date,
      preferred_time: formData.preferred_time,
      features_of_interest: formData.features_of_interest || [],
      notes: formData.notes?.trim() || '',
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    this.demoBookings.unshift(newBooking);

    // Also push a live notification to the Admin!
    const adminNotification: AppNotification = {
      id: `notif_admin_demo_${Date.now()}`,
      user_id: 'a0000000-0000-0000-0000-000000000001',
      title: `📅 New Demo Request: ${newBooking.full_name}`,
      message: `${newBooking.organization_name} (${newBooking.seat_capacity}) booked a walkthrough for ${newBooking.preferred_date} at ${newBooking.preferred_time}.`,
      type: 'demo_booking',
      is_read: false,
      link: '/admin/dashboard',
      created_at: new Date().toISOString(),
    };
    this.notifications.unshift(adminNotification);

    this.persist();
    return newBooking;
  }

  async updateDemoBookingStatus(id: string, status: DemoBookingStatus): Promise<void> {
    await new Promise((r) => setTimeout(r, 100));
    const booking = this.demoBookings.find((b) => b.id === id);
    if (!booking) throw new Error('Demo booking not found.');
    booking.status = status;
    this.persist();
  }

  // Reset to initial seed
  resetToSeed() {
    this.profiles = [...SEED_PROFILES];
    this.seats = [...SEED_SEATS];
    this.assignments = [...SEED_ASSIGNMENTS];
    this.messages = [...SEED_MESSAGES];
    this.subscriptions = [...SEED_SUBSCRIPTIONS];
    this.notifications = [...SEED_NOTIFICATIONS];
    this.demoBookings = [...SEED_DEMO_BOOKINGS];
    this.currentUser = null;
    this.persist();
  }
}


export const mockStore = new MockDataStore();
