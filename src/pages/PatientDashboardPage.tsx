import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  Star,
  XCircle,
  RefreshCw,
  Building2,
  CheckCircle2,
  AlertCircle,
  User,
  Plus
} from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Appointment, Prescription } from '../types';
import { EmptyState } from '../components/common/EmptyState';

export const PatientDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'appointments' | 'prescriptions' | 'profile'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAppointment, setReviewAppointment] = useState<Appointment | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Reschedule Modal State
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('10:00 AM');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [apptsRes, rxRes] = await Promise.all([
        api.get('/appointments/my'),
        api.get('/prescriptions/my')
      ]);

      if (apptsRes.data.success) {
        setAppointments(apptsRes.data.appointments || []);
      }
      if (rxRes.data.success) {
        setPrescriptions(rxRes.data.prescriptions || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCancel = async () => {
    if (!cancellingAppointmentId) return;
    try {
      const res = await api.post(`/appointments/${cancellingAppointmentId}/cancel`, {
        reason: cancelReason || 'Patient cancelled consultation'
      });
      if (res.data.success) {
        showToast('Appointment cancelled successfully.');
        setCancelModalOpen(false);
        setCancellingAppointmentId(null);
        setCancelReason('');
        fetchDashboardData();
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleAppt || !rescheduleDate || !rescheduleTime) {
      showToast('Please specify reschedule date and time.', 'error');
      return;
    }
    try {
      const res = await api.post(`/appointments/${rescheduleAppt._id}/reschedule`, {
        requestedDate: rescheduleDate,
        requestedTime: rescheduleTime,
        reason: 'Patient requested slot change'
      });
      if (res.data.success) {
        showToast('Appointment rescheduled successfully.');
        setRescheduleModalOpen(false);
        setRescheduleAppt(null);
        fetchDashboardData();
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAppointment) return;

    setSubmittingReview(true);
    try {
      const res = await api.post('/reviews', {
        appointmentId: reviewAppointment._id,
        rating,
        comment
      });
      if (res.data.success) {
        showToast('Thank you! Your verified review has been posted.');
        setReviewModalOpen(false);
        setReviewAppointment(null);
        setComment('');
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const upcomingCount = appointments.filter((a) => ['pending', 'confirmed'].includes(a.status)).length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
            Patient Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your clinical consultations, digital prescriptions, and doctor reviews
          </p>
        </div>

        <Link
          to="/find-doctors"
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-600/20 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Book New Consultation
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Upcoming Visits</span>
            <span className="text-2xl font-black text-slate-900">{upcomingCount}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Completed Visits</span>
            <span className="text-2xl font-black text-slate-900">{completedCount}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Digital Prescriptions</span>
            <span className="text-2xl font-black text-slate-900">{prescriptions.length}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 transition flex items-center gap-2 ${
            activeTab === 'appointments'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" /> Appointments ({appointments.length})
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`pb-3 transition flex items-center gap-2 ${
            activeTab === 'prescriptions'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" /> Prescriptions ({prescriptions.length})
        </button>
      </div>

      {/* Tab: Appointments */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No upcoming appointments."
              description="You have no active doctor consultations scheduled. Find a specialist to reserve a verified time slot."
              actionLabel="Find a Doctor"
              onAction={() => navigate('/find-doctors')}
            />
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div
                  key={apt._id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={apt.doctor?.profilePhoto || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&auto=format&fit=crop&q=80'}
                      alt={apt.doctor?.name || 'Doctor'}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-100 shrink-0"
                      referrerPolicy="no-referrer"
                    />

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-base">
                          {apt.doctor?.name || 'Practitioner'}
                        </h3>
                        <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md">
                          {apt.doctor?.specialization}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                            apt.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : apt.status === 'completed'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : apt.status === 'cancelled'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" /> {apt.date}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-teal-600" /> {apt.startTime} - {apt.endTime}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" /> {apt.clinic?.name || 'Clinic'} ({apt.clinic?.city})
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 italic mt-1">
                        Reason: {apt.reason}
                      </p>
                    </div>
                  </div>

                  {/* Actions according to status */}
                  <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
                    {/* View Digital Prescription */}
                    {apt.prescriptionId && (
                      <Link
                        to={`/prescriptions/${apt.prescriptionId}`}
                        className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 transition flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Prescription
                      </Link>
                    )}

                    {/* Write Review for completed consultations */}
                    {apt.status === 'completed' && (
                      <button
                        onClick={() => {
                          setReviewAppointment(apt);
                          setReviewModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition flex items-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Write Review
                      </button>
                    )}

                    {/* Reschedule Button */}
                    {['pending', 'confirmed'].includes(apt.status) && (
                      <button
                        onClick={() => {
                          setRescheduleAppt(apt);
                          setRescheduleDate(apt.date);
                          setRescheduleModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                      </button>
                    )}

                    {/* Cancel Button */}
                    {['pending', 'confirmed'].includes(apt.status) && (
                      <button
                        onClick={() => {
                          setCancellingAppointmentId(apt._id);
                          setCancelModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Prescriptions */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          {prescriptions.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No prescriptions on record."
              description="When a verified doctor completes your consultation, your official digital prescription will appear here for download and print."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prescriptions.map((rx) => (
                <div
                  key={rx._id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded uppercase">
                        Prescription
                      </span>
                      <h4 className="font-bold text-slate-900 text-base mt-1">
                        {rx.doctor?.name || 'Doctor'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {rx.clinic?.name} &bull; {new Date(rx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      to={`/prescriptions/${rx._id}`}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 shadow-sm"
                    >
                      View &amp; Print
                    </Link>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="font-semibold text-slate-700">Diagnosis:</span>{' '}
                      <span className="text-slate-900 font-medium">{rx.diagnosis}</span>
                    </div>
                    {rx.symptoms && (
                      <div>
                        <span className="font-semibold text-slate-700">Symptoms:</span>{' '}
                        <span className="text-slate-600">{rx.symptoms}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-slate-700">Prescribed Drugs:</span>{' '}
                      <span className="text-slate-600">
                        {rx.medicines?.map((m) => m.name).join(', ') || 'None'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Verified Review Modal */}
      {reviewModalOpen && reviewAppointment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
                Verified Patient Review
              </span>
              <h3 className="font-bold text-slate-900 text-lg">
                Review Dr. {reviewAppointment.doctor?.name}
              </h3>
              <p className="text-xs text-slate-500">
                Only patients who completed consultations can review
              </p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Rating (1 to 5 Stars)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Your Feedback / Experience *
                </label>
                <textarea
                  rows={4}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about the doctor's diagnosis, punctuality, and clinic environment..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm"
                >
                  {submittingReview ? 'Submitting...' : 'Post Verified Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base">Cancel Appointment</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to cancel this visit? The doctor will be notified immediately.
            </p>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Keep Visit
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalOpen && rescheduleAppt && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base">Reschedule Visit</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  New Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  New Time Slot
                </label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="02:30 PM">02:30 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm"
              >
                Request Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
