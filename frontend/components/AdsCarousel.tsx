import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, ExternalLink, ImageIcon } from 'lucide-react';
import { API_BASE_URL } from '../apiConfig';

/* ─── Google Font injection ─────────────────────── */
export function useFont() {
    useEffect(() => {
        const id = 'ads-google-fonts';
        if (document.getElementById(id)) return;
        const l = document.createElement('link');
        l.id = id; l.rel = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500&family=Inter:wght@400;600;700;800&display=swap';
        document.head.appendChild(l);
    }, []);
}

/* ─── CSS injection ─────────────────────────────── */
const ADS_CSS = `
.ads-scroll-track {
  display:flex; gap:16px; overflow-x:auto;
  -webkit-overflow-scrolling:touch; scrollbar-width:none; cursor:grab; padding-right:48px;
}
.ads-scroll-track::-webkit-scrollbar { display:none; }
.ads-scroll-track:active { cursor:grabbing; }

.ads-card-active {
  box-shadow: 0 24px 64px rgba(0,0,0,.14), 0 6px 20px rgba(0,0,0,.08) !important;
  transform: translateY(-10px) scale(1.025) !important;
}
.ads-card-hover { transition: transform .35s cubic-bezier(.22,.68,0,1.2) !important; }
.ads-card-hover:hover { transform: translateY(-8px) !important; }

.ads-play-btn {
  width:68px; height:68px; border-radius:50%;
  background:rgba(255,255,255,.12); border:2px solid rgba(255,255,255,.35);
  display:flex; align-items:center; justify-content:center;
  backdrop-filter:blur(8px); cursor:pointer;
  transition:all .25s ease;
}
.ads-play-btn:hover { background:#C84B2F; border-color:#C84B2F; transform:scale(1.1); }

.ads-dot-btn {
  height:7px; border-radius:50%; border:none; background:#E5E7EB;
  cursor:pointer; padding:0; transition:all .3s cubic-bezier(.22,.68,0,1.2);
  width:7px;
}
.ads-dot-btn.dot-active {
  background:#C84B2F; width:22px; border-radius:4px;
}
.ads-dot-btn:hover:not(.dot-active) { background:#ccc; transform:scale(1.2); }

.ads-nav-btn {
  width:42px; height:42px; border-radius:50%; border:1.5px solid #E5E7EB;
  background:transparent; cursor:pointer; display:flex; align-items:center;
  justify-content:center; transition:all .2s ease; color:#1A1410;
}
.ads-nav-btn:hover { background:#1A1410; border-color:#1A1410; color:#fff; }

.ads-pulse-dot {
  width:7px; height:7px; border-radius:50%; background:#4A6741;
  animation:ads-pulse 1.6s ease-in-out infinite;
}
@keyframes ads-pulse {
  0%,100% { opacity:1; transform:scale(1); }
  50% { opacity:.4; transform:scale(.7); }
}
.ads-promo-bg { pointer-events:none; user-select:none;
  position:absolute; bottom:-30px; right:-20px;
  font-family:'Playfair Display',serif; font-size:11rem; font-weight:900;
  color:rgba(255,255,255,.07); line-height:1; }
`;

export function useCSS() {
    useEffect(() => {
        const id = 'ads-carousel-css';
        if (document.getElementById(id)) return;
        const s = document.createElement('style');
        s.id = id; s.textContent = ADS_CSS;
        document.head.appendChild(s);
    }, []);
}

/* ─── Types ─────────────────────────────────────── */
export type AdCardType = 'video' | 'image' | 'video_image';
export interface AdItem {
    _id?: string;
    card_type: AdCardType;
    eyebrow: string;
    title: string;
    description: string;
    media_url?: string;
    media_type?: 'image' | 'video';
    secondary_media_url?: string;
    secondary_media_type?: 'image' | 'video';
    tag?: string;
    badge?: string;
    cta_text: string;
    cta_style: 'primary' | 'dark' | 'gold' | 'sage' | 'outline-light' | 'white';
    pills?: string[];
    color_scheme: 'dark' | 'light';
    bg_color?: string;
    duration?: string;
    wide_side?: 'dark' | 'light';
    promo_tag?: string;
    promo_stats?: { num: string; label: string }[];
    order: number;
    active?: boolean;
    show_cta?: boolean;
    cta_link?: string;
}

