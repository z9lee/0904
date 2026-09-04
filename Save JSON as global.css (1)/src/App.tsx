import { useState, useEffect, useRef } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Screen =
  | 'profileSelect'
  | 'welcome' | 'language' | 'country' | 'gender' | 'ageGroup'
  | 'morningMethod' | 'morningCleanser'
  | 'eveningMethod' | 'eveningCleanser' | 'eveningDouble'
  | 'skinStatus' | 'skinDirect' | 'skinSurvey' | 'lifestyleSurvey'
  | 'dashboard' | 'timer' | 'postCheck' | 'camera' | 'complete' | 'weeklyReport'

interface AppState {
  language: string
  country: string
  gender: string
  ageGroup: string
  morningMethod: string
  morningCleanserType: string
  eveningMethod: string
  eveningCleanserPrimary: string
  eveningCleanserSecondary: string
  skinKnowledge: string
  skinType: 'dry' | 'oily' | 'combination' | ''
  diagnosisAnswers: number[]
  commonAnswers: number[]
  perceivedStatus: string
  capturedImage: string | null
}

const INITIAL: AppState = {
  language: '', country: '', gender: '', ageGroup: '',
  morningMethod: '', morningCleanserType: '',
  eveningMethod: '', eveningCleanserPrimary: '', eveningCleanserSecondary: '',
  skinKnowledge: '', skinType: '',
  diagnosisAnswers: [], commonAnswers: [],
  perceivedStatus: '', capturedImage: null,
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const COUNTRIES = [
  'Australia', 'Brazil', 'Canada', 'China', 'France', 'Germany', 'Hong Kong',
  'India', 'Indonesia', 'Italy', 'Japan', 'Malaysia', 'Mexico', 'Netherlands',
  'Philippines', 'Saudi Arabia', 'Singapore', 'South Africa', 'South Korea',
  'Spain', 'Sweden', 'Switzerland', 'Taiwan', 'Thailand', 'Turkey', 'UAE',
  'UK', 'USA', 'Vietnam',
]

const CLEANSER_TYPES = ['Cleansing Foam', 'Cleansing Milk', 'Cleansing Oil', 'Cleansing Balm', 'Cleansing Soap']

const CLEANSER_TEMP: Record<string, { range: string; label: string; desc: string }> = {
  'Cleansing Foam': { range: '30° ~ 32°C', label: 'FOAM ACTIVATION', desc: 'Optimal rich foam formation & skin balance' },
  'Cleansing Soap': { range: '30° ~ 32°C', label: 'FOAM RINSE', desc: 'Effective foam rinsing & refreshing finish' },
  'Cleansing Milk': { range: '32° ~ 34°C', label: 'GENTLE EMULSIFICATION', desc: 'Gentle emulsification & moisture-retaining cleanse' },
  'Cleansing Oil':  { range: '34° ~ 36°C', label: 'OIL DISSOLUTION', desc: 'Effective sebum & makeup dissolution' },
  'Cleansing Balm': { range: '35° ~ 37°C', label: 'DEEP MELT', desc: 'Deep pore melting & smooth oil-melting' },
}
const WATER_TEMP = { range: '28° ~ 30°C', label: 'WATER RINSE', desc: 'Gentle rinse at average facial skin temperature' }

const DIAGNOSTIC_QUESTIONS = [
  'I have a primary skin concern I want to address.',
  'Right after cleansing without any products, my skin feels tight or dry.',
  '3–4 hours after applying toner/lotion, my skin still feels dry and uncomfortable.',
  'By the afternoon, my face appears oily or shiny.',
  'My skin texture often feels rough or uneven.',
  'Products tend to sit on top of my skin without absorbing well.',
  'I experience flaking or dead skin buildup on my face.',
  'I can visibly see sebum or oil on my skin throughout the day.',
  'I frequently experience inflamed, cystic acne.',
  'I have bumpy, clogged pores or milia on my face.',
  'My face often feels warm or hot to the touch.',
  'I need cooling or soothing relief after outdoor activity.',
  'I experience redness, burning, or flushing on my face.',
  'My skin itches or stings in cold or dry weather.',
  'My skin is sensitive to environmental changes like dust or pollution.',
]

const LIFESTYLE_QUESTIONS = [
  'My skin looks dull and lacks radiance.',
  'I have visible breakout marks or scars on my face.',
  'I have dark spots or hyperpigmentation on my skin.',
  'I have recently undergone dermatologist treatments (laser/peeling).',
  'My overall skin tone appears dark or dull.',
  'I get enough sleep on average (7+ hours daily).',
  'My diet and drink habits are generally healthy.',
  'I exercise regularly (3+ times per week).',
  'My current stress level is manageable.',
]

const SCALE = ['Strongly Agree', 'Agree', 'Disagree', 'Strongly Disagree']
const SCALE_VALUES = [4, 3, 2, 1]

// ─── Logic ────────────────────────────────────────────────────────────────────

function calcSkinType(a: number[]): 'dry' | 'oily' | 'combination' {
  const dryIdx = [1, 2, 4, 6, 13]
  const oilyIdx = [3, 5, 7, 8, 9]
  const dryAvg = dryIdx.reduce((s, i) => s + (a[i] ?? 0), 0) / dryIdx.length
  const oilyAvg = oilyIdx.reduce((s, i) => s + (a[i] ?? 0), 0) / oilyIdx.length
  if (oilyAvg > dryAvg + 0.4) return 'oily'
  if (dryAvg > oilyAvg + 0.4) return 'dry'
  return 'combination'
}

interface TempGuide { range: string; label: string; desc: string; note: string }

function getTempGuide(state: AppState, tab: 'morning' | 'evening'): TempGuide {
  const method = tab === 'morning' ? state.morningMethod : state.eveningMethod
  const cleanser = tab === 'morning' ? state.morningCleanserType : state.eveningCleanserPrimary
  const skin = state.skinType

  if (skin === 'dry') {
    if (method === 'water') return { range: '18° ~ 22°C', label: 'SOOTHING RINSE', desc: 'Skin calming · Reduces morning puffiness', note: 'Cool water prevents moisture loss from dry skin' }
    if (['Cleansing Foam', 'Cleansing Milk'].includes(cleanser)) return { range: '28° ~ 30°C', label: 'GENTLE CLEANSE', desc: 'Minimal lipid disruption', note: 'Optimal surfactant activation for dry skin' }
    if (['Cleansing Oil', 'Cleansing Balm'].includes(cleanser)) return { range: '30° ~ 32°C', label: 'OIL EMULSION', desc: 'Liquid sebum melting point (Squalene)', note: 'Dissolves impurities without stripping barrier' }
  }
  if (skin === 'oily') {
    if (method === 'water') return { range: '28° ~ 30°C', label: 'DAILY RINSE', desc: 'Liquid sebum melting point (Squalene)', note: 'Removes surface oil without over-stimulating glands' }
    if (['Cleansing Foam', 'Cleansing Milk'].includes(cleanser)) return { range: '30° ~ 32°C', label: 'DEEP CLEANSE', desc: 'Optimal surfactant activation', note: 'Rich foam formation clears sebum buildup' }
    if (['Cleansing Oil', 'Cleansing Balm'].includes(cleanser)) return { range: '32° ~ 35°C', label: 'SEBUM MELT', desc: 'Solidified sebum melting point (Triglycerides)', note: 'Fully dissolves hardened sebum in pores' }
  }
  // combination / default
  if (method === 'water') return { range: '28° ~ 30°C', label: 'DAILY RINSE', desc: 'Average facial skin temperature', note: 'Gentle daily rinse for balanced skin' }
  if (['Cleansing Foam', 'Cleansing Milk'].includes(cleanser)) return { range: '30° ~ 32°C', label: 'DAILY CLEANSE', desc: 'Optimal rich foam formation', note: 'Effective cleansing for combination skin' }
  if (['Cleansing Oil', 'Cleansing Balm'].includes(cleanser)) return { range: '32° ~ 35°C', label: 'OIL EMULSION', desc: 'Optimal oil emulsification point', note: 'Dissolves impurities across T-zone and dry areas' }
  return { range: '28° ~ 32°C', label: 'DAILY CLEANSE', desc: 'Standard cleansing temperature', note: 'Balanced for your routine' }
}

// ─── Shared Components ────────────────────────────────────────────────────────

const css = {
  shell: { maxWidth: 430, minHeight: '100vh', margin: '0 auto', background: 'var(--color-surface-base)', overflowX: 'hidden' } as React.CSSProperties,
  screen: { display: 'flex', flexDirection: 'column', minHeight: '100vh', animation: 'screen-enter 280ms ease both' } as React.CSSProperties,
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid var(--color-border-subtle)' } as React.CSSProperties,
  brandLabel: { fontSize: 9, fontWeight: 900, letterSpacing: '0.30em', textTransform: 'uppercase', color: 'var(--color-text-primary)' } as React.CSSProperties,
  metaLabel: { fontSize: 9, fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' } as React.CSSProperties,
  eyebrow: { fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: 12 } as React.CSSProperties,
  displayL: { fontSize: 28, fontWeight: 900, lineHeight: 1.12, letterSpacing: '-0.03em', color: 'var(--color-text-primary)' } as React.CSSProperties,
  headingM: { fontSize: 22, fontWeight: 900, lineHeight: 1.28, letterSpacing: '-0.025em', color: 'var(--color-text-primary)' } as React.CSSProperties,
  bodyS: { fontSize: 12, fontWeight: 400, lineHeight: 1.65, color: 'var(--color-text-secondary)' } as React.CSSProperties,
  divider: { borderBottom: '1px solid var(--color-border-subtle)' } as React.CSSProperties,
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, height: 3, background: 'var(--color-border-subtle)', zIndex: 100 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-text-strong)', transition: 'width 400ms cubic-bezier(0.4,0,0.2,1)' }} />
    </div>
  )
}

