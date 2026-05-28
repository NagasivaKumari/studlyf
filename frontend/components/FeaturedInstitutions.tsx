import React from 'react';

const institutions = [
    { name: 'Woxsen', logo: '/images/woxen.png' },
    { name: 'VJIM', logo: '/images/vjim.png' },
    { name: 'Vishnu', logo: '/images/vishnu.webp' },
    { name: 'SRM', logo: '/images/srm.webp' },
    { name: 'MRU', logo: '/images/mru.png' },
    { name: 'IIT Madras', logo: '/images/iitm.png' },
    { name: 'IIT Kanpur', logo: '/images/iit k.png' },
    { name: 'IIT Hyderabad', logo: '/images/iit h.webp' },
    { name: 'IIT Delhi', logo: '/images/iit-delhi.png' },
    { name: 'IIT Bombay', logo: '/images/iit-bombay.png' },
    { name: 'IIM K', logo: '/images/iim k.webp' },
    { name: 'GRIET', logo: '/images/griet.jpg' },
    { name: 'CMR', logo: '/images/cmr.png' },
    { name: 'CBIT', logo: '/images/cbit.png' },
    { name: 'BITS', logo: '/images/bits.webp' },
    { name: 'Anurag University', logo: '/images/anuraguni.png' },
];

const FeaturedInstitutions: React.FC = () => {
    // Triple for a seamless infinite loop
    const allInstitutions = [...institutions, ...institutions, ...institutions];

    return (
        <section className="bg-white py-16 overflow-hidden relative">
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes scroll-left-to-right {
                    0% { transform: translateX(calc(-100% / 3)); }
                    100% { transform: translateX(0); }
                }
                .inst-marquee-track {
                    display: flex;
                    gap: 6rem;
                    width: max-content;
                    animation: scroll-left-to-right 60s linear infinite;
                    align-items: center;
                }
                .inst-marquee-track:hover {
                    animation-play-state: paused;
                }
                .inst-logo {
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.02));
                }
                .inst-card {
                    transition: all 0.4s ease;
                }
                .inst-card:hover .inst-logo {
                    transform: scale(1.12) translateY(-4px);
                    filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.12));
                }
            ` }} />

            {/* Section Title */}
            <div className="text-center mb-12 px-4">
                <h2 className="text-3xl md:text-5xl font-['Poppins'] font-extrabold text-black mb-4 tracking-tight uppercase">
                    Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C4DFF] via-[#EC4899] to-[#FF5B5B]">Institutions</span>
                </h2>
                <p className="text-base md:text-lg text-gray-500 font-['Poppins'] font-medium max-w-3xl mx-auto">
                    STUDLYF learners come from strong colleges, universities, and institutions.
                </p>
            </div>

            <div className="relative max-w-[1400px] mx-auto">
                {/* Edge Fades for Premium Look */}
                <div className="absolute inset-y-0 left-0 w-24 md:w-40 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
                <div className="absolute inset-y-0 right-0 w-24 md:w-40 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

                <div className="inst-marquee-track py-6 px-8">
                    {allInstitutions.map((institution, index) => (
                        <div
                            key={`${institution.name}-${index}`}
                            className="inst-card flex-shrink-0 w-40 h-24 flex items-center justify-center cursor-pointer"
                        >
                            <img
                                src={institution.logo}
                                alt={institution.name}
                                className="inst-logo max-w-full max-h-full object-contain"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                        parent.innerHTML = `<span class="text-sm font-['Poppins'] font-semibold text-gray-400 text-center leading-tight">${institution.name}</span>`;
                                    }
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedInstitutions;
