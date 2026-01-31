
import React from 'react';
import { UserData } from '../types';

interface InputFormProps {
  profile: UserData;
  onSubmit: (data: UserData) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ profile, onSubmit, isLoading }) => {
  const [specialChars, setSpecialChars] = React.useState(profile.specialChars || '!@#$%-');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.firstName || !profile.lastName || !profile.dob) {
      alert("Missing Identity: Please configure your profile markers in the Settings portal.");
      return;
    }
    onSubmit({ ...profile, specialChars });
  };

  const labelClass = "block text-sm font-black mb-2 text-slate-950 dark:text-white transition-colors uppercase tracking-tight";
  const fixedInputClass = "w-full px-5 py-4 rounded-2xl border transition-all outline-none font-black text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800/80 dark:border-slate-800 dark:text-slate-400 cursor-not-allowed select-none shadow-inner opacity-80";
  const editableInputClass = "w-full px-5 py-4 rounded-2xl border-2 transition-all outline-none font-black text-slate-950 bg-white border-slate-200 focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 dark:bg-slate-950 dark:border-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-10 bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 animate-fade-in transition-all">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className={labelClass}>First Identity Marker</label>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
               <svg className="w-3 h-3 text-slate-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Locked</span>
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
          <div className="flex justify-between items-center mb-3">
            <label className={labelClass}>Last Identity Marker</label>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
               <svg className="w-3 h-3 text-slate-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Locked</span>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className={labelClass}>Origin Date</label>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
               <svg className="w-3 h-3 text-slate-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Locked</span>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              readOnly
              value={profile.dob || 'UNSET'}
              className={`${fixedInputClass} pl-14`}
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          </div>
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

      <div className="pt-8 border-t border-slate-50 dark:border-slate-800 text-center">
        <p className="text-xs font-black text-slate-500 dark:text-slate-400 mb-8 italic tracking-tight">
          System Identity Markers are securely locked. Modify them via the <span className="text-indigo-600 dark:text-indigo-400 font-black">Settings</span> portal.
        </p>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-6 rounded-3xl text-white font-black text-2xl shadow-2xl transform transition-all active:scale-[0.97] hover:scale-[1.01] ${
            isLoading 
              ? 'bg-slate-500 cursor-not-allowed opacity-50' 
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-4">
              <svg className="animate-spin h-7 w-7 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Thinking...
            </span>
          ) : 'Generate Personal Keys'}
        </button>
      </div>
    </form>
  );
};

export default InputForm;