/* ─── Dummy data ─────────────────────────────────── */
const DUMMY: AdItem[] = [];

/* ─── BG colour map ─────────────────────────────── */
const BG_MAP: Record<string, string> = {
    blue: 'linear-gradient(135deg,#1a2744 0%,#2c4a7c 100%)',
    green: 'linear-gradient(135deg,#1a3322 0%,#2d6645 100%)',
    amber: 'linear-gradient(135deg,#3d2200 0%,#8a5200 100%)',
    purple: 'linear-gradient(135deg,#1e0a3c 0%,#4a1a7c 100%)',
    teal: 'linear-gradient(135deg,#062233 0%,#0e5a70 100%)',
    rose: 'linear-gradient(135deg,#3d0a0a 0%,#7c2020 100%)',
    'soft-blue': '#d0dff5',
    'soft-green': '#d0e8d5',
    'soft-amber': '#f5e8c8',
};

function bgStyle(color?: string): React.CSSProperties {
    if (!color) return { background: '#1a1410' };
    const val = BG_MAP[color] || '#1a1410';
    return val.startsWith('linear') ? { backgroundImage: val } : { background: val };
}

/* ─── CTA button ────────────────────────────────── */
const CTA_STYLES: Record<string, React.CSSProperties> = {
    primary: { background: '#C84B2F', color: '#fff' },
    dark: { background: '#1A1410', color: '#FFFFFF' },
    gold: { background: '#D4A847', color: '#1A1410' },
    sage: { background: '#4A6741', color: '#fff' },
    'outline-light': { background: 'transparent', border: '1px solid rgba(255,255,255,.35)', color: 'rgba(255,255,255,.85)' },
    white: { background: '#FFFFFF', color: '#C84B2F', fontWeight: 600 },
};
function CtaBtn({ text, link, style: s = 'primary', fullWidth = false }: { text: string; link?: string; style?: string; fullWidth?: boolean }) {
    const handleClick = () => {
        if (link) {
            window.open(link, '_blank', 'noopener,noreferrer');
        } else {
            const el = document.getElementById('contact-us');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    return (
        <button onClick={handleClick} style={{
            fontFamily: "'Inter',sans-serif", fontSize: '.75rem', fontWeight: 600,
            letterSpacing: '.08em', textTransform: 'uppercase', padding: '12px 18px', borderRadius: 4,
            border: 'none', cursor: 'pointer', marginTop: 'auto', width: fullWidth ? '100%' : 'fit-content',
            ...CTA_STYLES[s]
        }}>
            {text}
        </button>
    );
}

/* ─── YouTube Helper ───────────────────────────── */
function getYoutubeEmbed(url?: string) {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}&controls=0&modestbranding=1` : null;
}

/* ─── Card components ──────────────────────────── */
function VideoCard({ ad }: { ad: AdItem }) {
    const isVideo = ad.media_type === 'video' || !!getYoutubeEmbed(ad.media_url) || !!ad.media_url?.match(/\.(mp4|webm|mov|ogg)$/i);
    return (
        <div className="ads-card-hover" style={{
            flex: '0 0 380px', minHeight: 220,
            borderRadius: 14, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1.3fr 1fr',
            background: '#1A1410', boxShadow: '0 25px 50px rgba(0,0,0,0.15)'
        }}>
            <div style={{ position: 'relative', overflow: 'hidden' }}>
                {isVideo ? (
                    getYoutubeEmbed(ad.media_url) ? (
                        <iframe
                            src={getYoutubeEmbed(ad.media_url)!}
                            style={{ width: '100%', height: '100%', border: 'none', objectFit: 'cover' }}
                            allow="autoplay; encrypted-media"
                            title={ad.title}
                        />
                    ) : (
                             <video
                                key={ad.media_url}
                                src={ad.media_url}
                                autoPlay={true}
                                loop={true}
                                muted={true}
                                playsInline={true}
                                crossOrigin="anonymous"
                                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#000' }}
                            />
                        )
                    ) : (
                        <img src={ad.media_url} alt={ad.title} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />
                    )}
                {ad.tag && <div style={{
                    position: 'absolute', top: 20, left: 20, background: '#C84B2F',
                    color: '#fff', fontSize: '.68rem', fontWeight: 600, letterSpacing: '.1em',
                    textTransform: 'uppercase', padding: '6px 14px', borderRadius: 4
                }}>{ad.tag}</div>}
            </div>
            <div style={{
                padding: '24px', background: '#1A1410',
                color: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 12
            }}>
                <div style={{
                    fontSize: '.65rem', letterSpacing: '.14em', textTransform: 'uppercase',
                    color: '#D4A847', fontWeight: 600
                }}>{ad.eyebrow}</div>
                <h3 style={{
                    fontFamily: "'Inter', sans-serif", fontSize: '1.2rem', fontWeight: 800,
                    lineHeight: 1.2, letterSpacing: '-.02em', margin: 0
                }}>{ad.title}</h3>
                <p style={{
                    fontSize: '.85rem', lineHeight: 1.6, color: 'rgba(255,255,255,.7)',
                    fontWeight: 400, margin: 0, overflowY: 'auto', maxHeight: '180px'
                }}>{ad.description}</p>
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {ad.pills?.map(p => <span key={p} style={{
                            fontSize: '.6rem', letterSpacing: '.05em',
                            textTransform: 'uppercase', padding: '4px 10px', borderRadius: 4, fontWeight: 600,
                            background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>{p}</span>)}
                    </div>
                    {ad.show_cta !== false && <CtaBtn text={ad.cta_text} link={ad.cta_link} style={ad.cta_style} fullWidth={true} />}
                </div>
            </div>
        </div>
    );
}

function ImageCard({ ad }: { ad: AdItem }) {
    return (
        <div className="ads-card-hover" style={{
            flex: '0 0 260px', minHeight: 260,
            borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column',
            background: '#fff', border: '1px solid #f3f4f6', boxShadow: '0 20px 40px rgba(0,0,0,0.06)'
        }}>
            <div style={{ position: 'relative', overflow: 'hidden', height: '120px', flexShrink: 0, background: '#f8fafc' }}>
                <img src={ad.media_url} alt={ad.title} crossOrigin="anonymous"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                {ad.badge && <div style={{
                    position: 'absolute', top: 12, right: 12, background: '#fff',
                    color: '#111', fontSize: '.65rem', fontWeight: 700, letterSpacing: '.1em',
                    textTransform: 'uppercase', padding: '6px 14px', borderRadius: 20,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>{ad.badge}</div>}
            </div>
            <div style={{
                padding: '24px', background: '#fff', color: '#111',
                display: 'flex', flexDirection: 'column', gap: 12, flex: 1
            }}>
                <div style={{
                    fontSize: '.65rem', letterSpacing: '.14em', textTransform: 'uppercase',
                    color: '#6366f1', fontWeight: 700
                }}>{ad.eyebrow}</div>
                <h3 style={{
                    fontFamily: "'Inter', sans-serif", fontSize: '1.25rem', fontWeight: 800,
                    lineHeight: 1.2, letterSpacing: '-.02em', margin: 0
                }}>{ad.title}</h3>
                <p style={{ 
                    fontSize: '.9rem', lineHeight: 1.5, color: '#555', fontWeight: 400, margin: 0,
                    overflowY: 'auto', maxHeight: '140px'
                 }}>
                    {ad.description}</p>
                <div style={{ marginTop: 'auto' }}>
                    {ad.show_cta !== false && <CtaBtn text={ad.cta_text} link={ad.cta_link} style={ad.cta_style} fullWidth={true} />}
                </div>
            </div>
        </div>
    );
}

function VideoImageCard({ ad }: { ad: AdItem }) {
    const isVideo = ad.media_type === 'video' || !!getYoutubeEmbed(ad.media_url) || !!ad.media_url?.match(/\.(mp4|webm|mov|ogg)$/i);
    return (
        <div className="ads-card-hover" style={{
            flex: '0 0 420px', minHeight: 220,
            borderRadius: 14, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1.1fr 1fr',
            background: '#fff', border: '1px solid #f3f4f6', boxShadow: '0 25px 60px rgba(0,0,0,0.1)'
        }}>
            <div style={{ position: 'relative', overflow: 'hidden', borderRight: '1px solid #f3f4f6' }}>
                {isVideo ? (
                    getYoutubeEmbed(ad.media_url) ? (
                        <iframe
                            src={getYoutubeEmbed(ad.media_url)!}
                            style={{ width: '100%', height: '100%', border: 'none', objectFit: 'cover' }}
                            allow="autoplay; encrypted-media"
                            title={ad.title}
                        />
                    ) : (
                        <video
                            key={ad.media_url}
                            src={ad.media_url}
                            autoPlay={true}
                            loop={true}
                            muted={true}
                            playsInline={true}
                            crossOrigin="anonymous"
                            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#f8fafc' }}
                        />
                    )
                ) : (
                    <img src={ad.media_url} alt="Primary" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#f8fafc' }} />
                )}
                <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '4px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Main</div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateRows: '1.2fr 1fr' }}>
                {/* Secondary Image Area */}
                <div style={{ position: 'relative', overflow: 'hidden', background: '#f9fafb' }}>
                    {ad.secondary_media_url ? (
                        <img src={ad.secondary_media_url} alt="Secondary" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                             <ImageIcon size={32} />
                        </div>
                    )}
                     <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(255,255,255,0.8)', color: '#111', padding: '4px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Feature</div>
                </div>

                {/* Content Area */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 8, background: '#fff' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#111', lineHeight: 1.2 }}>{ad.title}</h3>
                    <p style={{ fontSize: '.85rem', color: '#555', margin: 0, overflowY: 'auto', maxHeight: '120px', lineHeight: 1.5 }}>{ad.description}</p>
                    <div style={{ marginTop: 'auto' }}>
                         {ad.show_cta !== false && <CtaBtn text={ad.cta_text} link={ad.cta_link} style={ad.cta_style} fullWidth={true} />}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function renderCard(ad: AdItem, idx: number) {
    switch (ad.card_type) {
        case 'video':       return <VideoCard key={idx} ad={ad} />;
        case 'image':       return <ImageCard key={idx} ad={ad} />;
        case 'video_image': return <VideoImageCard key={idx} ad={ad} />;
        default:            return <ImageCard key={idx} ad={ad} />;
    }
}

/* ─── easeOutQuint ──────────────────────────────── */
function easeOutQuint(t: number) { return 1 - Math.pow(1 - t, 5); }

const DEFAULT_ADS: AdItem[] = [];

/* ─── Main carousel ─────────────────────────────── */
export default function AdsCarousel() {
    useFont();
    useCSS();

    const [ads, setAds] = useState<AdItem[]>(DEFAULT_ADS);
    const [current, setCurrent] = useState(0);
    const trackRef = useRef<HTMLDivElement>(null);
    const autoRef = useRef<number>(0);
    const pausedRef = useRef(false);
    const currentRef = useRef(0);
    const DWELL = 2200;
    const SPEED = 900;

    /* fetch live data */
    useEffect(() => {
        fetch(`${API_BASE_URL}/api/ads`)
            .then(r => r.json())
            .then(data => { 
                if (Array.isArray(data) && data.length > 0) {
                    console.log("AdsCarousel: Fetched ads successfully:", data.length);
                    setAds(data.sort((a, b) => a.order - b.order)); 
                } else {
                    console.warn("AdsCarousel: No ads received from API");
                }
            })
            .catch(err => {
                console.error("AdsCarousel: Error fetching ads:", err);
            });
    }, []);

    const getCards = useCallback(() =>
        Array.from(trackRef.current?.querySelectorAll<HTMLElement>('.ads-card-hover,.ads-card-active') ?? []), []);


    const scrollToCard = useCallback((idx: number) => {
        const cards = getCards();
        if (!cards.length || !trackRef.current) return;
        const safeIdx = ((idx % cards.length) + cards.length) % cards.length;
        currentRef.current = safeIdx;
        setCurrent(safeIdx);
        const card = cards[safeIdx];
        trackRef.current.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
    }, [getCards]);

    const startContinuousScroll = useCallback(() => {
        if (autoRef.current) cancelAnimationFrame(autoRef.current);
        const step = () => {
            if (!pausedRef.current && trackRef.current) {
                const max = trackRef.current.scrollWidth - trackRef.current.clientWidth;
                if (trackRef.current.scrollLeft >= max - 2) {
                    trackRef.current.scrollTo({ left: 0, behavior: 'smooth' }); 
                    setTimeout(() => { if (!pausedRef.current) autoRef.current = requestAnimationFrame(step); }, 800);
                    return;
                } else {
                    trackRef.current.scrollLeft += 1;
                }
            }
            autoRef.current = requestAnimationFrame(step);
        };
        autoRef.current = requestAnimationFrame(step);
    }, []);

    const pause = useCallback((resumeMs = 3500) => {
        pausedRef.current = true;
        setTimeout(() => { pausedRef.current = false; }, resumeMs);
    }, []);

    useEffect(() => {
        const t = setTimeout(() => startContinuousScroll(), 1000);
        return () => { clearTimeout(t); if (autoRef.current) cancelAnimationFrame(autoRef.current); };
    }, [startContinuousScroll]);

    useEffect(() => () => { if (autoRef.current) cancelAnimationFrame(autoRef.current); }, []);

    const dragRef = useRef({ down: false, startX: 0, scrollLeft: 0 });
    const onMouseDown = (e: React.MouseEvent) => {
        if (!trackRef.current) return;
        dragRef.current = { down: true, startX: e.pageX - trackRef.current.offsetLeft, scrollLeft: trackRef.current.scrollLeft };
        pause(5000);
    };
    const onMouseMove = (e: React.MouseEvent) => {
        if (!dragRef.current.down || !trackRef.current) return;
        e.preventDefault();
        trackRef.current.scrollLeft = dragRef.current.scrollLeft - (e.pageX - (trackRef.current.offsetLeft) - dragRef.current.startX) * 1.4;
    };
    const onMouseUp = () => {
        dragRef.current.down = false;
        const cards = getCards();
        let nearest = 0, minD = Infinity;
        cards.forEach((c, i) => {
            const d = Math.abs(c.offsetLeft - 64 - (trackRef.current?.scrollLeft ?? 0));
            if (d < minD) { minD = d; nearest = i; }
        });
        scrollToCard(nearest);
    };

    if (ads.length === 0) return null;

    return (
        <section style={{ background: '#fff', fontFamily: "'Inter', sans-serif", color: '#111', overflow: 'hidden' }}>
            <div style={{ width: '100%', padding: '28px 0 0 24px', position: 'relative' }}>
                <div
                    ref={trackRef}
                    className="ads-scroll-track"
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onMouseLeave={() => { dragRef.current.down = false; }}
                    onMouseEnter={() => pause(3000)}
                >
                    {ads.map((ad, i) => renderCard(ad, i))}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '32px 24px 48px' }}>
                <div style={{ display: 'flex', gap: 16 }}>
                    <button className="ads-nav-btn" aria-label="Previous"
                        onClick={() => { pause(4000); scrollToCard(currentRef.current - 1); }}>
                        <ChevronLeft size={20} />
                    </button>
                    <button className="ads-nav-btn" aria-label="Next"
                        onClick={() => { pause(4000); scrollToCard(currentRef.current + 1); }}>
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </section>
    );
}
