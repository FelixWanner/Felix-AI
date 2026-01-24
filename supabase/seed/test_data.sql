-- ═══════════════════════════════════════════════════════════════
-- Life OS - Realistic Test Data Seed
-- ═══════════════════════════════════════════════════════════════
-- Run with: psql -f test_data.sql
-- Or via Supabase: supabase db seed
-- ═══════════════════════════════════════════════════════════════

-- Clean existing data (in reverse FK order)
TRUNCATE TABLE
    workout_sets, workouts, training_plan_days, training_plans,
    supplement_logs, supplement_cycles, supplements,
    habit_logs, habits,
    daily_readiness, garmin_daily_stats, daily_nutrition,
    document_embeddings, documents,
    time_entries, meeting_participants, meetings, clients,
    inbox_items, daily_logs, weekly_reviews,
    ai_insights, telegram_messages, telegram_reminders,
    monthly_goals, quarterly_goals, goals, life_areas,
    transactions, positions, invoices, tenants, units, loans, properties,
    company_financials, companies, accounts, institutions,
    daily_snapshots, sync_status
CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- 1. INSTITUTIONS (Banken)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO institutions (id, name, institution_type, website, notes) VALUES
    ('11111111-1111-1111-1111-111111111111', 'DKB Bank', 'bank', 'https://www.dkb.de', 'Hauptbank für Girokonten'),
    ('22222222-2222-2222-2222-222222222222', 'Trade Republic', 'broker', 'https://www.traderepublic.com', 'ETF-Sparpläne'),
    ('33333333-3333-3333-3333-333333333333', 'ING-DiBa', 'bank', 'https://www.ing.de', 'Tagesgeld und Baufinanzierung'),
    ('44444444-4444-4444-4444-444444444444', 'Scalable Capital', 'broker', 'https://www.scalable.capital', 'Zweites Depot'),
    ('55555555-5555-5555-5555-555555555555', 'Sparkasse München', 'bank', 'https://www.sparkasse-muenchen.de', 'Baufinanzierung Immobilie 1');

-- ═══════════════════════════════════════════════════════════════
-- 2. ACCOUNTS (Konten) - 3-5 pro Bank
-- ═══════════════════════════════════════════════════════════════

