-- Student Feedback Management System (SFMS)
-- PostgreSQL Database Schema

-- Enable UUID extension for secure identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table: Central identity registry for Students, Faculty, and Admins
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    given_name VARCHAR(100),
    family_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('student', 'faculty', 'admin')) NOT NULL,
    picture_url TEXT,
    department VARCHAR(100), -- For faculty/students
    college VARCHAR(255) DEFAULT 'SRMIST',
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'On Leave', 'Decommissioned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- 2. Courses Table: Primary academic curriculum definitions
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_name VARCHAR(255) NOT NULL,
    course_code VARCHAR(50) UNIQUE,
    semester INTEGER,
    academic_year VARCHAR(20),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Faculty Assignments: Mapping faculty to specific courses
CREATE TABLE IF NOT EXISTS course_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    academic_year VARCHAR(20),
    semester VARCHAR(20),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(faculty_id, course_id)
);

-- 4. Feedback Responses: Multi-dimensional feedback data storage
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Numerical ratings (Scale 1-5 or 1-10)
    teaching_quality INTEGER CHECK (teaching_quality BETWEEN 1 AND 5),
    course_content INTEGER CHECK (course_content BETWEEN 1 AND 5),
    practical_knowledge INTEGER CHECK (practical_knowledge BETWEEN 1 AND 5),
    communication_skills INTEGER CHECK (communication_skills BETWEEN 1 AND 5),
    punctuality INTEGER CHECK (punctuality BETWEEN 1 AND 5),
    
    -- Comprehensive JSONB field for flexible survey questions
    responses JSONB NOT NULL,
    
    -- Qualitative feedback
    overall_comment TEXT,
    overall_rating NUMERIC(3, 2),
    
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. System Config: Centralized session management and administrative flags
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial administrative protocol
INSERT INTO system_config (config_key, config_value) 
VALUES ('feedback_session_status', 'open')
ON CONFLICT (config_key) DO NOTHING;

-- Seed Default Admin Node (Password: SFMS@Admin2024 - Hash placeholder)
-- Note: In production, password_hash should be generated via bcrypt/argon2
INSERT INTO users (full_name, given_name, family_name, email, password_hash, role, status)
VALUES ('System Administrator', 'System', 'Administrator', 'admin@sfms.edu', '$2b$10$PlaceholderHash', 'admin', 'Active')
ON CONFLICT (email) DO NOTHING;

-- Seed Standard Academic Backbone (Courses)
INSERT INTO courses (course_name, course_code, semester)
VALUES 
('Probability and Queueing Theory', 'MA1001', 4),
('Database Management System', 'CS1002', 4),
('Design and Analysis of Algorithm', 'CS1003', 4),
('Internet of Things', 'EC1004', 4),
('Artificial Intelligence', 'CS1005', 4),
('Social Engineering', 'SE1006', 4),
('Creative & Critical Thinking Skills', 'GE1007', 4),
('Understanding Harmony and Ethical Human Conducts', 'GE1008', 4)
ON CONFLICT (course_code) DO NOTHING;
