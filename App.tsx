
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserData, GenerationState, PasswordSuggestion } from './types';
import { generatePasswords } from './services/geminiService';
import InputForm from './components/InputForm';
import PasswordCard from './components/PasswordCard';

const STORAGE_KEY = 'secure8_vault_v2';
const PIN_KEY = 'secure8_master_pin';
const LOCK_INTERVAL_KEY = 'secure8_lock_interval';
const PROFILE_KEY = 'secure8_profile';
const THEME_KEY = 'secure8_theme';

const App: React.FC = () => {
  const [isLocked, setIsLocked] = useState(true);
  const [masterPin, setMasterPin] = useState<string | null>(localStorage.getItem(PIN_KEY));
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(!localStorage.getItem(PIN_KEY));
  const [lockInterval, setLockInterval] = useState(parseInt(localStorage.getItem(LOCK_INTERVAL_KEY) || '300000'));
  const [profile, setProfile] = useState<UserData>(() => {
    const saved = localStorage.getItem(PROFILE_KEY);
    return saved ? JSON.parse(saved) : { firstName: '', lastName: '', dob: '', specialChars: '!@#$%' };
  });
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem(THEME_KEY) === 'dark');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<'designer' | 'vault' | 'settings'>('designer');
  const [state, setState] = useState<GenerationState>({ loading: false, error: null, suggestions: [] });
  const [vault, setVault] = useState<PasswordSuggestion[]>([]);
  const [savingPassword, setSavingPassword] = useState<PasswordSuggestion | null>(null);
  const [manualAddMode, setManualAddMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [usageInput, setUsageInput] = useState('');
  const [accountInput, setAccountInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [websiteInput, setWebsiteInput] = useState('');
  // Added state for manual password input in the vault modal
  const [manualPassword, setManualPassword] = useState('');
  
  const lockTimerRef = useRef<number | null>(null);
  const onboardingDateRef = useRef<HTMLInputElement>(null);
  const settingsDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!isLocked) {
      const isComplete = profile.firstName.trim() && profile.lastName.trim() && profile.dob.trim();
      if (!isComplete) setShowOnboarding(true);
    }
  }, [isLocked, profile]);

  const resetLockTimer = () => {
    if (lockTimerRef.current) window.clearTimeout(lockTimerRef.current);
    if (!isLocked && lockInterval > 0) {
      lockTimerRef.current = window.setTimeout(() => setIsLocked(true), lockInterval);
    }
  };

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetLockTimer));
    resetLockTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetLockTimer));
      if (lockTimerRef.current) window.clearTimeout(lockTimerRef.current);
    };
  }, [isLocked, lockInterval]);

  useEffect(() => {
    const savedVault = localStorage.getItem(STORAGE_KEY);
    if (savedVault) {
      try { setVault(JSON.parse(savedVault)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(vault)); }, [vault]);
  useEffect(() => { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); }, [profile]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = pinInput.trim();
    if (isSettingUp) {
      if (cleanInput.length < 4) { setPinError(true); setTimeout(() => setPinError(false), 500); return; }
      localStorage.setItem(PIN_KEY, cleanInput);
      setMasterPin(cleanInput);
      setIsLocked(false);
      setIsSettingUp(false);
      setPinInput('');
    } else {
      if (cleanInput === (masterPin || '').trim()) {
        setIsLocked(false);
        setPinInput('');
      } else {
        setPinError(true);
        setPinInput('');
        setTimeout(() => setPinError(false), 500);
      }
    }
  };

  const openCalendar = (ref: React.RefObject<HTMLInputElement>) => {
    if (ref.current) {
      try {
        if ('showPicker' in HTMLInputElement.prototype) {
          ref.current.showPicker();
        } else {
          ref.current.focus();
          ref.current.click();
        }
      } catch (e) {
        ref.current.focus();
      }
    }
  };

  // Fixed error: Added implementation for confirmSave
  const confirmSave = () => {
    const passValue = manualAddMode ? manualPassword : (savingPassword?.value || '');
    
    if (!passValue) {
      alert("Password cannot be empty.");
      return;
    }

    if (!usageInput) {
      alert("Please specify what this password is for.");
      return;
    }

    const newEntry: PasswordSuggestion = {
      id: `vault-${Date.now()}`,
      value: passValue,
      strength: manualAddMode ? 'medium' : (savingPassword?.strength || 'medium'),
      explanation: manualAddMode ? 'Manual Entry' : (savingPassword?.explanation || ''),
      category: manualAddMode ? 'Manual' : (savingPassword?.category || ''),
      timestamp: Date.now(),
      usageLocation: usageInput,
      accountDetail: accountInput,
      notes: notesInput,
      websiteUrl: websiteInput,
      isFavorite: false
    };

    setVault(prev => [...prev, newEntry]);
    
    // Cleanup and reset UI
    setSavingPassword(null);
    setManualAddMode(false);
    setUsageInput('');
    setAccountInput('');
    setManualPassword('');
    setNotesInput('');
    setWebsiteInput('');
  };

  const filteredVault = useMemo(() => {
    return vault.filter(item => 
      item.usageLocation?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.accountDetail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vault, searchTerm]);

  const stats = useMemo(() => ({
    total: vault.length,
    favs: vault.filter(v => v.isFavorite).length,
    health: vault.length ? Math.round((vault.filter(v => v.strength === 'strong').length / vault.length) * 100) : 100
  }), [vault]);

  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] shadow-2xl transition-all duration-300">
          <div className="text-center mb-10">
            <div className="bg-indigo-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/30">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h2 className="text-3xl font-black text-white">{isSettingUp ? "Set Master PIN" : "Vault Locked"}</h2>
          </div>
          <form onSubmit={handleUnlock} className="space-y-6">
            <input 
              type={showPin ? "text" : "password"} 
              maxLength={6} 
              autoFocus 
              value={pinInput} 
              onChange={(e) => setPinInput(e.target.value)} 
              placeholder="••••••" 
              className={`w-full bg-slate-800/50 border ${pinError ? 'border-rose-500' : 'border-slate-700'} focus:border-indigo-500 rounded-2xl px-6 py-5 text-center text-4xl tracking-widest text-white outline-none transition-all placeholder:text-slate-600 font-mono`} 
            />
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 shadow-indigo-500/20">
              {isSettingUp ? "Enable Vault" : "Unlock Store"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className={`w-full max-w-lg p-10 rounded-[3.5rem] border shadow-2xl space-y-10 animate-fade-in ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="text-center space-y-3">
             <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <h2 className="text-4xl font-black">Identity Setup</h2>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if(profile.firstName && profile.lastName && profile.dob) setShowOnboarding(false); }} className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <input type="text" required value={profile.firstName} onChange={e => setProfile({...profile, firstName: e.target.value})} className={`w-full px-6 py-4 rounded-2xl border outline-none font-black ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'}`} placeholder="First Name" />
              <input type="text" required value={profile.lastName} onChange={e => setProfile({...profile, lastName: e.target.value})} className={`w-full px-6 py-4 rounded-2xl border outline-none font-black ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'}`} placeholder="Last Name" />
            </div>
            <div className="relative group cursor-pointer" onClick={() => openCalendar(onboardingDateRef)}>
              <input 
                ref={onboardingDateRef}
                type="date" 
                required 
                value={profile.dob} 
                onChange={e => setProfile({...profile, dob: e.target.value})} 
                className={`w-full px-6 py-4 pl-14 rounded-2xl border outline-none font-black text-lg focus:ring-4 focus:ring-indigo-500/20 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'}`} 
              />
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
            </div>
            <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black text-xl rounded-2xl shadow-xl hover:bg-indigo-700 transition-all shadow-indigo-500/20">
              Initialize Profile
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col md:flex-row font-sans ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <aside className={`w-full md:w-64 border-r p-6 flex flex-col z-40 sticky top-0 md:h-screen ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Secure8</h1>
        </div>
        <nav className="flex-grow space-y-2">
          {['designer', 'vault', 'settings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === tab ? (isDarkMode ? 'bg-indigo-600/20 text-indigo-400' : 'bg-indigo-50 text-indigo-700 shadow-sm') : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              {tab === 'designer' ? 'Generator' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
        <button onClick={() => setIsLocked(true)} className="mt-auto flex items-center gap-3 px-5 py-4 font-black text-slate-500 hover:text-rose-400">Lock Vault</button>
      </aside>

      <main className="flex-grow p-6 md:p-12 overflow-y-auto">
        {activeTab === 'designer' && (
          <div className="max-w-4xl mx-auto space-y-12">
            <header className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">Identity <span className="text-indigo-600">Designer</span></h2>
            </header>
            <InputForm 
              profile={profile}
              onSubmit={async (data) => {
                setProfile(prev => ({ ...prev, specialChars: data.specialChars }));
                setState({ loading: true, error: null, suggestions: [] });
                try {
                  const res = await generatePasswords(data, vault.map(v => v.value));
                  setState({ loading: false, error: null, suggestions: res });
                } catch (e: any) { setState({ loading: false, error: e.message, suggestions: [] }); }
              }} 
              isLoading={state.loading} 
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {state.suggestions.map(s => <PasswordCard key={s.id} suggestion={s} isDarkMode={isDarkMode} onSave={() => setSavingPassword(s)} />)}
            </div>
          </div>
        )}

        {activeTab === 'vault' && (
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <input type="text" placeholder="Search keys..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`w-full px-6 py-5 border rounded-3xl outline-none font-black ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`} />
              <button onClick={() => setManualAddMode(true)} className="w-full md:w-auto px-10 py-5 bg-indigo-600 text-white font-black rounded-3xl whitespace-nowrap">Manual Entry</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
              {filteredVault.map(item => (
                <PasswordCard 
                  key={item.id} suggestion={item} isDarkMode={isDarkMode} 
                  onFavorite={() => setVault(v => v.map(i => i.id === item.id ? { ...i, isFavorite: !i.isFavorite } : i))} 
                  onDelete={() => { if(confirm("Delete item?")) setVault(v => v.filter(i => i.id !== item.id)) }} 
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-12">
            <h2 className="text-4xl font-black">Configuration</h2>
            <div className={`rounded-[3rem] border p-10 space-y-8 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div><h4 className="text-lg font-black">Night Mode</h4></div>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className={`relative w-16 h-9 rounded-full ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 w-7 h-7 bg-white rounded-full transition-all ${isDarkMode ? 'left-8' : 'left-1'}`} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <input type="text" value={profile.firstName} onChange={e => setProfile({...profile, firstName: e.target.value})} className={`w-full px-5 py-4 rounded-2xl border outline-none font-black ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
                <input type="text" value={profile.lastName} onChange={e => setProfile({...profile, lastName: e.target.value})} className={`w-full px-5 py-4 rounded-2xl border outline-none font-black ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
              </div>
              <div className="relative group cursor-pointer" onClick={() => openCalendar(settingsDateRef)}>
                <input 
                  ref={settingsDateRef}
                  type="date" 
                  value={profile.dob} 
                  onChange={e => setProfile({...profile, dob: e.target.value})} 
                  className={`w-full px-5 py-4 pl-12 rounded-2xl border outline-none font-black ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'}`} 
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {(savingPassword || manualAddMode) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className={`w-full max-w-lg rounded-[3.5rem] p-12 space-y-8 border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-white'}`}>
            <h3 className="text-4xl font-black text-center">{manualAddMode ? "New Record" : "Save Record"}</h3>
            <div className="space-y-6">
              <input type="text" autoFocus value={usageInput} onChange={e => setUsageInput(e.target.value)} placeholder="Service Name" className={`w-full px-6 py-4 border-2 rounded-2xl outline-none font-black ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'}`} />
              <input type="text" value={accountInput} onChange={e => setAccountInput(e.target.value)} placeholder="Username" className={`w-full px-6 py-4 border-2 rounded-2xl outline-none font-black ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'}`} />
              {/* Linked manual-pass input to state to support confirmSave logic */}
              {manualAddMode ? <input type="text" placeholder="Password" value={manualPassword} onChange={e => setManualPassword(e.target.value)} className={`w-full px-6 py-4 border-2 rounded-2xl outline-none font-black font-mono tracking-widest ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'}`} /> : null}
            </div>
            <div className="flex gap-4 pt-6">
              <button onClick={() => { setSavingPassword(null); setManualAddMode(false); }} className="flex-1 py-5 font-black text-lg text-slate-500">Cancel</button>
              <button onClick={confirmSave} className="flex-1 py-5 bg-indigo-600 text-white font-black text-lg rounded-3xl shadow-2xl shadow-indigo-600/20 active:scale-[0.98]">Confirm Store</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
