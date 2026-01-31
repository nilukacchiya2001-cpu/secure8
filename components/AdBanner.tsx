
import React from 'react';

interface AdBannerProps {
  type: 'horizontal' | 'card';
}

const AdBanner: React.FC<AdBannerProps> = ({ type }) => {
  if (type === 'horizontal') {
    return (
      <div className="w-full bg-indigo-50 border border-indigo-100 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">AD</div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Upgrade to Secure8 Pro</h4>
            <p className="text-xs text-slate-500">Get unlimited vault storage and priority AI generation.</p>
          </div>
        </div>
        <button className="px-6 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl whitespace-nowrap">
          Learn More
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 rounded-[2rem] flex flex-col justify-between h-full min-h-[200px]">
      <div>
        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-400/10 px-2 py-1 rounded-md mb-4 inline-block">Sponsored</span>
        <h4 className="text-xl font-bold text-white mb-2">VaultGuard VPN</h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          Encrypt your entire connection. Special 80% discount for Secure8 users.
        </p>
      </div>
      <button className="w-full py-3 bg-white text-slate-900 font-black rounded-2xl text-xs mt-6 hover:bg-indigo-50 transition-colors">
        Protect Me Now
      </button>
    </div>
  );
};

export default AdBanner;