function TopBar({ right, label = 'GROHE SELF-CARE' }: { right?: React.ReactNode; label?: string }) {
  return (
    <div style={css.topBar}>
      <span style={css.brandLabel}>{label}</span>
      {right}
    </div>
  )
}

function StepBadge({ step, total }: { step: number; total: number }) {
  return <span style={{ ...css.metaLabel, letterSpacing: '0.15em' }}>{String(step).padStart(2, '0')}/{String(total).padStart(2, '0')}</span>
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: '18px 24px',
      background: disabled ? 'rgba(255,255,255,0.10)' : 'var(--color-text-strong)',
      color: disabled ? 'var(--color-text-tertiary)' : '#000000',
      border: 'none', cursor: disabled ? 'default' : 'pointer',
      fontSize: 11, fontWeight: 900, letterSpacing: '0.11em', textTransform: 'uppercase', fontFamily: 'inherit',
      transition: 'opacity 150ms ease',
    }}>
      {children}
    </button>
  )
}

function NavRow({ label, sub, onPress }: { label: string; sub?: string; onPress: () => void }) {
  return (
    <button onClick={onPress} style={{
      width: '100%', textAlign: 'left', padding: '22px 24px',
      background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border-subtle)',
      cursor: 'pointer', fontFamily: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--color-text-primary)', marginBottom: sub ? 5 : 0 }}>{label}</div>
        {sub && <div style={css.bodyS}>{sub}</div>}
      </div>
      <span style={{ color: 'var(--color-text-tertiary)', fontSize: 16, marginLeft: 12 }}>→</span>
    </button>
  )
}

// ─── Screen: Profile Select ───────────────────────────────────────────────────

function ProfileSelectScreen({ onSelectProfile, onAddProfile, onManage }: {
  onSelectProfile: () => void
  onAddProfile: () => void
  onManage: () => void
}) {
  return (
    <div style={css.screen}>
      <div style={css.topBar}>
        <span style={css.brandLabel}>GROHE SELF-CARE</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '48px 24px 40px' }}>
        {/* Title */}
        <div style={{ marginBottom: 52 }}>
          <p style={css.eyebrow}>USER SELECT</p>
          <h2 style={{ ...css.displayL, fontSize: 32 }}>Who's<br />Cleansing?</h2>
        </div>

        {/* Profile grid */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>

            {/* Profile 1 — JISU */}
            <button
              onClick={onSelectProfile}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 0,
              }}
            >
              <div style={{
                width: 110, height: 110,
                border: '1.5px solid var(--color-text-strong)',
                background: 'var(--color-surface-raised)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Avatar initial */}
                <span style={{
                  fontSize: 38, fontWeight: 900, color: 'var(--color-text-primary)',
                  letterSpacing: '-0.03em', lineHeight: 1, userSelect: 'none',
                }}>J</span>
                {/* Subtle corner accent */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
                  background: 'var(--color-text-strong)',
                }} />
              </div>
              <span style={{
                fontSize: 11, fontWeight: 900, letterSpacing: '0.20em',
                color: 'var(--color-text-primary)', textTransform: 'uppercase',
              }}>JISU</span>
            </button>

            {/* Profile 2 — Add Profile */}
            <button
              onClick={onAddProfile}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 0,
              }}
            >
              <div style={{
                width: 110, height: 110,
                border: '1.5px dashed var(--color-border-subtle)',
                background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{
                  fontSize: 36, fontWeight: 200, color: 'var(--color-text-tertiary)',
                  lineHeight: 1, userSelect: 'none',
                }}>+</span>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.15em',
                color: 'var(--color-text-tertiary)', textTransform: 'uppercase',
              }}>Add Profile</span>
            </button>

          </div>
        </div>

        {/* Manage Profiles link */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
          <button
            onClick={onManage}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'var(--color-text-tertiary)',
              borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 2,
            }}
          >
            Manage Profiles
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Screen: Welcome ──────────────────────────────────────────────────────────

