import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, HeartHandshake, PhoneCall } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Doc<span className="text-teal-400">Pulse</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md leading-relaxed">
              Empowering patients to discover verified medical doctors, inspect state medical council credentials, review physical clinics, and schedule guaranteed appointment slots with zero double-booking.
            </p>
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs text-amber-300/90 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <span className="font-semibold text-amber-200 block">Professional Verification Promise</span>
                Doctor status and council licenses are reviewed and validated by the platform administrator before appointment booking privileges are granted.
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4">
              Explore Network
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/find-doctors" className="hover:text-teal-400 transition">
                  Find Doctors by Specialty
                </Link>
              </li>
              <li>
                <Link to="/clinics" className="hover:text-teal-400 transition">
                  Registered Clinics & Hospitals
                </Link>
              </li>
              <li>
                <Link to="/register?role=doctor" className="hover:text-teal-400 transition">
                  Register as a Medical Doctor
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-teal-400 transition">
                  Patient & Doctor Portal Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Emergency Notice & Demo Info */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4">
              Emergency Advisory
            </h4>
            <div className="p-3 bg-rose-950/40 rounded-xl border border-rose-900/60 text-xs text-rose-200/90 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-rose-300">
                <PhoneCall className="w-3.5 h-3.5" /> Emergency Support
              </div>
              <p className="leading-snug">
                DocPulse is for scheduled outpatient consultations. In an acute medical emergency, please immediately contact 102/108/911 or head to the nearest casualty emergency ward.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} DocPulse Healthcare Network. Connected MERN Production System.
          </div>
          <div className="flex items-center gap-4">
            <span>Authentication: JWT &amp; bcrypt</span>
            <span>&bull;</span>
            <span>Database: MongoDB &amp; Mongoose</span>
            <span>&bull;</span>
            <span>Role-Based Access Control</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
