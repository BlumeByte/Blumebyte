import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Search, Check } from 'lucide-react';
import { useLanguage, LANGUAGES } from '../lib/language-context';
import type { Language } from '../lib/language-context';

interface LanguageSelectorProps {
  /** Visual style – use 'card' inside dashboard settings, 'compact' elsewhere */
  variant?: 'card' | 'compact';
  className?: string;
}

export function LanguageSelector({ variant = 'card', className = '' }: LanguageSelectorProps) {
  const { selectedLanguage, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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

  // Group by region for display
  const regions = useMemo(() => {
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

  if (variant === 'compact') {
    return (
      <div ref={ref} className={`relative ${className}`}>
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors"
        >
          <Globe className="w-4 h-4 text-muted-foreground" />
          <span className="uppercase tracking-wide text-xs">{selectedLanguage.code.split('-')[0]}</span>
          <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute right-0 mt-1 w-72 bg-card border border-border rounded-xl shadow-xl z-50 flex flex-col max-h-80">
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search language…"
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {Array.from(regions.entries()).map(([region, langs]) => (
                <div key={region}>
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50">
                    {region}
                  </div>
                  {langs.map(l => (
                    <button
                      key={l.code}
                      onClick={() => handleSelect(l.code)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted transition-colors ${selectedLanguage.code === l.code ? 'bg-primary/5 text-primary' : ''}`}
                    >
                      <span className="flex flex-col items-start">
                        <span className="font-medium">{l.name}</span>
                        <span className="text-[11px] text-muted-foreground">{l.nativeName}</span>
                      </span>
                      {selectedLanguage.code === l.code && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">No languages found</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // card variant — used in settings pages
  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-border bg-card hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <span className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-primary" />
          <span className="flex flex-col items-start">
            <span className="font-medium text-sm">{selectedLanguage.name}</span>
            <span className="text-xs text-muted-foreground">{selectedLanguage.nativeName} · {selectedLanguage.region}</span>
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 flex flex-col max-h-80">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search language…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {Array.from(regions.entries()).map(([region, langs]) => (
              <div key={region}>
                <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50 sticky top-0">
                  {region}
                </div>
                {langs.map(l => (
                  <button
                    key={l.code}
                    onClick={() => handleSelect(l.code)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted transition-colors ${selectedLanguage.code === l.code ? 'bg-primary/5 text-primary' : ''}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="font-medium">{l.name}</span>
                      <span className="text-xs text-muted-foreground">{l.nativeName}</span>
                    </span>
                    {selectedLanguage.code === l.code && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No languages found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
