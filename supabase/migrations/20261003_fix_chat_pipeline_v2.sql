-- ============================================================================
-- FIX CHAT PIPELINE V2: REMOVE AUTH.USERS REFERENCES IN RLS & AUTO-RESOLVE STUDENT
-- Run this in the Supabase Dashboard SQL Editor
-- ============================================================================

-- 1. Streamlined is_admin() relying directly on profiles (where auth_user_id = auth.uid())
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE auth_user_id = auth.uid() AND role = 'admin'::user_role
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Clean RLS Policies for conversations (NO direct queries to auth.users in RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can access their own conversation" ON public.conversations;
DROP POLICY IF EXISTS "Admins can access all conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;

CREATE POLICY "Students can access their own conversation" ON public.conversations
    FOR SELECT USING (
        student_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Admins can access all conversations" ON public.conversations
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can insert conversations" ON public.conversations
    FOR INSERT WITH CHECK (
        student_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) 
        OR public.is_admin()
    );

CREATE POLICY "Users can update their conversations" ON public.conversations
    FOR UPDATE USING (
        student_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) 
        OR public.is_admin()
    );

-- 3. Clean RLS Policies for messages (NO direct queries to auth.users in RLS)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own sent or received messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update is_read on received messages" ON public.messages;
DROP POLICY IF EXISTS "Users can access messages for their conversations" ON public.messages;
DROP POLICY IF EXISTS "Admins can access all messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages" ON public.messages;

CREATE POLICY "Users can access messages for their conversations" ON public.messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM public.conversations 
            WHERE student_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
        ) 
        OR public.is_admin()
    );

CREATE POLICY "Users can insert messages" ON public.messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM public.conversations 
            WHERE student_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
        ) 
        OR public.is_admin()
    );

CREATE POLICY "Users can update messages" ON public.messages
    FOR UPDATE USING (
        conversation_id IN (
            SELECT id FROM public.conversations 
            WHERE student_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
        ) 
        OR public.is_admin()
    );

-- 4. Secure & Foolproof send_chat_message RPC
-- Automatically maps student callers to their own profile, preventing foreign key violations
CREATE OR REPLACE FUNCTION public.send_chat_message(p_student_id UUID, p_message TEXT)
RETURNS JSON AS $$
DECLARE
    v_sender_id UUID;
    v_sender_role user_role;
    v_conversation_id UUID;
    v_message_id UUID;
    v_target_student_id UUID;
BEGIN
    -- Resolve authenticated sender profile
    SELECT id, role INTO v_sender_id, v_sender_role 
    FROM public.profiles 
    WHERE auth_user_id = auth.uid();

    IF v_sender_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Profile not found for authenticated user');
    END IF;

    -- If caller is student, target conversation is ALWAYS their own profile
    -- (Frontend cannot spoof or pass invalid student IDs)
    IF v_sender_role = 'student' THEN
        v_target_student_id := v_sender_id;
    ELSE
        -- Caller is admin: target conversation is the student specified
        v_target_student_id := p_student_id;
    END IF;

    IF v_target_student_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Target student ID is required');
    END IF;

    -- Verify that target student exists in profiles
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_target_student_id) THEN
        RETURN json_build_object('success', false, 'error', 'Student profile not found in library database');
    END IF;

    -- Get or create the unique Helpdesk conversation for this student
    SELECT id INTO v_conversation_id FROM public.conversations WHERE student_id = v_target_student_id;
    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (student_id, last_message_at, unread_by_student, unread_by_admin)
        VALUES (v_target_student_id, now(), 0, 0)
        ON CONFLICT (student_id) DO UPDATE SET updated_at = now()
        RETURNING id INTO v_conversation_id;
    END IF;

    -- Insert message
    INSERT INTO public.messages (conversation_id, sender_id, message, created_at, is_read)
    VALUES (v_conversation_id, v_sender_id, p_message, now(), false)
    RETURNING id INTO v_message_id;

    -- Update conversation metadata
    UPDATE public.conversations SET 
        last_message_at = now(),
        updated_at = now(),
        unread_by_admin = CASE WHEN v_sender_role = 'student' THEN unread_by_admin + 1 ELSE unread_by_admin END,
        unread_by_student = CASE WHEN v_sender_role = 'admin' THEN unread_by_student + 1 ELSE unread_by_student END
    WHERE id = v_conversation_id;

    RETURN json_build_object(
        'success', true, 
        'message_id', v_message_id, 
        'conversation_id', v_conversation_id,
        'sender_id', v_sender_id,
        'created_at', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
