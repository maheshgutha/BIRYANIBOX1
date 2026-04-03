import React from 'react';
import { Facebook, Instagram, Navigation, MapPin, ShieldCheck } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-bg-main pt-32 pb-16 border-t border-white/5 relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[200px] rounded-full translate-x-1/2 translate-y-1/2" />

      <div className="container relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-32">
          <div className="space-y-10">
            <a href="/" className="text-4xl font-black flex items-center gap-2">
              <span className="text-primary">BIRYANI</span>
              <span className="text-white">BOX</span>
            </a>
            <p className="text-text-muted leading-relaxed font-medium text-sm">
              Cultivating the gold standard of Indian artisanal flavors across the American
              Northeast. Every box is an encrypted promise of heritage and craft.
            </p>
            <div className="space-y-6">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">
                Order Hub Applications
              </p>
              <div className="flex gap-4">
                <button className="h-14 px-6 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all shadow-xl group">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black font-black">
                    A
                  </div>
                  <div className="text-left">
                    <p className="text-[8px] font-black uppercase text-white/30 tracking-widest leading-none mb-1">
                      Download on
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">
                      App Store
                    </p>
                  </div>
                </button>
                <button className="h-14 px-6 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all shadow-xl group">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black">
                    G
                  </div>
                  <div className="text-left">
                    <p className="text-[8px] font-black uppercase text-white/30 tracking-widest leading-none mb-1">
                      Injected for
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">
                      Play Store
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.4em] text-white mb-10 border-l-4 border-primary pl-6">
              Service Area Grid
            </h4>
            <ul className="space-y-6">
              {[
                'Scranton, PA',
                'Dickson City, PA',
                'Dunmore, PA',
                'Old Forge, PA',
                'Wilkes-Barre, PA',
              ].map((area) => (
                <li
                  key={area}
                  className="flex items-center gap-4 text-text-muted hover:text-white transition-all cursor-pointer group"
                >
                  <MapPin
                    size={16}
                    className="text-primary/50 group-hover:scale-125 group-hover:text-primary transition-all"
                  />
                  <span className="text-[11px] font-black uppercase tracking-widest">{area}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.4em] text-white mb-10 border-l-4 border-primary pl-6">
              Digital Ecosystem
            </h4>
            <ul className="space-y-6">
              {[
                'The Artisan Menu',
                'Elite Rewards Hub',
                'Catering Protocol',
                'Gift Card Purchase',
                'Reservation Sync',
              ].map((link) => (
                <li
                  key={link}
                  className="text-[11px] text-text-muted hover:text-primary transition-all cursor-pointer font-black uppercase tracking-[0.3em]"
                >
                  {link}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.4em] text-white mb-10 border-l-4 border-primary pl-6">
              Deployment Hours
            </h4>
            <div className="space-y-6 text-[11px] font-black text-text-muted">
              <div className="flex justify-between border-b border-white/5 pb-4">
                <span className="uppercase tracking-widest text-white/40">Mon — Thu</span>
                <span className="text-white">11:30 — 22:00</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-4">
                <span className="uppercase tracking-widest text-white/40">Fri — Sat</span>
                <span className="text-white">11:30 — 23:00</span>
              </div>
              <div className="flex justify-between">
                <span className="uppercase tracking-widest text-primary">Sunday</span>
                <span className="text-white font-bold">12:00 — 21:00</span>
              </div>
              <div className="pt-10 flex items-center gap-4 opacity-20">
                <ShieldCheck size={20} />
                <p className="text-[8px] italic font-black uppercase tracking-[0.5em]">
                  SYSTEM ENCRYPTED. DISPATCH OPTIMIZED.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">
            © 2026 Rabbani. POWERED BY Basha Bhaiv1.4.5
          </p>
          <div className="flex gap-12">
            <a href="#" className="text-white/20 hover:text-primary transition-all">
              <Facebook size={24} />
            </a>
            <a href="#" className="text-white/20 hover:text-primary transition-all">
              <Instagram size={24} />
            </a>
            <a href="#" className="text-white/20 hover:text-primary transition-all">
              <Navigation size={24} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
