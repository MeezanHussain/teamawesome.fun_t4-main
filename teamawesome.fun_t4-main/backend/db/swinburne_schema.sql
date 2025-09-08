-- Swinburne Student Project Template Database Schema Extensions
-- This file contains all new tables and modifications required for the Swinburne academic project feature

-- Create Swinburne Units reference table
CREATE TABLE IF NOT EXISTS swinburne_units (
  id SERIAL PRIMARY KEY,
  unit_code VARCHAR(10) UNIQUE NOT NULL,
  unit_name VARCHAR(200) NOT NULL,
  faculty VARCHAR(100),
  campus VARCHAR(20)[] NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Swinburne Projects table (extends base projects table)
CREATE TABLE IF NOT EXISTS swinburne_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Course Information
  unit_code VARCHAR(10) NOT NULL,
  unit_name VARCHAR(200) NOT NULL,
  semester VARCHAR(20) NOT NULL,
  academic_year INTEGER NOT NULL,
  campus VARCHAR(20) NOT NULL CHECK (campus IN ('Hawthorn', 'Sarawak', 'Online')),
  
  -- Project Details
  project_type VARCHAR(20) NOT NULL CHECK (project_type IN ('Individual', 'Group', 'Assignment', 'Research', 'Capstone')),
  assessment_weight VARCHAR(50),
  due_date DATE,
  
  -- Collaboration Management
  collaboration_status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (collaboration_status IN ('Open', 'Invite Only', 'Closed')),
  
  -- Lifecycle
  status VARCHAR(20) NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'Planning', 'In Progress', 'Review', 'Completed', 'Submitted')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  -- Privacy
  visibility VARCHAR(20) NOT NULL DEFAULT 'Swinburne Only' CHECK (visibility IN ('Public', 'Swinburne Only', 'Team Only', 'Private')),
  instructor_code VARCHAR(50),
  
  -- Academic
  final_grade VARCHAR(10),
  
  -- Tags for project categorization
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Project Collaborators table
CREATE TABLE IF NOT EXISTS project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES swinburne_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('Leader', 'Developer', 'Designer', 'Researcher', 'Writer')),
  status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Invited', 'Active', 'Inactive')),
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(project_id, user_id)
);

-- Create Project Milestones table
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES swinburne_projects(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  completed_by UUID REFERENCES users(id),
  order_index INTEGER NOT NULL DEFAULT 1,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_swinburne_projects_base_id ON swinburne_projects(base_project_id);
CREATE INDEX IF NOT EXISTS idx_swinburne_projects_unit_code ON swinburne_projects(unit_code);
CREATE INDEX IF NOT EXISTS idx_swinburne_projects_semester ON swinburne_projects(semester, academic_year);
CREATE INDEX IF NOT EXISTS idx_swinburne_projects_due_date ON swinburne_projects(due_date);
CREATE INDEX IF NOT EXISTS idx_swinburne_projects_status ON swinburne_projects(status);
CREATE INDEX IF NOT EXISTS idx_swinburne_projects_visibility ON swinburne_projects(visibility);

CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id ON project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_status ON project_collaborators(status);

CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_due_date ON project_milestones(due_date);
CREATE INDEX IF NOT EXISTS idx_project_milestones_completed ON project_milestones(is_completed);

CREATE INDEX IF NOT EXISTS idx_swinburne_units_code ON swinburne_units(unit_code);
CREATE INDEX IF NOT EXISTS idx_swinburne_units_active ON swinburne_units(is_active);

-- Insert sample Swinburne units data
INSERT INTO swinburne_units (unit_code, unit_name, faculty, campus) VALUES
('COS10011', 'Creating Web Applications', 'Science, Engineering and Technology', ARRAY['Hawthorn', 'Online']),
('TNE10006', 'Network Administration', 'Science, Engineering and Technology', ARRAY['Hawthorn', 'Sarawak']),
('COS20007', 'Object Oriented Programming', 'Science, Engineering and Technology', ARRAY['Hawthorn', 'Online']),
('TNE30026', 'Network Systems Administration', 'Science, Engineering and Technology', ARRAY['Hawthorn', 'Sarawak']),
('COS30043', 'Interface Design and Development', 'Science, Engineering and Technology', ARRAY['Hawthorn', 'Online']),
('COS30017', 'Software Development for Mobile Devices', 'Science, Engineering and Technology', ARRAY['Hawthorn', 'Online']),
('ICT30017', 'Advanced Software Development Techniques', 'Science, Engineering and Technology', ARRAY['Hawthorn', 'Online']),
('COS80001', 'Computing Project 1', 'Science, Engineering and Technology', ARRAY['Hawthorn', 'Online']),
('COS80002', 'Computing Project 2', 'Science, Engineering and Technology', ARRAY['Hawthorn', 'Online']),
('TNE80001', 'Telecommunications Project 1', 'Science, Engineering and Technology', ARRAY['Hawthorn', 'Sarawak']),
('TNE80002', 'Telecommunications Project 2', 'Science, Engineering and Technology', ARRAY['Hawthorn', 'Sarawak']),
('COS20019', 'Cloud Computing Architecture', 'Science, Engineering and Technology', ARRAY['Hawthorn', 'Online']),
('COS30020', 'Artificial Intelligence for Games', 'Science, Engineering and Technology', ARRAY['Hawthorn', 'Online']),
('COS30018', 'Intelligent Systems', 'Science, Engineering and Technology', ARRAY['Hawthorn', 'Online']),
('COS30002', 'Games Programming', 'Science, Engineering and Technology', ARRAY['Hawthorn', 'Online']),
('COS30045', 'Data Structures and Patterns', 'Science, Engineering and Technology', ARRAY['Hawthorn', 'Online']),
('COS80013', 'Internet Technologies', 'Science, Engineering and Technology', ARRAY['Hawthorn', 'Online']),
('INF30029', 'Information Technology Project Management', 'Science, Engineering and Technology', ARRAY['Hawthorn', 'Online']),
('COS60011', 'Technology Inquiry Project', 'Science, Engineering and Technology', ARRAY['Hawthorn', 'Online']),
('COS60016', 'Database Systems and Business Intelligence', 'Science, Engineering and Technology', ARRAY['Hawthorn', 'Online'])
ON CONFLICT (unit_code) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_swinburne_projects_updated_at
    BEFORE UPDATE ON swinburne_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for easy querying of Swinburne projects with base project data
CREATE OR REPLACE VIEW swinburne_projects_view AS
SELECT 
    sp.*,
    p.title,
    p.description,
    p.image_urls,
    p.user_id,
    p.created_at as base_created_at,
    p.updated_at as base_updated_at,
    u.first_name,
    u.last_name,
    u.user_name,
    u.profile_picture_url,
    u.email
FROM swinburne_projects sp
JOIN projects p ON sp.base_project_id = p.id
JOIN users u ON p.user_id = u.id;