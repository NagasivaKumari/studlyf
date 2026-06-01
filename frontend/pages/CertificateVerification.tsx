import React, { useState, useEffect } from 'react';
import { ShieldCheck, Calendar, User, Award, CheckCircle2, Download, Share2, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import Navigation from '../components/Navigation';

const CertificateVerification: React.FC = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
        try {
            const res = await fetch(`/api/v1/institution/verify-certificate/${id}`);
            if (!res.ok) throw new Error("Certificate not found");
            const data = await res.json();
            setCertData(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    if (id) verify();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#fafafa] flex items-start justify-center px-6 py-28">
      <div className="w-full max-w-2xl rounded-[2.5rem] border border-gray-100 bg-white shadow-sm p-8 sm:p-10 text-center">
        <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Verifying institutional record</p>
      </div>
    </div>
  );
  
  if (error || !certData) return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-8">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-xl text-center max-w-md border-4 border-red-100">
            <X size={48} className="text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-black text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-500">This certificate record could not be found or has been revoked by the institution.</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <ShieldCheck size={40} className="text-green-600" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Verified Credential</h1>
          <p className="text-gray-500 mt-2">This digital certificate has been cryptographically verified and issued by StudLyf.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <div className="bg-white p-8 md:p-12 rounded-[2rem] border-4 border-gray-100 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-50 rounded-full -ml-12 -mb-12" />
              <div className="relative">
                <div className="flex justify-between items-start mb-12">
                  <div className="font-black text-2xl tracking-tighter text-blue-600">StudLyf</div>
                  <CheckCircle2 className="text-green-500" size={32} />
                </div>
                <div className="space-y-8">
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] mb-2">Certificate of Achievement</p>
                    <h2 className="text-3xl font-black text-gray-900">{certData.recipient}</h2>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed max-w-md">
                    Has successfully participated in and achieved the rank of <span className="font-bold text-gray-900">{certData.rank}</span> in the 
                    <span className="font-bold text-blue-600 italic"> {certData.event}</span>.
                  </p>
                  <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Issue Date</p>
                      <p className="text-sm font-bold text-gray-800">{certData.date}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Issuer ID</p>
                      <p className="text-sm font-mono font-bold text-gray-800">{id}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award size={18} className="text-blue-600" />
                Issuer Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-400"><User size={16} /></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Verified Recipient</p>
                    <p className="text-sm font-bold text-gray-800">{certData.recipient}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-400"><Calendar size={16} /></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Event Date</p>
                    <p className="text-sm font-bold text-gray-800">{certData.date}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
            <button className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-95"
                onClick={() => window.open(`/api/v1/institution/download-certificate/${id}`, '_blank')}>
                <Download size={18} />
                Download PDF
            </button>
            <button className="w-full py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:border-blue-400 transition-all"
                onClick={() => { navigator.clipboard?.writeText?.(window.location.href); alert('Verification link copied!'); }}>
                <Share2 size={18} />
                Share Credential
            </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CertificateVerification;