INSERT INTO accounts (id, institution_id, name, account_type, iban, current_balance, currency, is_active, low_balance_threshold, notes) VALUES
    -- DKB (4 Konten)
    ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'DKB Girokonto', 'girokonto', 'DE89370400440532013000', 8547.32, 'EUR', true, 1000, 'Hauptkonto für laufende Ausgaben'),
    ('a1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'DKB Visa Kreditkarte', 'kreditkarte', NULL, -1823.45, 'EUR', true, NULL, 'Kreditkarte mit Teilzahlung'),
    ('a1111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'DKB Mietkonto', 'girokonto', 'DE89370400440532013001', 15234.89, 'EUR', true, 5000, 'Separates Konto für Mieteinnahmen'),
    ('a1111111-1111-1111-1111-111111111114', '11111111-1111-1111-1111-111111111111', 'DKB Notgroschen', 'tagesgeld', 'DE89370400440532013002', 25000.00, 'EUR', true, 20000, '6 Monate Notreserve'),

    -- Trade Republic (3 Konten)
    ('a2222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', 'TR Verrechnungskonto', 'verrechnungskonto', NULL, 1523.67, 'EUR', true, 500, 'Cash für Nachkäufe'),
    ('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'TR Depot Hauptportfolio', 'depot', NULL, 87543.21, 'EUR', true, NULL, 'ETF-Weltportfolio'),
    ('a2222222-2222-2222-2222-222222222223', '22222222-2222-2222-2222-222222222222', 'TR Crypto', 'crypto', NULL, 4521.00, 'EUR', true, NULL, 'BTC/ETH Positionen'),

    -- ING (4 Konten)
    ('a3333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333333', 'ING Extra-Konto', 'tagesgeld', 'DE89500105175419265381', 12500.00, 'EUR', true, 5000, 'Urlaubsrücklage'),
    ('a3333333-3333-3333-3333-333333333332', '33333333-3333-3333-3333-333333333333', 'ING Festgeld 12M', 'festgeld', NULL, 30000.00, 'EUR', true, NULL, '3.5% bis März 2025'),
    ('a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'ING Girokonto', 'girokonto', 'DE89500105175419265382', 2341.56, 'EUR', true, 500, 'Zweitkonto'),
    ('a3333333-3333-3333-3333-333333333334', '33333333-3333-3333-3333-333333333333', 'ING Baufinanzierung Konto', 'darlehenskonto', NULL, -287500.00, 'EUR', true, NULL, 'Darlehen Wohnung 1'),

    -- Scalable (3 Konten)
    ('a4444444-4444-4444-4444-444444444441', '44444444-4444-4444-4444-444444444444', 'Scalable Cash', 'verrechnungskonto', NULL, 892.33, 'EUR', true, 200, NULL),
    ('a4444444-4444-4444-4444-444444444442', '44444444-4444-4444-4444-444444444444', 'Scalable Prime Depot', 'depot', NULL, 45678.90, 'EUR', true, NULL, 'Themen-ETFs'),
    ('a4444444-4444-4444-4444-444444444443', '44444444-4444-4444-4444-444444444444', 'Scalable Robo', 'depot', NULL, 15234.56, 'EUR', true, NULL, 'Robo-Advisor Portfolio'),

    -- Sparkasse (3 Konten)
    ('a5555555-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555555', 'Sparkasse Girokonto', 'girokonto', 'DE89701500000000123456', 3456.78, 'EUR', true, 1000, 'Lokales Geschäftskonto'),
    ('a5555555-5555-5555-5555-555555555552', '55555555-5555-5555-5555-555555555555', 'Sparkasse Darlehen MFH', 'darlehenskonto', NULL, -425000.00, 'EUR', true, NULL, 'Mehrfamilienhaus'),
    ('a5555555-5555-5555-5555-555555555553', '55555555-5555-5555-5555-555555555555', 'Sparkasse Bausparvertrag', 'bausparvertrag', NULL, 18500.00, 'EUR', true, NULL, 'Für nächste Immobilie');

-- ═══════════════════════════════════════════════════════════════
-- 3. PROPERTIES (5 Immobilien)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO properties (id, name, street, house_number, postal_code, city, country, property_type, year_built, purchase_date, purchase_price, current_value, square_meters, notes) VALUES
    ('p1111111-1111-1111-1111-111111111111', 'ETW München Schwabing', 'Leopoldstraße', '42', '80802', 'München', 'DE', 'eigentumswohnung', 1985, '2015-03-15', 285000.00, 485000.00, 78.5, '2-Zimmer, vermietet seit 2015'),
    ('p2222222-2222-2222-2222-222222222222', 'MFH Nürnberg Zentrum', 'Königstraße', '15', '90402', 'Nürnberg', 'DE', 'mehrfamilienhaus', 1962, '2018-09-01', 680000.00, 920000.00, 485.0, '6 Wohneinheiten, kernsaniert 2019'),
    ('p3333333-3333-3333-3333-333333333333', 'ETW Berlin Prenzlauer Berg', 'Schönhauser Allee', '88', '10439', 'Berlin', 'DE', 'eigentumswohnung', 1905, '2020-06-20', 425000.00, 510000.00, 95.0, '3-Zimmer Altbau, selbst genutzt'),
    ('p4444444-4444-4444-4444-444444444444', 'Gewerbeeinheit Leipzig', 'Petersstraße', '5', '04109', 'Leipzig', 'DE', 'gewerbeimmobilie', 1998, '2022-01-10', 320000.00, 345000.00, 120.0, 'Ladenfläche EG, langfristig vermietet'),
    ('p5555555-5555-5555-5555-555555555555', 'Ferienhaus Ostsee', 'Strandweg', '12', '23946', 'Boltenhagen', 'DE', 'ferienimmobilie', 2005, '2023-04-01', 380000.00, 395000.00, 85.0, 'Ferienvermietung, gute Rendite im Sommer');

-- ═══════════════════════════════════════════════════════════════
-- 4. UNITS (15 Wohneinheiten)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO units (id, property_id, unit_number, unit_type, floor, square_meters, rooms, monthly_rent_target, is_rented, notes) VALUES
    -- ETW München (1 Unit = Wohnung selbst)
    ('u1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'EG links', 'wohnung', 0, 78.5, 2, 1450.00, true, NULL),

    -- MFH Nürnberg (6 Units)
    ('u2222222-2222-2222-2222-222222222221', 'p2222222-2222-2222-2222-222222222222', '1. OG links', 'wohnung', 1, 75.0, 2, 850.00, true, NULL),
    ('u2222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', '1. OG rechts', 'wohnung', 1, 82.0, 3, 920.00, true, NULL),
    ('u2222222-2222-2222-2222-222222222223', 'p2222222-2222-2222-2222-222222222222', '2. OG links', 'wohnung', 2, 75.0, 2, 850.00, true, NULL),
    ('u2222222-2222-2222-2222-222222222224', 'p2222222-2222-2222-2222-222222222222', '2. OG rechts', 'wohnung', 2, 82.0, 3, 920.00, false, 'Aktuell Renovierung'),
    ('u2222222-2222-2222-2222-222222222225', 'p2222222-2222-2222-2222-222222222222', '3. OG links', 'wohnung', 3, 85.0, 3, 950.00, true, NULL),
    ('u2222222-2222-2222-2222-222222222226', 'p2222222-2222-2222-2222-222222222222', '3. OG rechts', 'wohnung', 3, 86.0, 3, 960.00, true, NULL),

    -- ETW Berlin (1 Unit - selbst genutzt)
    ('u3333333-3333-3333-3333-333333333331', 'p3333333-3333-3333-3333-333333333333', 'Whg 4', 'wohnung', 2, 95.0, 3, NULL, false, 'Eigennutzung'),

    -- Gewerbe Leipzig (2 Units)
    ('u4444444-4444-4444-4444-444444444441', 'p4444444-4444-4444-4444-444444444444', 'Laden EG', 'gewerbe', 0, 80.0, NULL, 2200.00, true, 'Bekleidungsgeschäft'),
    ('u4444444-4444-4444-4444-444444444442', 'p4444444-4444-4444-4444-444444444444', 'Büro 1. OG', 'gewerbe', 1, 40.0, NULL, 800.00, true, 'Steuerberater'),

    -- Ferienhaus Ostsee (4 Units/Zimmer)
    ('u5555555-5555-5555-5555-555555555551', 'p5555555-5555-5555-5555-555555555555', 'Whg Meerblick', 'ferienwohnung', 1, 45.0, 2, 120.00, true, 'Pro Nacht Hochsaison'),
    ('u5555555-5555-5555-5555-555555555552', 'p5555555-5555-5555-5555-555555555555', 'Whg Garten', 'ferienwohnung', 0, 40.0, 1, 95.00, true, 'Pro Nacht Hochsaison');

-- ═══════════════════════════════════════════════════════════════
-- 5. TENANTS (10 Mieter)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO tenants (id, unit_id, first_name, last_name, email, phone, move_in_date, contract_end_date, monthly_rent, deposit_amount, deposit_paid, status, notes) VALUES
    -- München
    ('t1111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', 'Thomas', 'Müller', 'thomas.mueller@email.de', '+49 170 1234567', '2015-04-01', NULL, 1450.00, 4350.00, true, 'active', 'Seit Anfang dabei, zuverlässig'),

    -- Nürnberg MFH
    ('t2222222-2222-2222-2222-222222222221', 'u2222222-2222-2222-2222-222222222221', 'Maria', 'Schmidt', 'maria.schmidt@email.de', '+49 171 2345678', '2019-05-01', '2025-04-30', 850.00, 2550.00, true, 'active', NULL),
    ('t2222222-2222-2222-2222-222222222222', 'u2222222-2222-2222-2222-222222222222', 'Klaus', 'Weber', 'klaus.weber@email.de', '+49 172 3456789', '2020-01-01', NULL, 920.00, 2760.00, true, 'active', 'Familie mit 2 Kindern'),
    ('t2222222-2222-2222-2222-222222222223', 'u2222222-2222-2222-2222-222222222223', 'Anna', 'Fischer', 'anna.fischer@email.de', '+49 173 4567890', '2021-08-01', NULL, 850.00, 2550.00, true, 'active', 'Studentin'),
    ('t2222222-2222-2222-2222-222222222225', 'u2222222-2222-2222-2222-222222222225', 'Peter', 'Wagner', 'peter.wagner@email.de', '+49 174 5678901', '2019-03-01', '2025-02-28', 950.00, 2850.00, true, 'active', 'Vertrag läuft aus'),
    ('t2222222-2222-2222-2222-222222222226', 'u2222222-2222-2222-2222-222222222226', 'Lisa', 'Becker', 'lisa.becker@email.de', '+49 175 6789012', '2022-06-01', NULL, 960.00, 2880.00, true, 'active', NULL),

    -- Leipzig Gewerbe
    ('t4444444-4444-4444-4444-444444444441', 'u4444444-4444-4444-4444-444444444441', 'Fashion', 'GmbH', 'kontakt@fashiongmbh.de', '+49 341 1234567', '2022-03-01', '2032-02-28', 2200.00, 6600.00, true, 'active', '10-Jahres Gewerbemietvertrag'),
    ('t4444444-4444-4444-4444-444444444442', 'u4444444-4444-4444-4444-444444444442', 'Steuerberatung', 'Meier', 'info@stb-meier.de', '+49 341 2345678', '2022-06-01', '2027-05-31', 800.00, 2400.00, true, 'active', '5-Jahres Gewerbemietvertrag'),

    -- Gekündigte/Ehemalige
    ('t9999999-9999-9999-9999-999999999991', 'u2222222-2222-2222-2222-222222222224', 'Michael', 'Braun', 'michael.braun@email.de', '+49 176 7890123', '2020-04-01', '2024-12-31', 920.00, 2760.00, true, 'gekuendigt', 'Auszug wegen Renovierung'),
    ('t9999999-9999-9999-9999-999999999992', NULL, 'Sandra', 'Klein', 'sandra.klein@email.de', '+49 177 8901234', '2018-01-01', '2023-06-30', 800.00, 2400.00, true, 'ausgezogen', 'Ehemalige Mieterin MFH');

-- ═══════════════════════════════════════════════════════════════
-- 6. LOANS (5 Darlehen)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO loans (id, property_id, account_id, institution_id, name, loan_type, original_amount, current_balance, interest_rate, interest_fixed_until, monthly_payment, start_date, end_date, status, notes) VALUES
    ('l1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333334', '33333333-3333-3333-3333-333333333333', 'ING Baufi München', 'annuitaeten', 250000.00, 187500.00, 1.85, '2025-03-31', 1150.00, '2015-04-01', '2035-03-31', 'active', 'Zinsbindung läuft bald aus!'),
    ('l2222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', 'a5555555-5555-5555-5555-555555555552', '55555555-5555-5555-5555-555555555555', 'Sparkasse MFH Nürnberg', 'annuitaeten', 500000.00, 425000.00, 2.10, '2028-09-01', 2100.00, '2018-09-01', '2043-08-31', 'active', 'Gute Konditionen gesichert'),
    ('l3333333-3333-3333-3333-333333333333', 'p3333333-3333-3333-3333-333333333333', NULL, '33333333-3333-3333-3333-333333333333', 'ING Berlin Wohnung', 'annuitaeten', 350000.00, 312000.00, 0.95, '2030-06-20', 1250.00, '2020-06-20', '2050-06-19', 'active', 'Historisch niedriger Zins'),
    ('l4444444-4444-4444-4444-444444444444', 'p4444444-4444-4444-4444-444444444444', NULL, '55555555-5555-5555-5555-555555555555', 'Sparkasse Gewerbe Leipzig', 'annuitaeten', 250000.00, 228000.00, 2.80, '2027-01-10', 1400.00, '2022-01-10', '2037-01-09', 'active', NULL),
    ('l5555555-5555-5555-5555-555555555555', 'p5555555-5555-5555-5555-555555555555', NULL, '33333333-3333-3333-3333-333333333333', 'ING Ferienhaus', 'annuitaeten', 280000.00, 268000.00, 3.45, '2033-04-01', 1350.00, '2023-04-01', '2043-03-31', 'active', 'Etwas höherer Zins wegen Ferienimmobilie');

-- ═══════════════════════════════════════════════════════════════
-- 7. POSITIONS (2 Portfolios à 5 ETFs)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO positions (id, account_id, symbol, name, isin, quantity, avg_buy_price, current_price, current_value, unrealized_gain_loss, unrealized_gain_loss_percent, last_updated) VALUES
    -- Trade Republic Hauptportfolio
    ('pos11111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'VWCE', 'Vanguard FTSE All-World', 'IE00BK5BQT80', 450.00, 98.50, 118.75, 53437.50, 9112.50, 20.56, NOW()),
    ('pos11111-1111-1111-1111-111111111112', 'a2222222-2222-2222-2222-222222222222', 'ISAC', 'iShares MSCI ACWI', 'IE00B6R52259', 280.00, 62.30, 71.45, 20006.00, 2562.00, 14.69, NOW()),
    ('pos11111-1111-1111-1111-111111111113', 'a2222222-2222-2222-2222-222222222222', 'EUNL', 'iShares Core MSCI Europe', 'IE00B4K48X80', 150.00, 28.90, 31.25, 4687.50, 352.50, 8.13, NOW()),
    ('pos11111-1111-1111-1111-111111111114', 'a2222222-2222-2222-2222-222222222222', 'IEMA', 'iShares MSCI EM', 'IE00B4L5YC18', 200.00, 42.15, 38.90, 7780.00, -650.00, -7.71, NOW()),
    ('pos11111-1111-1111-1111-111111111115', 'a2222222-2222-2222-2222-222222222222', 'SPYD', 'SPDR S&P US Dividend', 'IE00B6YX5D40', 40.00, 38.20, 40.80, 1632.21, 104.21, 6.81, NOW()),

    -- Scalable Prime Depot (Themen-ETFs)
    ('pos22222-2222-2222-2222-222222222221', 'a4444444-4444-4444-4444-444444444442', 'IUIT', 'iShares S&P 500 IT', 'IE00B3WJKG14', 85.00, 85.50, 98.75, 8393.75, 1126.25, 15.50, NOW()),
    ('pos22222-2222-2222-2222-222222222222', 'a4444444-4444-4444-4444-444444444442', 'WCLD', 'WisdomTree Cloud Computing', 'IE00BJGWQN72', 120.00, 42.80, 38.45, 4614.00, -522.00, -10.17, NOW()),
    ('pos22222-2222-2222-2222-222222222223', 'a4444444-4444-4444-4444-444444444442', 'L&G CYBR', 'L&G Cyber Security', 'IE00BYPLS672', 180.00, 18.90, 22.15, 3987.00, 585.00, 17.20, NOW()),
    ('pos22222-2222-2222-2222-222222222224', 'a4444444-4444-4444-4444-444444444442', 'RBOT', 'iShares Automation & Robotics', 'IE00BYZK4552', 200.00, 12.45, 13.80, 2760.00, 270.00, 10.84, NOW()),
    ('pos22222-2222-2222-2222-222222222225', 'a4444444-4444-4444-4444-444444444442', 'INRG', 'iShares Global Clean Energy', 'IE00B1XNHC34', 350.00, 11.20, 8.95, 3132.50, -787.50, -20.09, NOW());

-- ═══════════════════════════════════════════════════════════════
-- 8. HABITS (10 Habits)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO habits (id, name, description, category, frequency, target_value, unit, target_days, reminder_time, is_active, sort_order) VALUES
    ('h1111111-1111-1111-1111-111111111111', 'Protein 180g', 'Mindestens 180g Protein pro Tag', 'ernaehrung', 'daily', 180, 'g', NULL, NULL, true, 1),
    ('h2222222-2222-2222-2222-222222222222', 'Meditation', '10 Minuten Meditation morgens', 'gesundheit', 'daily', 10, 'min', NULL, '06:30', true, 2),
    ('h3333333-3333-3333-3333-333333333333', '10.000 Schritte', 'Tägliches Schrittziel', 'fitness', 'daily', 10000, 'schritte', NULL, NULL, true, 3),
    ('h4444444-4444-4444-4444-444444444444', 'Krafttraining', '4x pro Woche Gym', 'fitness', 'weekly', 4, 'sessions', '[1,2,4,5]', '17:00', true, 4),
    ('h5555555-5555-5555-5555-555555555555', 'Wasser 3L', 'Mindestens 3 Liter Wasser', 'ernaehrung', 'daily', 3000, 'ml', NULL, NULL, true, 5),
    ('h6666666-6666-6666-6666-666666666666', 'Lesen', '30 Minuten lesen', 'produktivitaet', 'daily', 30, 'min', NULL, '21:00', true, 6),
    ('h7777777-7777-7777-7777-777777777777', 'Journaling', 'Abend-Reflexion', 'produktivitaet', 'daily', 1, 'count', NULL, '21:30', true, 7),
    ('h8888888-8888-8888-8888-888888888888', 'Cold Shower', 'Kalte Dusche morgens', 'gesundheit', 'daily', 1, 'count', NULL, '06:00', true, 8),
    ('h9999999-9999-9999-9999-999999999999', 'Keine Snacks', 'Keine Snacks zwischen Mahlzeiten', 'ernaehrung', 'daily', 1, 'count', NULL, NULL, true, 9),
    ('haaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Weekly Review', 'Sonntags Weekly Review', 'produktivitaet', 'weekly', 1, 'count', '[7]', '18:00', true, 10);

-- ═══════════════════════════════════════════════════════════════
-- 9. HABIT_LOGS (30 Tage, mit variierender Completion)
-- ═══════════════════════════════════════════════════════════════

-- Generate habit logs for the last 30 days with realistic patterns
INSERT INTO habit_logs (habit_id, date, value, is_completed, notes)
SELECT
    h.id,
    d.date,
    CASE
        WHEN h.target_value IS NOT NULL THEN
            CASE WHEN random() < completion_chance THEN h.target_value * (0.9 + random() * 0.2) ELSE h.target_value * random() * 0.7 END
        ELSE NULL
    END,
    random() < completion_chance,
    NULL
FROM habits h
CROSS JOIN generate_series(CURRENT_DATE - 29, CURRENT_DATE, '1 day'::interval) AS d(date)
CROSS JOIN LATERAL (
    SELECT CASE h.name
        WHEN 'Protein 180g' THEN 0.85
        WHEN 'Meditation' THEN 0.70
        WHEN '10.000 Schritte' THEN 0.75
        WHEN 'Krafttraining' THEN 0.80
        WHEN 'Wasser 3L' THEN 0.65
        WHEN 'Lesen' THEN 0.55
        WHEN 'Journaling' THEN 0.45
        WHEN 'Cold Shower' THEN 0.40
        WHEN 'Keine Snacks' THEN 0.60
        WHEN 'Weekly Review' THEN 0.90
        ELSE 0.50
    END AS completion_chance
) AS chance
WHERE h.is_active = true
  AND (h.frequency = 'daily' OR (h.frequency = 'weekly' AND EXTRACT(ISODOW FROM d.date) = 7))
ON CONFLICT (habit_id, date) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 10. SUPPLEMENTS (5 Supplements)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO supplements (id, name, brand, category, dosage_amount, dosage_unit, frequency, timing, current_stock, reorder_threshold, cost_per_unit, is_active, notes) VALUES
    ('s1111111-1111-1111-1111-111111111111', 'Vitamin D3', 'Sunday Natural', 'vitamin', 5000, 'IU', 'daily', 'morgens', 180, 30, 0.12, true, 'Mit Fett einnehmen'),
    ('s2222222-2222-2222-2222-222222222222', 'Omega-3 Fischöl', 'Nordic Naturals', 'aminosaeure', 2000, 'mg', 'daily', 'morgens', 90, 20, 0.45, true, 'EPA/DHA 2:1'),
    ('s3333333-3333-3333-3333-333333333333', 'Magnesium Glycinat', 'NOW Foods', 'mineral', 400, 'mg', 'daily', 'abends', 120, 30, 0.18, true, 'Hilft beim Schlafen'),
    ('s4444444-4444-4444-4444-444444444444', 'Kreatin Monohydrat', 'Creapure', 'aminosaeure', 5, 'g', 'daily', 'post_workout', 500, 100, 0.08, true, 'Täglich, nicht nur Training'),
    ('s5555555-5555-5555-5555-555555555555', 'Ashwagandha KSM-66', 'Jarrow', 'nootropic', 600, 'mg', 'daily', 'abends', 60, 15, 0.35, true, 'Stressabbau, Cortisol');

-- ═══════════════════════════════════════════════════════════════
-- 11. GARMIN_DAILY_STATS (30 Tage)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO garmin_daily_stats (
    date, sleep_score, sleep_duration_minutes, deep_sleep_minutes, light_sleep_minutes,
    rem_sleep_minutes, awake_minutes, body_battery_start, body_battery_end,
    body_battery_charged, body_battery_drained, stress_avg, stress_max,
    rest_stress_minutes, low_stress_minutes, medium_stress_minutes, high_stress_minutes,
    steps, active_calories, total_calories, intensity_minutes, floors_climbed,
    resting_hr, hrv_status, hrv_value, synced_at
)
SELECT
    d.date,
    -- Sleep Score: 55-95 with some variation
    55 + floor(random() * 40)::int,
    -- Sleep Duration: 5.5-8.5 hours
    330 + floor(random() * 180)::int,
    -- Deep Sleep: 45-90 min
    45 + floor(random() * 45)::int,
    -- Light Sleep: 180-280 min
    180 + floor(random() * 100)::int,
    -- REM: 60-120 min
    60 + floor(random() * 60)::int,
    -- Awake: 10-45 min
    10 + floor(random() * 35)::int,
    -- Body Battery Start: 40-95
    40 + floor(random() * 55)::int,
    -- Body Battery End: 15-45
    15 + floor(random() * 30)::int,
    -- Charged: 30-70
    30 + floor(random() * 40)::int,
    -- Drained: 50-100
    50 + floor(random() * 50)::int,
    -- Stress Avg: 25-55
    25 + floor(random() * 30)::int,
    -- Stress Max: 60-95
    60 + floor(random() * 35)::int,
    -- Rest Stress Minutes: 300-480
    300 + floor(random() * 180)::int,
    -- Low Stress: 180-360
    180 + floor(random() * 180)::int,
    -- Medium Stress: 60-180
    60 + floor(random() * 120)::int,
    -- High Stress: 0-60
    floor(random() * 60)::int,
    -- Steps: 5000-15000
    5000 + floor(random() * 10000)::int,
    -- Active Calories: 300-800
    300 + floor(random() * 500)::int,
    -- Total Calories: 2000-3000
    2000 + floor(random() * 1000)::int,
    -- Intensity Minutes: 0-90
    floor(random() * 90)::int,
    -- Floors: 3-20
    3 + floor(random() * 17)::int,
    -- Resting HR: 48-62
    48 + floor(random() * 14)::int,
    -- HRV Status
    (ARRAY['balanced', 'balanced', 'balanced', 'high', 'low'])[floor(random() * 5) + 1],
    -- HRV Value: 35-75
    35 + floor(random() * 40)::int,
    NOW()
FROM generate_series(CURRENT_DATE - 29, CURRENT_DATE, '1 day'::interval) AS d(date);

-- ═══════════════════════════════════════════════════════════════
-- 12. DAILY_READINESS (30 Tage, basierend auf Garmin)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO daily_readiness (date, sleep_score, hrv_status, body_battery, stress_avg, readiness_score, recommendation)
SELECT
    g.date,
    g.sleep_score,
    g.hrv_status,
    g.body_battery_start,
    g.stress_avg,
    -- Calculated readiness score
    LEAST(100, GREATEST(0,
        (g.sleep_score * 0.3) +
        (g.body_battery_start * 0.25) +
        (CASE g.hrv_status WHEN 'balanced' THEN 20 WHEN 'high' THEN 15 ELSE 5 END) +
        (15 - (g.stress_avg * 0.15)) +
        10
    ))::int,
    -- Recommendation
    CASE
        WHEN g.sleep_score >= 80 AND g.body_battery_start >= 70 THEN 'full_intensity'
        WHEN g.sleep_score >= 60 AND g.body_battery_start >= 50 THEN 'moderate'
        WHEN g.sleep_score >= 40 OR g.body_battery_start >= 30 THEN 'light_only'
        ELSE 'rest_day'
    END
FROM garmin_daily_stats g;

-- ═══════════════════════════════════════════════════════════════
-- 13. LIFE_AREAS & GOALS
-- ═══════════════════════════════════════════════════════════════

INSERT INTO life_areas (id, name, description, color, icon, sort_order) VALUES
    ('la111111-1111-1111-1111-111111111111', 'Finanzen & Vermögen', 'Finanzielle Unabhängigkeit und Vermögensaufbau', '#22c55e', 'wallet', 1),
    ('la222222-2222-2222-2222-222222222222', 'Gesundheit & Fitness', 'Körperliche und mentale Gesundheit', '#ef4444', 'heart', 2),
    ('la333333-3333-3333-3333-333333333333', 'Karriere & Business', 'Berufliche Entwicklung', '#3b82f6', 'briefcase', 3),
    ('la444444-4444-4444-4444-444444444444', 'Beziehungen', 'Familie, Freunde, Partner', '#ec4899', 'users', 4),
    ('la555555-5555-5555-5555-555555555555', 'Persönliches Wachstum', 'Lernen, Hobbies, Selbstentwicklung', '#8b5cf6', 'brain', 5);

-- Jahresziel
INSERT INTO goals (id, life_area_id, title, description, goal_type, target_value, current_value, unit, start_date, target_date, status, priority) VALUES
    ('g1111111-1111-1111-1111-111111111111', 'la111111-1111-1111-1111-111111111111', 'Nettovermögen 500k erreichen', 'FIRE-Ziel: Nettovermögen auf 500.000€ steigern', 'yearly', 500000, 425000, 'EUR', '2024-01-01', '2024-12-31', 'in_progress', 1),
    ('g2222222-2222-2222-2222-222222222222', 'la222222-2222-2222-2222-222222222222', 'Körperfett auf 15% reduzieren', 'Body Recomposition', 'yearly', 15, 18.5, '%', '2024-01-01', '2024-12-31', 'in_progress', 2),
    ('g3333333-3333-3333-3333-333333333333', 'la333333-3333-3333-3333-333333333333', '100k Umsatz Freelancing', 'Nebenberuflich 100k Jahresumsatz', 'yearly', 100000, 67500, 'EUR', '2024-01-01', '2024-12-31', 'in_progress', 3);

-- Quartalsziele
INSERT INTO quarterly_goals (id, goal_id, quarter, year, target_value, current_value, notes) VALUES
    ('qg111111-1111-1111-1111-111111111111', 'g1111111-1111-1111-1111-111111111111', 1, 2024, 440000, 442000, 'Q1 übertroffen'),
    ('qg111111-1111-1111-1111-111111111112', 'g1111111-1111-1111-1111-111111111111', 2, 2024, 460000, 458000, 'Knapp verfehlt'),
    ('qg111111-1111-1111-1111-111111111113', 'g1111111-1111-1111-1111-111111111111', 3, 2024, 480000, 475000, 'In Arbeit'),
    ('qg111111-1111-1111-1111-111111111114', 'g1111111-1111-1111-1111-111111111111', 4, 2024, 500000, NULL, 'Geplant'),

    ('qg222222-2222-2222-2222-222222222221', 'g2222222-2222-2222-2222-222222222222', 1, 2024, 19, 19.2, NULL),
    ('qg222222-2222-2222-2222-222222222222', 'g2222222-2222-2222-2222-222222222222', 2, 2024, 17.5, 18.1, NULL),
    ('qg222222-2222-2222-2222-222222222223', 'g2222222-2222-2222-2222-222222222222', 3, 2024, 16, 18.5, 'Rückschlag durch Urlaub'),
    ('qg222222-2222-2222-2222-222222222224', 'g2222222-2222-2222-2222-222222222222', 4, 2024, 15, NULL, NULL);

-- Monatsziele
INSERT INTO monthly_goals (id, quarterly_goal_id, month, year, target_value, current_value, notes) VALUES
    ('mg111111-1111-1111-1111-111111111111', 'qg111111-1111-1111-1111-111111111113', 7, 2024, 468000, 470000, NULL),
    ('mg111111-1111-1111-1111-111111111112', 'qg111111-1111-1111-1111-111111111113', 8, 2024, 474000, 472000, NULL),
    ('mg111111-1111-1111-1111-111111111113', 'qg111111-1111-1111-1111-111111111113', 9, 2024, 480000, 475000, 'Aktueller Stand');

-- ═══════════════════════════════════════════════════════════════
-- 14. INBOX_ITEMS (Sample Tasks)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO inbox_items (id, source, item_type, title, content, status, priority, due_date, scheduled_date, context, tags, created_at) VALUES
    ('i1111111-1111-1111-1111-111111111111', 'manual', 'task', 'Anschlussfinanzierung ING prüfen', 'Zinsbindung München läuft März 2025 aus. Angebote einholen!', 'in_bearbeitung', 'hoch', '2025-01-15', NULL, '@finance', '["immobilien", "darlehen"]', NOW() - INTERVAL '5 days'),
    ('i2222222-2222-2222-2222-222222222222', 'telegram', 'task', 'Steuererklärung 2023 einreichen', NULL, 'neu', 'hoch', '2024-07-31', NULL, '@admin', '["steuern"]', NOW() - INTERVAL '2 days'),
    ('i3333333-3333-3333-3333-333333333333', 'email', 'task', 'Mieterhöhung Nürnberg 1.OG links prüfen', 'Ortsübliche Vergleichsmiete checken', 'neu', 'mittel', '2024-09-01', NULL, '@immobilien', '["mietvertrag", "nürnberg"]', NOW() - INTERVAL '1 day'),
    ('i4444444-4444-4444-4444-444444444444', 'manual', 'task', 'ETF-Sparplan erhöhen', 'Von 1000€ auf 1500€ erhöhen bei TR', 'erledigt', 'niedrig', NULL, NULL, '@finance', '["investment"]', NOW() - INTERVAL '10 days'),
    ('i5555555-5555-5555-5555-555555555555', 'manual', 'note', 'Idee: Ferienhaus Buchungsportal', 'Eigene Website für Direktbuchungen Ostsee erstellen?', 'someday', 'niedrig', NULL, NULL, '@projekte', '["ferienhaus", "idee"]', NOW() - INTERVAL '15 days'),
    ('i6666666-6666-6666-6666-666666666666', 'telegram', 'task', 'Handwerker für MFH Nürnberg beauftragen', 'Renovierung 2.OG rechts planen', 'today', 'hoch', CURRENT_DATE, CURRENT_DATE, '@immobilien', '["renovierung", "handwerker"]', NOW()),
    ('i7777777-7777-7777-7777-777777777777', 'manual', 'task', 'Mietervertrag Wagner verlängern', 'Gespräch führen wegen Verlängerung', 'in_bearbeitung', 'mittel', '2025-01-31', NULL, '@immobilien', '["mietvertrag", "nürnberg"]', NOW() - INTERVAL '3 days');

-- ═══════════════════════════════════════════════════════════════
-- 15. DAILY_SNAPSHOTS (Vermögensentwicklung)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO daily_snapshots (date, total_assets, total_liabilities, net_worth, cash_value, investment_value, property_value, company_value)
SELECT
    d.date,
    -- Total Assets: ~2M with slight growth
    2050000 + (EXTRACT(DOY FROM d.date) * 500) + floor(random() * 10000),
    -- Total Liabilities: ~1.4M slowly decreasing
    1420000 - (EXTRACT(DOY FROM d.date) * 200) - floor(random() * 2000),
    -- Net Worth (calculated but with variation)
    NULL, -- Will be calculated
    -- Cash: ~75k
    75000 + floor(random() * 5000),
    -- Investment: ~150k with growth
    145000 + (EXTRACT(DOY FROM d.date) * 100) + floor(random() * 3000),
    -- Property: ~2.65M
    2655000 + floor(random() * 5000),
    -- Company: ~25k
    25000 + floor(random() * 2000)
FROM generate_series(CURRENT_DATE - 90, CURRENT_DATE, '1 day'::interval) AS d(date);

-- Update net_worth
UPDATE daily_snapshots SET net_worth = total_assets - total_liabilities;

-- ═══════════════════════════════════════════════════════════════
-- 16. COMPANIES & FINANCIALS
-- ═══════════════════════════════════════════════════════════════

INSERT INTO companies (id, name, legal_form, tax_number, founding_date, status, notes) VALUES
    ('c1111111-1111-1111-1111-111111111111', 'IT Consulting Mustermann', 'einzelunternehmen', 'DE123456789', '2020-01-01', 'active', 'Freelancing Hauptgeschäft'),
    ('c2222222-2222-2222-2222-222222222222', 'Immobilien Mustermann GbR', 'gbr', 'DE987654321', '2018-09-01', 'active', 'Vermietung und Verpachtung');

INSERT INTO company_financials (id, company_id, year, month, revenue, expenses, profit, tax_paid, notes) VALUES
    ('cf111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 2024, 1, 8500, 1200, 7300, 0, NULL),
    ('cf111111-1111-1111-1111-111111111112', 'c1111111-1111-1111-1111-111111111111', 2024, 2, 9200, 1100, 8100, 0, NULL),
    ('cf111111-1111-1111-1111-111111111113', 'c1111111-1111-1111-1111-111111111111', 2024, 3, 7800, 1500, 6300, 0, NULL),
    ('cf111111-1111-1111-1111-111111111114', 'c1111111-1111-1111-1111-111111111111', 2024, 4, 12000, 1300, 10700, 0, 'Großprojekt'),
    ('cf111111-1111-1111-1111-111111111115', 'c1111111-1111-1111-1111-111111111111', 2024, 5, 8000, 1200, 6800, 0, NULL),
    ('cf111111-1111-1111-1111-111111111116', 'c1111111-1111-1111-1111-111111111111', 2024, 6, 9500, 1400, 8100, 0, NULL);

-- ═══════════════════════════════════════════════════════════════
-- 17. TRANSACTIONS (Sample)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO transactions (id, account_id, date, amount, currency, transaction_type, category, description, counterparty, is_recurring) VALUES
    -- Mieteinnahmen
    ('tx111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111113', CURRENT_DATE - 5, 1450.00, 'EUR', 'einnahme', 'mieteinnahmen', 'Miete München', 'Müller Thomas', true),
    ('tx111111-1111-1111-1111-111111111112', 'a1111111-1111-1111-1111-111111111113', CURRENT_DATE - 5, 850.00, 'EUR', 'einnahme', 'mieteinnahmen', 'Miete Nürnberg 1.OG links', 'Schmidt Maria', true),
    ('tx111111-1111-1111-1111-111111111113', 'a1111111-1111-1111-1111-111111111113', CURRENT_DATE - 5, 920.00, 'EUR', 'einnahme', 'mieteinnahmen', 'Miete Nürnberg 1.OG rechts', 'Weber Klaus', true),

    -- Darlehenszahlungen
    ('tx222222-2222-2222-2222-222222222221', 'a1111111-1111-1111-1111-111111111111', CURRENT_DATE - 3, -1150.00, 'EUR', 'ausgabe', 'darlehen', 'Rate ING München', 'ING-DiBa', true),
    ('tx222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', CURRENT_DATE - 3, -2100.00, 'EUR', 'ausgabe', 'darlehen', 'Rate Sparkasse MFH', 'Sparkasse', true),

    -- ETF-Sparplan
    ('tx333333-3333-3333-3333-333333333331', 'a2222222-2222-2222-2222-222222222221', CURRENT_DATE - 1, -1000.00, 'EUR', 'ausgabe', 'investment', 'ETF Sparplan VWCE', 'Trade Republic', true),

    -- Sonstige
    ('tx444444-4444-4444-4444-444444444441', 'a1111111-1111-1111-1111-111111111111', CURRENT_DATE - 2, -89.99, 'EUR', 'ausgabe', 'versicherung', 'Haftpflicht', 'Allianz', true),
    ('tx444444-4444-4444-4444-444444444442', 'a1111111-1111-1111-1111-111111111111', CURRENT_DATE - 1, 5200.00, 'EUR', 'einnahme', 'gehalt', 'Gehalt Dezember', 'Arbeitgeber GmbH', true);

-- ═══════════════════════════════════════════════════════════════
-- 18. INVOICES (Sample)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO invoices (id, property_id, invoice_number, vendor_name, invoice_date, due_date, total_amount, payment_status, category, notes) VALUES
    ('inv11111-1111-1111-1111-111111111111', 'p2222222-2222-2222-2222-222222222222', 'RE-2024-0142', 'Elektro Müller GmbH', CURRENT_DATE - 15, CURRENT_DATE + 5, 1850.00, 'offen', 'reparatur', 'Elektrik 2.OG rechts'),
    ('inv22222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', 'RE-2024-0089', 'Malermeister Schulze', CURRENT_DATE - 30, CURRENT_DATE - 10, 3200.00, 'bezahlt', 'renovierung', 'Malerarbeiten 2.OG'),
    ('inv33333-3333-3333-3333-333333333333', NULL, '2024-001234', 'Steuerberater Meier', CURRENT_DATE - 5, CURRENT_DATE + 25, 890.00, 'offen', 'steuerberatung', 'Q3 Buchhaltung'),
    ('inv44444-4444-4444-4444-444444444444', 'p1111111-1111-1111-1111-111111111111', 'HV-2024-08', 'Hausverwaltung München', CURRENT_DATE - 20, CURRENT_DATE - 5, 245.00, 'bezahlt', 'hausverwaltung', 'Monatliche HV-Gebühr');

-- ═══════════════════════════════════════════════════════════════
-- 19. SYNC_STATUS
-- ═══════════════════════════════════════════════════════════════

INSERT INTO sync_status (source, entity_type, last_sync_at, status, records_synced) VALUES
    ('garmin', 'daily_stats', NOW(), 'success', 1),
    ('bhb', 'accounts', NOW() - INTERVAL '2 hours', 'success', 15),
    ('bhb', 'transactions', NOW() - INTERVAL '2 hours', 'success', 127),
    ('trade_republic', 'positions', NOW() - INTERVAL '1 hour', 'success', 10),
    ('ai_insights', 'daily_generation', NOW() - INTERVAL '2 hours', 'success', 5);

-- ═══════════════════════════════════════════════════════════════
-- 20. AI_INSIGHTS (Sample)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO ai_insights (id, insight_type, category, priority, title, message, suggested_actions, is_read, is_actioned, related_entity_type, related_entity_id, expires_at) VALUES
    ('ai111111-1111-1111-1111-111111111111', 'loan_rate_expiring', 'wealth', 'action_required', 'Zinsbindung ING München endet bald', 'Die Zinsbindung deines Darlehens bei der ING endet am 31.03.2025. Bei der aktuellen Restschuld von 187.500€ und Marktzinsen um 3.5% solltest du jetzt Anschlussfinanzierungen vergleichen.', '[{"action": "compare_rates", "label": "Angebote vergleichen"}, {"action": "contact_bank", "label": "ING kontaktieren"}]', false, false, 'loan', 'l1111111-1111-1111-1111-111111111111', NOW() + INTERVAL '30 days'),
    ('ai222222-2222-2222-2222-222222222222', 'tenant_contract_expiring', 'wealth', 'warning', 'Mietvertrag Wagner läuft aus', 'Der Mietvertrag mit Peter Wagner (Nürnberg 3.OG links) endet am 28.02.2025. Kläre rechtzeitig ob eine Verlängerung gewünscht ist.', '[{"action": "contact_tenant", "label": "Mieter kontaktieren"}]', false, false, 'tenant', 't2222222-2222-2222-2222-222222222225', NOW() + INTERVAL '30 days'),
    ('ai333333-3333-3333-3333-333333333333', 'habit_streak_risk', 'health', 'info', 'Journaling Habit schwächelt', 'Deine Journaling Completion Rate liegt bei nur 45% in den letzten 2 Wochen. Überlege ob die Uhrzeit (21:30) für dich passt.', '[{"action": "adjust_time", "label": "Zeit anpassen"}]', true, false, 'habit', 'h7777777-7777-7777-7777-777777777777', NOW() + INTERVAL '14 days'),
    ('ai444444-4444-4444-4444-444444444444', 'position_gain_alert', 'wealth', 'info', 'VWCE +20% seit Kauf', 'Deine größte Position VWCE hat seit dem Kauf 20.56% zugelegt. Bei 53.437€ Wert könntest du über Rebalancing nachdenken.', '[{"action": "review_allocation", "label": "Allocation prüfen"}]', true, true, 'position', 'pos11111-1111-1111-1111-111111111111', NOW() + INTERVAL '30 days');

-- ═══════════════════════════════════════════════════════════════
-- FINAL: Verify Data Consistency
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_properties INT;
    v_units INT;
    v_tenants INT;
    v_accounts INT;
    v_loans INT;
    v_positions INT;
    v_habits INT;
    v_supplements INT;
    v_garmin_days INT;
    v_goals INT;
BEGIN
    SELECT COUNT(*) INTO v_properties FROM properties;
    SELECT COUNT(*) INTO v_units FROM units;
    SELECT COUNT(*) INTO v_tenants FROM tenants WHERE status = 'active';
    SELECT COUNT(*) INTO v_accounts FROM accounts WHERE is_active = true;
    SELECT COUNT(*) INTO v_loans FROM loans WHERE status = 'active';
    SELECT COUNT(*) INTO v_positions FROM positions WHERE quantity > 0;
    SELECT COUNT(*) INTO v_habits FROM habits WHERE is_active = true;
    SELECT COUNT(*) INTO v_supplements FROM supplements WHERE is_active = true;
    SELECT COUNT(*) INTO v_garmin_days FROM garmin_daily_stats;
    SELECT COUNT(*) INTO v_goals FROM goals;

    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE 'Test Data Summary:';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE 'Properties: %', v_properties;
    RAISE NOTICE 'Units: %', v_units;
    RAISE NOTICE 'Active Tenants: %', v_tenants;
    RAISE NOTICE 'Active Accounts: %', v_accounts;
    RAISE NOTICE 'Active Loans: %', v_loans;
    RAISE NOTICE 'Positions: %', v_positions;
    RAISE NOTICE 'Active Habits: %', v_habits;
    RAISE NOTICE 'Active Supplements: %', v_supplements;
    RAISE NOTICE 'Garmin Days: %', v_garmin_days;
    RAISE NOTICE 'Goals: %', v_goals;
    RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;

-- ═══════════════════════════════════════════════════════════════
-- End of Test Data Seed
-- ═══════════════════════════════════════════════════════════════
