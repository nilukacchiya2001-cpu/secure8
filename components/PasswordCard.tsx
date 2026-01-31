
import React, { useState } from 'react';
import { PasswordSuggestion } from '../types';

interface PasswordCardProps {
  suggestion: PasswordSuggestion;
  isDarkMode?: boolean;
  onCopy?: (val: string) => void;
  onSave?: () => void;
  onDelete?: () => void;
  onFavorite?: () => void;
}

const PasswordCard: React.FC<PasswordCardProps> = ({ suggestion, isDarkMode, onCopy, onSave, onDelete, onFavorite }) => {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(!suggestion.usageLocation);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(suggestion.value);
    setCopied(true);
    if (onCopy) onCopy(suggestion.value);
    setTimeout(() => setCopied(false), 2000);
  };

  const config = {
    strong: { label: 'High Security', color: 'bg-emerald-600', text: 'text-emerald-800 dark:text-emerald-400' },
    medium: { label: 'Balanced', color: 'bg-blue-600', text: 'text-blue-800 dark:text-blue-400' },
    weak: { label: 'Memorable', color: 'bg-amber-600', text: 'text-amber-800 dark:text-amber-400' }
  }[suggestion.strength];

  const isVaultItem = !!suggestion.usageLocation;

  return (
    <div className={`group relative border p-6 rounded-[2.5rem] transition-all hover:shadow-2xl hover:-translate-y-1 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} ${suggestion.isFavorite ? (isDarkMode ? 'ring-4 ring-indigo-500/20 border-indigo-500/40' : 'border-indigo-300 ring-4 ring-indigo-50/50') : ''}`}>
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-3 flex-grow">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
            <span className={`text-[10px] uppercase font-black tracking-widest ${config.text}`}>
              {config.label}
            </span>
            {suggestion.isFavorite && (
              <span className="text-indigo-600 dark:text-indigo-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              </span>
            )}
          </div>
          
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isVaultItem ? 'bg-indigo-600 text-white' : (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700')}`}>
                {isVaultItem ? suggestion.usageLocation : suggestion.category}
              </div>
              {isVaultItem && suggestion.websiteUrl && (
                <a 
                  href={suggestion.websiteUrl.startsWith('http') ? suggestion.websiteUrl : `https://${suggestion.websiteUrl}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`p-1.5 transition-colors rounded-lg ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-indigo-400' : 'bg-slate-100 text-slate-500 hover:text-indigo-700'}`}
                  title="Visit Website"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              )}
            </div>
            {isVaultItem && (
              <div className="space-y-1 mt-2">
                <p className={`text-[12px] font-black px-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{suggestion.accountDetail}</p>
                {suggestion.notes && (
                  <p className={`text-[11px] px-1 italic line-clamp-2 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`} title={suggestion.notes}>
                    {suggestion.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {isVaultItem && onFavorite && (
            <button onClick={onFavorite} className={`p-2.5 rounded-xl border transition-all ${suggestion.isFavorite ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-500' : (isDarkMode ? 'text-slate-500 border-slate-800' : 'text-slate-400 border-slate-100')}`}>
              <svg className="w-5 h-5" fill={suggestion.isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            </button>
          )}
          {!isVaultItem && onSave && (
            <button onClick={onSave} className={`p-2.5 rounded-xl transition-all border ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            </button>
          )}
          <button onClick={() => setIsVisible(!isVisible)} className={`p-2.5 rounded-xl border transition-all ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white' : 'bg-slate-50 text-slate-500 border-slate-100 hover:text-indigo-700'}`}>
            {isVisible ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            )}
          </button>
          {isVaultItem && onDelete && (
            <button onClick={onDelete} className="p-2.5 text-slate-400 hover:text-rose-600 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          )}
        </div>
      </div>
      
      <div onClick={copyToClipboard} className={`mono text-4xl font-black tracking-[0.2em] mb-6 cursor-pointer transition-all duration-300 ${!isVisible ? 'blur-xl opacity-10' : (isDarkMode ? 'text-white' : 'text-slate-950')}`}>
        {isVisible ? suggestion.value : '••••••••'}
      </div>
      
      <div className={`flex items-center justify-between border-t pt-5 transition-colors ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <p className={`text-[11px] font-medium italic line-clamp-1 max-w-[70%] transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-600'}`}>{suggestion.explanation}</p>
        <button onClick={copyToClipboard} className={`text-[11px] font-black uppercase tracking-widest transition-colors ${copied ? 'text-emerald-600' : (isDarkMode ? 'text-slate-400 group-hover:text-indigo-400' : 'text-slate-500 group-hover:text-indigo-700')}`}>
          {copied ? 'Copied!' : 'Copy Key'}
        </button>
      </div>
    </div>
  );
};

export default PasswordCard;
