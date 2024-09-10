import React from "react";
import { Employee } from "../types/scheduler";

interface EmployeeEventTooltipProps {
  employee: Employee;
  date: Date;
  onAction: (
    action: "unavailable" | "unreachable" | "preferable" | "delete"
  ) => void;
  position: { top: number; left: number };
}

const EmployeeEventTooltip: React.FC<EmployeeEventTooltipProps> = ({
  employee,
  date,
  onAction,
  position,
}) => {
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
      <p className="text-sm text-gray-600 mb-2">{employee.role}</p>
      <p className="text-sm mb-2">Date: {date.toLocaleDateString()}</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 text-sm"
          onClick={() => onAction("unavailable")}
        >
          Unavailable
        </button>
        <button
          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-sm"
          onClick={() => onAction("unreachable")}
        >
          Unreachable
        </button>
        <button
          className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 text-sm"
          onClick={() => onAction("preferable")}
        >
          Preferable
        </button>
        <button
          className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 text-sm"
          onClick={() => onAction("delete")}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default EmployeeEventTooltip;