function WelcomeScreen({ onNext }: { onNext: () => void }) {
  return (
    <div style={css.screen}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 24px 40px' }}>
        <div>
          <p style={{ ...css.metaLabel, marginBottom: 40 }}>GROHE SELF-CARE</p>
          <h1 style={{ ...css.displayL, fontSize: 34, marginBottom: 20 }}>Precision<br />Skin Analysis</h1>
          <p style={{ ...css.bodyS, fontSize: 13, marginBottom: 40 }}>
            A clinical skin analysis system that prescribes your optimal cleansing temperature based on your unique skin type and routine.
          </p>
          <div style={{ padding: '16px', border: '1px solid var(--color-border-subtle)', marginBottom: 0 }}>
            <p style={{ ...css.eyebrow, marginBottom: 14 }}>ANALYSIS SCOPE</p>
            {['Morning & Evening Routine', 'Skin Type Diagnosis', 'Temperature Prescription', 'Post-Cleanse Verification'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 10, borderTop: '1px solid var(--color-border-subtle)' }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-text-strong)', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 40 }}>
          <PrimaryButton onClick={onNext}>Create New Profile</PrimaryButton>
        </div>
      </div>
    </div>
  )
}

// ─── Screen: Language ─────────────────────────────────────────────────────────

function LanguageScreen({ onNext }: { onNext: (lang: string) => void }) {
  const langs = [
    { code: 'en', flag: '🇺🇸', name: 'English', native: 'English' },
    { code: 'zh', flag: '🇨🇳', name: 'Chinese', native: '中文' },
    { code: 'ja', flag: '🇯🇵', name: 'Japanese', native: '日本語' },
  ]
  return (
    <div style={css.screen}>
      <ProgressBar pct={10} />
      <TopBar right={<StepBadge step={1} total={8} />} />
      <div style={{ padding: '40px 24px 32px' }}>
        <p style={css.eyebrow}>LANGUAGE</p>
        <h2 style={{ ...css.displayL, marginBottom: 8 }}>Select<br />Language</h2>
        <p style={{ ...css.bodyS, marginBottom: 0 }}>Choose your preferred language for the analysis.</p>
      </div>
      {langs.map(l => (
        <button key={l.code} onClick={() => onNext(l.code)} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border-subtle)',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 26 }}>{l.flag}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>{l.native}</div>
              <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{l.name}</div>
            </div>
          </div>
          <span style={{ color: 'var(--color-text-tertiary)' }}>→</span>
        </button>
      ))}
    </div>
  )
}

// ─── Screen: Country ──────────────────────────────────────────────────────────

