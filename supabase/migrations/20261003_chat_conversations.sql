-- 1. Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT DEFAULT 'active',
    unread_by_student INTEGER DEFAULT 0,
    unread_by_admin INTEGER DEFAULT 0,
    UNIQUE(student_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_student_id ON conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Safely drop existing policies if any
DROP POLICY IF EXISTS "Students can access their own conversation" ON conversations;
DROP POLICY IF EXISTS "Admins can access all conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;

CREATE POLICY "Students can access their own conversation" ON conversations
    FOR SELECT USING (student_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins can access all conversations" ON conversations
    FOR SELECT USING (is_admin());
    
CREATE POLICY "Users can insert conversations" ON conversations
    FOR INSERT WITH CHECK (
        student_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
        is_admin()
    );

CREATE POLICY "Users can update their conversations" ON conversations
    FOR UPDATE USING (
        student_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
        is_admin()
    );


-- 2. Create messages table (in case it does not exist)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure we have the conversation_id and read_at columns if the table ALREADY existed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'conversation_id') THEN
        ALTER TABLE messages ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'read_at') THEN
        ALTER TABLE messages ADD COLUMN read_at TIMESTAMPTZ;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing old policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own sent or received messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can update is_read on received messages" ON messages;
DROP POLICY IF EXISTS "Users can access messages for their conversations" ON messages;
DROP POLICY IF EXISTS "Admins can access all messages" ON messages;

CREATE POLICY "Users can access messages for their conversations" ON messages
    FOR SELECT USING (
        conversation_id IN (SELECT id FROM conversations WHERE student_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())) OR
        is_admin()
    );

CREATE POLICY "Users can insert messages" ON messages
    FOR INSERT WITH CHECK (
        conversation_id IN (SELECT id FROM conversations WHERE student_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())) OR
        is_admin()
    );
    
CREATE POLICY "Users can update messages" ON messages
    FOR UPDATE USING (
        conversation_id IN (SELECT id FROM conversations WHERE student_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())) OR
        is_admin()
    );


-- Migrate existing messages to conversations (only if there are existing messages missing a conversation_id)
DO $$
DECLARE
    r RECORD;
    v_conversation_id UUID;
    v_student_id UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'receiver_id') THEN
        FOR r IN SELECT DISTINCT LEAST(sender_id, receiver_id) as u1, GREATEST(sender_id, receiver_id) as u2 FROM messages WHERE conversation_id IS NULL AND receiver_id IS NOT NULL LOOP
            -- one of these is admin, one is student.
            SELECT id INTO v_student_id FROM profiles WHERE id = r.u1 AND role = 'student';
            IF v_student_id IS NULL THEN
                SELECT id INTO v_student_id FROM profiles WHERE id = r.u2 AND role = 'student';
            END IF;

            IF v_student_id IS NOT NULL THEN
                -- Create or get conversation
                INSERT INTO conversations (student_id, last_message_at) 
                VALUES (v_student_id, (SELECT MAX(created_at) FROM messages WHERE (sender_id = r.u1 AND receiver_id = r.u2) OR (sender_id = r.u2 AND receiver_id = r.u1)))
                ON CONFLICT (student_id) DO UPDATE SET last_message_at = EXCLUDED.last_message_at
                RETURNING id INTO v_conversation_id;

                -- Update messages
                UPDATE messages SET conversation_id = v_conversation_id 
                WHERE (sender_id = r.u1 AND receiver_id = r.u2) OR (sender_id = r.u2 AND receiver_id = r.u1);
            END IF;
        END LOOP;
    END IF;
END $$;


-- 3. Function to securely send a message and create conversation if needed
CREATE OR REPLACE FUNCTION send_chat_message(p_student_id UUID, p_message TEXT)
RETURNS JSON AS $$
DECLARE
    v_sender_id UUID;
    v_conversation_id UUID;
    v_message_id UUID;
    v_role user_role;
BEGIN
    -- Get sender profile id and role from auth.uid()
    SELECT id, role INTO v_sender_id, v_role FROM profiles WHERE auth_user_id = auth.uid();
    IF v_sender_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Profile not found for authenticated user');
    END IF;

    IF v_role = 'student' AND v_sender_id != p_student_id THEN
        RETURN json_build_object('success', false, 'error', 'Unauthorized to send message as another student');
    END IF;

    -- Ensure conversation exists
    SELECT id INTO v_conversation_id FROM conversations WHERE student_id = p_student_id;
    IF v_conversation_id IS NULL THEN
        INSERT INTO conversations (student_id, last_message_at) VALUES (p_student_id, now()) RETURNING id INTO v_conversation_id;
    END IF;

    -- Insert message
    INSERT INTO messages (conversation_id, sender_id, message)
    VALUES (v_conversation_id, v_sender_id, p_message)
    RETURNING id INTO v_message_id;

    -- Update conversation
    UPDATE conversations SET 
        last_message_at = now(),
        unread_by_admin = CASE WHEN v_sender_id = student_id THEN unread_by_admin + 1 ELSE unread_by_admin END,
        unread_by_student = CASE WHEN v_sender_id != student_id THEN unread_by_student + 1 ELSE unread_by_student END
    WHERE id = v_conversation_id;

    RETURN json_build_object('success', true, 'message_id', v_message_id, 'conversation_id', v_conversation_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
