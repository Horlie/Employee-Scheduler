import React, { useState } from "react";
import { Employee } from "../types/scheduler";

interface EmployeeEventTooltipProps {
  employee: Employee;
  date: Date;
  onAction: (
    action: "unavailable" | "unreachable" | "preferable" | "delete" | "vacation",
    startDate: Date,
    finishDate: Date
  ) => void; 
  position: { top: number; left: number };
}

const EmployeeEventTooltip: React.FC<EmployeeEventTooltipProps> = ({
  employee,
  date,
  onAction,
  position,
}) => {
  const [isFullDay, setIsFullDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  const handleAction = (action: "unavailable" | "unreachable" | "preferable" | "delete" | "vacation") => {
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
  };

  return (
    <div
      className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-64"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translate(-50%, -100%)",
      }}
    >
      <h3 className="font-bold text-lg mb-2">{employee.name}</h3>
      <p className="text-sm text-gray-600 mb-2 capitalize">{employee.role}</p>
      <p className="text-sm mb-2">Date: {date.toLocaleDateString()}</p>
      <div className="mb-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isFullDay}
            onChange={(e) => setIsFullDay(e.target.checked)}
            className="mr-2"
          />
          Full Day
        </label>
      </div>
      {!isFullDay && (
        <div className="flex space-x-2 mb-2">
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
          <span className="text-sm pt-1">to</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button
          className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 text-sm"
          onClick={() => handleAction("unavailable")}
        >
          Unavailable
        </button>
        <button
          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-sm"
          onClick={() => handleAction("unreachable")}
        >
          Unreachable
        </button>
        <button
          className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 text-sm"
          onClick={() => handleAction("preferable")}
        >
          Preferable
        </button>
        <button
          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
          onClick={() => handleAction("vacation")}
        >
          Vacation
        </button>
        <button
          className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 text-sm col-span-2"
          onClick={() => handleAction("delete")}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default EmployeeEventTooltip;
