'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
  icon?: React.ReactNode;
}

export interface SelectGroup {
  label: string;
  icon?: React.ReactNode;
  options: SelectOption[];
}

interface CustomSelectProps {
  groups: SelectGroup[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CustomSelect({ groups, value, onChange, className = '' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Find the selected option across all groups
  let selectedOption: SelectOption | undefined;
  for (const group of groups) {
    const found = group.options.find((opt) => opt.value === value);
    if (found) {
      selectedOption = found;
      break;
    }
  }

  // Close when clicked outside
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
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 bg-zinc-900 border px-3 py-2 rounded-lg text-xs font-medium text-zinc-200 transition-all ${
          isOpen
            ? 'border-amber-400 ring-1 ring-amber-400/50 bg-zinc-850'
            : 'border-zinc-700/80 hover:border-zinc-600 hover:bg-zinc-850'
        }`}
      >
        <div className="flex items-center gap-2 truncate text-left">
          {selectedOption?.icon && (
            <span className="text-amber-400 shrink-0">{selectedOption.icon}</span>
          )}
          <div className="truncate">
            <span className="block truncate text-zinc-100 font-medium">
              {selectedOption?.label || 'Selecione...'}
            </span>
            {selectedOption?.subLabel && (
              <span className="text-[10px] text-zinc-400 block truncate font-mono">
                {selectedOption.subLabel}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {selectedOption?.badge && (
            <span className="text-[9px] font-mono font-semibold bg-zinc-800 text-amber-400 px-1.5 py-0.5 rounded border border-zinc-700">
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-amber-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-zinc-900 border border-zinc-700/90 rounded-xl shadow-2xl z-50 overflow-hidden max-h-72 overflow-y-auto animate-scale-in p-1 space-y-2">
          {groups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-0.5">
              {/* Group Header */}
              <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase flex items-center gap-1.5 bg-zinc-950/40 rounded">
                {group.icon && <span className="text-amber-400/80">{group.icon}</span>}
                <span>{group.label}</span>
              </div>

              {/* Group Options */}
              <div className="space-y-0.5 pt-0.5">
                {group.options.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                        isSelected
                          ? 'bg-amber-400/15 text-amber-300 font-semibold border border-amber-400/30'
                          : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {opt.icon && (
                          <span
                            className={isSelected ? 'text-amber-400' : 'text-zinc-500'}
                          >
                            {opt.icon}
                          </span>
                        )}
                        <div className="truncate">
                          <div className="truncate text-[11px] leading-tight">
                            {opt.label}
                          </div>
                          {opt.subLabel && (
                            <div className="text-[10px] text-zinc-400 font-mono leading-tight">
                              {opt.subLabel}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {opt.badge && (
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                              isSelected
                                ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
