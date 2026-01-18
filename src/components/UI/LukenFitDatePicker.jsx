import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  addDaysToDate,
  formatDateDisplay,
  getArgentinaDateString,
  getArgentinaDay
} from '../../utils/dateUtils';

/**
 * LukenFitDatePicker
 * A premium, unified date picker component for LukenFit.
 * Features:
 * - Pure white aesthetic with subtle shadows
 * - iOS-style physics and feel
 * - Quick 'Today'/'Yesterday' navigation
 * - Custom Calendar View
 * - Strict Argentina Timezone adherence
 */
export const LukenFitDatePicker = ({
  selectedDate,
  onChange,
  label = 'Fecha',
  disableFuture = true
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const today = getArgentinaDateString();
  const yesterday = addDaysToDate(today, -1);

  // Format display text - Optimized to avoid redundancy
  const dateObj = new Date(selectedDate + 'T12:00:00');
  const formattedDate = new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).format(dateObj);

  // If Today/Yesterday, label says HOY/AYER, so main text should be the actual date (e.g. "Lun 18 Ene")
  // If distinct date, label says 'FECHA', main text is the date.
  // This avoids "HOY / Hoy" redundancy.
  const mainText = formattedDate;

  const isToday = selectedDate === today;
  const isYesterday = selectedDate === yesterday;

  const handlePrevDay = () => onChange(addDaysToDate(selectedDate, -1));
  const handleNextDay = () => {
    const nextDay = addDaysToDate(selectedDate, 1);
    if (disableFuture && nextDay > today) return;
    onChange(nextDay);
  };

  const isNextDisabled = disableFuture && selectedDate >= today;

  // Calendar Helpers
  const [viewDate, setViewDate] = useState(selectedDate || today); // For calendar navigation

  // Sync viewDate when modal opens
  useEffect(() => {
    if (isCalendarOpen) setViewDate(selectedDate || today);
  }, [isCalendarOpen, selectedDate, today]);

  const viewMonthYear = new Date(viewDate + 'T12:00:00').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  const handleCalendarSelect = (dayStr) => {
    onChange(dayStr);
    setIsCalendarOpen(false);
  };

  // Generate calendar days
  const getCalendarDays = () => {
    const year = parseInt(viewDate.split('-')[0]);
    const month = parseInt(viewDate.split('-')[1]) - 1; // 0-indexed

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();

    let startDay = getArgentinaDay(firstDayOfMonth);
    startDay = startDay === 0 ? 6 : startDay - 1;

    const days = [];
    // Padding
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        const yyyy = year;
        const mm = String(month + 1).padStart(2, '0');
        const dd = String(i).padStart(2, '0');
        days.push(`${yyyy}-${mm}-${dd}`);
    }
    return days;
  };

  const calendarDays = getCalendarDays();
  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const changeMonth = (offset) => {
      const [y, m, d] = viewDate.split('-').map(Number);
      const current = new Date(y, m - 1, 1);
      current.setMonth(current.getMonth() + offset);
      const newY = current.getFullYear();
      const newM = String(current.getMonth() + 1).padStart(2, '0');
      setViewDate(`${newY}-${newM}-01`);
  };

  return (
    <div className="relative font-sans inline-block w-full">
      {/* Main Controller */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 w-full relative z-10">
        {/* Previous Day */}
        <button
          onClick={handlePrevDay}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-95 flex-shrink-0"
          aria-label="Día anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Date Display (Trigger) - Centered & Aligned */}
        <button
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          className="flex-1 flex flex-col items-center justify-center mx-1 group cursor-pointer py-1 min-w-0"
        >
           <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
             isToday ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'
           }`}>
            {isToday ? 'HOY' : isYesterday ? 'AYER' : label}
           </span>
           <div className="flex items-center justify-center gap-1.5 text-gray-900 font-bold text-lg leading-none mt-0.5 group-hover:text-blue-600 transition-colors w-full">
              <CalendarIcon className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              <span className="truncate">{mainText}</span>
           </div>
        </button>

        {/* Next Day */}
        <button
          onClick={handleNextDay}
          disabled={isNextDisabled}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95 flex-shrink-0 ${
            isNextDisabled
              ? 'text-gray-200 cursor-not-allowed'
              : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
          }`}
          aria-label="Día siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Internal Modal / Dropdown - Absolute Positioned */}
      {isCalendarOpen && (
        <>
          {/* Backdrop for click-outside */}
          <div className="fixed inset-0 z-[50]" onClick={() => setIsCalendarOpen(false)} />

          {/* Popover */}
          <div
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-[60] bg-white rounded-3xl p-5 w-[300px] shadow-2xl border border-gray-100 ring-1 ring-black/5 animate-in slide-in-from-top-2 duration-200 origin-top"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
               <div className="flex flex-col items-start">
                  <h3 className="text-lg font-bold text-gray-900 capitalize tracking-tight">{viewMonthYear}</h3>
                  <button
                    onClick={() => handleCalendarSelect(today)}
                    className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors mt-0.5"
                  >
                    Volver a Hoy
                  </button>
               </div>
               <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-full border border-gray-100">
                 <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-full text-gray-500 transition-all">
                    <ChevronLeft className="w-5 h-5" />
                 </button>
                 <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-full text-gray-500 transition-all">
                    <ChevronRight className="w-5 h-5" />
                 </button>
               </div>
            </div>

            {/* Week Days */}
            <div className="grid grid-cols-7 mb-3 border-b border-gray-50 pb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 place-items-center">
              {calendarDays.map((dateStr, idx) => {
                if (!dateStr) return <div key={`empty-${idx}`} className="w-full" />;

                const isSelected = dateStr === selectedDate;
                const isFuture = disableFuture && dateStr > today;
                const isCurrentToday = dateStr === today;
                const dayNum = parseInt(dateStr.split('-')[2]);

                return (
                  <button
                    key={dateStr}
                    disabled={isFuture}
                    onClick={() => handleCalendarSelect(dateStr)}
                    className={`
                      w-8 h-8 rounded-full text-sm font-medium transition-all flex items-center justify-center relative
                      ${isSelected
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                        : isFuture
                          ? 'text-gray-200 cursor-not-allowed font-normal'
                          : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                      }
                      ${isCurrentToday && !isSelected ? 'text-blue-600 font-bold ring-1 ring-blue-100 bg-blue-50/50' : ''}
                    `}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Close Button Mobile Friendly (Optional but helpful) */}
            <button
              onClick={() => setIsCalendarOpen(false)}
              className="mt-4 w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold rounded-xl text-xs transition-colors"
            >
              Cerrar
            </button>
          </div>
        </>
      )}
    </div>
  );
};
