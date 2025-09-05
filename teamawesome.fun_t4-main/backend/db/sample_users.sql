-- Sample users for testing pagination features
-- This script inserts 25 sample users with realistic data

INSERT INTO public.users (
    id, 
    first_name, 
    last_name, 
    user_name, 
    email, 
    password, 
    bio, 
    profile_picture_url, 
    is_profile_public, 
    created_at
) VALUES 
-- Users 1-5
('550e8400-e29b-41d4-a716-446655440001', 'Alice', 'Johnson', 'alice_j', 'alice.johnson@example.com', '$2b$10$example.hash.1', 'Software Engineer passionate about web development and user experience design.', NULL, true, NOW() - INTERVAL '30 days'),
('550e8400-e29b-41d4-a716-446655440002', 'Bob', 'Smith', 'bob_smith', 'bob.smith@example.com', '$2b$10$example.hash.2', 'Full-stack developer with expertise in React and Node.js. Love building scalable applications.', NULL, true, NOW() - INTERVAL '29 days'),
('550e8400-e29b-41d4-a716-446655440003', 'Carol', 'Davis', 'carol_d', 'carol.davis@example.com', '$2b$10$example.hash.3', 'UI/UX Designer creating beautiful and functional digital experiences.', NULL, true, NOW() - INTERVAL '28 days'),
('550e8400-e29b-41d4-a716-446655440004', 'David', 'Wilson', 'david_w', 'david.wilson@example.com', '$2b$10$example.hash.4', 'Data Scientist exploring the intersection of AI and business intelligence.', NULL, true, NOW() - INTERVAL '27 days'),
('550e8400-e29b-41d4-a716-446655440005', 'Emma', 'Brown', 'emma_brown', 'emma.brown@example.com', '$2b$10$example.hash.5', 'Product Manager with a passion for user-centered design and agile methodologies.', NULL, true, NOW() - INTERVAL '26 days'),

-- Users 6-10
('550e8400-e29b-41d4-a716-446655440006', 'Frank', 'Miller', 'frank_m', 'frank.miller@example.com', '$2b$10$example.hash.6', 'DevOps Engineer automating infrastructure and ensuring system reliability.', NULL, true, NOW() - INTERVAL '25 days'),
('550e8400-e29b-41d4-a716-446655440007', 'Grace', 'Garcia', 'grace_g', 'grace.garcia@example.com', '$2b$10$example.hash.7', 'Frontend Developer specializing in modern JavaScript frameworks and responsive design.', NULL, true, NOW() - INTERVAL '24 days'),
('550e8400-e29b-41d4-a716-446655440008', 'Henry', 'Martinez', 'henry_m', 'henry.martinez@example.com', '$2b$10$example.hash.8', 'Backend Developer building robust APIs and microservices architecture.', NULL, true, NOW() - INTERVAL '23 days'),
('550e8400-e29b-41d4-a716-446655440009', 'Ivy', 'Anderson', 'ivy_a', 'ivy.anderson@example.com', '$2b$10$example.hash.9', 'Mobile App Developer creating cross-platform solutions with React Native.', NULL, true, NOW() - INTERVAL '22 days'),
('550e8400-e29b-41d4-a716-446655440010', 'Jack', 'Taylor', 'jack_taylor', 'jack.taylor@example.com', '$2b$10$example.hash.10', 'Cybersecurity Specialist protecting digital assets and ensuring data privacy.', NULL, true, NOW() - INTERVAL '21 days'),

