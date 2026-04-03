import React from 'react';
import { Navigation, MapPin, ShieldCheck } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-bg-main pt-32 pb-16 border-t border-white/5 relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[200px] rounded-full translate-x-1/2 translate-y-1/2" />

      <div className="container relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-32">

          {/* Logo Section */}
          <div className="space-y-10">
            <a href="/" className="text-4xl font-black flex items-center gap-2">
              <span className="text-primary">BIRYANI</span>
              <span className="text-white">BOX</span>
            </a>
            <p className="text-text-muted text-sm">
              Authentic flavors crafted with tradition and care.
            </p>
          </div>

          {/* Locations */}
          <div>
            <h4 className="text-xs font-black uppercase text-white mb-6">
              Locations
            </h4>
            <ul className="space-y-3">
              {['Hyderabad', 'Bangalore', 'Chennai'].map((area) => (
                <li key={area} className="flex items-center gap-2 text-text-muted">
                  <MapPin size={14} />
                  {area}
                </li>
              ))}
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-xs font-black uppercase text-white mb-6">
              Hours
            </h4>
            <p className="text-text-muted text-sm">
              Mon - Sun: 11:30 AM - 10:00 PM
            </p>
          </div>

          {/* Security */}
          <div>
            <h4 className="text-xs font-black uppercase text-white mb-6">
              Secure
            </h4>
            <div className="flex items-center gap-2 text-text-muted">
              <ShieldCheck size={16} />
              Secure Platform
            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="pt-10 border-t border-white/5 flex justify-between items-center">
          <p className="text-xs text-white/30">
            © 2026 Biryani Box
          </p>

          <Navigation size={20} />
        </div>
      </div>
    </footer>
  );
};

export default Footer;