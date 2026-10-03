-- ============================================================================
-- COMPLETE HELPDESK CHAT PIPELINE FIX: RLS, PROFILES SYNC & REALTIME
-- Run this in the Supabase Dashboard SQL Editor
-- ============================================================================

-- 1. Ensure is_admin() reliably detects admin by auth_user_id OR email
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE (
            auth_user_id = auth.uid() 
            OR LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1))
        )
        AND role = 'admin'::user_role
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Link existing auth.users to profiles matching their email
UPDATE public.profiles p
SET auth_user_id = u.id,
    updated_at = now()
FROM auth.users u
WHERE LOWER(p.email) = LOWER(u.email)
  AND (p.auth_user_id IS NULL OR p.auth_user_id != u.id);

-- Ensure admin profile specifically is set to admin role and active status
UPDATE public.profiles
SET role = 'admin'::user_role,
    status = 'active'::account_status
WHERE LOWER(email) = 'admin@library.com';

-- 3. Automatic Trigger to link auth_user_id upon signup or login
CREATE OR REPLACE FUNCTION public.handle_user_profile_sync()
RETURNS trigger AS $$
DECLARE
    v_profile_id UUID;
    v_role user_role := 'student';
BEGIN
    IF LOWER(NEW.email) = 'admin@library.com' OR (NEW.raw_user_meta_data->>'role') = 'admin' THEN
        v_role := 'admin';
    END IF;

    SELECT id INTO v_profile_id FROM public.profiles WHERE LOWER(email) = LOWER(NEW.email);
    
    IF v_profile_id IS NOT NULL THEN
        UPDATE public.profiles
        SET auth_user_id = NEW.id,
            role = CASE WHEN v_role = 'admin' THEN 'admin'::user_role ELSE role END,
            updated_at = now()
        WHERE id = v_profile_id;
    ELSE
        INSERT INTO public.profiles (
            auth_user_id,
            role,
            full_name,
            email,
            student_id,
            status
        ) VALUES (
            NEW.id,
            v_role,
            COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
            NEW.email,
            CASE WHEN v_role = 'admin' THEN NULL ELSE COALESCE(NEW.raw_user_meta_data->>'student_id', 'STU' || floor(random() * 900000 + 100000)::text) END,
            'active'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_auth_user_sync_profile ON auth.users;
CREATE TRIGGER tr_auth_user_sync_profile
    AFTER INSERT OR UPDATE OF email ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_profile_sync();

-- 4. RPC to securely sync profile for the caller
CREATE OR REPLACE FUNCTION public.sync_my_profile()
RETURNS JSON AS $$
DECLARE
    v_auth_id UUID := auth.uid();
    v_email TEXT;
    v_prof_id UUID;
    v_prof_role user_role;
BEGIN
    IF v_auth_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT email INTO v_email FROM auth.users WHERE id = v_auth_id;

    -- Look up profile
    SELECT id, role INTO v_prof_id, v_prof_role 
    FROM public.profiles 
    WHERE auth_user_id = v_auth_id OR LOWER(email) = LOWER(v_email) 
    LIMIT 1;

    IF v_prof_id IS NOT NULL THEN
        UPDATE public.profiles 
        SET auth_user_id = v_auth_id,
            updated_at = now()
        WHERE id = v_prof_id;
        
        RETURN json_build_object('success', true, 'profile_id', v_prof_id, 'role', v_prof_role);
    END IF;

    RETURN json_build_object('success', false, 'error', 'No profile found for email');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Ensure conversations table exists with correct schema & constraints
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT DEFAULT 'active',
    unread_by_student INTEGER DEFAULT 0,
    unread_by_admin INTEGER DEFAULT 0,
    UNIQUE(student_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_student_id ON public.conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);

-- 6. Ensure messages table exists with conversation_id
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'conversation_id') THEN
        ALTER TABLE public.messages ADD COLUMN conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'read_at') THEN
        ALTER TABLE public.messages ADD COLUMN read_at TIMESTAMPTZ;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- 7. Configure RLS Policies
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can access their own conversation" ON public.conversations;
DROP POLICY IF EXISTS "Admins can access all conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;

