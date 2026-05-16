import React from 'react';

export interface CertData {
  certType: string;
  institutionName: string;
  eventName: string;
  bodyText: string;
  duration: string;
  venue: string;
  teamIdLabel: string;
  themeLabel: string;
  institutionLogo: string;
  eventLogo: string;
  sponsorLogos: string[];
  showSponsorSection: boolean;
  signatories: { name: string; title: string; org: string }[];
}

// ─── shared helpers ───────────────────────────────────────────────
const LogoBox = ({ src, label, size = 52 }: { src: string; label: string; size?: number }) =>
  src ? (
    <img src={src} alt={label} style={{ height: size, objectFit: 'contain' }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: 8, background: '#f1f5f9', border: '2px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#94A3B8', fontFamily: 'sans-serif', fontWeight: 700 }}>
      {label}
    </div>
  );

const SignatoryBlock = ({ s, i, color }: { s: { name: string; title: string; org: string }; i: number; color: string }) => (
  <div style={{ textAlign: 'center', fontFamily: 'sans-serif' }}>
    <div style={{ height: 28, borderBottom: `1.5px solid ${color}`, marginBottom: 6, width: 110 }} />
    <div style={{ fontSize: 11, fontWeight: 800, color: '#0F172A' }}>{s.name || `Signatory ${i + 1}`}</div>
    <div style={{ fontSize: 9, color: '#64748B' }}>{s.title}</div>
    <div style={{ fontSize: 9, color: '#64748B' }}>{s.org}</div>
  </div>
);

