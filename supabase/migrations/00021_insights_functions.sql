-- ═══════════════════════════════════════════════════════════════
-- AI Insights Database Functions
-- Migration: 00021_insights_functions.sql
-- Ersetzt direkte Postgres-Queries durch RPC-fähige Functions
-- ═══════════════════════════════════════════════════════════════

-- 1. Expiring Loan Rates
CREATE OR REPLACE FUNCTION get_expiring_loan_rates()
RETURNS TABLE (
    id UUID,
    name TEXT,
    institution TEXT,
    original_amount DECIMAL,
    current_balance DECIMAL,
    interest_rate DECIMAL,
    interest_fixed_until DATE,
    monthly_payment DECIMAL,
    property_name TEXT,
    days_until_expiry INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id,
        l.name,
        l.institution,
        l.original_amount,
        l.current_balance,
        l.interest_rate,
        l.interest_fixed_until,
        l.monthly_payment,
        p.name as property_name,
        EXTRACT(DAYS FROM (l.interest_fixed_until - NOW()))::INTEGER as days_until_expiry
    FROM loans l
    LEFT JOIN properties p ON p.id = l.property_id
    WHERE l.status = 'active'
      AND l.interest_fixed_until IS NOT NULL
      AND l.interest_fixed_until < NOW() + INTERVAL '6 months'
    ORDER BY l.interest_fixed_until ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Tax-Free Properties (10-Year Rule)
CREATE OR REPLACE FUNCTION get_tax_free_properties()
RETURNS TABLE (
    id UUID,
    name TEXT,
    street TEXT,
    city TEXT,
    purchase_price DECIMAL,
    purchase_date DATE,
    current_value DECIMAL,
    years_owned DECIMAL,
    approaching_tax_free BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.street,
        p.city,
        p.purchase_price,
        p.purchase_date,
        p.current_value,
        EXTRACT(YEARS FROM AGE(NOW(), p.purchase_date))::DECIMAL as years_owned,
        (NOW() + INTERVAL '6 months' > p.purchase_date + INTERVAL '10 years') as approaching_tax_free
    FROM properties p
    WHERE p.purchase_date IS NOT NULL
      AND EXTRACT(YEARS FROM AGE(NOW(), p.purchase_date)) >= 9.5
      AND EXTRACT(YEARS FROM AGE(NOW(), p.purchase_date)) < 10.5
    ORDER BY p.purchase_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Low Balance Accounts
CREATE OR REPLACE FUNCTION get_low_balance_accounts()
RETURNS TABLE (
    id UUID,
    name TEXT,
    account_type TEXT,
    current_balance DECIMAL,
    low_balance_threshold DECIMAL,
    institution TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.name,
        a.account_type,
        a.current_balance,
        a.low_balance_threshold,
        a.institution
    FROM accounts a
    WHERE a.is_active = true
      AND a.low_balance_threshold IS NOT NULL
      AND a.current_balance < a.low_balance_threshold
    ORDER BY (a.current_balance / NULLIF(a.low_balance_threshold, 0)) ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Struggling Habits
CREATE OR REPLACE FUNCTION get_struggling_habits()
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    completed_count BIGINT,
    total_count BIGINT,
    completion_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH habit_stats AS (
        SELECT
            h.id,
            h.name,
            h.category,
            COUNT(CASE WHEN hl.is_completed THEN 1 END) as completed_count,
            COUNT(*) as total_count,
            ROUND(
                COUNT(CASE WHEN hl.is_completed THEN 1 END)::DECIMAL /
                NULLIF(COUNT(*), 0) * 100, 1
            ) as completion_rate
        FROM habits h
        LEFT JOIN habit_logs hl ON hl.habit_id = h.id
            AND hl.date >= CURRENT_DATE - 14
        WHERE h.is_active = true
        GROUP BY h.id, h.name, h.category
    )
    SELECT hs.id, hs.name, hs.category, hs.completed_count, hs.total_count, hs.completion_rate
    FROM habit_stats hs
    WHERE hs.completion_rate < 50 OR hs.completion_rate IS NULL
    ORDER BY hs.completion_rate ASC NULLS FIRST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Health Trends
CREATE OR REPLACE FUNCTION get_health_trends()
RETURNS TABLE (
    avg_sleep_7d DECIMAL,
    avg_sleep_prev DECIMAL,
    avg_stress_7d DECIMAL,
    avg_stress_prev DECIMAL,
    avg_body_battery_7d DECIMAL,
    avg_body_battery_prev DECIMAL,
    avg_resting_hr_7d DECIMAL,
    avg_resting_hr_prev DECIMAL,
    health_concern TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_stats AS (
        SELECT
            AVG(g.sleep_score) as avg_sleep_7d,
            AVG(g.stress_avg) as avg_stress_7d,
            AVG(g.body_battery_start) as avg_body_battery_7d,
            AVG(g.resting_hr) as avg_resting_hr_7d
        FROM garmin_daily_stats g
        WHERE g.date >= CURRENT_DATE - 7
    ),
    prev_stats AS (
        SELECT
            AVG(g.sleep_score) as avg_sleep_prev,
            AVG(g.stress_avg) as avg_stress_prev,
            AVG(g.body_battery_start) as avg_body_battery_prev,
            AVG(g.resting_hr) as avg_resting_hr_prev
        FROM garmin_daily_stats g
        WHERE g.date >= CURRENT_DATE - 14 AND g.date < CURRENT_DATE - 7
    )
    SELECT
        r.avg_sleep_7d,
        p.avg_sleep_prev,
        r.avg_stress_7d,
        p.avg_stress_prev,
        r.avg_body_battery_7d,
        p.avg_body_battery_prev,
        r.avg_resting_hr_7d,
        p.avg_resting_hr_prev,
        CASE
            WHEN r.avg_sleep_7d < 60 THEN 'poor_sleep'
            WHEN r.avg_stress_7d > 50 THEN 'high_stress'
            WHEN r.avg_body_battery_7d < 40 THEN 'low_energy'
            WHEN r.avg_sleep_7d < p.avg_sleep_prev - 10 THEN 'declining_sleep'
            WHEN r.avg_stress_7d > p.avg_stress_prev + 10 THEN 'increasing_stress'
            ELSE NULL
        END as health_concern
    FROM recent_stats r, prev_stats p
    WHERE r.avg_sleep_7d < 60
       OR r.avg_stress_7d > 50
       OR r.avg_body_battery_7d < 40
       OR r.avg_sleep_7d < p.avg_sleep_prev - 10
       OR r.avg_stress_7d > p.avg_stress_prev + 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Position Alerts
CREATE OR REPLACE FUNCTION get_position_alerts()
RETURNS TABLE (
    id UUID,
    symbol TEXT,
    name TEXT,
    quantity DECIMAL,
    avg_buy_price DECIMAL,
    current_price DECIMAL,
    current_value DECIMAL,
    unrealized_gain_loss DECIMAL,
    unrealized_gain_loss_percent DECIMAL,
    account_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pos.id,
        pos.symbol,
        pos.name,
        pos.quantity,
        pos.avg_buy_price,
        pos.current_price,
        pos.current_value,
        pos.unrealized_gain_loss,
        pos.unrealized_gain_loss_percent,
        a.name as account_name
    FROM positions pos
    JOIN accounts a ON a.id = pos.account_id
    WHERE pos.quantity > 0
      AND ABS(pos.unrealized_gain_loss_percent) > 20
    ORDER BY ABS(pos.unrealized_gain_loss_percent) DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Due Invoices
CREATE OR REPLACE FUNCTION get_due_invoices()
RETURNS TABLE (
    id UUID,
    invoice_number TEXT,
    vendor_name TEXT,
    total_amount DECIMAL,
    due_date DATE,
    payment_status TEXT,
    days_until_due INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.id,
        i.invoice_number,
        i.vendor_name,
        i.total_amount,
        i.due_date,
        i.payment_status,
        EXTRACT(DAYS FROM (i.due_date - CURRENT_DATE))::INTEGER as days_until_due
    FROM invoices i
    WHERE i.payment_status IN ('offen', 'teilbezahlt')
      AND i.due_date IS NOT NULL
      AND i.due_date <= CURRENT_DATE + 7
    ORDER BY i.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Expiring Tenant Contracts
CREATE OR REPLACE FUNCTION get_expiring_tenant_contracts()
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    move_in_date DATE,
    contract_end_date DATE,
    monthly_rent DECIMAL,
    unit_number TEXT,
    property_name TEXT,
    days_until_end INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.first_name,
        t.last_name,
        t.email,
        t.move_in_date,
        t.contract_end_date,
        t.monthly_rent,
        u.unit_number,
        p.name as property_name,
        EXTRACT(DAYS FROM (t.contract_end_date - CURRENT_DATE))::INTEGER as days_until_end
    FROM tenants t
    JOIN units u ON u.id = t.unit_id
    JOIN properties p ON p.id = u.property_id
    WHERE t.status = 'active'
      AND t.contract_end_date IS NOT NULL
      AND t.contract_end_date <= CURRENT_DATE + INTERVAL '3 months'
    ORDER BY t.contract_end_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Get High Priority Insights
CREATE OR REPLACE FUNCTION get_high_priority_insights()
RETURNS TABLE (
    id UUID,
    insight_type TEXT,
    category TEXT,
    priority TEXT,
    title TEXT,
    message TEXT,
    suggested_actions JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.id,
        i.insight_type,
        i.category,
        i.priority,
        i.title,
        i.message,
        i.suggested_actions
    FROM ai_insights i
    WHERE i.priority IN ('action_required', 'warning')
      AND i.is_read = false
      AND i.created_at >= NOW() - INTERVAL '1 hour'
    ORDER BY
        CASE i.priority WHEN 'action_required' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
        i.created_at DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Insert AI Insight
CREATE OR REPLACE FUNCTION insert_ai_insight(
    p_insight_type TEXT,
    p_category TEXT,
    p_priority TEXT,
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT '{}',
    p_suggested_actions JSONB DEFAULT '[]',
    p_related_entity_type TEXT DEFAULT NULL,
    p_related_entity_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO ai_insights (
        id,
        insight_type,
        category,
        priority,
        title,
        message,
        data,
        suggested_actions,
        related_entity_type,
        related_entity_id,
        is_read,
        is_actioned,
        created_at,
        expires_at
    ) VALUES (
        gen_random_uuid(),
        p_insight_type,
        p_category,
        p_priority,
        p_title,
        p_message,
        p_data,
        p_suggested_actions,
        p_related_entity_type,
        p_related_entity_id,
        false,
        false,
        NOW(),
        NOW() + INTERVAL '30 days'
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Cleanup Old Insights
CREATE OR REPLACE FUNCTION cleanup_old_insights(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ai_insights
    WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
      AND is_actioned = false;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Update Sync Status
CREATE OR REPLACE FUNCTION update_insight_sync_status(p_records_synced INTEGER)
RETURNS VOID AS $$
BEGIN
    INSERT INTO sync_status (id, source, entity_type, last_sync_at, status, records_synced)
    VALUES (gen_random_uuid(), 'ai_insights', 'daily_generation', NOW(), 'success', p_records_synced)
    ON CONFLICT (source, entity_type) DO UPDATE SET
        last_sync_at = NOW(),
        status = 'success',
        records_synced = p_records_synced,
        error_message = NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_expiring_loan_rates() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_tax_free_properties() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_low_balance_accounts() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_struggling_habits() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_health_trends() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_position_alerts() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_due_invoices() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_expiring_tenant_contracts() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_high_priority_insights() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION insert_ai_insight(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_insights(INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_insight_sync_status(INTEGER) TO authenticated, service_role;

COMMENT ON FUNCTION get_expiring_loan_rates() IS 'Get loans with interest rates expiring within 6 months';
COMMENT ON FUNCTION get_tax_free_properties() IS 'Get properties approaching 10-year tax-free sale threshold';
COMMENT ON FUNCTION get_low_balance_accounts() IS 'Get accounts below their low balance threshold';
COMMENT ON FUNCTION get_struggling_habits() IS 'Get habits with less than 50% completion rate';
COMMENT ON FUNCTION get_health_trends() IS 'Get health trend warnings from Garmin data';
COMMENT ON FUNCTION get_position_alerts() IS 'Get investment positions with significant gains/losses';
COMMENT ON FUNCTION get_due_invoices() IS 'Get invoices due within 7 days';
COMMENT ON FUNCTION get_expiring_tenant_contracts() IS 'Get tenant contracts expiring within 3 months';
