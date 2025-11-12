import React, { useState, useEffect, useCallback } from 'react';
import type { EmployeeAvailability } from '../types/scheduler';

interface ShiftTooltipProps {
  shift: EmployeeAvailability | null;
  date: Date;
  employeeId: number;
  onSave: (shift: EmployeeAvailability) => void;
  onDelete: (shiftId: number | string) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

const formatDateToTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const isOneDayApartByDate = (startDate: Date, endDate: Date) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays === 1;
};

export const ShiftTooltip: React.FC<ShiftTooltipProps> = ({
  shift,
  date,
  employeeId,
  onSave,
  onDelete,
  onClose,
  position,
}) => {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isFullDay, setIsFullDay] = useState(false);

  useEffect(() => {
    if (shift) {
      const startDate = new Date(shift.startDate);
      const finishDate = new Date(shift.finishDate);
      setStartTime(formatDateToTime(startDate));
      setEndTime(formatDateToTime(finishDate));
      setIsFullDay(isOneDayApartByDate(new Date(shift.startDate), new Date(shift.finishDate)) ? true : false);
    } else {
      // Reset to default for new shift
      setStartTime('09:00');
      setEndTime('17:00');
      setIsFullDay(false);
    }
  }, [shift]);

  const handleFullDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsFullDay(checked);
    setStartTime(startTime);
    checked ? setEndTime(startTime) : setEndTime("17:00");
  };

  const handleSave = useCallback(() => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const newStartDate = new Date(date);
    newStartDate.setHours(startHour, startMinute, 0, 0);
    const newFinishDate = new Date(date);
    newFinishDate.setHours(endHour, endMinute, 0, 0);
    
    // Handle overnight shifts
    if (newFinishDate <= newStartDate) {
      newFinishDate.setDate(newFinishDate.getDate() + 1);
    }

    const shiftPayload: EmployeeAvailability = {
      id: shift?.id || -1,
      employeeId,
      startDate: newStartDate,
      finishDate: newFinishDate,
      start: newStartDate,
      end: newFinishDate,
      isFullDay: isFullDay,
    };

    onSave(shiftPayload);
  }, [startTime, endTime, date, shift, employeeId, isFullDay, onSave]);
  
  const handleDelete = () => {
      if (shift) {
          onDelete(shift.id);
      }
  };

  return (
    <div
      style={{ top: position.top, left: position.left }}
      className="absolute z-10 p-4 bg-white rounded-lg shadow-2xl w-64 transform -translate-x-1/2 mt-2 transition-all duration-300 ease-in-out animate-fade-in-down border"
    >
      <div className="absolute left-1/2 -top-2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t"></div>
      <div className="relative">
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 text-slate-500 hover:text-slate-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-lg font-bold text-slate-800 mb-1">
          {shift ? 'Edit Shift' : 'Add Shift'}
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="full-day"
              type="checkbox"
              checked={isFullDay}
              onChange={handleFullDayChange}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="full-day" className="ml-2 block text-sm font-medium text-slate-700">
              Full Day
            </label>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div>
              <label htmlFor="start-time" className="block text-sm font-medium text-slate-700">
                Start
              </label>
              <input
                type="time"
                id="start-time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="end-time" className="block text-sm font-medium text-slate-700">
                End
              </label>
              <input
                type="time"
                id="end-time"
                value={isFullDay ? startTime : endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isFullDay}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-6">
            {shift ? (
                <button 
                    onClick={handleDelete}
                    className="text-sm font-medium text-red-600 hover:text-red-800"
                >
                    Delete
                </button>
            ) : <div />}
             <button
                onClick={handleSave}
                className="inline-flex justify-center rounded-md border border-transparent bg-sky-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            >
                Save
            </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-down {
            0% {
                opacity: 0;
                transform: translate(-50%, -10px);
            }
            100% {
                opacity: 1;
                transform: translate(-50%, 0);
            }
        }
        .animate-fade-in-down {
            animation: fade-in-down 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
