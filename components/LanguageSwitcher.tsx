'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation, Language } from '@/lib/i18n';
import { Globe, ChevronDown, Check } from 'lucide-react';

const LANGUAGES: { id: Language; label: string; flag: string; short: string; currency: string }[] = [
  { id: 'pt', label: 'Português', flag: '🇧🇷', short: 'PT', currency: 'R$' },
  { id: 'en', label: 'English', flag: '🇺🇸', short: 'EN', currency: '$' },
  { id: 'es', label: 'Español', flag: '🇪🇸', short: 'ES', currency: '$' },
];

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.id === language) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left select-none ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold shadow-sm transition active:scale-95"
      >
        <span className="text-sm leading-none">{currentLang.flag}</span>
        <span className="font-bold">{currentLang.short}</span>
        <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl z-50 py-1.5 animate-scale-in">
          <div className="px-3 py-1.5 border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
            Idioma & Moeda
          </div>
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                setLanguage(l.id);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-xs flex items-center justify-between hover:bg-zinc-800 transition ${
                language === l.id ? 'text-amber-400 font-bold bg-zinc-850/50' : 'text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{l.flag}</span>
                <span>{l.label}</span>
                <span className="text-[10px] text-zinc-500 font-mono">({l.currency})</span>
              </div>
              {language === l.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
