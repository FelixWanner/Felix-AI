# Fitness & Coaching Dashboard - Implementierungsstand

## ✅ Fertiggestellt

### Datenbank-Schema (Migration 00012)

Alle Tabellen wurden erstellt:

1. **body_tracking** - Tägliche Körperdaten (Gewicht, Umfang, Blutdruck, etc.)
2. **progress_photos** - Wöchentliche Progress-Fotos (4 Winkel)
3. **nutrition_compliance** - Tägliche Ernährungs-Compliance
4. **training_sessions** - Trainingseinheiten mit Metadaten
5. **training_sets** - Einzelne Sätze mit Gewicht/Reps/RPE
6. **cardio_sessions** - Cardio-Tracking
7. **supplement_slots** - Supplement-Plan Definition
8. **supplement_compliance** - Tägliche Supplement-Einnahme
9. **ped_trt_compliance** - PED/TRT Plan-Compliance
10. **weekly_updates** - Wöchentliche Zusammenfassungen

### Features

- ✅ Vollständiges Multi-Tenancy (user_id auf allen Tabellen)
- ✅ RLS Policies für alle Tabellen
- ✅ Automatische updated_at Trigger
- ✅ Helper-Funktion `calculate_weekly_compliance()`

## 🚧 Nächste Schritte (Frontend)

### 1. Fitness Dashboard Haupt-Page

Erstelle: `frontend/src/pages/Fitness.tsx`

```typescript
// Module:
// - Heute (Daily Check-in)
// - Training & Progression
// - Ernährungs-Compliance
// - Recovery
// - Weekly Update Generator
```

### 2. "Heute" Daily Check-in Component

- Gewicht (nüchtern) Input
- Plan-Compliance Ernährung Toggle
- Training geplant/erledigt
- Cardio Toggle + Details
- Supplement Checkboxes
- Schlaf/Stress/Wohlbefinden Slider

### 3. Training Session Tracker

- Session auswählen (Tag 1/2/3)
- Satz-Eingabe (Übung, Gewicht, Reps, RPE)
- Auto-PR Detection
- Trend-Anzeige

### 4. Weekly Update Generator

- Automatische Berechnung Compliance %
- Gewichtstrend
- Abweichungen sammeln
- WhatsApp Export-Text generieren

## 📊 Datenbank-Funktionen

### calculate_weekly_compliance(user_id, week_start)

Returns:
- nutrition_compliance %
- training_compliance %
- supplement_compliance %
- avg_wellbeing (1-5)
- avg_stress (1-5)
- avg_sleep_quality (hours)

## 🎯 Wichtigste KPIs

Alle KPIs werden automatisch berechnet:

1. **Ernährungs-Compliance %** - Tage vollständig nach Plan / 7
2. **Training-Compliance %** - Geplante vs absolvierte Einheiten
3. **Supplement-Compliance %** - Pflichtslots erfüllt
4. **Progression-Score** - Anzahl PRs/Woche
5. **Recovery-Score** - Sleep + Stress + Wohlbefinden

## 📝 Daily Check-in Flow (< 2 Min)

1. **Gewicht** → Input nüchtern morgens
2. **Ernährung** → Toggle + Abweichung (wenn nein)
3. **Training** → Erledigt? + Zeit
4. **Cardio** → Toggle + Typ + Dauer + HF
5. **Supplements** → Checkboxes per Slot
6. **Recovery** → 3 Slider (Schlaf/Stress/Wohlbefinden)
7. **Bemerkung** → Freitext (optional)

## 🏋️ Training Session Tracking

```typescript
interface TrainingSet {
  exercise_name: string
  set_number: number
  weight_kg: number
  reps: number
  rpe: number  // 1-10
  is_pr: boolean
  comment?: string
}
```

**Automatische Features:**
- PR Detection (höchstes Gewicht × Reps)
- RPE Drift Warning (gleiche Last, höheres RPE = Ermüdung)
- Trend-Anzeige für Top-Übungen

## 📸 Progress Photos

**Anforderungen:**
- Morgens nüchtern
- 4 Fotos: Front / Seite Links / Rücken / Seite Rechts
- Zentriert, komplett sichtbar
- Keine Selfies/Spiegel
- Nicht posen
- Neutrale Wand
- Licht auf dich

**Implementation:**
- File Upload zu Supabase Storage
- Metadaten in `progress_photos` Tabelle
- `photos_complete` Boolean (alle 4 vorhanden)

## 📋 Weekly Update Format

```
=== WEEKLY UPDATE ===
Woche: [KW] [Jahr]

Gewicht:
- Durchschnitt: [X.X] kg
- Veränderung: [+/-X.X] kg

Compliance:
- Ernährung: [X]% ([X]/7 Tage)
- Training: [X]% ([X]/[Y] Einheiten)
- Supplements: [X]%

Abweichungen:
- [Datum]: [Grund] - [Maßnahme]
- ...

Recovery:
- Schlaf: [X] Std (Ø)
- Stress: [X]/5
- Wohlbefinden: [X]/5

Bemerkungen:
[Freitext]
```

## 🔄 Integration mit Daily Logs

Das Fitness Dashboard nutzt die bestehende `daily_logs` Tabelle für:
- Schlaf (sleep_duration)
- Stress (stress_level)
- Wohlbefinden/Mood (mood)

Daher ist es perfekt integriert mit dem Tagebuch-Modul!

## 🎨 UI-Komponenten Todo

1. **FitnessDailyCheckin.tsx** - Haupt-Check-in Component
2. **TrainingSessionForm.tsx** - Training Session Erfassung
3. **TrainingSetInput.tsx** - Satz-Eingabe Component
4. **SupplementCheckboxes.tsx** - Supplement Slots
5. **WeeklyUpdateGenerator.tsx** - Update-Generator
6. **ProgressPhotoUpload.tsx** - Foto-Upload Component
7. **ComplianceCalendar.tsx** - Kalender grün/gelb/rot
8. **PRBadge.tsx** - Personal Record Badge

## 📱 Navigation

Add to `Layout.tsx`:
```typescript
{ name: 'Fitness', href: '/fitness', icon: Dumbbell }
```

## 🚀 Implementation Priority

1. **Phase 1: Daily Check-in** (heute fertigstellen)
   - Body tracking
   - Nutrition compliance
   - Supplement tracking

2. **Phase 2: Training** (morgen)
   - Session tracking
   - Set logging
   - PR detection

3. **Phase 3: Weekly Update** (übermorgen)
   - Compliance calculator
   - Export generator
   - Photo upload

## 💡 Wichtige Hinweise

- **Minimale Erfassungszeit**: Alle Formulare sind auf < 2 Min optimiert
- **Coach-Ready Export**: 1 Klick → WhatsApp-Text
- **Automatische KPIs**: Alle Metriken werden automatisch berechnet
- **Plan vs. Ist**: Klare Trennung zwischen Plan-Daten und tatsächlichen Logs
- **Versionierung**: Plan-Änderungen nur nach Coach-Freigabe

## 📦 Dependencies

Keine zusätzlichen Dependencies nötig!
Alles mit bestehenden Tools:
- React + TypeScript
- Supabase Client
- Tailwind CSS
- lucide-react Icons
- date-fns

## 🎯 Erfolgsmetriken

Dashboard erfolgreich wenn:
- ✅ Daily Check-in < 2 Minuten
- ✅ Compliance % automatisch berechnet
- ✅ Weekly Update 1-Klick Export
- ✅ Alle Abweichungen dokumentiert
- ✅ PR-Tracking automatisch
- ✅ Coach kann Report in < 1 Min erfassen