CREATE POLICY "Students can access their own conversation" ON public.conversations
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM public.profiles 
            WHERE auth_user_id = auth.uid() 
               OR LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1))
        )
    );

CREATE POLICY "Admins can access all conversations" ON public.conversations
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can insert conversations" ON public.conversations
    FOR INSERT WITH CHECK (
        student_id IN (
            SELECT id FROM public.profiles 
            WHERE auth_user_id = auth.uid() 
               OR LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1))
        ) 
        OR public.is_admin()
    );

CREATE POLICY "Users can update their conversations" ON public.conversations
    FOR UPDATE USING (
        student_id IN (
            SELECT id FROM public.profiles 
            WHERE auth_user_id = auth.uid() 
               OR LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1))
        ) 
        OR public.is_admin()
    );

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
            WHERE student_id IN (
                SELECT id FROM public.profiles 
                WHERE auth_user_id = auth.uid() 
                   OR LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1))
            )
        ) 
        OR public.is_admin()
    );

CREATE POLICY "Users can insert messages" ON public.messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM public.conversations 
            WHERE student_id IN (
                SELECT id FROM public.profiles 
                WHERE auth_user_id = auth.uid() 
                   OR LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1))
            )
        ) 
        OR public.is_admin()
    );

CREATE POLICY "Users can update messages" ON public.messages
    FOR UPDATE USING (
        conversation_id IN (
            SELECT id FROM public.conversations 
            WHERE student_id IN (
                SELECT id FROM public.profiles 
                WHERE auth_user_id = auth.uid() 
                   OR LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1))
            )
        ) 
        OR public.is_admin()
    );

-- 8. send_chat_message RPC (Self-healing profile lookup + transactional message send)
CREATE OR REPLACE FUNCTION public.send_chat_message(p_student_id UUID, p_message TEXT)
RETURNS JSON AS $$
DECLARE
    v_sender_id UUID;
    v_sender_role user_role;
    v_conversation_id UUID;
    v_message_id UUID;
BEGIN
    -- Resolve sender profile from auth.uid()
    SELECT id, role INTO v_sender_id, v_sender_role 
    FROM public.profiles 
    WHERE auth_user_id = auth.uid();
    
    -- Self-healing fallback: match by email from auth.users if auth_user_id wasn't linked yet
    IF v_sender_id IS NULL THEN
        SELECT p.id, p.role INTO v_sender_id, v_sender_role
        FROM public.profiles p
        JOIN auth.users u ON LOWER(u.email) = LOWER(p.email)
        WHERE u.id = auth.uid()
        LIMIT 1;
        
        IF v_sender_id IS NOT NULL THEN
            UPDATE public.profiles SET auth_user_id = auth.uid(), updated_at = now() WHERE id = v_sender_id;
        END IF;
    END IF;

    IF v_sender_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Profile not found for authenticated user');
    END IF;

    -- Prevent student from spoofing another student
    IF v_sender_role = 'student' AND v_sender_id != p_student_id THEN
        RETURN json_build_object('success', false, 'error', 'Unauthorized to send message as another student');
    END IF;

    -- Get or create the unique Helpdesk conversation for this student
    SELECT id INTO v_conversation_id FROM public.conversations WHERE student_id = p_student_id;
    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (student_id, last_message_at, unread_by_student, unread_by_admin)
        VALUES (p_student_id, now(), 0, 0)
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

-- 9. ENABLE SUPABASE REALTIME PUBLICATION & REPLICA IDENTITY
DO $$
BEGIN
    -- Ensure publication exists
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    -- Add messages to realtime publication if not present
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;

    -- Add conversations to realtime publication if not present
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    END IF;
END $$;

ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
