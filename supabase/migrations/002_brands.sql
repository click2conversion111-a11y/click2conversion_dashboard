CREATE TABLE IF NOT EXISTS brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#4D9EFF',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  meta JSONB,
  google JSONB,
  shopify JSONB
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON brands FOR ALL USING (true);
