
import React from 'react';
import { UserData } from '../types';

interface InputFormProps {
  profile: UserData;
  onSubmit: (data: UserData) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ profile, onSubmit, isLoading }) => {
  const [specialChars, setSpecialChars] = React.useState(profile.specialChars || '!@#$%');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.firstName || !profile.lastName || !profile.dob) {
      alert("Missing Profile Data: Go to Settings to configure your identity markers.");
      return;
    }
    onSubmit({ ...profile, specialChars });
  };

  const labelClass = "block text-sm font-black mb-2 text-slate-950 dark:text-slate-200 transition-colors uppercase tracking-tight";
  const fixedInputClass = "w-full px-5 py-4 rounded-xl border transition-all outline-none font-black text-slate-800 bg-slate-100 border-slate-200 dark:bg-slate-800/80 dark:border-slate-800 dark:text-slate-300 cursor-not-allowed select-none shadow-inner";
  const editableInputClass = "w-full px-5 py-4 rounded-xl border transition-all outline-none font-black text-slate-950 bg-white border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 dark:bg-slate-950 dark:border-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in transition-all">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className={labelClass}>First Identity Marker</label>
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
               <svg className="w-2.5 h-2.5 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Fixed</span>
            </div>
          </div>
          <input
            type="text"
            readOnly
            value={profile.firstName || 'UNSET'}
            className={fixedInputClass}
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className={labelClass}>Last Identity Marker</label>
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
               <svg className="w-2.5 h-2.5 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Fixed</span>
            </div>
          </div>
          <input
            type="text"
            readOnly
            value={profile.lastName || 'UNSET'}
            className={fixedInputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className={labelClass}>Origin Date</label>
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
               <svg className="w-2.5 h-2.5 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Fixed</span>
            </div>
          </div>
          <input
            type="text"
            readOnly
            value={profile.dob || 'UNSET'}
            className={fixedInputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Entropy Symbols</label>
          <input
            type="text"
            value={specialChars}
            onChange={(e) => setSpecialChars(e.target.value)}
            placeholder="!@#$%"
            className={editableInputClass}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
        <p className="text-[11px] font-black text-slate-500 dark:text-slate-600 mb-6 italic tracking-tight">
          System Identity Markers are securely locked. Modify them via the <span className="text-indigo-600 dark:text-indigo-500 underline decoration-2 underline-offset-4">Settings</span> portal.
        </p>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-5 rounded-2xl text-white font-black text-xl shadow-2xl transform transition-all active:scale-[0.97] hover:scale-[1.01] ${
            isLoading 
              ? 'bg-slate-500 cursor-not-allowed opacity-50' 
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Deriving Intelligence...
            </span>
          ) : 'Generate Personalized Keys'}
        </button>
      </div>
    </form>
  );
};

export default InputForm;