function CountryScreen({ onNext }: { onNext: (v: string) => void }) {
  const [search, setSearch] = useState('')
  const filtered = COUNTRIES.filter(c => c.toLowerCase().includes(search.toLowerCase()))
  return (
    <div style={css.screen}>
      <ProgressBar pct={22} />
      <TopBar right={<StepBadge step={2} total={8} />} />
      <div style={{ padding: '40px 24px 16px' }}>
        <p style={css.eyebrow}>COUNTRY</p>
        <h2 style={{ ...css.displayL, marginBottom: 8 }}>Your Country</h2>
        <p style={{ ...css.bodyS, marginBottom: 20 }}>Select your country of residence.</p>
        <input
          type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '13px 14px', background: 'transparent',
            border: '1.5px solid var(--color-text-primary)', color: 'var(--color-text-primary)',
            fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 40 }}>
        {filtered.map(country => (
          <button key={country} onClick={() => onNext(country)} style={{
            width: '100%', textAlign: 'left', padding: '14px 24px',
            background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border-subtle)',
            cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', color: 'var(--color-text-primary)',
          }}>
            {country}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Screen: Gender ───────────────────────────────────────────────────────────

function GenderScreen({ onNext }: { onNext: (v: string) => void }) {
  return (
    <div style={css.screen}>
      <ProgressBar pct={34} />
      <TopBar right={<StepBadge step={3} total={8} />} />
      <div style={{ padding: '40px 24px' }}>
        <p style={css.eyebrow}>BIOLOGICAL PROFILE</p>
        <h2 style={{ ...css.displayL, marginBottom: 8 }}>Gender</h2>
        <p style={{ ...css.bodyS, marginBottom: 40 }}>Skin physiology varies by biological sex, affecting sebum production and hydration levels.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {['Male', 'Female'].map(g => (
            <button key={g} onClick={() => onNext(g)} style={{
              padding: '36px 16px', background: 'transparent',
              color: 'var(--color-text-primary)', border: '1.5px solid var(--color-border-subtle)',
              cursor: 'pointer', fontSize: 16, fontWeight: 900, fontFamily: 'inherit', letterSpacing: '-0.02em',
              transition: 'background 100ms, color 100ms, border-color 100ms',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-text-strong)'; (e.currentTarget as HTMLButtonElement).style.color = '#000'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-text-strong)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border-subtle)' }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Screen: Age Group ────────────────────────────────────────────────────────

function AgeGroupScreen({ onNext }: { onNext: (v: string) => void }) {
  return (
    <div style={css.screen}>
      <ProgressBar pct={46} />
      <TopBar right={<StepBadge step={4} total={8} />} />
      <div style={{ padding: '40px 24px' }}>
        <p style={css.eyebrow}>AGE RANGE</p>
        <h2 style={{ ...css.displayL, marginBottom: 8 }}>Age Group</h2>
        <p style={{ ...css.bodyS, marginBottom: 40 }}>Skin characteristics change significantly with age, influencing the analysis parameters.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {['10s', '20s', '30s', '40s', '50s', '60s+'].map(age => (
            <button key={age} onClick={() => onNext(age)} style={{
              padding: '28px 12px', background: 'transparent',
              color: 'var(--color-text-primary)', border: '1.5px solid var(--color-border-subtle)',
              cursor: 'pointer', fontSize: 16, fontWeight: 900, fontFamily: 'inherit',
              transition: 'background 100ms, color 100ms, border-color 100ms',
            }}
              onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'var(--color-text-strong)'; b.style.color = '#000'; b.style.borderColor = 'var(--color-text-strong)' }}
              onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'transparent'; b.style.color = 'var(--color-text-primary)'; b.style.borderColor = 'var(--color-border-subtle)' }}
            >
              {age}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Screen: Morning Method ───────────────────────────────────────────────────

function MorningMethodScreen({ onNext }: { onNext: (v: string) => void }) {
  return (
    <div style={css.screen}>
      <ProgressBar pct={58} />
      <TopBar right={<StepBadge step={5} total={8} />} />
      <div style={{ padding: '40px 24px 32px' }}>
        <p style={css.eyebrow}>A.M. CLEANSING</p>
        <h2 style={{ ...css.displayL, marginBottom: 8 }}>Morning<br />Routine</h2>
        <p style={css.bodyS}>How do you cleanse your face in the morning?</p>
      </div>
      <NavRow label="Water Wash" sub="Rinse with water only — no cleanser product" onPress={() => onNext('water')} />
      <NavRow label="Cleanser Wash" sub="Use a dedicated facial cleanser product" onPress={() => onNext('cleanser')} />
    </div>
  )
}

// ─── Screen: Cleanser Select (reusable) ───────────────────────────────────────

function CleanserSelectScreen({
  title, eyebrow, step, pct, onNext,
}: {
  title: string; eyebrow: string; step: number; pct: number; onNext: (v: string) => void
}) {
  const [selected, setSelected] = useState('')
  return (
    <div style={css.screen}>
      <ProgressBar pct={pct} />
      <TopBar right={<StepBadge step={step} total={8} />} />
      <div style={{ padding: '40px 24px' }}>
        <p style={css.eyebrow}>{eyebrow}</p>
        <h2 style={{ ...css.headingM, marginBottom: 32 }}>{title}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 32 }}>
          {CLEANSER_TYPES.map(ct => (
            <button key={ct} onClick={() => setSelected(ct)} style={{
              padding: '22px 12px', textAlign: 'center',
              background: selected === ct ? 'var(--color-text-strong)' : 'transparent',
              color: selected === ct ? '#000' : 'var(--color-text-primary)',
              border: `1.5px solid ${selected === ct ? 'var(--color-text-strong)' : 'var(--color-border-subtle)'}`,
              cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
              transition: 'all 100ms ease',
            }}>
              {ct}
            </button>
          ))}
        </div>
        <PrimaryButton disabled={!selected} onClick={() => onNext(selected)}>Continue</PrimaryButton>
      </div>
    </div>
  )
}

// ─── Screen: Evening Method ───────────────────────────────────────────────────

function EveningMethodScreen({ onNext }: { onNext: (v: string) => void }) {
  return (
    <div style={css.screen}>
      <ProgressBar pct={66} />
      <TopBar right={<StepBadge step={6} total={8} />} />
      <div style={{ padding: '40px 24px 32px' }}>
        <p style={css.eyebrow}>P.M. CLEANSING</p>
        <h2 style={{ ...css.displayL, marginBottom: 8 }}>Evening<br />Routine</h2>
        <p style={css.bodyS}>How do you cleanse your face in the evening?</p>
      </div>
      <NavRow label="Water Wash" sub="Rinse with water only" onPress={() => onNext('water')} />
      <NavRow label="Cleanser Wash" sub="Single cleanser product" onPress={() => onNext('cleanser')} />
      <NavRow label="Double Cleansing" sub="Oil/balm step followed by foam or milk" onPress={() => onNext('double')} />
    </div>
  )
}

// ─── Screen: Evening Double ───────────────────────────────────────────────────

function EveningDoubleScreen({ onNext }: { onNext: (p: string, s: string) => void }) {
  const [primary, setPrimary] = useState('')
  const [secondary, setSecondary] = useState('')

  return (
    <div style={css.screen}>
      <ProgressBar pct={66} />
      <TopBar right={<StepBadge step={6} total={8} />} />
      <div style={{ padding: '40px 24px' }}>
        <p style={css.eyebrow}>DOUBLE CLEANSING</p>
        <h2 style={{ ...css.headingM, marginBottom: 32 }}>Select Both<br />Cleanser Steps</h2>

        <p style={{ ...css.metaLabel, marginBottom: 12 }}>STEP 1 — PRIMARY CLEANSER</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 28 }}>
          {CLEANSER_TYPES.map(ct => (
            <button key={ct} onClick={() => setPrimary(ct)} style={{
              padding: '18px 10px', textAlign: 'center',
              background: primary === ct ? 'var(--color-text-strong)' : 'transparent',
              color: primary === ct ? '#000' : 'var(--color-text-primary)',
              border: `1.5px solid ${primary === ct ? 'var(--color-text-strong)' : 'var(--color-border-subtle)'}`,
              cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', transition: 'all 100ms',
            }}>
              {ct}
            </button>
          ))}
        </div>

        <p style={{ ...css.metaLabel, marginBottom: 12 }}>STEP 2 — SECONDARY CLEANSER</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 32 }}>
          {CLEANSER_TYPES.map(ct => (
            <button key={ct} onClick={() => setSecondary(ct)} style={{
              padding: '18px 10px', textAlign: 'center',
              background: secondary === ct ? 'var(--color-text-strong)' : 'transparent',
              color: secondary === ct ? '#000' : 'var(--color-text-primary)',
              border: `1.5px solid ${secondary === ct ? 'var(--color-text-strong)' : 'var(--color-border-subtle)'}`,
              cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', transition: 'all 100ms',
            }}>
              {ct}
            </button>
          ))}
        </div>

        <PrimaryButton disabled={!primary || !secondary} onClick={() => onNext(primary, secondary)}>
          Confirm Double Cleansing
        </PrimaryButton>
      </div>
    </div>
  )
}

// ─── Screen: Skin Status ──────────────────────────────────────────────────────

function SkinStatusScreen({ onNext }: { onNext: (v: string) => void }) {
  return (
    <div style={css.screen}>
      <ProgressBar pct={75} />
      <TopBar right={<StepBadge step={7} total={8} />} />
      <div style={{ padding: '40px 24px 32px' }}>
        <p style={css.eyebrow}>SKIN TYPE</p>
        <h2 style={{ ...css.displayL, marginBottom: 8 }}>Do you know<br />your skin type?</h2>
        <p style={css.bodyS}>This determines whether we analyze or confirm your skin type.</p>
      </div>
      <NavRow label="I know my skin type" sub="Select directly on the next step" onPress={() => onNext('known')} />
      <NavRow label="I don't know my skin type" sub="15-question clinical diagnostic survey" onPress={() => onNext('unknown')} />
    </div>
  )
}

// ─── Screen: Skin Direct ──────────────────────────────────────────────────────

function SkinDirectScreen({ onNext }: { onNext: (v: 'dry' | 'oily' | 'combination') => void }) {
  const types = [
    { value: 'dry' as const, label: 'Dry', desc: 'Feels tight, flaky, or rough after cleansing' },
    { value: 'oily' as const, label: 'Oily', desc: 'Appears shiny, prone to enlarged pores and breakouts' },
    { value: 'combination' as const, label: 'Combination', desc: 'Oily T-zone with normal to dry cheeks' },
  ]
  return (
    <div style={css.screen}>
      <ProgressBar pct={82} />
      <TopBar right={<StepBadge step={7} total={8} />} />
      <div style={{ padding: '40px 24px 32px' }}>
        <p style={css.eyebrow}>SKIN TYPE</p>
        <h2 style={{ ...css.displayL, marginBottom: 8 }}>Select Your<br />Skin Type</h2>
        <p style={css.bodyS}>Choose the option that best describes your skin condition.</p>
      </div>
      {types.map(t => (
        <NavRow key={t.value} label={t.label} sub={t.desc} onPress={() => onNext(t.value)} />
      ))}
    </div>
  )
}

// ─── Screen: Survey ───────────────────────────────────────────────────────────

function SurveyScreen({
  eyebrow, questions, basePct, onComplete,
}: {
  eyebrow: string; questions: string[]; basePct: number; onComplete: (answers: number[]) => void
}) {
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])

  const handleAnswer = (val: number) => {
    const next = [...answers, val]
    if (idx + 1 >= questions.length) {
      onComplete(next)
    } else {
      setAnswers(next)
      setIdx(i => i + 1)
    }
  }

  const surveyPct = basePct + (idx / questions.length) * 8

  return (
    <div style={css.screen}>
      <ProgressBar pct={surveyPct} />
      <TopBar right={
        <span style={{ ...css.metaLabel, letterSpacing: '0.15em' }}>
          Q.{String(idx + 1).padStart(2, '0')}/{String(questions.length).padStart(2, '0')}
        </span>
      } />
      {/* Survey inner progress */}
      <div style={{ height: 2, background: 'var(--color-border-subtle)' }}>
        <div style={{ height: '100%', width: `${(idx / questions.length) * 100}%`, background: 'var(--color-text-strong)', transition: 'width 400ms cubic-bezier(0.4,0,0.2,1)' }} />
      </div>

      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '26px 24px 24px', animation: 'screen-enter 200ms ease both' }}>
        <p style={{ ...css.eyebrow, marginBottom: 10 }}>{eyebrow}</p>
        <h3 style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.35, letterSpacing: '-0.025em', color: 'var(--color-text-primary)', flex: 1, marginBottom: 32 }}>
          {questions[idx]}
        </h3>
        <div>
          {SCALE.map((opt, i) => (
            <button key={opt} onClick={() => handleAnswer(SCALE_VALUES[i])} style={{
              width: '100%', textAlign: 'left', padding: '15px 0',
              background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border-subtle)',
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 13,
              transition: 'background 100ms',
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-tertiary)', width: 20, flexShrink: 0 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.5 }}>{opt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Screen: Dashboard ────────────────────────────────────────────────────────

function DashboardScreen({ state, onNext }: { state: AppState; onNext: () => void }) {
  const [tab, setTab] = useState<'morning' | 'evening'>('morning')
  const skinLabel = state.skinType === 'dry' ? 'DRY' : state.skinType === 'oily' ? 'OILY' : 'COMBINATION'

  const tabMethod = tab === 'morning' ? state.morningMethod : state.eveningMethod
  const tabPrimary = tab === 'morning' ? state.morningCleanserType : state.eveningCleanserPrimary
  const tabSecondary = state.eveningCleanserSecondary
  const isWater = tabMethod === 'water'
  const isDouble = tabMethod === 'double' && !!tabPrimary && !!tabSecondary
  const singleData = CLEANSER_TEMP[tabPrimary] ?? WATER_TEMP
  const doubleSteps = [
    { badge: 'STEP 1', cleanser: tabPrimary, data: CLEANSER_TEMP[tabPrimary] ?? WATER_TEMP },
    { badge: 'STEP 2', cleanser: tabSecondary, data: CLEANSER_TEMP[tabSecondary] ?? WATER_TEMP },
  ]

  const routineSummary = (t: 'morning' | 'evening') => {
    const method = t === 'morning' ? state.morningMethod : state.eveningMethod
    const p = t === 'morning' ? state.morningCleanserType : state.eveningCleanserPrimary
    const s = state.eveningCleanserSecondary
    if (method === 'water') return 'Water only'
    if (method === 'double') return `${p} → ${s}`
    return p || 'Cleanser'
  }

  return (
    <div style={css.screen}>
      <div style={css.topBar}>
        <span style={css.brandLabel}>GROHE SELF-CARE</span>
        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', padding: '3px 8px', border: '1.5px solid var(--color-text-strong)', color: 'var(--color-text-primary)' }}>
          {skinLabel} SKIN
        </span>
      </div>

      <div style={{ flex: 1, padding: '32px 24px 40px', overflowY: 'auto' }}>
        <p style={css.eyebrow}>PRESCRIPTION DASHBOARD</p>
        <h2 style={{ ...css.displayL, marginBottom: 32 }}>Temperature<br />Prescription</h2>

        {/* Tab */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-subtle)', marginBottom: 28 }}>
          {(['morning', 'evening'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '10px 0', background: 'transparent', border: 'none',
              borderBottom: tab === t ? '2px solid var(--color-text-strong)' : '2px solid transparent',
              color: tab === t ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
              cursor: 'pointer', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em',
              textTransform: 'uppercase', fontFamily: 'inherit', marginBottom: -1, transition: 'color 150ms',
            }}>
              {t === 'morning' ? 'Morning' : 'Evening'}
            </button>
          ))}
        </div>

        {/* Temperature Card(s) — cleanser-specific */}
        {isWater && (
          <div style={{ border: '1.5px solid var(--color-text-strong)', padding: '24px', marginBottom: 16 }}>
            <p style={{ ...css.metaLabel, marginBottom: 14 }}>{WATER_TEMP.label}</p>
            <p style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--color-text-primary)', marginBottom: 10, lineHeight: 1 }}>{WATER_TEMP.range}</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{WATER_TEMP.desc}</p>
          </div>
        )}
        {!isWater && isDouble && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {doubleSteps.map(s => (
              <div key={s.badge} style={{ border: '1.5px solid var(--color-text-strong)', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ ...css.metaLabel }}>{s.badge}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', padding: '2px 8px', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-tertiary)' }}>
                    {s.cleanser}
                  </span>
                </div>
                <p style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--color-text-primary)', marginBottom: 8, lineHeight: 1 }}>{s.data.range}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{s.data.desc}</p>
              </div>
            ))}
          </div>
        )}
        {!isWater && !isDouble && (
          <div style={{ border: '1.5px solid var(--color-text-strong)', padding: '24px', marginBottom: 16 }}>
            <p style={{ ...css.metaLabel, marginBottom: 14 }}>{singleData.label}</p>
            <p style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--color-text-primary)', marginBottom: 10, lineHeight: 1 }}>{singleData.range}</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{singleData.desc}</p>
          </div>
        )}

        {/* Routine summary */}
        <div style={{ border: '1px solid var(--color-border-subtle)', padding: '16px', marginBottom: 32 }}>
          <p style={{ ...css.eyebrow, marginBottom: 14 }}>YOUR ROUTINE</p>
          {[
            { label: 'Skin Type', value: state.skinType },
            { label: 'Morning', value: routineSummary('morning') },
            { label: 'Evening', value: routineSummary('evening') },
          ].map((row, i) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, marginTop: i === 0 ? 0 : 0, borderTop: '1px solid var(--color-border-subtle)' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{row.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-primary)', textTransform: 'capitalize', textAlign: 'right', maxWidth: '55%' }}>{row.value || '—'}</span>
            </div>
          ))}
        </div>

        <PrimaryButton onClick={onNext}>Start Cleansing</PrimaryButton>
      </div>
    </div>
  )
}

