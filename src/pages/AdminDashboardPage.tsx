import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Building2,
  Calendar,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Check,
  X,
  Stethoscope,
  FileCheck2,
  Database,
  BarChart3,
  ExternalLink,
  Ban
} from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DashboardStats, DoctorProfile, Clinic, Appointment, User, Review } from '../types';
import { EmptyState } from '../components/common/EmptyState';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'verifications' | 'demo' | 'doctors' | 'clinics' | 'users' | 'appointments'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Verifications Tab State
  const [verifications, setVerifications] = useState<any[]>([]);
  const [selectedVerificationStatus, setSelectedVerificationStatus] = useState('all');

  // Lists
  const [doctorsList, setDoctorsList] = useState<DoctorProfile[]>([]);
  const [clinicsList, setClinicsList] = useState<Clinic[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);

  // Demo Delete Confirmation Modal
  const [demoDeleteTarget, setDemoDeleteTarget] = useState<string | null>(null);
  const [demoActionLoading, setDemoActionLoading] = useState(false);

  // Review Doctor Modal
  const [adminNotes, setAdminNotes] = useState('');
  const [verifyingDoc, setVerifyingDoc] = useState<any | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, verifRes, docsRes, clinicsRes, usersRes, apptsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/verifications'),
        api.get('/admin/doctors'),
        api.get('/admin/clinics'),
        api.get('/admin/users'),
        api.get('/admin/appointments')
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (verifRes.data.success) setVerifications(verifRes.data.requests || []);
      if (docsRes.data.success) setDoctorsList(docsRes.data.doctors || []);
      if (clinicsRes.data.success) setClinicsList(clinicsRes.data.clinics || []);
      if (usersRes.data.success) setUsersList(usersRes.data.users || []);
      if (apptsRes.data.success) setAppointmentsList(apptsRes.data.appointments || []);
    } catch (err) {
      console.error('Failed to load admin console data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Doctor Verification Action Handler
  const handleVerifyDoctor = async (id: string, status: 'verified' | 'rejected' | 'suspended') => {
    try {
      const res = await api.put(`/admin/verifications/${id}`, {
        status,
        adminNotes: adminNotes || `Reviewed and ${status} by administrator`,
        medicalRegistrationVerified: status === 'verified',
        hospitalVerified: status === 'verified',
        identityVerified: status === 'verified'
      });

      if (res.data.success) {
        showToast(`Doctor verification updated to ${status}. Notification sent to doctor.`);
        setVerifyingDoc(null);
        setAdminNotes('');
        fetchAdminData();
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  // Demo Data Cleanup Execution
  const executeDemoCleanup = async (target: string) => {
    setDemoActionLoading(true);
    try {
      const res = await api.delete(`/admin/demo/${target}`);
      if (res.data.success) {
        showToast(res.data.message);
        setDemoDeleteTarget(null);
        fetchAdminData();
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setDemoActionLoading(false);
    }
  };

  // Reseed Demo Data Handler
  const handleReseed = async () => {
    setDemoActionLoading(true);
    try {
      const res = await api.post('/admin/demo/seed');
      if (res.data.success) {
        showToast('Demo dataset successfully populated and refreshed.');
        fetchAdminData();
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setDemoActionLoading(false);
    }
  };

  // Toggle Clinic Verification
  const handleToggleClinicVerify = async (clinicId: string, currentStatus: boolean) => {
    try {
      const res = await api.put(`/admin/clinics/${clinicId}/verify`, {
        isVerified: !currentStatus
      });
      if (res.data.success) {
        showToast('Clinic accreditation status updated.');
        fetchAdminData();
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Permanently remove this user and associated records?')) return;
    try {
      const res = await api.delete(`/admin/users/${userId}`);
      if (res.data.success) {
        showToast('User record permanently deleted.');
        fetchAdminData();
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-teal-500/20 text-teal-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-teal-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Platform Governance Console
            </span>
            <span className="text-slate-400 text-xs">Primary Admin: {user?.email}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Healthcare System Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Doctor credential verification, clinic approvals, real-time analytics, and demo data management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('demo')}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5"
          >
            <Database className="w-4 h-4" /> Demo Data Management
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 block">Total Users</span>
            <span className="text-xl font-extrabold text-slate-900">{stats.totalUsers}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">{stats.totalPatients} Patients</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 block">Total Doctors</span>
            <span className="text-xl font-extrabold text-slate-900">{stats.totalDoctors}</span>
            <span className="text-[10px] text-teal-600 font-semibold block mt-0.5">
              {stats.verifiedDoctors} Verified
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 block">Pending Verifications</span>
            <span className="text-xl font-extrabold text-amber-600">{stats.pendingDoctors}</span>
            <span className="text-[10px] text-amber-500 block mt-0.5">Needs Review</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 block">Registered Clinics</span>
            <span className="text-xl font-extrabold text-slate-900">{stats.totalClinics}</span>
            <span className="text-[10px] text-teal-600 font-semibold block mt-0.5">
              {stats.verifiedClinics} Accredited
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 block">Total Appointments</span>
            <span className="text-xl font-extrabold text-slate-900">{stats.totalAppointments}</span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
              {stats.completedAppointments} Completed
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 block">Demo Records</span>
            <span className="text-xl font-extrabold text-indigo-600">
              {stats.demoCounts.totalDemoRecords}
            </span>
            <span className="text-[10px] text-indigo-500 block mt-0.5">Physical Hard Delete</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'overview'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Platform Overview
        </button>
        <button
          onClick={() => setActiveTab('verifications')}
          className={`pb-3 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'verifications'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" /> Doctor Verifications ({verifications.filter(v => ['pending', 'under_review'].includes(v.status)).length} Pending)
        </button>
        <button
          onClick={() => setActiveTab('demo')}
          className={`pb-3 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'demo'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" /> Demo Data Management
        </button>
        <button
          onClick={() => setActiveTab('doctors')}
          className={`pb-3 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'doctors'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Stethoscope className="w-4 h-4" /> Doctors ({doctorsList.length})
        </button>
        <button
          onClick={() => setActiveTab('clinics')}
          className={`pb-3 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'clinics'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" /> Clinics ({clinicsList.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'users'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Users ({usersList.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Specializations Distribution from Real Data */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-600" /> Doctors by Specialization
            </h3>
            <p className="text-xs text-slate-500">
              Aggregated directly from verified and registered physician profiles in the database
            </p>

            <div className="space-y-2.5 pt-2">
              {stats?.specializationsDistribution.map((spec) => (
                <div key={spec.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{spec.name}</span>
                    <span className="text-slate-500">{spec.count} doctor{spec.count === 1 ? '' : 's'}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full"
                      style={{
                        width: `${Math.min(100, (spec.count / (stats.totalDoctors || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Appointment Status Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" /> Appointment Pipeline
            </h3>
            <p className="text-xs text-slate-500">
              Status distribution of patient consultations scheduled across all registered clinics
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {stats?.statusDistribution.map((s) => (
                <div key={s.status} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 block">{s.status}</span>
                  <span className="text-2xl font-black text-slate-900">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOCTOR VERIFICATIONS (Rules 2 & 3) */}
      {activeTab === 'verifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Medical Credential Verification Requests
              </h2>
              <p className="text-xs text-slate-500">
                Inspect state council registration, qualifications, and authorize doctors to accept appointments
              </p>
            </div>

            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {['all', 'pending', 'verified', 'rejected'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedVerificationStatus(st)}
                  className={`px-3 py-1 rounded-lg capitalize transition ${
                    selectedVerificationStatus === st
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {verifications.filter(v => selectedVerificationStatus === 'all' || v.status === selectedVerificationStatus).length === 0 ? (
            <EmptyState
              icon={FileCheck2}
              title="No verification requests found."
              description="All submitted medical practitioner registration requests have been reviewed."
            />
          ) : (
            <div className="space-y-3">
              {verifications
                .filter(v => selectedVerificationStatus === 'all' || v.status === selectedVerificationStatus)
                .map((req) => (
                  <div
                    key={req._id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base">{req.doctorName}</h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                              req.status === 'verified'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : req.status === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            Status: {req.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {req.specialization} &bull; {req.qualification}
                        </p>
                      </div>

                      <div className="text-xs text-slate-400">
                        Submitted: {new Date(req.submittedAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Registration Details Table */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                          Medical Registration No.
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {req.medicalRegistrationNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                          State Medical Council
                        </span>
                        <span className="font-semibold text-slate-800">{req.medicalCouncil}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                          Identity Verification Check
                        </span>
                        <span className="text-teal-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ID Document Checked
                        </span>
                      </div>
                    </div>

                    {req.adminNotes && (
                      <p className="text-xs text-slate-600 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                        Admin Note: {req.adminNotes}
                      </p>
                    )}

                    {/* Verification Actions */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      {req.status !== 'verified' && (
                        <button
                          onClick={() => handleVerifyDoctor(req._id, 'verified')}
                          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve &amp; Verify Doctor
                        </button>
                      )}

                      {req.status === 'verified' && (
                        <button
                          onClick={() => handleVerifyDoctor(req._id, 'suspended')}
                          className="px-3 py-1.5 rounded-xl border border-amber-200 text-amber-700 hover:bg-amber-50 text-xs font-semibold flex items-center gap-1"
                        >
                          <Ban className="w-3.5 h-3.5" /> Suspend Account
                        </button>
                      )}

                      {req.status !== 'rejected' && (
                        <button
                          onClick={() => handleVerifyDoctor(req._id, 'rejected')}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Reject Request
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DEMO DATA MANAGEMENT (Rules 9, 10, 11) */}
      {activeTab === 'demo' && stats && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <Database className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Demo Data Management &amp; Cleanup Engine
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Physical removal of seeded records. Real registered user data is protected by the <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-700 font-semibold">isDemo: false</code> invariant.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1">
            <span className="font-bold block flex items-center gap-1 text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Database Integrity Notice
            </span>
            <p>
              Deleting demo data executes actual, irreversible <span className="font-mono font-semibold">DELETE</span> queries on the database. Records created by real users during testing will remain untouched.
            </p>
          </div>

          {/* Current Demo Record Counts */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-xs font-semibold text-slate-500 block">Demo Doctors</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {stats.demoCounts.demoDoctors}
              </span>
              <button
                onClick={() => setDemoDeleteTarget('doctors')}
                disabled={stats.demoCounts.demoDoctors === 0}
                className="mt-3 w-full py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40 text-xs font-semibold transition"
              >
                Delete Demo Doctors
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-xs font-semibold text-slate-500 block">Demo Patients</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {stats.demoCounts.demoPatients}
              </span>
              <button
                onClick={() => setDemoDeleteTarget('patients')}
                disabled={stats.demoCounts.demoPatients === 0}
                className="mt-3 w-full py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40 text-xs font-semibold transition"
              >
                Delete Demo Patients
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-xs font-semibold text-slate-500 block">Demo Clinics</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {stats.demoCounts.demoClinics}
              </span>
              <button
                onClick={() => setDemoDeleteTarget('clinics')}
                disabled={stats.demoCounts.demoClinics === 0}
                className="mt-3 w-full py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40 text-xs font-semibold transition"
              >
                Delete Demo Clinics
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-xs font-semibold text-slate-500 block">Demo Appointments</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {stats.demoCounts.demoAppointments}
              </span>
              <button
                onClick={() => setDemoDeleteTarget('appointments')}
                disabled={stats.demoCounts.demoAppointments === 0}
                className="mt-3 w-full py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40 text-xs font-semibold transition"
              >
                Delete Demo Visits
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-xs font-semibold text-slate-500 block">Demo Reviews</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {stats.demoCounts.demoReviews}
              </span>
              <button
                onClick={() => setDemoDeleteTarget('appointments')}
                disabled={stats.demoCounts.demoReviews === 0}
                className="mt-3 w-full py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40 text-xs font-semibold transition"
              >
                Delete Demo Reviews
              </button>
            </div>
          </div>

          {/* Master Global Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="font-bold text-slate-900 text-sm block">Global Demo Actions</span>
              <span className="text-xs text-slate-500">
                Wipe all seeded data to test clean empty states, or repopulate the original demonstration dataset.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReseed}
                disabled={demoActionLoading}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-Seed / Restore Demo Data
              </button>

              <button
                onClick={() => setDemoDeleteTarget('all')}
                disabled={demoActionLoading || stats.demoCounts.totalDemoRecords === 0}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete All Demo Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ALL DOCTORS */}
      {activeTab === 'doctors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">All Registered Doctors</h2>
            <span className="text-xs text-slate-500">{doctorsList.length} total</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <tr>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Specialization</th>
                  <th className="p-3">Reg. Number</th>
                  <th className="p-3">Council</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctorsList.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3 font-medium text-slate-900 flex items-center gap-2">
                      <img
                        src={doc.profilePhoto || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=80&auto=format&fit=crop&q=80'}
                        alt={doc.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <span>{doc.name}</span>
                    </td>
                    <td className="p-3 text-slate-600">{doc.specialization}</td>
                    <td className="p-3 font-mono text-slate-700">{doc.medicalRegistrationNumber}</td>
                    <td className="p-3 text-slate-600">{doc.medicalCouncil}</td>
                    <td className="p-3">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full capitalize text-[10px] ${
                          doc.verificationStatus === 'verified'
                            ? 'bg-teal-50 text-teal-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {doc.verificationStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] font-semibold ${doc.isDemo ? 'text-indigo-600' : 'text-slate-500'}`}>
                        {doc.isDemo ? 'Demo' : 'Real'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleVerifyDoctor(doc._id, doc.verificationStatus === 'verified' ? 'suspended' : 'verified')}
                        className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                      >
                        {doc.verificationStatus === 'verified' ? 'Suspend' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: ALL CLINICS */}
      {activeTab === 'clinics' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">All Registered Clinics</h2>
            <span className="text-xs text-slate-500">{clinicsList.length} total</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clinicsList.map((c) => (
              <div key={c._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                    <p className="text-xs text-slate-500">{c.address}, {c.city}</p>
                  </div>
                  <button
                    onClick={() => handleToggleClinicVerify(c._id, c.isVerified)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${
                      c.isVerified
                        ? 'bg-teal-50 text-teal-700 border-teal-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {c.isVerified ? '✓ Accredited' : 'Verify Clinic'}
                  </button>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Doctor: {c.doctor?.name || 'Practitioner'}</span>
                  <span>{c.isDemo ? 'Demo Record' : 'Real Clinic'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: ALL USERS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">System Users</h2>
            <span className="text-xs text-slate-500">{usersList.length} total accounts</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3 font-medium text-slate-900">
                      <div>{u.name}</div>
                      <div className="text-slate-400 font-normal">{u.email}</div>
                    </td>
                    <td className="p-3">
                      <span className="capitalize font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{u.phone || 'N/A'}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-semibold ${u.isDemo ? 'text-indigo-600' : 'text-slate-500'}`}>
                        {u.isDemo ? 'Demo' : 'Real'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Demo Delete Confirmation Modal */}
      {demoDeleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-lg">
                Permanently Delete Demo {demoDeleteTarget === 'all' ? 'Data' : demoDeleteTarget.toUpperCase()}?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This action will physically remove all matching demo records from the database. Real user registrations, actual clinics, and real appointments will NOT be affected.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDemoDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={demoActionLoading}
                onClick={() => executeDemoCleanup(demoDeleteTarget)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition"
              >
                {demoActionLoading ? 'Deleting...' : 'Yes, Delete from Database'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
