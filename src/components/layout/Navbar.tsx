import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  Calendar,
  Search,
  Building2,
  Bell,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { Notification } from '../../types';

export const Navbar: React.FC = () => {
  const { user, doctorProfile, logout, quickLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/all/read');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  const handleQuickLogin = async (role: 'admin' | 'verified_doctor' | 'pending_doctor' | 'patient') => {
    await quickLogin(role);
    setDemoModalOpen(false);
    setMobileMenuOpen(false);
    showToast(`Logged in as demo ${role.replace('_', ' ')}`);

    if (role === 'admin') navigate('/admin');
    else if (role.includes('doctor')) navigate('/doctor-dashboard');
    else navigate('/dashboard');
  };

  const handleLogout = () => {
    logout();
    showToast('You have been logged out.');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Demo Bar for Reviewer Convenience */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-teal-500/20 text-teal-300 font-semibold px-2 py-0.5 rounded">
              <Sparkles className="w-3 h-3" /> Demo Switcher
            </span>
            <span className="hidden sm:inline text-slate-400">
              One-click instant login as any platform role:
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => handleQuickLogin('admin')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-teal-700 text-slate-200 hover:text-white transition font-medium text-[11px]"
            >
              Admin
            </button>
            <button
              onClick={() => handleQuickLogin('verified_doctor')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-teal-700 text-slate-200 hover:text-white transition font-medium text-[11px]"
            >
              Verified Doctor (Dr. Rahul)
            </button>
            <button
              onClick={() => handleQuickLogin('pending_doctor')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-700 text-amber-300 hover:text-white transition font-medium text-[11px]"
              title="Test unverified doctor restrictions"
            >
              Pending Doctor (Dr. Ananya)
            </button>
            <button
              onClick={() => handleQuickLogin('patient')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-teal-700 text-slate-200 hover:text-white transition font-medium text-[11px]"
            >
              Patient (Priya)
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition transform">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1">
                Doc<span className="text-teal-600">Pulse</span>
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-400 block -mt-1">
                Healthcare Network
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link to="/" className="hover:text-teal-600 transition">
              Home
            </Link>
            <Link to="/find-doctors" className="hover:text-teal-600 transition flex items-center gap-1.5">
              <Search className="w-4 h-4" /> Find Doctors
            </Link>
            <Link to="/clinics" className="hover:text-teal-600 transition flex items-center gap-1.5">
              <Building2 className="w-4 h-4" /> Clinics
            </Link>

            {user?.role === 'patient' && (
              <Link to="/dashboard" className="hover:text-teal-600 transition flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> My Appointments
              </Link>
            )}

            {user?.role === 'doctor' && (
              <Link to="/doctor-dashboard" className="hover:text-teal-600 transition flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4" /> Doctor Workspace
              </Link>
            )}

            {user?.role === 'admin' && (
              <Link to="/admin" className="hover:text-teal-600 transition flex items-center gap-1.5 text-teal-700 font-semibold">
                <ShieldCheck className="w-4 h-4" /> Admin Console
              </Link>
            )}
          </nav>

          {/* Right Action Controls */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition relative"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Popover */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                        <span className="font-semibold text-sm text-slate-800">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 6).map((n) => (
                            <div
                              key={n._id}
                              className={`p-3 text-xs hover:bg-slate-50 transition ${
                                !n.read ? 'bg-teal-50/40' : ''
                              }`}
                            >
                              <div className="font-semibold text-slate-800 flex items-center justify-between">
                                <span>{n.title}</span>
                                <span className="text-[10px] font-normal text-slate-400">
                                  {new Date(n.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown Profile Button */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-semibold text-sm overflow-hidden border border-teal-200">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                  <div className="text-left hidden lg:block">
                    <span className="text-sm font-semibold text-slate-800 block leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[11px] font-medium capitalize text-teal-600 flex items-center gap-1">
                      {user.role === 'doctor' && doctorProfile?.verificationStatus === 'verified' && (
                        <ShieldCheck className="w-3 h-3 text-teal-600" />
                      )}
                      {user.role}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition ml-1"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-teal-600 hover:bg-slate-100 transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 shadow-sm shadow-teal-600/30 transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
          >
            Home
          </Link>
          <Link
            to="/find-doctors"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
          >
            Find Doctors
          </Link>
          <Link
            to="/clinics"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
          >
            Clinics
          </Link>

          {user?.role === 'patient' && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-teal-700 bg-teal-50"
            >
              My Appointments & Prescriptions
            </Link>
          )}

          {user?.role === 'doctor' && (
            <Link
              to="/doctor-dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-teal-700 bg-teal-50"
            >
              Doctor Workspace
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-teal-700 bg-teal-50"
            >
              Admin Dashboard & Verifications
            </Link>
          )}

          <div className="pt-4 border-t border-slate-200">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-1 font-semibold text-slate-800">
                  {user.name} ({user.role})
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-rose-600 font-medium hover:bg-rose-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