const SponsorRow = ({ logos }: { logos: string[] }) => {
  const valid = logos.filter(l => l.trim());
  return (
    <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #E2E8F0', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 3, color: '#94A3B8', textAlign: 'center', marginBottom: 8 }}>SPONSORED BY</div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
        {valid.length > 0
          ? valid.map((s, i) => <img key={i} src={s} alt="" style={{ height: 26, objectFit: 'contain' }} />)
          : [1, 2, 3].map(i => <div key={i} style={{ width: 56, height: 22, background: '#F1F5F9', borderRadius: 4, border: '1px dashed #CBD5E1' }} />)}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE 1 — Classic Red & Gold  (xto10x / hackathon medal style)
// ═══════════════════════════════════════════════════════════════════
export const Template1: React.FC<{ data: CertData }> = ({ data }) => (
  <div style={{ fontFamily: 'Georgia, serif', background: '#fff', border: '10px solid #B91C1C', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
    {/* Gold inner border */}
    <div style={{ position: 'absolute', inset: 8, border: '3px solid #D97706', pointerEvents: 'none', zIndex: 1 }} />
    {/* Red corner decorations */}
    {['0 0', '0 auto', 'auto 0', 'auto auto'].map((pos, i) => (
      <div key={i} style={{ position: 'absolute', top: i < 2 ? 0 : 'auto', bottom: i >= 2 ? 0 : 'auto', left: i % 2 === 0 ? 0 : 'auto', right: i % 2 !== 0 ? 0 : 'auto', width: 60, height: 60, background: '#B91C1C', clipPath: i % 2 === 0 ? 'polygon(0 0,100% 0,0 100%)' : 'polygon(100% 0,100% 100%,0 100%)' }} />
    ))}
    <div style={{ padding: '40px 50px 32px', position: 'relative', zIndex: 2 }}>
      {/* Logos */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <LogoBox src={data.institutionLogo} label="INST" size={56} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#B91C1C', fontFamily: 'sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>{data.institutionName || 'Institution Name'}</div>
        </div>
        <LogoBox src={data.eventLogo} label="EVENT" size={56} />
      </div>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 38, fontWeight: 900, color: '#B91C1C', letterSpacing: 4, textTransform: 'uppercase', lineHeight: 1 }}>CERTIFICATE</div>
        <div style={{ fontSize: 16, color: '#D97706', fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginTop: 4 }}>{data.certType.replace('Certificate of ', 'of ') || 'of Achievement'}</div>
        <div style={{ height: 3, background: 'linear-gradient(90deg,transparent,#D97706,transparent)', margin: '10px auto 0', width: '60%' }} />
      </div>
      <div style={{ textAlign: 'center', fontSize: 13, color: '#64748B', fontFamily: 'sans-serif', marginBottom: 8 }}>This certificate is proudly presented to</div>
      {/* Name */}
      <div style={{ textAlign: 'center', fontSize: 30, fontWeight: 800, color: '#0F172A', borderBottom: '2px solid #B91C1C', display: 'inline-block', padding: '0 32px', margin: '0 auto 12px', display: 'block', width: 'fit-content' }}>
        {'{ Recipient Name }'}
      </div>
      {/* Meta */}
      {(data.teamIdLabel || data.themeLabel) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 10, fontFamily: 'sans-serif', fontSize: 12 }}>
          {data.teamIdLabel && <span><b>Team ID:</b> {data.teamIdLabel}</span>}
          {data.themeLabel && <span><b>Theme:</b> {data.themeLabel}</span>}
        </div>
      )}
      <div style={{ textAlign: 'center', fontSize: 13, color: '#334155', fontFamily: 'sans-serif', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 8px' }}>
        {data.bodyText} <strong>"{data.eventName || 'Hackathon'}"</strong>
        {data.duration && <span> during <strong>{data.duration}</strong></span>}
        {data.venue && <span> at {data.venue}</span>}.
      </div>
      {/* Signatories */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 24, paddingTop: 16, borderTop: '1px solid #FCA5A5' }}>
        {data.signatories.map((s, i) => <SignatoryBlock key={i} s={s} i={i} color="#B91C1C" />)}
      </div>
      {data.showSponsorSection && <SponsorRow logos={data.sponsorLogos} />}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════
// TEMPLATE 2 — Blue Tech Wave  (Saraswati / DSC style)
// ═══════════════════════════════════════════════════════
export const Template2: React.FC<{ data: CertData }> = ({ data }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', background: '#fff', border: '1px solid #BFDBFE', borderRadius: 12, overflow: 'hidden' }}>
    {/* Blue header bar */}
    <div style={{ background: 'linear-gradient(135deg,#1E40AF,#3B82F6)', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <LogoBox src={data.institutionLogo} label="INST" size={52} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 3 }}>presents</div>
        <div style={{ color: '#fff', fontSize: 18, fontWeight: 900, letterSpacing: 2 }}>{data.eventName || 'Event Name'}</div>
      </div>
      <LogoBox src={data.eventLogo} label="EVENT" size={52} />
    </div>
    <div style={{ padding: '28px 40px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#64748B', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 4 }}>THIS IS TO CERTIFY THAT</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: 2 }}>{data.certType.toUpperCase()}</div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 30, fontStyle: 'italic', color: '#0F172A', borderBottom: '2px solid #3B82F6', display: 'inline-block', padding: '0 32px', margin: '0 auto 16px', display: 'block', width: 'fit-content' }}>
        {'{ Recipient Name }'}
      </div>
      {(data.teamIdLabel || data.themeLabel) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 12, fontSize: 12 }}>
          {data.teamIdLabel && <span><b>Team ID:</b> {data.teamIdLabel}</span>}
          {data.themeLabel && <span><b>Theme:</b> {data.themeLabel}</span>}
        </div>
      )}
      <div style={{ textAlign: 'center', fontSize: 13, color: '#475569', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 8px' }}>
        {data.bodyText} <strong>"{data.eventName || 'the event'}"</strong>
        {data.duration && <span> during <strong>{data.duration}</strong></span>}
        {data.venue && <span> at <strong>{data.venue}</strong></span>}.
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 24, paddingTop: 16, borderTop: '1px solid #BFDBFE' }}>
        {data.signatories.map((s, i) => <SignatoryBlock key={i} s={s} i={i} color="#1E40AF" />)}
      </div>
      {data.showSponsorSection && <SponsorRow logos={data.sponsorLogos} />}
    </div>
    {/* Wave footer */}
    <div style={{ background: 'linear-gradient(135deg,#1E3A8A,#2563EB,#06B6D4)', height: 40 }} />
  </div>
);

