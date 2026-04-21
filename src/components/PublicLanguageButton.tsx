import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Globe, Search, Check } from 'lucide-react';
import { useLanguage, LANGUAGES } from '../lib/language-context';
import type { Language } from '../lib/language-context';

export function PublicLanguageButton() {
  const { selectedLanguage, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter(
      l =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.region.toLowerCase().includes(q),
    );
  }, [search]);

  // Group by region
  const grouped = useMemo(() => {
    const map = new Map<string, Language[]>();
    filtered.forEach(l => {
      if (!map.has(l.region)) map.set(l.region, []);
      map.get(l.region)!.push(l);
    });
    return map;
  }, [filtered]);

  const handleSelect = (code: string) => {
    setLanguage(code);
    setOpen(false);
    setSearch('');
  };

  const displayCode = selectedLanguage.code.split('-')[0].toUpperCase();

  return (
    <div
      ref={ref}
      className="fixed bottom-6 left-6 z-[9999]"
    >
      {/* Floating trigger button */}
      <button
        onMouseEnter={() => setOpen(true)}
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-black text-white shadow-lg hover:bg-gray-800 transition-colors text-sm font-semibold select-none"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4" />
        <span className="tracking-widest text-xs">{displayCode}</span>
      </button>

      {/* Scrollable language popup — appears above the button */}
      {open && (
        <div
          onMouseLeave={() => { if (!search) setOpen(false); }}
          className="absolute bottom-full mb-2 left-0 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col max-h-96 overflow-hidden"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">Select Language</span>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black/10"
              />
            </div>
          </div>

          {/* Language list */}
          <div className="overflow-y-auto flex-1">
            {Array.from(grouped.entries()).map(([region, langs]) => (
              <div key={region}>
                <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 sticky top-0">
                  {region}
                </div>
                {langs.map(l => (
                  <button
                    key={l.code}
                    onClick={() => handleSelect(l.code)}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${selectedLanguage.code === l.code ? 'bg-black/5 text-black font-semibold' : 'text-gray-700'}`}
                  >
                    <span className="flex flex-col items-start">
                      <span>{l.name}</span>
                      <span className="text-[11px] text-gray-400">{l.nativeName}</span>
                    </span>
                    {selectedLanguage.code === l.code && <Check className="w-3.5 h-3.5 shrink-0 text-black" />}
                  </button>
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-6">No languages found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
