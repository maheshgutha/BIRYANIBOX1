import React from 'react';
import { Navigation, MapPin, Phone, Globe, Clock, ShieldCheck } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-bg-main pt-32 pb-16 border-t border-white/5 relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[200px] rounded-full translate-x-1/2 translate-y-1/2" />

      <div className="container relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-32">

          {/* Logo + Tagline */}
          <div className="space-y-6">
            <a href="/" className="text-4xl font-black flex items-center gap-2">
              <span className="text-primary">BIRYANI</span>
              <span className="text-white">BOX</span>
            </a>
            <p className="text-text-muted text-sm leading-relaxed">
              A South Indian Authentic Kitchen — crafted with tradition, love, and the finest spices.
            </p>
          </div>

          {/* Location & Contact */}
          <div>
            <h4 className="text-xs font-black uppercase text-white mb-6">Find Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-2 text-text-muted text-sm">
                <MapPin size={14} className="text-primary mt-0.5 flex-shrink-0" />
                <span>38 Waterford Rd<br />Clarks Summit, PA 18411</span>
              </li>
              <li>
                <a href="tel:+15708401760" className="flex items-center gap-2 text-text-muted text-sm hover:text-primary transition-colors">
                  <Phone size={14} className="text-primary flex-shrink-0" />
                  (570) 840-1760
                </a>
              </li>
              <li>
                <a href="https://www.biryani-box.com" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-text-muted text-sm hover:text-primary transition-colors">
                  <Globe size={14} className="text-primary flex-shrink-0" />
                  www.biryani-box.com
                </a>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-xs font-black uppercase text-white mb-6">Hours</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-text-muted text-sm">
                <Clock size={14} className="text-primary mt-0.5 flex-shrink-0" />
                <span>
                  Mon – Sat<br />
                  <span className="text-white/70 font-bold">11:30 AM – 10:00 PM</span>
                </span>
              </li>
              <li className="flex items-start gap-2 text-text-muted text-sm">
                <Clock size={14} className="text-primary mt-0.5 flex-shrink-0" />
                <span>
                  Sunday<br />
                  <span className="text-white/70 font-bold">12:00 PM – 9:00 PM</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Security */}
          <div>
            <h4 className="text-xs font-black uppercase text-white mb-6">Secure</h4>
            <div className="flex items-center gap-2 text-text-muted">
              <ShieldCheck size={16} className="text-primary" />
              Secure Platform
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-10 border-t border-white/5 flex flex-wrap justify-between items-center gap-4">
          <p className="text-xs text-white/30">
            © 2026 Biryani Box · A South Indian Authentic Kitchen
          </p>
          <p className="text-xs text-white/20">
            38 Waterford Rd, Clarks Summit, PA 18411 · (570) 840-1760
          </p>
          <Navigation size={18} className="text-white/20" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;