// ═════════════════════════════════════════════════════════════
// TEMPLATE 3 — Colorful Minimal  (Google DSC / Hack4Good style)
// ═════════════════════════════════════════════════════════════
const COLORS = ['#EF4444','#3B82F6','#22C55E','#F59E0B'];
export const Template3: React.FC<{ data: CertData }> = ({ data }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', background: '#fff', border: '4px solid #0F172A', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
    {/* Colorful corner triangles */}
    <div style={{ position: 'absolute', top: 0, left: 0, width: 80, height: 80, background: COLORS[0], clipPath: 'polygon(0 0,100% 0,0 100%)' }} />
    <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: COLORS[1], clipPath: 'polygon(100% 0,100% 100%,0 0)' }} />
    <div style={{ position: 'absolute', bottom: 0, left: 0, width: 80, height: 80, background: COLORS[2], clipPath: 'polygon(0 0,0 100%,100% 100%)' }} />
    <div style={{ position: 'absolute', bottom: 0, right: 0, width: 80, height: 80, background: COLORS[3], clipPath: 'polygon(100% 0,0 100%,100% 100%)' }} />
    <div style={{ padding: '36px 56px 28px', position: 'relative', zIndex: 2 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <LogoBox src={data.institutionLogo} label="INST" size={48} />
        <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 900, color: '#0F172A' }}>{data.institutionName || 'Institution'}</div>
        <LogoBox src={data.eventLogo} label="EVENT" size={48} />
      </div>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', letterSpacing: 2 }}>{data.eventName || 'Hackathon'}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 3 }}>{data.certType.toUpperCase()}</div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>This certificate is awarded to</div>
      </div>
      <div style={{ textAlign: 'center', margin: '0 auto 16px', borderBottom: '2px solid #0F172A', display: 'inline-block', padding: '0 40px', display: 'block', width: 'fit-content', fontSize: 28, fontWeight: 700, color: '#0F172A' }}>
        {'{ Recipient Name }'}
      </div>
      {(data.teamIdLabel || data.themeLabel) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 10, fontSize: 12, color: '#475569' }}>
          {data.teamIdLabel && <span><b>Team:</b> {data.teamIdLabel}</span>}
          {data.themeLabel && <span><b>Theme:</b> {data.themeLabel}</span>}
        </div>
      )}
      <div style={{ textAlign: 'center', fontSize: 12, color: '#475569', lineHeight: 1.7, maxWidth: 440, margin: '0 auto 8px' }}>
        {data.bodyText} "{data.eventName}"
        {data.duration && ` — ${data.duration}`}
        {data.venue && ` @ ${data.venue}`}.
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 20, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
        {data.signatories.map((s, i) => <SignatoryBlock key={i} s={s} i={i} color={COLORS[i] || '#0F172A'} />)}
      </div>
      {data.showSponsorSection && <SponsorRow logos={data.sponsorLogos} />}
    </div>
  </div>
);

