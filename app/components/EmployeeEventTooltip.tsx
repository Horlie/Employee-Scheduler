import React, { useState } from "react";
import { Employee } from "../types/scheduler";
import { useTranslation } from "react-i18next";

interface EmployeeEventTooltipProps {
  position: { top: number; left: number };
  onClose?: () => void; 

  employee?: Employee;
  date?: Date;
  onAction?: (
    action: "unavailable" | "unreachable" | "preferable" | "delete" | "vacation",
    startDate: Date,
    finishDate: Date
  ) => void;

  selectedCount?: number;
  onMultiAction?: (
    action: "unavailable" | "unreachable" | "preferable" | "delete" | "vacation",
    startTime: string,
    endTime: string,
    isFullDay: boolean
  ) => void;
}

const EmployeeEventTooltip: React.FC<EmployeeEventTooltipProps> = ({
  employee,
  date,
  onAction,
  position,
  selectedCount = 0,
  onMultiAction,
  onClose
}) => {
  const { t } = useTranslation();
  const [isFullDay, setIsFullDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  const isMultiMode = selectedCount > 1;

  const handleAction = (action: "unavailable" | "unreachable" | "preferable" | "delete" | "vacation") => {
    if (isMultiMode && onMultiAction) {
      onMultiAction(action, startTime, endTime, isFullDay);
    } else if (employee && date && onAction) {
      const startDate = new Date(date);
      const finishDate = new Date(date);
      if (isFullDay) {
        startDate.setHours(0, 0, 0, 0);
        finishDate.setHours(23, 59, 59, 999);
      } else {
        const [startHours, startMinutes] = startTime.split(":").map(Number);
        const [endHours, endMinutes] = endTime.split(":").map(Number);
        startDate.setHours(startHours, startMinutes, 0, 0);
        finishDate.setHours(endHours, endMinutes, 0, 0);
      }
      onAction(action, startDate, finishDate);
    }
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartTime = e.target.value;
    setStartTime(newStartTime);
    if (newStartTime > endTime) {
      setEndTime(newStartTime);
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndTime = e.target.value;
    if (newEndTime >= startTime) {
      setEndTime(newEndTime);
    }
  };

  return (
    <div
      className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 min-w-max"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translate(-50%, -100%)", 
        marginTop: "-8px"
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          {isMultiMode ? (
            <h3 className="font-bold text-lg text-indigo-700">
              {selectedCount} {t('tooltip.cells_selected', 'cells selected')}
            </h3>
          ) : (
            <>
              <h3 className="font-bold text-lg">{employee?.name}</h3>
              <p className="text-sm text-gray-600 capitalize">{employee?.roles.join(", ")}</p>
            </>
          )}
        </div>
        {onClose && (
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4">✕</button>
        )}
      </div>

      {!isMultiMode && date && (
        <p className="text-sm mb-2">{t('tooltip.date')}: {date.toLocaleDateString()}</p>
      )}

      <div className="mb-2">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isFullDay}
            onChange={(e) => setIsFullDay(e.target.checked)}
            className="mr-2"
          />
          {t('tooltip.full_day')}
        </label>
      </div>

      {!isFullDay && (
        <div className="flex space-x-2 mb-2">
          <input
            type="time"
            value={startTime}
            onChange={handleStartTimeChange}
            className="border rounded px-2 py-1 text-sm"
          />
          <span className="text-sm pt-1">{t('tooltip.to')}</span>
          <input
            type="time"
            value={endTime}
            onChange={handleEndTimeChange}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          className="bg-yellow-500 text-white px-4 py-1 rounded hover:bg-yellow-600 text-sm transition-colors"
          onClick={() => handleAction("unavailable")}
        >
          {t('tooltip.unavailable')}
        </button>
        <button
          className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 text-sm transition-colors"
          onClick={() => handleAction("unreachable")}
        >
          {t('tooltip.unreachable')}
        </button>
        <button
          className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 text-sm transition-colors"
          onClick={() => handleAction("preferable")}
        >
          {t('tooltip.preferable')}
        </button>
        <button
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 text-sm transition-colors"
          onClick={() => handleAction("vacation")}
        >
          {t('tooltip.vacation')}
        </button>

        <button
          className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 text-sm col-span-2 transition-colors"
          onClick={() => handleAction("delete")}
        >
          {t('tooltip.delete')}
        </button>
      </div>
    </div>
  );
};

export default EmployeeEventTooltip;