-- Users 11-15
('550e8400-e29b-41d4-a716-446655440011', 'Kate', 'Thomas', 'kate_t', 'kate.thomas@example.com', '$2b$10$example.hash.11', 'QA Engineer ensuring software quality through comprehensive testing strategies.', NULL, true, NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440012', 'Liam', 'Jackson', 'liam_j', 'liam.jackson@example.com', '$2b$10$example.hash.12', 'Cloud Architect designing scalable and secure cloud infrastructure solutions.', NULL, true, NOW() - INTERVAL '19 days'),
('550e8400-e29b-41d4-a716-446655440013', 'Maya', 'White', 'maya_w', 'maya.white@example.com', '$2b$10$example.hash.13', 'Technical Writer creating clear and comprehensive documentation for developers.', NULL, true, NOW() - INTERVAL '18 days'),
('550e8400-e29b-41d4-a716-446655440014', 'Noah', 'Harris', 'noah_h', 'noah.harris@example.com', '$2b$10$example.hash.14', 'Machine Learning Engineer developing intelligent systems and predictive models.', NULL, true, NOW() - INTERVAL '17 days'),
('550e8400-e29b-41d4-a716-446655440015', 'Olivia', 'Martin', 'olivia_m', 'olivia.martin@example.com', '$2b$10$example.hash.15', 'Scrum Master facilitating agile development processes and team collaboration.', NULL, true, NOW() - INTERVAL '16 days'),

-- Users 16-20
('550e8400-e29b-41d4-a716-446655440016', 'Paul', 'Thompson', 'paul_t', 'paul.thompson@example.com', '$2b$10$example.hash.16', 'Database Administrator optimizing performance and ensuring data integrity.', NULL, true, NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-446655440017', 'Quinn', 'Garcia', 'quinn_g', 'quinn.garcia@example.com', '$2b$10$example.hash.17', 'Game Developer creating immersive experiences with Unity and C#.', NULL, true, NOW() - INTERVAL '14 days'),
('550e8400-e29b-41d4-a716-446655440018', 'Rachel', 'Lee', 'rachel_l', 'rachel.lee@example.com', '$2b$10$example.hash.18', 'Digital Marketing Specialist driving growth through data-driven strategies.', NULL, true, NOW() - INTERVAL '13 days'),
('550e8400-e29b-41d4-a716-446655440019', 'Sam', 'Perez', 'sam_p', 'sam.perez@example.com', '$2b$10$example.hash.19', 'Blockchain Developer building decentralized applications and smart contracts.', NULL, true, NOW() - INTERVAL '12 days'),
('550e8400-e29b-41d4-a716-446655440020', 'Tina', 'Roberts', 'tina_r', 'tina.roberts@example.com', '$2b$10$example.hash.20', 'System Administrator maintaining server infrastructure and network security.', NULL, true, NOW() - INTERVAL '11 days'),

-- Users 21-25
('550e8400-e29b-41d4-a716-446655440021', 'Uma', 'Turner', 'uma_t', 'uma.turner@example.com', '$2b$10$example.hash.21', 'Content Creator sharing knowledge about technology and programming.', NULL, true, NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440022', 'Victor', 'Phillips', 'victor_p', 'victor.phillips@example.com', '$2b$10$example.hash.22', 'Freelance Developer helping startups build their MVP and scale their products.', NULL, true, NOW() - INTERVAL '9 days'),
('550e8400-e29b-41d4-a716-446655440023', 'Wendy', 'Campbell', 'wendy_c', 'wendy.campbell@example.com', '$2b$10$example.hash.23', 'Tech Lead mentoring junior developers and architecting complex systems.', NULL, true, NOW() - INTERVAL '8 days'),
('550e8400-e29b-41d4-a716-446655440024', 'Xavier', 'Parker', 'xavier_p', 'xavier.parker@example.com', '$2b$10$example.hash.24', 'Open Source Contributor building tools that make developers more productive.', NULL, true, NOW() - INTERVAL '7 days'),
('550e8400-e29b-41d4-a716-446655440025', 'Yara', 'Evans', 'yara_e', 'yara.evans@example.com', '$2b$10$example.hash.25', 'Research Engineer exploring cutting-edge technologies and their practical applications.', NULL, true, NOW() - INTERVAL '6 days');

-- Insert some sample followers_summary data to make the pagination more realistic
INSERT INTO public.followers_summary (user_id, followers_count, following_count, updated_at)
SELECT 
    id,
    0, -- 0 followers
    0, -- 0 following
    NOW()
FROM public.users 
WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440009',
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440012',
    '550e8400-e29b-41d4-a716-446655440013',
    '550e8400-e29b-41d4-a716-446655440014',
    '550e8400-e29b-41d4-a716-446655440015',
    '550e8400-e29b-41d4-a716-446655440016',
    '550e8400-e29b-41d4-a716-446655440017',
    '550e8400-e29b-41d4-a716-446655440018',
    '550e8400-e29b-41d4-a716-446655440019',
    '550e8400-e29b-41d4-a716-446655440020',
    '550e8400-e29b-41d4-a716-446655440021',
    '550e8400-e29b-41d4-a716-446655440022',
    '550e8400-e29b-41d4-a716-446655440023',
    '550e8400-e29b-41d4-a716-446655440024',
    '550e8400-e29b-41d4-a716-446655440025'
)
ON CONFLICT (user_id) DO UPDATE SET
    followers_count = EXCLUDED.followers_count,
    following_count = EXCLUDED.following_count,
    updated_at = NOW();
