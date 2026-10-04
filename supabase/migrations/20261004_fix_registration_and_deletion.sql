-- ============================================================================
-- FULL FIX: REGISTRATION, DELETION, ORPHAN PURGE & NOTIFICATION ENGINE (V4)
-- Run this in the Supabase Dashboard SQL Editor
-- ============================================================================

-- 1. DROP OLD PROBLEMATIC TRIGGERS ON auth.users
DROP TRIGGER IF EXISTS tr_auth_user_sync_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. CREATE ROBUST, SAFE PROFILE SYNC TRIGGER FOR NEW SIGNUPS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.profiles (
        auth_user_id,
        role,
        full_name,
        email,
        phone,
        student_id,
        date_of_birth,
        address,
        emergency_contact,
        status
    ) VALUES (
        NEW.id,
        CASE 
            WHEN LOWER(NEW.email) = 'admin@library.com' OR (NEW.raw_user_meta_data->>'role') = 'admin' 
            THEN 'admin'::public.user_role 
            ELSE 'student'::public.user_role 
        END,
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1)),
        NEW.email,
        NULLIF(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'student_id', ''), 'STU' || floor(random() * 900000 + 100000)::text),
        NULLIF(NEW.raw_user_meta_data->>'date_of_birth', '')::date,
        NULLIF(NEW.raw_user_meta_data->>'address', ''),
        NULLIF(NEW.raw_user_meta_data->>'emergency_contact', ''),
        'active'::public.account_status
    )
    ON CONFLICT (email) DO UPDATE SET
        auth_user_id = EXCLUDED.auth_user_id,
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        updated_at = now();

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 3. ENSURE SUBSCRIPTIONS TABLE EXISTS WITH RLS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL DEFAULT 'Standard Plan',
    amount_paid NUMERIC NOT NULL DEFAULT 0,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    status TEXT NOT NULL DEFAULT 'active',
    auto_renew BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Students can view own subscription" ON public.subscriptions;
    DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Students can view own subscription" ON public.subscriptions
    FOR SELECT USING (
        student_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR
        public.is_admin()
    );

CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions
    FOR ALL USING (public.is_admin());

-- 4. ENSURE NOTIFICATIONS TABLE EXISTS WITH COMPLETE RLS & REALTIME
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system',
    is_read BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'notifications' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (
        user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR
        public.is_admin()
    );

CREATE POLICY "Users and admins can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL OR public.is_admin()
    );

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (
        user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR
        public.is_admin()
    );

CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (
        user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR
        public.is_admin()
    );

-- Enable Realtime publication on notifications
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 5. AUTOMATED NOTIFICATION TRIGGERS
-- A. Trigger when a chat message is sent
CREATE OR REPLACE FUNCTION public.tr_notify_on_new_message()
RETURNS trigger
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
    v_sender_name TEXT;
    v_sender_role public.user_role;
    v_target_user_id UUID;
    admin_rec RECORD;
BEGIN
    SELECT full_name, role INTO v_sender_name, v_sender_role 
    FROM public.profiles 
    WHERE id = NEW.sender_id;

    IF v_sender_role = 'student' THEN
        FOR admin_rec IN SELECT id FROM public.profiles WHERE role = 'admin'::public.user_role LOOP
            INSERT INTO public.notifications (user_id, title, message, type, link)
            VALUES (
                admin_rec.id,
                'New Message from ' || COALESCE(v_sender_name, 'Student'),
                substring(NEW.message from 1 for 120),
                'chat_message',
                '/admin/messages'
            );
        END LOOP;
    ELSE
        SELECT student_id INTO v_target_user_id 
        FROM public.conversations 
        WHERE id = NEW.conversation_id;

        IF v_target_user_id IS NOT NULL THEN
            INSERT INTO public.notifications (user_id, title, message, type, link)
            VALUES (
                v_target_user_id,
                'Helpdesk Reply from ' || COALESCE(v_sender_name, 'Admin'),
                substring(NEW.message from 1 for 120),
                'chat_message',
                '/student/chat'
            );
        END IF;
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_messages_notify ON public.messages;
CREATE TRIGGER tr_messages_notify
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.tr_notify_on_new_message();

