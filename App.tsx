
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
  // --- Security State ---
  const [isLocked, setIsLocked] = useState(true);
  const [masterPin, setMasterPin] = useState<string | null>(localStorage.getItem(PIN_KEY));
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(!localStorage.getItem(PIN_KEY));
  const [lockInterval, setLockInterval] = useState(parseInt(localStorage.getItem(LOCK_INTERVAL_KEY) || '300000'));

  // --- Profile & Theme State ---
  const [profile, setProfile] = useState<UserData>(() => {
    const saved = localStorage.getItem(PROFILE_KEY);
    return saved ? JSON.parse(saved) : { firstName: '', lastName: '', dob: '', specialChars: '!@#$%' };
  });
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem(THEME_KEY) === 'dark');

  // --- Onboarding Flow ---
  const [showOnboarding, setShowOnboarding] = useState(false);

  // --- App State ---
  const [activeTab, setActiveTab] = useState<'designer' | 'vault' | 'settings'>('designer');
  const [state, setState] = useState<GenerationState>({ loading: false, error: null, suggestions: [] });
  const [vault, setVault] = useState<PasswordSuggestion[]>([]);
  const [savingPassword, setSavingPassword] = useState<PasswordSuggestion | null>(null);
  const [manualAddMode, setManualAddMode] = useState(false);
  
  // --- Vault UI State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites' | 'recent'>('all');
  const [usageInput, setUsageInput] = useState('');
  const [accountInput, setAccountInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [websiteInput, setWebsiteInput] = useState('');
  
  const lockTimerRef = useRef<number | null>(null);

  // Apply Dark Mode Class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [isDarkMode]);

  // Trigger onboarding if profile is missing after unlock
  useEffect(() => {
    if (!isLocked) {
      const isComplete = profile.firstName.trim() && profile.lastName.trim() && profile.dob.trim();
      if (!isComplete) {
        setShowOnboarding(true);
      }
    }
  }, [isLocked, profile]);

  // Security: Auto-lock timer logic
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

  // Persistence logic
  useEffect(() => {
    const savedVault = localStorage.getItem(STORAGE_KEY);
    if (savedVault) {
      try { setVault(JSON.parse(savedVault)); } catch (e) { console.error("Vault parse error", e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vault));
  }, [vault]);

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);

  // Handlers
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = pinInput.trim();
    
    if (isSettingUp) {
      if (cleanInput.length < 4) { 
        setPinError(true); 
        setTimeout(() => setPinError(false), 500);
        return; 
      }
      localStorage.setItem(PIN_KEY, cleanInput);
      setMasterPin(cleanInput);
      setIsLocked(false);
      setIsSettingUp(false);
      setPinInput('');
    } else {
      if (cleanInput === (masterPin || '').trim()) {
        setIsLocked(false);
        setPinError(false);
        setPinInput('');
        setShowPin(false);
      } else {
        setPinError(true);
        setPinInput('');
        setTimeout(() => setPinError(false), 500);
      }
    }
  };

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.firstName.trim() && profile.lastName.trim() && profile.dob.trim()) {
      setShowOnboarding(false);
    } else {
      alert("Please complete your identity profile to enable secure generation.");
    }
  };

  const toggleFavorite = (id: string) => {
    setVault(prev => prev.map(item => item.id === id ? { ...item, isFavorite: !item.isFavorite } : item));
  };

  const confirmSave = () => {
    const manualPass = (document.getElementById('manual-pass') as HTMLInputElement)?.value;
    const newEntry: PasswordSuggestion = {
      id: `v-${Date.now()}`,
      value: savingPassword?.value || manualPass || '',
      strength: savingPassword?.strength || 'strong',
      explanation: savingPassword?.explanation || 'User manually entered credential.',
      category: manualAddMode ? 'Manual' : (savingPassword?.category || 'General'),
      usageLocation: usageInput.trim() || 'General App',
      accountDetail: accountInput.trim() || 'N/A',
      notes: notesInput.trim(),
      websiteUrl: websiteInput.trim(),
      timestamp: Date.now(),
      isFavorite: false
    };
    if (!newEntry.value) return;
    setVault(prev => [newEntry, ...prev]);
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setSavingPassword(null);
    setManualAddMode(false);
    setUsageInput('');
    setAccountInput('');
    setNotesInput('');
    setWebsiteInput('');
  };

  const filteredVault = useMemo(() => {
    return vault.filter(item => {
      const matchesSearch = item.usageLocation?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.accountDetail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      if (filter === 'favorites') return item.isFavorite;
      if (filter === 'recent') return (Date.now() - item.timestamp) < 86400000;
      return true;
    });
  }, [vault, searchTerm, filter]);

  const stats = useMemo(() => ({
    total: vault.length,
    favs: vault.filter(v => v.isFavorite).length,
    health: vault.length ? Math.round((vault.filter(v => v.strength === 'strong').length / vault.length) * 100) : 100
  }), [vault]);

  // --- Screen: Vault Lock ---
  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        
        <div className={`w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] shadow-2xl transition-all duration-300 ${pinError ? 'translate-x-2 animate-bounce' : ''}`}>
          <div className="text-center mb-10">
            <div className="bg-indigo-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/30">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h2 className="text-3xl font-black text-white">{isSettingUp ? "Set Master PIN" : "Vault Locked"}</h2>
            <p className="text-slate-300 text-sm mt-2">
              {isSettingUp ? "Create a 4-6 digit code to protect your local storage." : "Enter your PIN to decrypt your passwords."}
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-6">
            <div className="relative">
              <input 
                type={showPin ? "text" : "password"} 
                maxLength={6} 
                autoFocus 
                value={pinInput} 
                onChange={(e) => setPinInput(e.target.value)} 
                placeholder={isSettingUp ? "New PIN" : "••••••"} 
                className={`w-full bg-slate-800/50 border ${pinError ? 'border-rose-500' : 'border-slate-700'} focus:border-indigo-500 rounded-2xl px-6 py-5 text-center text-4xl tracking-widest text-white outline-none transition-all placeholder:text-slate-600 placeholder:tracking-normal font-mono`} 
              />
              <button 
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPin ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
            
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 shadow-indigo-500/20">
              {isSettingUp ? "Enable Encryption" : "Unlock Vault"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Screen: Initial Identity Setup ---
  if (showOnboarding) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300 font-sans ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className={`w-full max-w-lg p-10 rounded-[3rem] border shadow-2xl space-y-8 animate-fade-in ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="text-center space-y-2">
             <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
             </div>
             <h2 className="text-3xl font-black">Identity Setup</h2>
             <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Create your secure profile markers to begin generating personalized keys.</p>
          </div>

          <form onSubmit={handleOnboardingSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400">First Name</label>
                <input type="text" required value={profile.firstName} onChange={e => setProfile({...profile, firstName: e.target.value})} className={`w-full px-5 py-4 rounded-xl border outline-none font-black text-lg focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} placeholder="e.g. John" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400">Last Name</label>
                <input type="text" required value={profile.lastName} onChange={e => setProfile({...profile, lastName: e.target.value})} className={`w-full px-5 py-4 rounded-xl border outline-none font-black text-lg focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} placeholder="e.g. Smith" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400">Date of Birth</label>
              <div className="relative group">
                <input 
                  type="date" 
                  required 
                  value={profile.dob} 
                  onChange={e => setProfile({...profile, dob: e.target.value})} 
                  className={`w-full px-5 py-4 pl-12 rounded-xl border outline-none font-black text-lg focus:ring-2 focus:ring-indigo-500 appearance-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} 
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
              </div>
            </div>
            <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black text-xl rounded-2xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-indigo-500/20">
              Initialize Secure8
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Screen: Main App ---
  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col md:flex-row font-sans ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* --- Sidebar Navigation --- */}
      <aside className={`w-full md:w-64 border-r p-6 flex flex-col z-40 sticky top-0 md:h-screen transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h1 className={`text-xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>Secure8</h1>
        </div>

        <nav className="flex-grow space-y-2">
          {[
            { id: 'designer', label: 'Generator', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            { id: 'vault', label: 'Vault', icon: 'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4' },
            { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-black transition-all ${activeTab === item.id ? (isDarkMode ? 'bg-indigo-600/20 text-indigo-400' : 'bg-indigo-50 text-indigo-700 shadow-sm') : (isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100')}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} /></svg>
              {item.label}
            </button>
          ))}
        </nav>

        <button onClick={() => setIsLocked(true)} className="mt-auto flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-rose-600 font-black transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          Lock Store
        </button>
      </aside>

      {/* --- Main Content Area --- */}
      <main className="flex-grow p-6 md:p-12 overflow-y-auto">
        {activeTab === 'designer' && (
          <div className="max-w-4xl mx-auto space-y-12">
            <header className="text-center space-y-4">
              <h2 className={`text-4xl md:text-5xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>Identity <span className="text-indigo-600">Designer</span></h2>
              <p className={`text-lg font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Derived from your unique profile markers.</p>
            </header>
            
            <InputForm 
              profile={profile}
              onSubmit={async (data) => {
                setProfile(prev => ({ ...prev, specialChars: data.specialChars }));
                setState(p => ({ ...p, loading: true }));
                try {
                  const res = await generatePasswords(data, vault.map(v => v.value));
                  setState({ loading: false, error: null, suggestions: res });
                } catch (e: any) { setState({ loading: false, error: e.message, suggestions: [] }); }
              }} 
              isLoading={state.loading} 
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {state.suggestions.map(s => <PasswordCard key={s.id} suggestion={s} isDarkMode={isDarkMode} onSave={() => { setSavingPassword(s); }} />)}
            </div>
          </div>
        )}

        {activeTab === 'vault' && (
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-8 rounded-[2.5rem] border shadow-sm flex items-center justify-between transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div><p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Stored Items</p><h3 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{stats.total}</h3></div>
                <div className="bg-indigo-600/10 p-4 rounded-2xl text-indigo-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg></div>
              </div>
              <div className={`p-8 rounded-[2.5rem] border shadow-sm flex items-center justify-between transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div><p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Strength</p><h3 className="text-3xl font-black text-emerald-500">{stats.health}%</h3></div>
                <div className="bg-emerald-500/10 p-4 rounded-2xl text-emerald-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
              </div>
              <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-500/20 flex items-center justify-between">
                <div><p className="text-[10px] font-black text-white/80 uppercase tracking-widest mb-1">Starred</p><h3 className="text-3xl font-black">{stats.favs}</h3></div>
                <div className="bg-white/10 p-4 rounded-2xl"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg></div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-grow w-full">
                <input type="text" placeholder="Search keys..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`w-full pl-12 pr-6 py-5 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-black transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-600' : 'bg-white border-slate-200 text-slate-950 placeholder:text-slate-400'}`} />
                <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <button onClick={() => setManualAddMode(true)} className="w-full md:w-auto px-10 py-5 bg-indigo-600 text-white font-black text-xs rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-indigo-500/20 active:scale-95">Add Entry</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
              {filteredVault.length > 0 ? filteredVault.map(item => (
                <PasswordCard 
                  key={item.id} 
                  suggestion={item} 
                  isDarkMode={isDarkMode} 
                  onFavorite={() => toggleFavorite(item.id)} 
                  onDelete={() => { if(confirm("Permanently delete this item from your vault?")) setVault(v => v.filter(i => i.id !== item.id)) }} 
                />
              )) : (
                <div className="col-span-full py-24 text-center opacity-30">
                   <p className="text-xl font-black italic">Your vault is currently empty.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>Configuration</h2>
            
            <div className="space-y-4">
              <h3 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Visuals</h3>
              <div className={`rounded-[2.5rem] border transition-colors shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="p-10 flex items-center justify-between">
                  <div><h4 className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Dark Theme</h4><p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Toggle visual appearance.</p></div>
                  <button onClick={() => setIsDarkMode(!isDarkMode)} className={`relative w-14 h-8 rounded-full transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${isDarkMode ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Identity Markers</h3>
              <div className={`rounded-[2.5rem] border transition-colors shadow-sm p-10 space-y-8 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className={`text-[11px] font-black uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>First Name</label>
                    <input type="text" value={profile.firstName} onChange={e => setProfile({...profile, firstName: e.target.value})} className={`w-full px-5 py-4 rounded-xl border outline-none font-black text-base focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'}`} />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-[11px] font-black uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Last Name</label>
                    <input type="text" value={profile.lastName} onChange={e => setProfile({...profile, lastName: e.target.value})} className={`w-full px-5 py-4 rounded-xl border outline-none font-black text-base focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'}`} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={`text-[11px] font-black uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Date of Birth</label>
                  <div className="relative group">
                    <input 
                      type="date" 
                      value={profile.dob} 
                      onChange={e => setProfile({...profile, dob: e.target.value})} 
                      className={`w-full px-5 py-4 pl-12 rounded-xl border outline-none font-black text-base focus:ring-2 focus:ring-indigo-500 appearance-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'}`} 
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  </div>
                </div>
                <p className={`text-[11px] italic font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Markers are mirrored in the Generator for recall.</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Vault Security</h3>
              <div className={`rounded-[2.5rem] border transition-colors shadow-sm divide-y ${isDarkMode ? 'bg-slate-900 border-slate-800 divide-slate-800' : 'bg-white border-slate-200 divide-slate-100'}`}>
                <div className="p-10 flex items-center justify-between">
                  <div><h4 className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Auto-Lock</h4><p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Session timeout policy.</p></div>
                  <select value={lockInterval} onChange={e => {
                    const val = parseInt(e.target.value);
                    setLockInterval(val);
                    localStorage.setItem(LOCK_INTERVAL_KEY, val.toString());
                  }} className={`border rounded-xl px-5 py-3 text-sm font-black transition-all outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'}`}>
                    <option value={60000}>1 min</option>
                    <option value={300000}>5 min</option>
                    <option value={900000}>15 min</option>
                    <option value={0}>Disabled</option>
                  </select>
                </div>
                <div className="p-10 flex items-center justify-between">
                  <div><h4 className="font-black text-rose-600">Danger Zone</h4><p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Wipe all local markers and keys.</p></div>
                  <button onClick={() => { if(confirm("Permanently erase your identity markers and vault items?")) { localStorage.clear(); window.location.reload(); }}} className="px-8 py-4 bg-rose-600 text-white font-black rounded-xl text-xs hover:bg-rose-700 shadow-xl shadow-rose-600/20 active:scale-95 transition-all">Destroy Data</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- Unified Record Modal --- */}
      {(savingPassword || manualAddMode) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className={`w-full max-w-lg rounded-[3.5rem] shadow-2xl p-12 my-8 space-y-8 animate-in zoom-in-95 border transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-white'}`}>
            <div className="text-center space-y-2">
              <h3 className={`text-4xl font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{manualAddMode ? "New Record" : "Save Record"}</h3>
              <p className={`text-base font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Attach context to this security key.</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2"><label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Label / Platform</label>
                <input type="text" autoFocus value={usageInput} onChange={e => setUsageInput(e.target.value)} placeholder="e.g. Gmail, Twitter, Coinbase" className={`w-full px-6 py-4 border-2 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 text-base font-black transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-950 placeholder:text-slate-400'}`} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>URL (Optional)</label>
                  <input type="url" value={websiteInput} onChange={e => setWebsiteInput(e.target.value)} placeholder="domain.com" className={`w-full px-6 py-4 border-2 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 text-sm font-black transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-950 placeholder:text-slate-400'}`} />
                </div>
                <div className="space-y-2"><label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Account Email</label>
                  <input type="text" value={accountInput} onChange={e => setAccountInput(e.target.value)} placeholder="user@mail.com" className={`w-full px-6 py-4 border-2 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 text-sm font-black transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-950 placeholder:text-slate-400'}`} />
                </div>
              </div>

              {manualAddMode ? (
                <div className="space-y-2"><label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Secret Payload</label>
                  <input id="manual-pass" type="text" placeholder="••••••••" className={`w-full px-6 py-4 border-2 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 text-base font-mono tracking-widest font-black transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-950 placeholder:text-slate-400'}`} />
                </div>
              ) : (
                <div className={`p-6 border-2 rounded-3xl text-center transition-all ${isDarkMode ? 'bg-indigo-600/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'}`}>
                  <span className={`text-[11px] font-black uppercase tracking-widest block mb-1 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Generated Secret</span>
                  <p className={`text-3xl font-black tracking-widest ${isDarkMode ? 'text-white' : 'text-indigo-900'}`}>{savingPassword?.value}</p>
                </div>
              )}
              
              <div className="space-y-2"><label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Security Notes</label>
                <textarea rows={2} value={notesInput} onChange={e => setNotesInput(e.target.value)} placeholder="Recovery codes, hints, etc..." className={`w-full px-6 py-4 border-2 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 text-sm font-black resize-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-950 placeholder:text-slate-400'}`} />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button onClick={handleCloseModal} className={`flex-1 py-5 font-black text-lg transition-all ${isDarkMode ? 'text-slate-500 hover:text-white' : 'text-slate-500 hover:text-slate-950'}`}>Cancel</button>
              <button onClick={confirmSave} className="flex-1 py-5 bg-indigo-600 text-white font-black text-lg rounded-3xl shadow-2xl shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]">Confirm Store</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
