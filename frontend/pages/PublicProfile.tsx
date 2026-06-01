import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../apiConfig';
import { ArrowLeft, Award, BadgeCheck, BookOpen, Briefcase, Calendar, Copy, Globe, MapPin, Share2, Sparkles, Star, TrendingUp, User } from 'lucide-react';
import AvatarImage from '../components/AvatarImage';

const PublicProfile: React.FC = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const publicUrl = useMemo(() => {
    if (!userId || typeof window === 'undefined') return '';
    return `${window.location.origin}/profile/${userId}`;
  }, [userId]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) {
        setError('Profile link is missing a user id.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/user/${userId}/profile`);
        if (!res.ok) {
          throw new Error('Profile not found');
        }
        const data = await res.json();
        setProfile(data);
      } catch (err: any) {
        setError(err?.message || 'Unable to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const copyLink = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const shareProfile = async () => {
    if (!publicUrl) return;
    const payload = {
      title: `${profile?.full_name || 'Studlyf Profile'}`,
      text: `View ${profile?.full_name || 'this profile'} on Studlyf.`,
      url: publicUrl,
    };

    if (navigator.share) {
      await navigator.share(payload);
      return;
    }

    await copyLink();
  };

  const skills = profile?.skills || [];
  const achievements = profile?.achievements || [];
  const projects = profile?.projects || [];
  const experience = profile?.experienceList || [];
  const certifications = profile?.certifications || [];
  const isVisible = profile?.profileVisible ?? true;
  const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || profile?.full_name || 'Contributor Profile';
  const role = profile?.userType || profile?.role || 'Contributor';
  const headline = profile?.bio || profile?.careerGoal || 'Contributor profile on Studlyf';

  const stats = [
    { label: 'Tests completed', value: (profile?.resume?.atsScore > 0 ? 1 : 0) + certifications.length + achievements.length, tone: 'emerald' },
    { label: 'Contributions', value: projects.length + experience.length, tone: 'violet' },
    { label: 'Skills', value: skills.length, tone: 'sky' },
    { label: 'Activity score', value: Math.min(100, (skills.length * 8) + (projects.length * 10) + (achievements.length * 6) + (profile?.resume?.atsScore || 0) / 2), tone: 'amber' },
  ];

  const timeline = [
    { title: 'Profile status', detail: isVisible ? 'Public profile is enabled and ready to share.' : 'This profile is currently limited in visibility.' },
    { title: 'Portfolio signal', detail: `${projects.length} projects and ${experience.length} work entries are available.` },
    { title: 'Skill density', detail: `${skills.length} skills are listed across the profile workspace.` },
    { title: 'Recognition', detail: `${achievements.length} achievements and ${certifications.length} certifications are shown.` },
  ];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F4F4F6] px-4 py-8 sm:px-6 lg:px-10">
                <div className="mx-auto max-w-7xl space-y-6">
                    <div className="w-32 h-10 bg-gray-200 rounded-2xl animate-pulse"></div>
                    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
                        <div className="h-64 bg-white rounded-[3rem] p-10 animate-pulse border border-gray-100 flex gap-8">
                            <div className="w-24 h-24 bg-gray-100 rounded-[2rem] shrink-0"></div>
                            <div className="flex-1 space-y-4">
                                <div className="w-1/2 h-10 bg-gray-100 rounded-lg"></div>
                                <div className="w-1/3 h-6 bg-gray-100 rounded-lg"></div>
                            </div>
                        </div>
                        <div className="h-64 bg-white rounded-[3rem] p-10 animate-pulse border border-gray-100"></div>
                    </div>
                </div>
            </div>
        );
    }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#F4F4F6] flex items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-[3rem] border border-gray-100 bg-white p-10 text-center shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <User className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Profile unavailable</h1>
          <p className="mt-2 text-sm text-gray-500">{error || 'The profile you requested could not be loaded.'}</p>
          <div className="mt-6 flex justify-center">
            <Link to="/" className="inline-flex items-center gap-2 rounded-2xl bg-[#7C3AED] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-[#7C3AED]/20">
              <ArrowLeft className="h-4 w-4" /> Back Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F6] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-gray-700 shadow-sm transition hover:border-[#7C3AED]/30 hover:text-[#7C3AED]">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 shadow-sm border border-gray-100">
            <Globe className="h-3 w-3 text-[#7C3AED]" /> Public Profile
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
          <section className="relative overflow-hidden rounded-[3rem] border border-gray-100 bg-white p-8 sm:p-10 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/5 via-transparent to-[#06B6D4]/10 pointer-events-none" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center">
              <div className="flex items-start gap-5 flex-1">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[2rem] border border-white bg-gray-50 shadow-xl ring-4 ring-[#7C3AED]/10">
                  {profile.profilePhoto ? <AvatarImage src={profile.profilePhoto} alt={name} className="h-full w-full object-cover" /> : <User className="h-10 w-10 text-gray-300" />}
                </div>
                <div className="min-w-0">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#7C3AED]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#7C3AED]">
                    <Sparkles className="h-3 w-3" /> Contributor Profile
                  </div>
                  <h1 className="break-words text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">{name}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    <span className="rounded-full border border-gray-100 bg-gray-50 px-3 py-1 font-medium text-gray-700">{role}</span>
                    {profile.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {profile.location}</span>}
                    {profile.domain && <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 font-medium text-emerald-700">{profile.domain}</span>}
                    {!isVisible && <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 font-medium text-amber-700">Visibility limited</span>}
                  </div>
                  <p className="mt-5 max-w-3xl text-sm leading-7 text-gray-600 sm:text-base">{headline}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:w-[280px]">
                <div className="rounded-3xl border border-gray-100 bg-gray-50/80 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Profile score</div>
                  <div className="mt-3 text-3xl font-black text-gray-900">{Math.round(Math.min(100, (skills.length * 8) + (projects.length * 10) + (achievements.length * 6)))}</div>
                  <div className="mt-3 h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${Math.min(100, (skills.length * 8) + (projects.length * 10) + (achievements.length * 6))}%` }} />
                  </div>
                </div>
                <div className="rounded-3xl border border-gray-100 bg-gray-50/80 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Public URL</div>
                  <div className="mt-3 break-all text-sm font-bold text-gray-900">{publicUrl}</div>
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-[3rem] border border-gray-100 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">Profile Actions</h2>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Share and copy this profile</p>
              </div>
              <Share2 className="h-5 w-5 text-[#7C3AED]" />
            </div>
            <div className="mt-6 space-y-3">
              <button onClick={copyLink} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-gray-900 transition hover:border-[#7C3AED]/30">
                {copied ? 'Copied' : 'Copy Profile Link'}
              </button>
              <button onClick={shareProfile} className="w-full rounded-2xl bg-[#7C3AED] px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-[#7C3AED]/20 transition hover:bg-[#6D28D9]">
                Share Profile
              </button>
            </div>
            <div className="mt-6 rounded-3xl border border-[#7C3AED]/10 bg-[#F5F3FF]/70 p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7C3AED]">Summary</div>
              <p className="mt-3 text-sm leading-6 text-gray-700">A public contributor profile with project history, skill depth, and profile sharing baked in.</p>
            </div>
          </aside>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(stat => (
            <div key={stat.label} className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${stat.tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' : stat.tone === 'violet' ? 'bg-[#F5F3FF] text-[#7C3AED]' : stat.tone === 'sky' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'}`}>
                {stat.label}
              </div>
              <div className="mt-4 text-3xl font-black text-gray-900">{stat.value}</div>
              <p className="mt-2 text-xs leading-5 text-gray-500">Public metric derived from profile content.</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[3rem] border border-gray-100 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">Activity Timeline</h2>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Visible milestones on the public surface</p>
              </div>
              <Calendar className="h-5 w-5 text-gray-300" />
            </div>
            <div className="mt-6 space-y-4">
              {timeline.map((entry, index) => (
                <div key={entry.title} className="flex gap-4 rounded-3xl border border-gray-100 bg-gray-50/60 p-4">
                  <div className="mt-2 h-3 w-3 shrink-0 rounded-full bg-[#7C3AED]" />
                  <div>
                    <div className="text-sm font-black text-gray-900">{entry.title}</div>
                    <div className="text-sm leading-6 text-gray-600">{entry.detail}</div>
                    <div className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">0{index + 1}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[3rem] border border-gray-100 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">Highlights</h2>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Badges and recent work</p>
              </div>
              <Award className="h-5 w-5 text-[#7C3AED]" />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Skills', value: skills.length },
                { label: 'Projects', value: projects.length },
                { label: 'Experience', value: experience.length },
                { label: 'Certifications', value: certifications.length },
              ].map(item => (
                <div key={item.label} className="rounded-3xl border border-gray-100 bg-[#FAFAFA] p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{item.label}</div>
                  <div className="mt-2 text-2xl font-black text-gray-900">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Profile Builder', value: `${projects.length + experience.length} records` },
                { label: 'Recognition', value: `${achievements.length} achievements` },
                { label: 'Resume Ready', value: profile?.resume?.fileName !== 'No resume uploaded' ? 'Active' : 'Pending' },
                { label: 'Visibility', value: isVisible ? 'Public' : 'Limited' },
              ].map(badge => (
                <div key={badge.label} className="rounded-3xl border border-[#7C3AED]/10 bg-[#F5F3FF]/70 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7C3AED]">{badge.label}</div>
                  <div className="mt-2 text-sm font-bold text-gray-900">{badge.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-3xl border border-gray-100 bg-gray-50/70 p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Featured Skills</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.slice(0, 8).map((skill: any) => (
                  <span key={skill.name || skill} className="rounded-full border border-gray-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-700">
                    {skill.name || skill}
                  </span>
                ))}
                {skills.length === 0 && <span className="text-sm text-gray-400">No public skills listed yet.</span>}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
