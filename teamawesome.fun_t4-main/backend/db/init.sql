CREATE TABLE users (
  id UUID PRIMARY KEY NOT NULL,

  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  user_name VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,

  password TEXT NOT NULL CHECK (char_length(password) >= 8),

  bio TEXT CHECK (char_length(bio) <= 1000),
  profile_picture_url TEXT CHECK (char_length(profile_picture_url) <= 500),

  is_profile_public BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_links (
  id SERIAL PRIMARY KEY,

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  title VARCHAR(100) NOT NULL CHECK (char_length(title) > 0),
  url TEXT NOT NULL CHECK (char_length(url) <= 500),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE reports (
  id SERIAL PRIMARY KEY,

  reported_user UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,

  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 10 AND 1000),

  reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  status VARCHAR(10) NOT NULL CHECK (status IN ('pending', 'resolved'))
);

CREATE TABLE follows (
  id SERIAL PRIMARY KEY,

  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_follow_pair UNIQUE (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);


CREATE TABLE follow_requests (
  id SERIAL PRIMARY KEY,

  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),

  CONSTRAINT unique_follow_request UNIQUE (requester_id, target_id),
  CONSTRAINT no_self_request CHECK (requester_id <> target_id)
);


CREATE TABLE followers_summary (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT CHECK (char_length(description) <= 500),
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Create likes table for projects
CREATE TABLE IF NOT EXISTS project_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, project_id)
);

-- Create index for likes
CREATE INDEX IF NOT EXISTS idx_project_likes_project_id ON project_likes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_user_id ON project_likes(user_id);