-- Shopify connections
CREATE TABLE IF NOT EXISTS shopify_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  account_id TEXT NOT NULL,
  shop_url TEXT NOT NULL,
  shop_name TEXT,
  access_token TEXT NOT NULL,
  currency TEXT DEFAULT 'INR',
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id)
);

-- Shopify cached data
CREATE TABLE IF NOT EXISTS shopify_cached_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id TEXT NOT NULL,
  date_range TEXT NOT NULL,
  data JSONB,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, date_range)
);

-- Product maps (manual keyword mapping)
CREATE TABLE IF NOT EXISTS product_maps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  keywords JSONB DEFAULT '[]',
  color TEXT DEFAULT '#4D9EFF',
  source TEXT DEFAULT 'manual', -- 'shopify' | 'manual'
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metric formatting per brand
CREATE TABLE IF NOT EXISTS metric_formatting (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  thresholds JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, metric_name)
);

-- Cached insights
CREATE TABLE IF NOT EXISTS cached_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id TEXT NOT NULL,
  date_range TEXT NOT NULL,
  level TEXT NOT NULL, -- 'account' | 'campaign' | 'adset' | 'ad'
  data JSONB,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, date_range, level)
);

-- RLS policies
ALTER TABLE shopify_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_cached_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_formatting ENABLE ROW LEVEL SECURITY;
ALTER TABLE cached_insights ENABLE ROW LEVEL SECURITY;

-- Allow all access for now (tighten after auth is added)
CREATE POLICY "Allow all" ON shopify_connections FOR ALL USING (true);
CREATE POLICY "Allow all" ON shopify_cached_data FOR ALL USING (true);
CREATE POLICY "Allow all" ON product_maps FOR ALL USING (true);
CREATE POLICY "Allow all" ON metric_formatting FOR ALL USING (true);
CREATE POLICY "Allow all" ON cached_insights FOR ALL USING (true);
