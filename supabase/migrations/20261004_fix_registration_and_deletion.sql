-- ============================================================================
-- FIX STUDENT REGISTRATION & DELETION PIPELINE (V2)
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

-- 3. ENSURE SUBSCRIPTIONS & NOTIFICATIONS TABLES EXIST
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

DROP POLICY IF EXISTS "Students can view own subscription" ON public.subscriptions;
CREATE POLICY "Students can view own subscription" ON public.subscriptions
    FOR SELECT USING (
        student_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR
        public.is_admin()
    );

DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions
    FOR ALL USING (public.is_admin());

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

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (
        user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR
        public.is_admin()
    );

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (
        user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR
        public.is_admin()
    );

-- 4. ENSURE RLS POLICIES ON profiles ALLOW PROPER INSERT & DELETE
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can DELETE profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for user registration" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users or service" ON public.profiles;
DROP POLICY IF EXISTS "Users can INSERT their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Enable insert for user registration" ON public.profiles
    FOR INSERT WITH CHECK (
        auth.uid() = auth_user_id OR auth.uid() IS NULL OR public.is_admin()
    );

CREATE POLICY "Admins can delete profiles" ON public.profiles
    FOR DELETE USING (public.is_admin());

-- 5. SECURE TRANSACTIONAL FUNCTION TO DELETE STUDENT ACCOUNTS
-- Defensively handles all related tables via dynamic SQL so missing tables never cause errors
CREATE OR REPLACE FUNCTION public.delete_student_account(p_student_id UUID)
RETURNS JSON AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_auth_user_id UUID;
    v_student_name TEXT;
BEGIN
    -- Verify caller is admin
    SELECT public.is_admin() INTO v_is_admin;
    IF NOT v_is_admin THEN
        RETURN json_build_object('success', false, 'error', 'Unauthorized: Caller is not an admin');
    END IF;

    -- Get student info
    SELECT auth_user_id, full_name INTO v_auth_user_id, v_student_name 
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
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;

    -- 2. Delete seat assignments
    IF to_regclass('public.seat_assignments') IS NOT NULL THEN
        BEGIN
            EXECUTE 'DELETE FROM public.seat_assignments WHERE student_id = $1' USING p_student_id;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;

    -- 3. Delete messages and conversations
    IF to_regclass('public.messages') IS NOT NULL THEN
        BEGIN
            EXECUTE 'DELETE FROM public.messages WHERE sender_id = $1 OR receiver_id = $1' USING p_student_id;
            IF to_regclass('public.conversations') IS NOT NULL THEN
                EXECUTE 'DELETE FROM public.messages WHERE conversation_id IN (SELECT id FROM public.conversations WHERE student_id = $1)' USING p_student_id;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;

    IF to_regclass('public.conversations') IS NOT NULL THEN
        BEGIN
            EXECUTE 'DELETE FROM public.conversations WHERE student_id = $1' USING p_student_id;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;

    -- 4. Delete subscriptions if table exists
    IF to_regclass('public.subscriptions') IS NOT NULL THEN
        BEGIN
            EXECUTE 'DELETE FROM public.subscriptions WHERE student_id = $1' USING p_student_id;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;

    -- 5. Delete notifications if table exists
    IF to_regclass('public.notifications') IS NOT NULL THEN
        BEGIN
            EXECUTE 'DELETE FROM public.notifications WHERE user_id = $1' USING p_student_id;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;

    -- 6. Delete audit logs if table exists
    IF to_regclass('public.audit_logs') IS NOT NULL THEN
        BEGIN
            EXECUTE 'DELETE FROM public.audit_logs WHERE entity_id = $1' USING p_student_id;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;

    -- 7. Delete profile
    DELETE FROM public.profiles WHERE id = p_student_id;

    -- 8. Delete auth user from auth.users if linked
    IF v_auth_user_id IS NOT NULL THEN
        BEGIN
            DELETE FROM auth.users WHERE id = v_auth_user_id;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;

    RETURN json_build_object('success', true, 'message', 'Student deleted successfully');
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
