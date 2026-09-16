import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, ArrowLeft, ShieldCheck, FileText, Stethoscope } from 'lucide-react';
import api from '../services/api';
import { Prescription } from '../types';

export const PrescriptionViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        const res = await api.get(`/prescriptions/${id}`);
        if (res.data.success) {
          setPrescription(res.data.prescription);
        }
      } catch (err) {
        console.error('Failed to load prescription', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPrescription();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Loading digital prescription record...</p>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 bg-white rounded-2xl border border-slate-200 text-center">
        <h3 className="font-bold text-slate-800 text-base">Prescription Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          This prescription record may have been removed or is unavailable.
        </p>
        <Link to="/dashboard" className="text-xs text-teal-600 font-semibold hover:underline">
          &larr; Return to Dashboard
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between no-print">
        <Link
          to="/dashboard"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Records
        </Link>

        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      {/* Prescription Document Sheet */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-sm space-y-8 print:shadow-none print:border-none print:p-0">
        {/* Clinic & Hospital Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-900 pb-6 gap-4">
          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-teal-700 block">
              Outpatient Clinical Consultation
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-0.5">
              {prescription.clinic?.name || 'Medical Clinic'}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              {prescription.clinic?.address}, {prescription.clinic?.city}
            </p>
            {prescription.clinic?.phone && (
              <p className="text-xs text-slate-500">Contact: {prescription.clinic?.phone}</p>
            )}
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 text-[11px] font-bold px-2 py-0.5 rounded-md border border-teal-200">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Council Verified Doctor
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {prescription.doctor?.name}
            </h2>
            <p className="text-xs font-semibold text-slate-700">
              {prescription.doctor?.specialization} &bull; {prescription.doctor?.qualification}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              Reg. No: {prescription.doctor?.medicalRegistrationNumber} ({prescription.doctor?.medicalCouncil})
            </p>
          </div>
        </div>

        {/* Patient Meta Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 text-xs border border-slate-200">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
              Patient Name
            </span>
            <span className="font-bold text-slate-900 text-sm">
              {prescription.patient?.name || prescription.appointment?.patientName}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
              Date &amp; Time
            </span>
            <span className="font-semibold text-slate-800">
              {new Date(prescription.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
              Consultation ID
            </span>
            <span className="font-mono text-slate-700 text-[11px]">
              {prescription.appointmentId.slice(-8).toUpperCase()}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
              Contact Phone
            </span>
            <span className="text-slate-700 font-medium">
              {prescription.appointment?.patientPhone || prescription.patient?.phone || 'N/A'}
            </span>
          </div>
        </div>

        {/* Diagnosis & Symptoms */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Clinical Diagnosis
              </span>
              <p className="text-base font-bold text-slate-900">{prescription.diagnosis}</p>
            </div>

            {prescription.symptoms && (
              <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Reported Symptoms
                </span>
                <p className="text-xs text-slate-700">{prescription.symptoms}</p>
              </div>
            )}
          </div>

          {prescription.consultationNotes && (
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-700 block mb-0.5">Clinical Notes:</span>
              <p>{prescription.consultationNotes}</p>
            </div>
          )}
        </div>

        {/* Rx Symbol & Medication Table */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-serif font-black text-3xl text-teal-700">℞</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Medication Schedule
            </span>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Drug / Medication</th>
                  <th className="p-3">Dosage</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Special Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prescription.medicines.map((med, index) => (
                  <tr key={index} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-400">{index + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{med.name}</td>
                    <td className="p-3 text-slate-700">{med.dosage}</td>
                    <td className="p-3 text-slate-700">{med.duration}</td>
                    <td className="p-3 text-slate-600 italic">{med.instructions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Advice & Follow Up */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {prescription.advice && (
            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-900 block">Physician Directives &amp; Lifestyle:</span>
              <p className="text-slate-600 leading-relaxed">{prescription.advice}</p>
            </div>
          )}

          {prescription.followUpDate && (
            <div className="space-y-1 text-xs sm:text-right">
              <span className="font-bold text-slate-900 block">Recommended Follow-up:</span>
              <p className="text-teal-700 font-bold text-sm">{prescription.followUpDate}</p>
            </div>
          )}
        </div>

        {/* Doctor Signature Block */}
        <div className="pt-10 border-t border-slate-200 flex items-end justify-between">
          <div className="text-[10px] text-slate-400 max-w-xs leading-tight">
            DocPulse Official Digital Medical Record. Certified tamper-evident record. For pharmacy dispensing, verify doctor registration number on state medical register.
          </div>

          <div className="text-right space-y-1">
            <div className="h-10 flex items-end justify-end">
              <span className="font-serif italic font-bold text-slate-800 text-lg">
                Dr. {prescription.doctor?.name.split(' ').pop()}
              </span>
            </div>
            <div className="w-44 border-t border-slate-400" />
            <span className="text-xs font-bold text-slate-800 block">Authorized Medical Practitioner</span>
            <span className="text-[10px] text-slate-500 font-mono">
              Reg. #{prescription.doctor?.medicalRegistrationNumber}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