-- B. Trigger when a seat is allocated or released
CREATE OR REPLACE FUNCTION public.tr_notify_on_seat_assignment()
RETURNS trigger
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
    v_seat_number TEXT;
BEGIN
    SELECT seat_number INTO v_seat_number FROM public.seats WHERE id = NEW.seat_id;

    IF TG_OP = 'INSERT' AND NEW.status = 'active'::public.assignment_status THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            NEW.student_id,
            'Seat Allocated 🎉',
            'Seat ' || COALESCE(v_seat_number, '') || ' has been allocated to you. View your digital pass on dashboard.',
            'seat_allocated',
            '/student/dashboard'
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'active'::public.assignment_status AND NEW.status = 'released'::public.assignment_status THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            NEW.student_id,
            'Seat Released',
            'Your allocation for Seat ' || COALESCE(v_seat_number, '') || ' has ended.',
            'seat_released',
            '/student/dashboard'
        );
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_seat_assignments_notify ON public.seat_assignments;
CREATE TRIGGER tr_seat_assignments_notify
    AFTER INSERT OR UPDATE ON public.seat_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.tr_notify_on_seat_assignment();

-- C. Trigger when a new student registers (notifies admin)
CREATE OR REPLACE FUNCTION public.tr_notify_on_new_student()
RETURNS trigger
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
    admin_rec RECORD;
BEGIN
    IF NEW.role = 'student'::public.user_role THEN
        FOR admin_rec IN SELECT id FROM public.profiles WHERE role = 'admin'::public.user_role LOOP
            INSERT INTO public.notifications (user_id, title, message, type, link)
            VALUES (
                admin_rec.id,
                'New Student Registered',
                NEW.full_name || ' (' || NEW.email || ') joined the library system.',
                'system',
                '/admin/students'
            );
        END LOOP;
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_profiles_notify ON public.profiles;
CREATE TRIGGER tr_profiles_notify
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.tr_notify_on_new_student();

-- D. RPC to sync and generate contextual notifications (Welcome, Desk status, Expiring warnings)
CREATE OR REPLACE FUNCTION public.check_and_sync_notifications()
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_role public.user_role;
    v_count INT := 0;
    v_seat_number TEXT;
    v_days_left INT;
    v_end_date DATE;
    v_unread_chats INT;
