-- Migration for Student Library Management System

-- 1. Custom Types/Enums
CREATE TYPE user_role AS ENUM ('student', 'admin');
CREATE TYPE account_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE seat_status AS ENUM ('available', 'occupied', 'maintenance', 'disabled');
CREATE TYPE assignment_status AS ENUM ('active', 'released');

-- 2. Tables

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    role user_role NOT NULL DEFAULT 'student',
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    student_id TEXT UNIQUE,
    date_of_birth DATE,
    address TEXT,
    emergency_contact TEXT,
    profile_image_url TEXT,
    status account_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seat_number TEXT NOT NULL UNIQUE,
    floor TEXT,
    section TEXT,
    row_number INTEGER,
    column_number INTEGER,
    status seat_status NOT NULL DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE seat_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ DEFAULT now(),
    released_at TIMESTAMPTZ,
    status assignment_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes
CREATE INDEX idx_profiles_auth_user_id ON profiles(auth_user_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_student_id ON profiles(student_id);

CREATE INDEX idx_seats_seat_number ON seats(seat_number);
CREATE INDEX idx_seats_status ON seats(status);
CREATE INDEX idx_seats_section ON seats(section);

CREATE INDEX idx_seat_assignments_student_id ON seat_assignments(student_id);
CREATE INDEX idx_seat_assignments_seat_id ON seat_assignments(seat_id);
CREATE INDEX idx_seat_assignments_status ON seat_assignments(status);

-- Partial unique index: Only ONE active assignment per student
CREATE UNIQUE INDEX idx_unique_active_student_assignment ON seat_assignments (student_id) WHERE status = 'active';

-- Partial unique index: Only ONE active assignment per seat
CREATE UNIQUE INDEX idx_unique_active_seat_assignment ON seat_assignments (seat_id) WHERE status = 'active';

-- 4. Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seats_updated_at
    BEFORE UPDATE ON seats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seat_assignments_updated_at
    BEFORE UPDATE ON seat_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Auth trigger
-- Note: NO auth trigger is created for auto-creating profiles. Application will handle during registration.

-- 6. Helper functions for RLS
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE auth_user_id = auth.uid() AND role = 'admin'::user_role
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- profiles policies:
CREATE POLICY "Students can SELECT their own profile" ON profiles
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Students can UPDATE their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Admins can SELECT all profiles" ON profiles
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can INSERT new profiles" ON profiles
    FOR INSERT WITH CHECK (is_admin());

-- Allow users to insert their own profile during self-registration
CREATE POLICY "Users can INSERT their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Admins can UPDATE any profile" ON profiles
    FOR UPDATE USING (is_admin());

-- seats policies:
CREATE POLICY "Students can SELECT seats" ON seats
    FOR SELECT USING (true);

CREATE POLICY "Admins can SELECT seats" ON seats
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can INSERT seats" ON seats
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can UPDATE seats" ON seats
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can DELETE seats" ON seats
    FOR DELETE USING (is_admin());

-- seat_assignments policies:
CREATE POLICY "Students can SELECT their own assignments" ON seat_assignments
    FOR SELECT USING (student_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins can ALL on assignments" ON seat_assignments
    FOR ALL USING (is_admin());

-- audit_logs policies:
CREATE POLICY "Admins can SELECT audit_logs" ON audit_logs
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can INSERT audit_logs" ON audit_logs
    FOR INSERT WITH CHECK (is_admin());


-- 7. RPC Functions
CREATE OR REPLACE FUNCTION assign_seat(p_student_id UUID, p_seat_id UUID, p_admin_id UUID)
RETURNS JSON AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_student_active BOOLEAN;
    v_seat_available BOOLEAN;
    v_student_has_active BOOLEAN;
    v_seat_has_active BOOLEAN;
BEGIN
    -- Verify caller is admin
    SELECT is_admin() INTO v_is_admin;
    IF NOT v_is_admin THEN
        RETURN json_build_object('success', false, 'error', 'Unauthorized: Caller is not an admin');
    END IF;

    -- Verify student exists and is active
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = p_student_id AND role = 'student' AND status = 'active') INTO v_student_active;
    IF NOT v_student_active THEN
        RETURN json_build_object('success', false, 'error', 'Student not found or inactive');
    END IF;

    -- Verify seat exists and is available
    SELECT EXISTS (SELECT 1 FROM seats WHERE id = p_seat_id AND status = 'available') INTO v_seat_available;
    IF NOT v_seat_available THEN
        RETURN json_build_object('success', false, 'error', 'Seat not found or unavailable');
    END IF;

    -- Verify student doesn't already have an active assignment
    SELECT EXISTS (SELECT 1 FROM seat_assignments WHERE student_id = p_student_id AND status = 'active') INTO v_student_has_active;
    IF v_student_has_active THEN
        RETURN json_build_object('success', false, 'error', 'Student already has an active assignment');
    END IF;

    -- Verify seat doesn't already have an active assignment
    SELECT EXISTS (SELECT 1 FROM seat_assignments WHERE seat_id = p_seat_id AND status = 'active') INTO v_seat_has_active;
    IF v_seat_has_active THEN
        RETURN json_build_object('success', false, 'error', 'Seat already has an active assignment');
    END IF;

    -- Create seat_assignment with status 'active'
    INSERT INTO seat_assignments (student_id, seat_id, assigned_by, status)
    VALUES (p_student_id, p_seat_id, p_admin_id, 'active');

    -- Update seat status to 'occupied'
    UPDATE seats SET status = 'occupied' WHERE id = p_seat_id;

    RETURN json_build_object('success', true, 'message', 'Seat assigned successfully');
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION change_seat(p_student_id UUID, p_new_seat_id UUID, p_admin_id UUID)
RETURNS JSON AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_active_assignment_id UUID;
    v_old_seat_id UUID;
    v_seat_available BOOLEAN;
    v_seat_has_active BOOLEAN;
BEGIN
    -- Verify caller is admin
    SELECT is_admin() INTO v_is_admin;
    IF NOT v_is_admin THEN
        RETURN json_build_object('success', false, 'error', 'Unauthorized: Caller is not an admin');
    END IF;

    -- Find current active assignment for student
    SELECT id, seat_id INTO v_active_assignment_id, v_old_seat_id FROM seat_assignments 
    WHERE student_id = p_student_id AND status = 'active';
    
    IF v_active_assignment_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Student has no active assignment to change');
    END IF;

    -- Verify new seat exists and is available
    SELECT EXISTS (SELECT 1 FROM seats WHERE id = p_new_seat_id AND status = 'available') INTO v_seat_available;
    IF NOT v_seat_available THEN
        RETURN json_build_object('success', false, 'error', 'New seat not found or unavailable');
    END IF;
    
    -- Verify seat doesn't already have an active assignment
    SELECT EXISTS (SELECT 1 FROM seat_assignments WHERE seat_id = p_new_seat_id AND status = 'active') INTO v_seat_has_active;
    IF v_seat_has_active THEN
        RETURN json_build_object('success', false, 'error', 'New seat already has an active assignment');
    END IF;

    -- Release old assignment
    UPDATE seat_assignments 
    SET status = 'released', released_at = now() 
    WHERE id = v_active_assignment_id;

    -- Mark old seat as 'available'
    UPDATE seats SET status = 'available' WHERE id = v_old_seat_id;

    -- Create new assignment
    INSERT INTO seat_assignments (student_id, seat_id, assigned_by, status)
    VALUES (p_student_id, p_new_seat_id, p_admin_id, 'active');

    -- Mark new seat as 'occupied'
    UPDATE seats SET status = 'occupied' WHERE id = p_new_seat_id;

    RETURN json_build_object('success', true, 'message', 'Seat changed successfully');
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION release_seat(p_assignment_id UUID, p_admin_id UUID)
RETURNS JSON AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_seat_id UUID;
    v_assignment_status assignment_status;
BEGIN
    -- Verify caller is admin
    SELECT is_admin() INTO v_is_admin;
    IF NOT v_is_admin THEN
        RETURN json_build_object('success', false, 'error', 'Unauthorized: Caller is not an admin');
    END IF;

    -- Find active assignment
    SELECT seat_id, status INTO v_seat_id, v_assignment_status 
    FROM seat_assignments WHERE id = p_assignment_id;

    IF v_seat_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Assignment not found');
    END IF;
    
    IF v_assignment_status != 'active' THEN
        RETURN json_build_object('success', false, 'error', 'Assignment is already released');
    END IF;

    -- Set assignment status to 'released'
    UPDATE seat_assignments 
    SET status = 'released', released_at = now() 
    WHERE id = p_assignment_id;

    -- Mark seat as 'available'
    UPDATE seats SET status = 'available' WHERE id = v_seat_id;

    RETURN json_build_object('success', true, 'message', 'Seat released successfully');
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_total_students INT;
    v_active_students INT;
    v_total_seats INT;
    v_occupied_seats INT;
    v_available_seats INT;
    v_maintenance_seats INT;
    v_occupancy_rate NUMERIC;
BEGIN
    -- Verify caller is admin
    SELECT is_admin() INTO v_is_admin;
    IF NOT v_is_admin THEN
        RETURN json_build_object('success', false, 'error', 'Unauthorized: Caller is not an admin');
    END IF;

    SELECT COUNT(*) INTO v_total_students FROM profiles WHERE role = 'student';
    SELECT COUNT(*) INTO v_active_students FROM profiles WHERE role = 'student' AND status = 'active';
    
    SELECT COUNT(*) INTO v_total_seats FROM seats;
    SELECT COUNT(*) INTO v_occupied_seats FROM seats WHERE status = 'occupied';
    SELECT COUNT(*) INTO v_available_seats FROM seats WHERE status = 'available';
    SELECT COUNT(*) INTO v_maintenance_seats FROM seats WHERE status = 'maintenance';

    IF v_total_seats > 0 THEN
        v_occupancy_rate := ROUND((v_occupied_seats::NUMERIC / v_total_seats::NUMERIC) * 100, 2);
    ELSE
        v_occupancy_rate := 0;
    END IF;

    RETURN json_build_object(
        'success', true,
        'data', json_build_object(
            'total_students', v_total_students,
            'active_students', v_active_students,
            'total_seats', v_total_seats,
            'occupied_seats', v_occupied_seats,
            'available_seats', v_available_seats,
            'maintenance_seats', v_maintenance_seats,
            'occupancy_rate', v_occupancy_rate
        )
    );
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==============================================================================
-- 8. Chat Messages, Subscriptions & Notifications
-- ==============================================================================

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sent or received messages" ON messages
    FOR SELECT USING (
        sender_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
        receiver_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
        is_admin()
    );

CREATE POLICY "Users can insert messages" ON messages
    FOR INSERT WITH CHECK (
        sender_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
        is_admin()
    );

CREATE POLICY "Users can update is_read on received messages" ON messages
    FOR UPDATE USING (
        receiver_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
        is_admin()
    );

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    amount_paid NUMERIC NOT NULL DEFAULT 0,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    auto_renew BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_student_id ON subscriptions(student_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own subscription" ON subscriptions
    FOR SELECT USING (
        student_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
        is_admin()
    );

CREATE POLICY "Admins can manage all subscriptions" ON subscriptions
    FOR ALL USING (is_admin());

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system',
    is_read BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (
        user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
        is_admin()
    );

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (
        user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
        is_admin()
    );

