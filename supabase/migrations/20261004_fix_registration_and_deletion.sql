-- ============================================================================
-- FIX STUDENT REGISTRATION & DELETION PIPELINE
-- Run this in the Supabase Dashboard SQL Editor
-- ============================================================================

-- 1. DROP OLD PROBLEMATIC TRIGGERS ON auth.users
DROP TRIGGER IF EXISTS tr_auth_user_sync_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. CREATE ROBUST, SAFE PROFILE SYNC TRIGGER FOR NEW SIGNUPS
-- Ensures auth.users insert NEVER fails (using EXCEPTION handler & public search_path)
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
    -- Log warning and do not abort user creation
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 3. ENSURE RLS POLICIES ON profiles ALLOW PROPER INSERT & DELETE
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can INSERT their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users or service" ON public.profiles;
DROP POLICY IF EXISTS "Admins can DELETE profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;

-- Allow user/anon self-registration insert
CREATE POLICY "Enable insert for user registration" ON public.profiles
    FOR INSERT WITH CHECK (
        auth.uid() = auth_user_id OR auth.uid() IS NULL OR public.is_admin()
    );

-- Allow admins to DELETE student profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
    FOR DELETE USING (public.is_admin());

-- 4. SECURE TRANSACTIONAL FUNCTION TO DELETE STUDENT ACCOUNTS
-- Handles seat unassignment, conversations, messages, audit logs, and auth.users cleanly
CREATE OR REPLACE FUNCTION public.delete_student_account(p_student_id UUID)
RETURNS JSON AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_auth_user_id UUID;
    v_student_name TEXT;
    v_assigned_seat_id UUID;
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
    SELECT seat_id INTO v_assigned_seat_id 
    FROM public.seat_assignments 
    WHERE student_id = p_student_id AND status = 'active'::public.assignment_status 
    LIMIT 1;

    IF v_assigned_seat_id IS NOT NULL THEN
        UPDATE public.seats
        SET status = 'available'::public.seat_status,
            updated_at = now()
        WHERE id = v_assigned_seat_id;
    END IF;

    -- 2. Delete seat assignments
    DELETE FROM public.seat_assignments WHERE student_id = p_student_id;

    -- 3. Delete conversations and messages
    DELETE FROM public.messages WHERE conversation_id IN (SELECT id FROM public.conversations WHERE student_id = p_student_id);
    DELETE FROM public.messages WHERE sender_id = p_student_id OR receiver_id = p_student_id;
    DELETE FROM public.conversations WHERE student_id = p_student_id;

    -- 4. Delete subscriptions
    DELETE FROM public.subscriptions WHERE student_id = p_student_id;

    -- 5. Delete audit logs where entity_id = student_id
    DELETE FROM public.audit_logs WHERE entity_id = p_student_id;

    -- 6. Delete profile
    DELETE FROM public.profiles WHERE id = p_student_id;

    -- 7. Delete auth user from auth.users if linked
    IF v_auth_user_id IS NOT NULL THEN
        DELETE FROM auth.users WHERE id = v_auth_user_id;
    END IF;

    RETURN json_build_object('success', true, 'message', 'Student deleted successfully');
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
