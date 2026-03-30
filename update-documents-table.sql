-- Step 1: Create documents table with all columns
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  file_type TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Step 2: Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents(created_by);

-- Step 3: Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to read documents" ON documents;
DROP POLICY IF EXISTS "Allow authenticated users to insert documents" ON documents;
DROP POLICY IF EXISTS "Allow users to update documents" ON documents;
DROP POLICY IF EXISTS "Allow users to delete documents" ON documents;

-- Step 5: Create RLS policies for documents table

-- Allow all authenticated users to read documents
CREATE POLICY "Allow authenticated users to read documents"
ON documents FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to insert documents
CREATE POLICY "Allow authenticated users to insert documents"
ON documents FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update documents
CREATE POLICY "Allow users to update documents"
ON documents FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow users to delete documents
CREATE POLICY "Allow users to delete documents"
ON documents FOR DELETE
TO authenticated
USING (true);

-- Step 6: Grant permissions
GRANT ALL ON documents TO authenticated;
GRANT ALL ON documents TO anon;