// ─── Screen: Timer ────────────────────────────────────────────────────────────

function TimerScreen({ state, onNext }: { state: AppState; onNext: () => void }) {
  const [phase, setPhase] = useState<'waiting' | 'counting' | 'done'>('waiting')
  const [count, setCount] = useState(30)
  const onNextRef = useRef(onNext)
  onNextRef.current = onNext
  const temp = getTempGuide(state, 'morning')

  useEffect(() => {
    const t = setTimeout(() => setPhase('counting'), 3000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (phase !== 'counting') return
    if (count <= 0) { setPhase('done'); return }
    const t = setTimeout(() => setCount(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, count])

  useEffect(() => {
    if (phase !== 'done') return
    const t = setTimeout(() => onNextRef.current(), 1800)
    return () => clearTimeout(t)
  }, [phase])

  const circumference = 2 * Math.PI * 88
  const dashOffset = circumference * (count / 30)

  return (
    <div style={css.screen}>
      <TopBar />
      <div style={{ padding: '12px 24px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={css.metaLabel}>TARGET TEMPERATURE</span>
        <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>{temp.range}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        {phase === 'waiting' && (
          <>
            <p style={{ ...css.metaLabel, marginBottom: 28, textAlign: 'center' }}>PREPARING</p>
            <p style={{ ...css.headingM, textAlign: 'center', marginBottom: 32 }}>Adjust your<br />water temperature</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-text-primary)', animation: `loading-dot 1.4s ease ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </>
        )}

        {phase !== 'waiting' && (
          <>
            <p style={{ ...css.metaLabel, marginBottom: 36, textAlign: 'center' }}>
              {phase === 'done' ? 'COMPLETE' : 'CLEANSING IN PROGRESS'}
            </p>
            <div style={{ position: 'relative', width: 200, height: 200, marginBottom: 36 }}>
              <svg width="200" height="200" style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
                <circle cx="100" cy="100" r="88" fill="none" stroke="var(--color-border-subtle)" strokeWidth="1.5" />
                <circle cx="100" cy="100" r="88" fill="none"
                  stroke={phase === 'done' ? 'var(--color-accent-gentle)' : 'var(--color-text-strong)'}
                  strokeWidth="1.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={phase === 'done' ? 0 : dashOffset}
                  strokeLinecap="square"
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 400ms ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {phase === 'done'
                  ? <span style={{ fontSize: 40, color: 'var(--color-accent-gentle)' }}>✓</span>
                  : <>
                    <span style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--color-text-primary)', lineHeight: 1 }}>
                      {String(count).padStart(2, '0')}
                    </span>
                    <span style={css.metaLabel}>SEC</span>
                  </>
                }
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'center', lineHeight: 1.65 }}>
              {phase === 'done'
                ? 'Cleansing complete. Recording your skin status.'
                : 'Continue cleansing at the recommended temperature.'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Screen: Post Check ───────────────────────────────────────────────────────

function PostCheckScreen({ onNext }: { onNext: (v: string) => void }) {
  return (
    <div style={css.screen}>
      <TopBar right={<span style={css.metaLabel}>POST-CLEANSE</span>} />
      <div style={{ padding: '40px 24px 32px' }}>
        <p style={css.eyebrow}>SELF-CHECK</p>
        <h2 style={{ ...css.displayL, marginBottom: 8 }}>How does your<br />skin feel?</h2>
        <p style={css.bodyS}>Evaluate your skin condition immediately after cleansing.</p>
      </div>
      {[
        { v: 'dry', label: 'Dry', icon: '◇', desc: 'Tight, uncomfortable, pulling sensation' },
        { v: 'oily', label: 'Oily', icon: '◈', desc: 'Greasy, residue, or film remains' },
        { v: 'good', label: 'Good', icon: '◉', desc: 'Balanced, comfortable, and clean' },
      ].map(opt => (
        <button key={opt.v} onClick={() => onNext(opt.v)} style={{
          width: '100%', textAlign: 'left', padding: '22px 24px',
          background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border-subtle)',
          cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 18,
        }}>
          <span style={{ fontSize: 22, color: 'var(--color-text-tertiary)', width: 28, textAlign: 'center', flexShrink: 0 }}>{opt.icon}</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--color-text-primary)', marginBottom: 4 }}>{opt.label}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{opt.desc}</div>
          </div>
        </button>
      ))}
    </div>
  )
}

// ─── Screen: Camera ───────────────────────────────────────────────────────────

function CameraScreen({ onNext }: { onNext: (img: string | null) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [phase, setPhase] = useState<'idle' | 'live' | 'captured' | 'denied'>('idle')
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      setPhase('live')
    } catch { setPhase('denied') }
  }

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return
    const c = canvasRef.current
    c.width = videoRef.current.videoWidth
    c.height = videoRef.current.videoHeight
    c.getContext('2d')?.drawImage(videoRef.current, 0, 0)
    const url = c.toDataURL('image/jpeg', 0.9)
    setDataUrl(url)
    streamRef.current?.getTracks().forEach(t => t.stop())
    setPhase('captured')
  }

  const retake = () => { setDataUrl(null); setPhase('idle') }

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()) }, [])

  return (
    <div style={css.screen}>
      <TopBar right={<span style={css.metaLabel}>VERIFICATION</span>} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px 40px' }}>
        <div style={{ alignSelf: 'stretch', marginBottom: 32 }}>
          <p style={css.eyebrow}>SKIN PHOTO LOG</p>
          <h2 style={{ ...css.headingM, marginBottom: 8 }}>Post-Cleanse<br />Verification</h2>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
            Capture a photo of your skin after cleansing. Stored locally for your personal skin log only.
          </p>
        </div>

        {/* Camera stage */}
        <div style={{
          width: 240, height: 240, borderRadius: '50%', background: '#101010', overflow: 'hidden',
          marginBottom: 32, boxShadow: 'var(--shadow-camera-stage)', position: 'relative', flexShrink: 0,
          border: '1px solid var(--color-border-subtle)',
        }}>
          {phase === 'idle' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 32, opacity: 0.3 }}>◎</span>
              <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '0 20px', letterSpacing: '0.05em' }}>CAMERA READY</p>
            </div>
          )}
          {phase === 'denied' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 28, opacity: 0.4 }}>⊘</span>
              <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '0 20px' }}>ACCESS DENIED</p>
            </div>
          )}
          {phase === 'live' && (
            <>
              <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} playsInline muted />
              <div style={{
                position: 'absolute', left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, transparent, var(--color-accent-camera-scan), transparent)`,
                boxShadow: 'var(--shadow-camera-scan-glow)', animation: 'scan-line 1.5s ease-in-out infinite',
              }} />
            </>
          )}
          {phase === 'captured' && dataUrl && (
            <img src={dataUrl} alt="Captured skin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {phase === 'idle' && <PrimaryButton onClick={startCamera}>Enable Camera</PrimaryButton>}
          {phase === 'live' && <PrimaryButton onClick={capture}>Capture Photo</PrimaryButton>}
          {phase === 'captured' && (
            <>
              <PrimaryButton onClick={() => onNext(dataUrl)}>Confirm & Complete</PrimaryButton>
              <button onClick={retake} style={{
                width: '100%', padding: '14px', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.20)', color: 'var(--color-text-tertiary)',
                cursor: 'pointer', fontSize: 11, fontWeight: 900, letterSpacing: '0.11em',
                textTransform: 'uppercase', fontFamily: 'inherit',
              }}>Retake</button>
            </>
          )}
          {phase === 'denied' && <PrimaryButton onClick={() => onNext(null)}>Continue Without Photo</PrimaryButton>}
        </div>
      </div>
    </div>
  )
}

// ─── Screen: Complete (Post-Cleanse Tip) ─────────────────────────────────────

function CompleteScreen({ state, onViewReport, onRestart }: {
  state: AppState; onViewReport: () => void; onRestart: () => void
}) {
  const statusColor = state.perceivedStatus === 'good'
    ? 'var(--color-accent-gentle)'
    : state.perceivedStatus === 'dry' ? 'var(--color-text-secondary)' : 'var(--color-accent-intensive)'

  return (
    <div style={css.screen}>
      <TopBar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 24px 40px' }}>
        <div>
          <p style={{ ...css.metaLabel, marginBottom: 40 }}>POST-CLEANSE TIP</p>
          <h1 style={{ ...css.displayL, fontSize: 30, marginBottom: 20, borderStyle: 'none', borderColor: 'rgba(0,0,0,0)', color: 'var(--color-accent-camera-scan)' }}>Apply Moisture<br />Within 30 Seconds</h1>
          <p style={{ ...css.bodyS, fontSize: 13, lineHeight: 1.75, marginBottom: 40 }}>
            Please apply your toner or lotion within 30 seconds to prevent rapid moisture loss after cleansing.
          </p>

          <div style={{ border: '1.5px solid var(--color-text-strong)', padding: '20px', marginBottom: 20 }}>
            <p style={{ ...css.eyebrow, marginBottom: 16 }}>SESSION SUMMARY</p>
            {[
              { label: 'Skin Type', value: state.skinType || '—', color: 'var(--color-text-primary)' },
              { label: 'Post-Cleanse Status', value: state.perceivedStatus || '—', color: statusColor },
              { label: 'Morning Routine', value: state.morningMethod === 'water' ? 'Water only' : state.morningCleanserType || '—', color: 'var(--color-text-primary)' },
              { label: 'Photo Log', value: state.capturedImage ? 'Captured ✓' : 'Skipped', color: state.capturedImage ? 'var(--color-accent-gentle)' : 'var(--color-text-tertiary)' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--color-border-subtle)' }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{row.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: row.color, textTransform: 'capitalize' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PrimaryButton onClick={onViewReport}>View Weekly Report</PrimaryButton>
          <button onClick={onRestart} style={{
            width: '100%', padding: '14px 24px', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)', color: 'var(--color-text-tertiary)',
            cursor: 'pointer', fontSize: 10, fontWeight: 900, letterSpacing: '0.15em',
            textTransform: 'uppercase', fontFamily: 'inherit',
          }}>
            Start New Analysis
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Screen: Weekly Report ────────────────────────────────────────────────────

// status → solid color
const DOT_COLOR: Record<string, string> = {
  dry:  '#8E8E93',
  good: '#34C759',
  oily: '#FF3B30',
}

const WEEKLY_DOTS: { day: string; am: string; pm: string }[] = [
  { day: 'MON', am: 'good', pm: 'good' },
  { day: 'TUE', am: 'dry',  pm: 'good' },
  { day: 'WED', am: 'dry',  pm: 'dry'  },
  { day: 'THU', am: 'good', pm: 'oily' },
  { day: 'FRI', am: 'dry',  pm: 'dry'  },
  { day: 'SAT', am: 'dry',  pm: 'good' },
  { day: 'SUN', am: 'dry',  pm: 'dry'  },
]

function WeeklyReportScreen({ onModify, onKeep, onBack }: {
  onModify: () => void; onKeep: () => void; onBack: () => void
}) {
  return (
    <div style={css.screen}>
      <div style={css.topBar}>
        <span style={css.brandLabel}>GROHE SELF-CARE</span>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', fontFamily: 'inherit' }}>
          ← BACK
        </button>
      </div>

      <div style={{ flex: 1, padding: '32px 24px 40px', overflowY: 'auto' }}>
        <p style={css.eyebrow}>WEEKLY INSIGHTS</p>
        <h2 style={{ ...css.displayL, marginBottom: 32 }}>Weekly Skin<br />Condition</h2>

        {/* Dot Stepper */}
        <div style={{ border: '1.5px solid var(--color-text-strong)', padding: '20px', marginBottom: 16 }}>
          <p style={{ ...css.metaLabel, marginBottom: 4 }}>POST-CLEANSE STATUS — PAST 7 DAYS</p>
          <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 20 }}>AM / PM post-cleanse selection history</p>

          {/* Row labels + dots */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 16 }}>
            {/* Y-axis labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginRight: 10, justifyContent: 'center' }}>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-text-tertiary)', lineHeight: 1 }}>AM</span>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-text-tertiary)', lineHeight: 1 }}>PM</span>
            </div>
            {/* Day columns */}
            {WEEKLY_DOTS.map(d => (
              <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: DOT_COLOR[d.am] }} />
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: DOT_COLOR[d.pm] }} />
              </div>
            ))}
          </div>

          {/* Day labels */}
          <div style={{ display: 'flex', marginLeft: 26 }}>
            {WEEKLY_DOTS.map(d => (
              <div key={d.day} style={{ flex: 1, textAlign: 'center' }}>
                <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--color-text-tertiary)' }}>{d.day}</span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--color-border-subtle)' }}>
            {[{ label: 'DRY', color: '#8E8E93' }, { label: 'GOOD', color: '#34C759' }, { label: 'OILY', color: '#FF3B30' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', color: 'var(--color-text-tertiary)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Insight callout */}
        <div style={{ background: 'var(--color-surface-subtle)', borderLeft: '2px solid var(--color-text-strong)', padding: '16px 18px', marginBottom: 28 }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: 8 }}>NOTICE</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.5, marginBottom: 6 }}>
            Increased dryness detected after recent cleanses.
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            We recommend reducing your overall cleansing time to protect your skin barrier and restore moisture balance.
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          <PrimaryButton onClick={onModify}>Modify Routine</PrimaryButton>
          <button onClick={onKeep} style={{
            width: '100%', padding: '16px 24px', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.20)', color: 'var(--color-text-secondary)',
            cursor: 'pointer', fontSize: 10, fontWeight: 900, letterSpacing: '0.15em',
            textTransform: 'uppercase', fontFamily: 'inherit',
          }}>
            Keep Current Routine
          </button>
        </div>

        {/* Filter replacement info */}
        <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 24 }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: 8 }}>FILTER STATUS</p>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
            Filter Replacement Date:{' '}
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>March 13, 2032</span>
          </p>
          <a
            href="https://www.grohe.com/en-SG/category/Kitchen/Water_filtering_system/For_filtered_water"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', width: '100%', padding: '14px 24px', boxSizing: 'border-box',
              background: 'transparent', border: '1.5px solid var(--color-text-strong)',
              color: 'var(--color-text-primary)', textAlign: 'center',
              fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase',
              textDecoration: 'none', fontFamily: 'inherit',
            }}
          >
            Buy Replacement Filter
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('profileSelect')
  const [state, setState] = useState<AppState>(INITIAL)

  const update = (patch: Partial<AppState>) => setState(s => ({ ...s, ...patch }))
  const go = (s: Screen) => setScreen(s)

  return (
    <div style={css.shell as React.CSSProperties}>
      {screen === 'profileSelect' && (
        <ProfileSelectScreen
          onSelectProfile={() => go('dashboard')}
          onAddProfile={() => go('welcome')}
          onManage={() => go('profileSelect')}
        />
      )}
      {screen === 'welcome' && (
        <WelcomeScreen onNext={() => go('language')} />
      )}
      {screen === 'language' && (
        <LanguageScreen onNext={v => { update({ language: v }); go('country') }} />
      )}
      {screen === 'country' && (
        <CountryScreen onNext={v => { update({ country: v }); go('gender') }} />
      )}
      {screen === 'gender' && (
        <GenderScreen onNext={v => { update({ gender: v }); go('ageGroup') }} />
      )}
      {screen === 'ageGroup' && (
        <AgeGroupScreen onNext={v => { update({ ageGroup: v }); go('morningMethod') }} />
      )}
      {screen === 'morningMethod' && (
        <MorningMethodScreen onNext={v => {
          update({ morningMethod: v })
          go(v === 'water' ? 'eveningMethod' : 'morningCleanser')
        }} />
      )}
      {screen === 'morningCleanser' && (
        <CleanserSelectScreen
          title="Morning Cleanser" eyebrow="A.M. PRODUCT"
          step={5} pct={62}
          onNext={v => { update({ morningCleanserType: v }); go('eveningMethod') }}
        />
      )}
      {screen === 'eveningMethod' && (
        <EveningMethodScreen onNext={v => {
          update({ eveningMethod: v })
          if (v === 'water') go('skinStatus')
          else if (v === 'cleanser') go('eveningCleanser')
          else go('eveningDouble')
        }} />
      )}
      {screen === 'eveningCleanser' && (
        <CleanserSelectScreen
          title="Evening Cleanser" eyebrow="P.M. PRODUCT"
          step={6} pct={70}
          onNext={v => { update({ eveningCleanserPrimary: v }); go('skinStatus') }}
        />
      )}
      {screen === 'eveningDouble' && (
        <EveningDoubleScreen onNext={(p, s) => {
          update({ eveningCleanserPrimary: p, eveningCleanserSecondary: s })
          go('skinStatus')
        }} />
      )}
      {screen === 'skinStatus' && (
        <SkinStatusScreen onNext={v => {
          update({ skinKnowledge: v })
          go(v === 'known' ? 'skinDirect' : 'skinSurvey')
        }} />
      )}
      {screen === 'skinDirect' && (
        <SkinDirectScreen onNext={v => { update({ skinType: v }); go('lifestyleSurvey') }} />
      )}
      {screen === 'skinSurvey' && (
        <SurveyScreen
          eyebrow="SKIN ANALYSIS — DIAGNOSTIC"
          questions={DIAGNOSTIC_QUESTIONS}
          basePct={82}
          onComplete={answers => {
            const type = calcSkinType(answers)
            update({ diagnosisAnswers: answers, skinType: type })
            go('lifestyleSurvey')
          }}
        />
      )}
      {screen === 'lifestyleSurvey' && (
        <SurveyScreen
          eyebrow="LIFESTYLE & CONDITION"
          questions={LIFESTYLE_QUESTIONS}
          basePct={90}
          onComplete={answers => {
            update({ commonAnswers: answers })
            go('dashboard')
          }}
        />
      )}
      {screen === 'dashboard' && (
        <DashboardScreen state={state} onNext={() => go('timer')} />
      )}
      {screen === 'timer' && (
        <TimerScreen state={state} onNext={() => go('postCheck')} />
      )}
      {screen === 'postCheck' && (
        <PostCheckScreen onNext={v => { update({ perceivedStatus: v }); go('camera') }} />
      )}
      {screen === 'camera' && (
        <CameraScreen onNext={img => { update({ capturedImage: img }); go('complete') }} />
      )}
      {screen === 'complete' && (
        <CompleteScreen
          state={state}
          onViewReport={() => go('weeklyReport')}
          onRestart={() => { setState(INITIAL); go('welcome') }}
        />
      )}
      {screen === 'weeklyReport' && (
        <WeeklyReportScreen
          onModify={() => go('morningMethod')}
          onKeep={() => go('welcome')}
          onBack={() => go('complete')}
        />
      )}
    </div>
  )
}
