import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  showOrangeDot?: boolean;
  buttonClassName?: string;
  className?: string;
  disabled?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'เลือก...',
  searchPlaceholder = 'ค้นหา...',
  showOrangeDot = false,
  buttonClassName = '',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (opt.sublabel && opt.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-left shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-slate-100 disabled:cursor-not-allowed ${buttonClassName}`}
      >
        <span className="truncate flex items-center gap-1.5">
          {showOrangeDot && <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />}
          {selectedOption ? (
            <span className="flex items-center gap-1.5">
              <span>{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-[11px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                  {selectedOption.sublabel}
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-hidden flex flex-col font-anuphan">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm focus:outline-none text-slate-700"
            />
          </div>
          <div className="overflow-y-auto max-h-48 py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value + opt.label}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-orange-50 transition-colors ${
                    opt.value === value ? 'bg-orange-50/70 font-semibold text-orange-900' : 'text-slate-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-[11px] text-orange-600 font-medium">
                        {opt.sublabel}
                      </span>
                    )}
                  </div>
                  {opt.value === value && <Check className="w-4 h-4 text-orange-600 shrink-0 ml-2" />}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-slate-400 text-center">ไม่พบข้อมูล</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
