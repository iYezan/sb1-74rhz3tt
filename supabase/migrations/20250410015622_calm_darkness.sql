/*
  # Add transactions table and fix profiles

  1. New Tables
    - `transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `amount` (numeric)
      - `converted_amount` (numeric)
      - `recipient_name` (text)
      - `recipient_mobile` (text)
      - `country` (text)
      - `payment_method` (text)
      - `status` (text)
      - `transaction_stage` (text)
      - `profit_amount` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for user access
    - Add policies for admin access
*/

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  amount numeric NOT NULL,
  converted_amount numeric NOT NULL,
  recipient_name text NOT NULL,
  recipient_mobile text NOT NULL,
  country text NOT NULL,
  payment_method text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  transaction_stage text NOT NULL DEFAULT 'Money Collection',
  profit_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for transactions
CREATE POLICY "Users can read own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage all transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add mobile_number column to profiles if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'mobile_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN mobile_number text;
  END IF;
END $$;