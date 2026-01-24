-- ═══════════════════════════════════════════════════════════════
-- Property & Solar Panel Loan Tracking
-- Migration: 00015_property_solar_loans.sql
-- ═══════════════════════════════════════════════════════════════

-- 1. Loans Table
CREATE TABLE IF NOT EXISTS asset_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Asset relationship (one of these must be set)
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    solar_panel_id UUID REFERENCES solar_panels(id) ON DELETE CASCADE,

    -- Loan details
    loan_name TEXT NOT NULL,
    lender_name TEXT,
    loan_type TEXT, -- e.g., 'Annuitätendarlehen', 'Tilgungsdarlehen', 'Endfälliges Darlehen'

    -- Financial details
    principal_amount DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL, -- e.g., 3.50 for 3.5%
    term_months INTEGER NOT NULL,
    monthly_payment DECIMAL(10,2),

    -- Dates
    start_date DATE NOT NULL,
    end_date DATE,

    -- Optional details
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure loan is linked to exactly one asset
    CONSTRAINT asset_loan_check CHECK (
        (property_id IS NOT NULL AND solar_panel_id IS NULL) OR
        (property_id IS NULL AND solar_panel_id IS NOT NULL)
    )
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_asset_loans_user ON asset_loans(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_loans_property ON asset_loans(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_asset_loans_solar ON asset_loans(solar_panel_id) WHERE solar_panel_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_asset_loans_dates ON asset_loans(user_id, start_date, end_date);

-- 3. RLS Policies
ALTER TABLE asset_loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own asset_loans" ON asset_loans;
CREATE POLICY "Users can manage their own asset_loans"
ON asset_loans FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. Updated_at Trigger
DROP TRIGGER IF EXISTS set_timestamp ON asset_loans;
CREATE TRIGGER set_timestamp BEFORE UPDATE ON asset_loans
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 5. View for active loans with remaining balance calculation
CREATE OR REPLACE VIEW active_loans_overview AS
SELECT
    al.id,
    al.user_id,
    al.loan_name,
    al.lender_name,
    al.principal_amount,
    al.interest_rate,
    al.monthly_payment,
    al.start_date,
    al.end_date,
    al.term_months,

    -- Calculate months elapsed
    GREATEST(0, EXTRACT(YEAR FROM AGE(CURRENT_DATE, al.start_date)) * 12 +
             EXTRACT(MONTH FROM AGE(CURRENT_DATE, al.start_date))) AS months_elapsed,

    -- Calculate remaining months
    GREATEST(0, al.term_months -
             (EXTRACT(YEAR FROM AGE(CURRENT_DATE, al.start_date)) * 12 +
              EXTRACT(MONTH FROM AGE(CURRENT_DATE, al.start_date)))) AS months_remaining,

    -- Asset type and reference
    CASE
        WHEN al.property_id IS NOT NULL THEN 'property'
        WHEN al.solar_panel_id IS NOT NULL THEN 'solar'
    END AS asset_type,

    COALESCE(p.address, sp.location) AS asset_name,

    al.property_id,
    al.solar_panel_id

FROM asset_loans al
LEFT JOIN properties p ON al.property_id = p.id
LEFT JOIN solar_panels sp ON al.solar_panel_id = sp.id
WHERE al.end_date IS NULL OR al.end_date >= CURRENT_DATE;

-- 6. Grant access to view
GRANT SELECT ON active_loans_overview TO authenticated;

COMMENT ON TABLE asset_loans IS 'Loans/mortgages associated with properties and solar panel installations';
COMMENT ON VIEW active_loans_overview IS 'Active loans with calculated remaining balance and months';
