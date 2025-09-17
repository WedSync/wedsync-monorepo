-- Test script to verify T025 implementation
-- Run this after setting up Supabase to verify migrations and seed data

-- Check that all tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verify seed data exists
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'supplier_profiles', COUNT(*) FROM supplier_profiles
UNION ALL
SELECT 'couple_profiles', COUNT(*) FROM couple_profiles
UNION ALL
SELECT 'weddings', COUNT(*) FROM weddings
UNION ALL
SELECT 'guests', COUNT(*) FROM guests
UNION ALL
SELECT 'forms', COUNT(*) FROM forms
UNION ALL
SELECT 'form_submissions', COUNT(*) FROM form_submissions
UNION ALL
SELECT 'journeys', COUNT(*) FROM journeys
UNION ALL
SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'templates', COUNT(*) FROM templates;

-- Check RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND rowsecurity = true
ORDER BY tablename;

-- Check RLS policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verify helper functions exist
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'auth'
    AND routine_name LIKE '%admin%' 
    OR routine_name LIKE '%supplier%'
    OR routine_name LIKE '%couple%'
    OR routine_name LIKE '%wedding%'
ORDER BY routine_name;

-- Test data integrity
SELECT 
    'Data integrity check' as test_name,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS: No orphaned records'
        ELSE 'FAIL: Found orphaned records'
    END as result
FROM (
    -- Check for orphaned supplier profiles
    SELECT sp.id FROM supplier_profiles sp
    LEFT JOIN users u ON sp.user_id = u.id
    WHERE u.id IS NULL
    
    UNION ALL
    
    -- Check for orphaned couple profiles
    SELECT cp.id FROM couple_profiles cp
    LEFT JOIN users u1 ON cp.partner_one_id = u1.id
    LEFT JOIN users u2 ON cp.partner_two_id = u2.id
    WHERE u1.id IS NULL OR u2.id IS NULL
    
    UNION ALL
    
    -- Check for orphaned weddings
    SELECT w.id FROM weddings w
    LEFT JOIN couple_profiles cp ON w.couple_id = cp.id
    WHERE cp.id IS NULL
) orphaned_records;

-- Check sample wedding access
SELECT 
    w.id as wedding_id,
    cp.partner_one_id,
    cp.partner_two_id,
    w.wedding_date,
    w.status
FROM weddings w
JOIN couple_profiles cp ON w.couple_id = cp.id
LIMIT 3;