BEGIN
    SELECT id, role INTO v_user_id, v_role 
    FROM public.profiles 
    WHERE auth_user_id = auth.uid();

    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Profile not found');
    END IF;

    IF v_role = 'student' THEN
        -- 1. Ensure welcome notification exists
        IF NOT EXISTS (SELECT 1 FROM public.notifications WHERE user_id = v_user_id AND type = 'system') THEN
            INSERT INTO public.notifications (user_id, title, message, type, link)
            VALUES (
                v_user_id,
                'Welcome to Central Study Centre! 📚',
                'Your student account is active. Check your digital seat pass and live helpdesk.',
                'system',
                '/student/dashboard'
            );
            v_count := v_count + 1;
        END IF;

        -- 2. Check allocated seat notification
        IF to_regclass('public.seat_assignments') IS NOT NULL AND to_regclass('public.seats') IS NOT NULL THEN
            SELECT s.seat_number INTO v_seat_number
            FROM public.seat_assignments sa
            JOIN public.seats s ON s.id = sa.seat_id
            WHERE sa.student_id = v_user_id AND sa.status = 'active'::public.assignment_status
            LIMIT 1;

            IF v_seat_number IS NOT NULL AND NOT EXISTS (
                SELECT 1 FROM public.notifications WHERE user_id = v_user_id AND type = 'seat_allocated'
            ) THEN
                INSERT INTO public.notifications (user_id, title, message, type, link)
                VALUES (
                    v_user_id,
                    'Active Desk Assigned: ' || v_seat_number,
                    'You have an allocated desk in the library. View your live pass on dashboard.',
                    'seat_allocated',
                    '/student/dashboard'
                );
                v_count := v_count + 1;
            END IF;
        END IF;

        -- 3. Check expiring subscription (within 5 days)
        IF to_regclass('public.subscriptions') IS NOT NULL THEN
            SELECT (end_date - CURRENT_DATE), end_date INTO v_days_left, v_end_date
            FROM public.subscriptions
            WHERE student_id = v_user_id AND status = 'active'
            ORDER BY end_date ASC
            LIMIT 1;

            IF v_days_left IS NOT NULL AND v_days_left <= 5 AND NOT EXISTS (
                SELECT 1 FROM public.notifications 
                WHERE user_id = v_user_id AND type = 'subscription_expiry' AND created_at > (now() - INTERVAL '3 days')
            ) THEN
                INSERT INTO public.notifications (user_id, title, message, type, link)
                VALUES (
                    v_user_id,
                    'Subscription Expiring Soon',
                    'Your membership ends on ' || to_char(v_end_date, 'Mon DD, YYYY') || ' (' || v_days_left || ' days remaining). Contact admin to renew.',
                    'subscription_expiry',
                    '/student/chat'
                );
                v_count := v_count + 1;
            END IF;
        END IF;

    ELSE
        -- Admin: Welcome / System Ready
        IF NOT EXISTS (SELECT 1 FROM public.notifications WHERE user_id = v_user_id AND type = 'system') THEN
            INSERT INTO public.notifications (user_id, title, message, type, link)
            VALUES (
                v_user_id,
                'LibraryMS Admin Console Ready',
                'Real-time seat monitoring, student records, and instant helpdesk chat are online.',
                'system',
                '/admin/dashboard'
            );
            v_count := v_count + 1;
        END IF;

        -- Check unread student messages
        IF to_regclass('public.conversations') IS NOT NULL THEN
            SELECT COALESCE(SUM(unread_by_admin), 0) INTO v_unread_chats
            FROM public.conversations;

            IF v_unread_chats > 0 AND NOT EXISTS (
                SELECT 1 FROM public.notifications 
                WHERE user_id = v_user_id AND type = 'chat_message' AND created_at > (now() - INTERVAL '1 hour')
            ) THEN
                INSERT INTO public.notifications (user_id, title, message, type, link)
                VALUES (
                    v_user_id,
                    'Unread Student Messages',
                    v_unread_chats || ' unread message(s) awaiting your response in Helpdesk & Chat.',
                    'chat_message',
                    '/admin/messages'
                );
                v_count := v_count + 1;
            END IF;
        END IF;
    END IF;

    RETURN json_build_object('success', true, 'synced_count', v_count);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CLEANLY RE-CREATE RLS POLICIES ON profiles (NO DUPLICATE ERRORS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
          AND LOWER(policyname) IN (
            'admins can delete profiles',
            'admins can delete any profile',
            'enable insert for user registration',
            'enable insert for authenticated users or service',
            'users can insert their own profile'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "Enable insert for user registration" ON public.profiles
    FOR INSERT WITH CHECK (
        auth.uid() = auth_user_id OR auth.uid() IS NULL OR public.is_admin()
    );

CREATE POLICY "Admins can delete profiles" ON public.profiles
    FOR DELETE USING (public.is_admin());

-- 7. SECURE TRANSACTIONAL FUNCTION TO DELETE STUDENT ACCOUNTS
CREATE OR REPLACE FUNCTION public.delete_student_account(p_student_id UUID)
RETURNS JSON AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_auth_user_id UUID;
    v_student_name TEXT;
    v_student_email TEXT;
BEGIN
    SELECT public.is_admin() INTO v_is_admin;
    IF NOT v_is_admin THEN
        RETURN json_build_object('success', false, 'error', 'Unauthorized: Caller is not an admin');
    END IF;

    SELECT auth_user_id, full_name, email INTO v_auth_user_id, v_student_name, v_student_email 
    FROM public.profiles 
    WHERE id = p_student_id;

    IF v_student_name IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Student profile not found');
    END IF;

    -- 1. Free any occupied seat currently assigned to this student
    IF to_regclass('public.seat_assignments') IS NOT NULL AND to_regclass('public.seats') IS NOT NULL THEN
        BEGIN
            UPDATE public.seats
            SET status = 'available'::public.seat_status,
                updated_at = now()
            WHERE id IN (
                SELECT seat_id FROM public.seat_assignments 
                WHERE student_id = p_student_id AND status = 'active'::public.assignment_status
            );
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;

    -- 2. Delete seat assignments
    IF to_regclass('public.seat_assignments') IS NOT NULL THEN
        BEGIN
            EXECUTE 'DELETE FROM public.seat_assignments WHERE student_id = $1' USING p_student_id;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;

    -- 3. Delete messages and conversations
    IF to_regclass('public.messages') IS NOT NULL THEN
        BEGIN
            EXECUTE 'DELETE FROM public.messages WHERE sender_id = $1 OR receiver_id = $1' USING p_student_id;
            IF to_regclass('public.conversations') IS NOT NULL THEN
                EXECUTE 'DELETE FROM public.messages WHERE conversation_id IN (SELECT id FROM public.conversations WHERE student_id = $1)' USING p_student_id;
            END IF;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;

    IF to_regclass('public.conversations') IS NOT NULL THEN
        BEGIN
            EXECUTE 'DELETE FROM public.conversations WHERE student_id = $1' USING p_student_id;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;

    -- 4. Delete subscriptions if table exists
    IF to_regclass('public.subscriptions') IS NOT NULL THEN
        BEGIN
            EXECUTE 'DELETE FROM public.subscriptions WHERE student_id = $1' USING p_student_id;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;

    -- 5. Delete notifications if table exists
    IF to_regclass('public.notifications') IS NOT NULL THEN
        BEGIN
            EXECUTE 'DELETE FROM public.notifications WHERE user_id = $1' USING p_student_id;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;

    -- 6. Delete audit logs if table exists
    IF to_regclass('public.audit_logs') IS NOT NULL THEN
        BEGIN
            EXECUTE 'DELETE FROM public.audit_logs WHERE entity_id = $1' USING p_student_id;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;

    -- 7. Delete profile
    DELETE FROM public.profiles WHERE id = p_student_id;

    -- 8. Delete auth user from auth.users (both by ID and by email)
    IF v_auth_user_id IS NOT NULL THEN
        BEGIN
            DELETE FROM auth.users WHERE id = v_auth_user_id;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;

    IF v_student_email IS NOT NULL AND LOWER(v_student_email) != 'admin@library.com' THEN
        BEGIN
            DELETE FROM auth.users WHERE LOWER(email) = LOWER(v_student_email);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;

    RETURN json_build_object('success', true, 'message', 'Student deleted successfully');
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. PURGE ORPHANED AUTH USERS FUNCTION
CREATE OR REPLACE FUNCTION public.purge_orphaned_auth_user(p_email TEXT)
RETURNS JSON AS $$
DECLARE
    v_profile_exists BOOLEAN;
    v_purged_count INT := 0;
BEGIN
    IF p_email IS NULL OR TRIM(p_email) = '' THEN
        RETURN json_build_object('success', false, 'error', 'Email is required');
    END IF;

    IF LOWER(TRIM(p_email)) = 'admin@library.com' THEN
        RETURN json_build_object('success', false, 'error', 'Cannot purge admin user');
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE LOWER(email) = LOWER(TRIM(p_email))
    ) INTO v_profile_exists;

    IF v_profile_exists THEN
        RETURN json_build_object('success', false, 'reason', 'profile_exists');
    END IF;

    WITH deleted AS (
        DELETE FROM auth.users 
        WHERE LOWER(email) = LOWER(TRIM(p_email))
          AND LOWER(email) != 'admin@library.com'
        RETURNING id
    )
    SELECT count(*) INTO v_purged_count FROM deleted;

    RETURN json_build_object('success', true, 'purged_count', v_purged_count);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. CLEAN UP ALL EXISTING ORPHANED AUTH USERS IMMEDIATELY
DELETE FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.auth_user_id = u.id OR LOWER(p.email) = LOWER(u.email)
)
AND LOWER(u.email) != 'admin@library.com'
AND COALESCE(u.raw_user_meta_data->>'role', '') != 'admin';
