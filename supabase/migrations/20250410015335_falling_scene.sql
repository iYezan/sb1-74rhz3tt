/*
  # Create admin user and fee management tables

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `full_name` (text)
      - `role` (text)
      - `is_approved` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `fees`
      - `id` (uuid, primary key)
      - `country` (text)
      - `fee_percentage` (numeric)
      - `exchange_rate` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for admin management
    - Add policies for user access

  3. Initial Data
    - Create admin user
    - Set up initial exchange rates
*/

-- Create profiles table first
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  full_name text,
  role text DEFAULT 'user',
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (role = 'admin');

-- Create fees table
CREATE TABLE IF NOT EXISTS fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text NOT NULL,
  fee_percentage numeric NOT NULL DEFAULT 2.99,
  exchange_rate numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on fees
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;

-- Policies for fees table
CREATE POLICY "Allow admin to manage fees"
  ON fees
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Allow users to read fees"
  ON fees
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert initial exchange rates
INSERT INTO fees (country, exchange_rate) VALUES
  ('Somalia', 1.27),  -- 1 GBP = 1.27 USD (example rate)
  ('Kenya', 157.23);  -- 1 GBP = 157.23 KES (example rate)

-- Create admin user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@alahdalpay.com',
  crypt('Admin123!@#', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Create admin profile
INSERT INTO profiles (
  user_id,
  full_name,
  role,
  is_approved
) 
SELECT 
  id,
  'Admin User',
  'admin',
  true
FROM auth.users 
WHERE email = 'admin@alahdalpay.com';