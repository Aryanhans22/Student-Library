/*
SEED DATA INSTRUCTIONS:
1. Run migration.sql first to set up the database schema.
2. Create auth users in Supabase Auth dashboard for the admin and students.
3. Update auth_user_id values in this seed.sql file to match the newly created auth users.
4. Then run this seed.sql file.

WARNING: THIS IS DEVELOPMENT SEED DATA. DO NOT RUN IN PRODUCTION.
*/

-- IMPORTANT: Replace these UUIDs with actual auth_user_ids from Supabase Auth dashboard!
-- Admin Auth ID placeholder: '00000000-0000-0000-0000-000000000001'
-- Student 1 Auth ID placeholder: '00000000-0000-0000-0000-000000000011'
-- Student 2 Auth ID placeholder: '00000000-0000-0000-0000-000000000012'
-- Student 3 Auth ID placeholder: '00000000-0000-0000-0000-000000000013'
-- Student 4 Auth ID placeholder: '00000000-0000-0000-0000-000000000014'
-- Student 5 Auth ID placeholder: '00000000-0000-0000-0000-000000000015'

-- 1. Insert admin profile
INSERT INTO profiles (id, auth_user_id, role, full_name, email, status)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', NULL, 'admin', 'Library Admin', 'admin@library.com', 'active');
-- NOTE: Update NULL above with the actual auth_user_id once created

-- 2. Insert 5 student profiles (STUD001-STUD005)
INSERT INTO profiles (id, auth_user_id, role, full_name, email, student_id, status)
VALUES 
    ('s0000000-0000-0000-0000-000000000001', NULL, 'student', 'Aarav Sharma', 'aarav.sharma@example.com', 'STUD001', 'active'),
    ('s0000000-0000-0000-0000-000000000002', NULL, 'student', 'Diya Patel', 'diya.patel@example.com', 'STUD002', 'active'),
    ('s0000000-0000-0000-0000-000000000003', NULL, 'student', 'Vihaan Singh', 'vihaan.singh@example.com', 'STUD003', 'active'),
    ('s0000000-0000-0000-0000-000000000004', NULL, 'student', 'Ananya Gupta', 'ananya.gupta@example.com', 'STUD004', 'active'),
    ('s0000000-0000-0000-0000-000000000005', NULL, 'student', 'Rohan Desai', 'rohan.desai@example.com', 'STUD005', 'active');

-- 3. Insert 12 seats: A01-A06, B01-B06
INSERT INTO seats (id, seat_number, floor, section, row_number, column_number, status)
VALUES 
    -- Section A, Ground Floor
    ('e0000000-0000-0000-0000-0000000000a1', 'A01', 'Ground Floor', 'A', 1, 1, 'available'),
    ('e0000000-0000-0000-0000-0000000000a2', 'A02', 'Ground Floor', 'A', 1, 2, 'available'),
    ('e0000000-0000-0000-0000-0000000000a3', 'A03', 'Ground Floor', 'A', 1, 3, 'available'),
    ('e0000000-0000-0000-0000-0000000000a4', 'A04', 'Ground Floor', 'A', 2, 1, 'available'),
    ('e0000000-0000-0000-0000-0000000000a5', 'A05', 'Ground Floor', 'A', 2, 2, 'available'),
    ('e0000000-0000-0000-0000-0000000000a6', 'A06', 'Ground Floor', 'A', 2, 3, 'available'),
    
    -- Section B, First Floor
    ('e0000000-0000-0000-0000-0000000000b1', 'B01', 'First Floor', 'B', 1, 1, 'available'),
    ('e0000000-0000-0000-0000-0000000000b2', 'B02', 'First Floor', 'B', 1, 2, 'available'),
    ('e0000000-0000-0000-0000-0000000000b3', 'B03', 'First Floor', 'B', 1, 3, 'available'),
    ('e0000000-0000-0000-0000-0000000000b4', 'B04', 'First Floor', 'B', 2, 1, 'available'),
    ('e0000000-0000-0000-0000-0000000000b5', 'B05', 'First Floor', 'B', 2, 2, 'available'),
    ('e0000000-0000-0000-0000-0000000000b6', 'B06', 'First Floor', 'B', 2, 3, 'available');

-- 4. Insert 2 sample seat assignments (STUD001 -> A01, STUD002 -> B03)
INSERT INTO seat_assignments (student_id, seat_id, assigned_by, status)
VALUES 
    ('s0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-0000000000a1', 'a0000000-0000-0000-0000-000000000001', 'active'),
    ('s0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-0000000000b3', 'a0000000-0000-0000-0000-000000000001', 'active');

-- Mark those seats as occupied
UPDATE seats SET status = 'occupied' WHERE id IN ('e0000000-0000-0000-0000-0000000000a1', 'e0000000-0000-0000-0000-0000000000b3');
