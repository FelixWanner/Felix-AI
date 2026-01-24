-- ═══════════════════════════════════════════════════════════════
-- Migration: Solar Panels (PV-Anlagen)
-- Description: Adds table for tracking solar panel installations
-- Date: 2026-01-21
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- Solar Panels Table
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS solar_panels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Information
  name TEXT NOT NULL,
  location TEXT,
  installed_date DATE,

  -- Capacity & Performance
  capacity_kwp NUMERIC(10, 2) NOT NULL, -- Kilowatt Peak
  annual_yield_kwh NUMERIC(10, 2), -- Annual yield in kWh
  feed_in_tariff NUMERIC(10, 4), -- Feed-in tariff per kWh (EUR)

  -- Financial Data
  installation_cost NUMERIC(12, 2),
  current_value NUMERIC(12, 2),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),

  -- Property Link (optional)
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────

CREATE INDEX idx_solar_panels_user_id ON solar_panels(user_id);
CREATE INDEX idx_solar_panels_property_id ON solar_panels(property_id);
CREATE INDEX idx_solar_panels_status ON solar_panels(status);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security (RLS)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE solar_panels ENABLE ROW LEVEL SECURITY;

-- Users can only see their own solar panels
CREATE POLICY "Users can view their own solar panels"
  ON solar_panels FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own solar panels
CREATE POLICY "Users can insert their own solar panels"
  ON solar_panels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own solar panels
CREATE POLICY "Users can update their own solar panels"
  ON solar_panels FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own solar panels
CREATE POLICY "Users can delete their own solar panels"
  ON solar_panels FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Triggers
-- ─────────────────────────────────────────────────────────────

-- Update updated_at timestamp
CREATE TRIGGER set_timestamp_solar_panels
  BEFORE UPDATE ON solar_panels
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- ─────────────────────────────────────────────────────────────
-- Comments
-- ─────────────────────────────────────────────────────────────

COMMENT ON TABLE solar_panels IS 'Tracks solar panel (PV) installations and their performance metrics';
COMMENT ON COLUMN solar_panels.capacity_kwp IS 'Installed capacity in Kilowatt Peak (kWp)';
COMMENT ON COLUMN solar_panels.annual_yield_kwh IS 'Expected or actual annual yield in kilowatt hours';
COMMENT ON COLUMN solar_panels.feed_in_tariff IS 'Feed-in tariff rate per kWh in EUR';
COMMENT ON COLUMN solar_panels.installation_cost IS 'Total cost of installation';
COMMENT ON COLUMN solar_panels.current_value IS 'Current estimated value of the system';
