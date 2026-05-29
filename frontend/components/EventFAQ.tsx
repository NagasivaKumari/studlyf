import React, { useState, useMemo } from 'react';
import { ChevronDown, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  id?: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
}

interface EventFAQProps {
  faqs: FAQItem[];
  title?: string;
  className?: string;
}

export default function EventFAQ({ faqs, title = 'Frequently Asked Questions', className = '' }: EventFAQProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = useMemo(() => {
    const cats = ['All', ...new Set(faqs.map(f => f.category || 'General'))];
    return cats;
  }, [faqs]);

  const filtered = useMemo(() => {
    return faqs.filter(f => {
      const matchSearch = !search || f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === 'All' || (f.category || 'General') === activeCategory;
      return matchSearch && matchCat;
    });
  }, [faqs, search, activeCategory]);

  if (!faqs || faqs.length === 0) return null;

  return (
    <section className={`bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6 ${className}`}>
      <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
        <span className="w-1 h-7 bg-purple-600 rounded-full" />
        {title}
      </h2>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search FAQs..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-400 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Filter size={14} className="text-slate-400 shrink-0" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                activeCategory === cat ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ List */}
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-400 font-medium text-center py-8">No FAQs found matching your search.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((faq, i) => {
            const key = faq.id || String(i);
            const isOpen = openId === key;
            return (
              <div key={key} className="border border-slate-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenId(isOpen ? null : key)}
                  className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm font-bold text-slate-800 flex-1">{faq.question}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {faq.category && faq.category !== 'General' && (
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{faq.category}</span>
                    )}
                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap border-t border-slate-100 pt-3">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-400 font-medium text-center">{filtered.length} of {faqs.length} FAQs</p>
    </section>
  );
}