// ════════════════════════════════════════════════════════
// TEMPLATE 4 — Elite Dark  (Premium / SIH style)
// ════════════════════════════════════════════════════════
export const Template4: React.FC<{ data: CertData }> = ({ data }) => (
  <div style={{ fontFamily: 'Georgia, serif', background: 'linear-gradient(145deg,#0F172A 0%,#1E293B 60%,#0F172A 100%)', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
    {/* Gold shimmer lines */}
    <div style={{ position: 'absolute', top: 16, left: 16, right: 16, bottom: 16, border: '1.5px solid rgba(217,119,6,0.4)', borderRadius: 8, pointerEvents: 'none' }} />
    <div style={{ padding: '40px 48px 32px', position: 'relative', zIndex: 2 }}>
      {/* Logos */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <LogoBox src={data.institutionLogo} label="INST" size={52} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#D97706', fontSize: 10, textTransform: 'uppercase', letterSpacing: 4, fontFamily: 'sans-serif' }}>Elite Recognition</div>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'sans-serif', marginTop: 2 }}>{data.institutionName}</div>
        </div>
        <LogoBox src={data.eventLogo} label="EVENT" size={52} />
      </div>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#D97706', textTransform: 'uppercase', letterSpacing: 5, fontFamily: 'sans-serif', marginBottom: 6 }}>THIS CERTIFIES THAT</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: '#D97706', letterSpacing: 3, textTransform: 'uppercase', lineHeight: 1 }}>CERTIFICATE</div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', letterSpacing: 2, fontFamily: 'sans-serif', marginTop: 4 }}>{data.certType.replace('Certificate of ', 'of ').toUpperCase()}</div>
        <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#D97706,transparent)', margin: '12px auto 0', width: '50%' }} />
      </div>
      {/* Name */}
      <div style={{ textAlign: 'center', fontSize: 30, color: '#fff', fontWeight: 700, fontStyle: 'italic', borderBottom: '1.5px solid #D97706', display: 'inline-block', padding: '0 40px', margin: '0 auto 16px', display: 'block', width: 'fit-content' }}>
        {'{ Recipient Name }'}
      </div>
      {(data.teamIdLabel || data.themeLabel) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 12, fontFamily: 'sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
          {data.teamIdLabel && <span><b style={{ color: '#D97706' }}>TEAM ID</b>  {data.teamIdLabel}</span>}
          {data.themeLabel && <span><b style={{ color: '#D97706' }}>THEME</b>  {data.themeLabel}</span>}
        </div>
      )}
      <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.75)', fontFamily: 'sans-serif', lineHeight: 1.7, maxWidth: 460, margin: '0 auto 8px' }}>
        {data.bodyText} <span style={{ color: '#fff', fontWeight: 700 }}>"{data.eventName || 'the event'}"</span>
        {data.duration && <span> during <b style={{ color: '#D97706' }}>{data.duration}</b></span>}
        {data.venue && <span> at {data.venue}</span>}.
      </div>
      {/* Signatories */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 28, paddingTop: 16, borderTop: '1px solid rgba(217,119,6,0.3)' }}>
        {data.signatories.map((s, i) => (
          <div key={i} style={{ textAlign: 'center', fontFamily: 'sans-serif' }}>
            <div style={{ height: 28, borderBottom: '1.5px solid #D97706', marginBottom: 6, width: 110 }} />
            <div style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{s.name || `Signatory ${i + 1}`}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{s.title}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{s.org}</div>
          </div>
        ))}
      </div>
      {data.showSponsorSection && (
        <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid rgba(217,119,6,0.2)', fontFamily: 'sans-serif' }}>
          <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 3, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginBottom: 8 }}>SPONSORED BY</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {data.sponsorLogos.filter(l => l.trim()).map((s, i) => <img key={i} src={s} alt="" style={{ height: 26, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />)}
          </div>
        </div>
      )}
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════
// TEMPLATE 5 — Professional Clean  (Tekno'19 / academic)
// ══════════════════════════════════════════════════════════
export const Template5: React.FC<{ data: CertData }> = ({ data }) => (
  <div style={{ fontFamily: 'Georgia, serif', background: '#fff', border: '6px solid #7C3AED', borderRadius: 8, position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 14, background: 'linear-gradient(180deg,#7C3AED,#9D7CFF)' }} />
    <div style={{ padding: '32px 40px 28px 52px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <LogoBox src={data.institutionLogo} label="INST" size={52} />
        <LogoBox src={data.eventLogo} label="EVENT" size={52} />
        {data.institutionName && (
          <div style={{ marginLeft: 'auto', textAlign: 'right', fontFamily: 'sans-serif' }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 1 }}>{data.institutionName}</div>
          </div>
        )}
      </div>
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontFamily: 'sans-serif', color: '#64748B', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 4 }}>THIS CERTIFICATE IS PRESENTED TO</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#7C3AED', letterSpacing: 2, textTransform: 'uppercase' }}>{data.certType.toUpperCase()}</div>
      </div>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #7C3AED', paddingBottom: 8, marginBottom: 14, maxWidth: 380, margin: '0 auto 14px', fontSize: 28, fontWeight: 700, fontStyle: 'italic', color: '#0F172A' }}>
        {'{ Recipient Name }'}
      </div>
      {(data.teamIdLabel || data.themeLabel) && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 32, marginBottom: 12, fontFamily: 'sans-serif', fontSize: 12 }}>
          {data.teamIdLabel && <span><b>TEAM ID</b>  <u>{data.teamIdLabel}</u></span>}
          {data.themeLabel && <span><b>THEME</b>  <u>{data.themeLabel}</u></span>}
        </div>
      )}
      <div style={{ fontSize: 13, color: '#334155', fontFamily: 'sans-serif', lineHeight: 1.75, maxWidth: 480, margin: '0 auto 8px', textAlign: 'center' }}>
        {data.bodyText} <strong>"{data.eventName || 'Hackathon Name'}"</strong>
        {data.duration && <span> during <strong>{data.duration}</strong></span>}
        {data.venue && <span> at <strong>{data.venue}</strong></span>}.
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 24, paddingTop: 16, borderTop: '1px solid #EDE9FE' }}>
        {data.signatories.map((s, i) => <SignatoryBlock key={i} s={s} i={i} color="#7C3AED" />)}
      </div>
      {data.showSponsorSection && <SponsorRow logos={data.sponsorLogos} />}
    </div>
  </div>
);

// ── Template registry ───────────────────────────────────
export const CERT_TEMPLATES = [
  { id: '1', label: 'Classic Red & Gold',    tag: 'Hackathon',    component: Template1 },
  { id: '2', label: 'Blue Tech',             tag: 'Professional', component: Template2 },
  { id: '3', label: 'Colorful Minimal',      tag: 'DSC / Google', component: Template3 },
  { id: '4', label: 'Elite Dark',            tag: 'Premium',      component: Template4 },
  { id: '5', label: 'Professional Clean',    tag: 'Academic',     component: Template5 },
];
