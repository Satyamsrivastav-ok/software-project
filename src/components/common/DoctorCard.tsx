import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Building2, Clock, CalendarCheck } from 'lucide-react';
import { DoctorProfile } from '../../types';
import { VerifiedBadge } from './VerifiedBadge';

interface DoctorCardProps {
  doctor: DoctorProfile;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between group">
      <div>
        {/* Top Header: Image & Badges */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <img
              src={doctor.profilePhoto || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80'}
              alt={doctor.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-100 shadow-sm"
              referrerPolicy="no-referrer"
            />
            {doctor.rating > 0 && (
              <div className="absolute -bottom-2 -right-1 bg-white text-slate-800 text-[11px] font-bold px-1.5 py-0.5 rounded-lg shadow-sm border border-slate-100 flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>{doctor.rating}</span>
                <span className="text-slate-400 font-normal">({doctor.reviewCount})</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-md">
                {doctor.specialization}
              </span>
              <VerifiedBadge status={doctor.verificationStatus} size="sm" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1 truncate group-hover:text-teal-600 transition">
              <Link to={`/doctors/${doctor._id}`}>{doctor.name}</Link>
            </h3>

            <p className="text-xs text-slate-500 truncate mt-0.5">{doctor.qualification}</p>
            <p className="text-xs font-medium text-slate-600 mt-1">
              {doctor.experience} Years Clinical Experience
            </p>
          </div>
        </div>

        {/* Primary Clinic & Location Details */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
          {doctor.primaryClinic ? (
            <>
              <div className="flex items-center gap-1.5 truncate">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-medium text-slate-800 truncate">
                  {doctor.primaryClinic.name}
                </span>
                {doctor.clinicsCount && doctor.clinicsCount > 1 && (
                  <span className="text-[10px] text-teal-600 bg-teal-50 px-1.5 py-0.2 rounded font-semibold shrink-0">
                    +{doctor.clinicsCount - 1} more
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{doctor.primaryClinic.city || doctor.primaryClinic.address}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {doctor.primaryClinic.openingTime} - {doctor.primaryClinic.closingTime}
                </span>
              </div>
            </>
          ) : (
            <div className="text-slate-400 italic">No clinic assigned yet</div>
          )}
        </div>
      </div>

      {/* Footer: Fee & Action Buttons */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          <span className="text-[11px] text-slate-400 block font-medium">Consultation Fee</span>
          <span className="text-base font-bold text-slate-900">
            ${doctor.consultationFee}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/doctors/${doctor._id}`}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition"
          >
            Profile
          </Link>
          <Link
            to={`/doctors/${doctor._id}#book`}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-600/20 transition flex items-center gap-1.5"
          >
            <CalendarCheck className="w-3.5 h-3.5" /> Book
          </Link>
        </div>
      </div>
    </div>
  );
};
