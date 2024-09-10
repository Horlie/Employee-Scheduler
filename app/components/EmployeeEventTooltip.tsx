import React from "react";
import { Employee } from "../types/scheduler";

interface EmployeeEventTooltipProps {
  employee: Employee;
  date: Date;
  onClose: () => void;
}

const EmployeeEventTooltip: React.FC<EmployeeEventTooltipProps> = ({
  employee,
  date,
  onClose,
}) => {
  return (
    <div className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-64">
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        onClick={onClose}
      >
        ×
      </button>
      <h3 className="font-bold text-lg mb-2">{employee.name}</h3>
      <p className="text-sm text-gray-600 mb-2">{employee.role}</p>
      <p className="text-sm mb-2">Date: {date.toLocaleDateString()}</p>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
        onClick={() => {
          /* Add event logic here */
        }}
      >
        Add Event
      </button>
    </div>
  );
};

export default EmployeeEventTooltip;
