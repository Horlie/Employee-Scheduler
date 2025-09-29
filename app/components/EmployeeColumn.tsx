import React, { useState, useEffect, useRef, type JSX } from "react";
import { Employee } from "../types/scheduler";
import RateToolTip from "./RateToolTip";
import { useEmployee } from "../context/EmployeeContext";

interface EmployeeColumnProps {
  groupedEmployees: [string, Employee[]][];
  renderGroupSeparator: (text: string) => JSX.Element;
  renderSearchBar: () => JSX.Element;
  hoveredEmployee: string | null;
  showTooltips: boolean;
  employeeHours: Record<number, Map<number, number>>;
}

const EmployeeColumn: React.FC<EmployeeColumnProps> = ({
  groupedEmployees,
  renderGroupSeparator,
  renderSearchBar,
  hoveredEmployee,
  showTooltips,
  employeeHours, // Destructure the new prop
}) => {
  const [tooltipEmployeeId, setTooltipEmployeeId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const { setEmployees } = useEmployee();
  const { activeMonth } = useEmployee();

  const handleRateUpdate = (employeeId: string, newRate: number) => {
    // Update global EmployeeContext
    setEmployees((prevEmployees) =>
      prevEmployees.map((emp) =>
        emp.id.toString() === employeeId ? { ...emp, rate: newRate } : emp
      )
    );
  };

  const handleRateClick = (
    employeeId: string,
    currentRate: number,
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    const scrollTop = window.scrollY;
    const scrollLeft = window.scrollX;
    const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
    setTooltipPosition({ x: rect.right + 10 + scrollLeft, y: rect.top + scrollTop }); // Position tooltip 10px to the right
    setTooltipEmployeeId(employeeId);
  };

  const closeTooltip = () => {
    setTooltipEmployeeId(null);
    setTooltipPosition(null);
  };

  // New state to manage the dropdown menu
  const [dropdownEmployeeId, setDropdownEmployeeId] = useState<string | null>(null);

  // Add a ref to the dropdown
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Effect to handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownEmployeeId(null);
      }
    };

    if (dropdownEmployeeId) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownEmployeeId]);

  // Function to toggle the dropdown menu
  const toggleDropdown = (employeeId: string) => {
    setDropdownEmployeeId((prev) => (prev === employeeId ? null : employeeId));
  };

  // Function to handle deletion of an employee
  const handleDelete = async (employeeId: string) => {
    try {
      const response = await fetch(`/api/employees?id=${employeeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete employee");
      }

      setEmployees((prevEmployees) =>
        prevEmployees.filter((emp) => emp.id.toString() !== employeeId)
      );
      setDropdownEmployeeId(null);
    } catch (error) {
      console.error("Error deleting employee:", error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <div className={`w-48 flex-shrink-0 flex flex-col bg-white`}>
      {renderGroupSeparator("")}
      {renderSearchBar()}
      <div className="flex-grow overflow-y-auto">
        {groupedEmployees.map(([role, employees], groupIndex) => (
          <React.Fragment key={role}>
            {groupIndex > 0 && (
              <>
                {renderGroupSeparator("")}
                {renderSearchBar()}
              </>
            )}
            {employees.map((employee) => (
              <div
                key={employee.id}
                className={`flex items-center p-2 border-l border-b border-r border-gray-300 h-[50px]
                  ${hoveredEmployee === employee.id.toString() ? "bg-lightblue z-[49]" : ""}`}
                style={{
                  boxShadow:
                    hoveredEmployee === employee.id.toString()
                      ? "0px 0px 10px 3px lightblue"
                      : "none",
                }}
              >
                <div
                  className="w-8 h-8 rounded-full border border-gray-500 flex items-center justify-center mr-2 cursor-pointer hover:text-indigo-600 hover:border-indigo-600"
                  onClick={(e) => handleRateClick(employee.id.toString(), employee.rate, e)}
                >
                  {employee.rate.toFixed(2)}
                </div>

                <div className="flex flex-col">
                  <div className="font-semibold text-sm">
                    {employee.name.split(" ").slice(0, 2).join(" ")}
                    {/* Display total hours */}
                    {!showTooltips && (
                      <span className="text-xs text-gray-500 block">
                        (
                        {employeeHours[activeMonth.getMonth() + 1]?.get(employee.id)
                          ? `${employeeHours[activeMonth.getMonth() + 1]
                              .get(employee.id)
                              ?.toFixed(2)} hrs`
                          : "0 hrs"}
                        )
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative ml-auto">
                  <button
                    onClick={() => toggleDropdown(employee.id.toString())}
                    className="focus:outline-none"
                  >
                    ⋮
                  </button>
                  {dropdownEmployeeId === employee.id.toString() && showTooltips && (
                    <div
                      ref={dropdownRef} // Attach the ref to the dropdown
                      className="absolute right-2 top-0 mt-2 w-24 bg-white border rounded shadow z-50"
                    >
                      <button
                        onClick={() => handleDelete(employee.id.toString())}
                        className="block px-4 py-2 text-left w-full hover:bg-gray-100 text-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="flex items-center h-[54px] bg-gray-100 border-r border-gray-300 border-t border-b border-l bg-white">
              <span className="text-md font-medium text-gray-600 pl-3">
                Total: {employees.length}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
      {/* Render RateToolTip with position */}
      {tooltipEmployeeId && tooltipPosition && showTooltips && (
        <RateToolTip
          employeeId={tooltipEmployeeId}
          currentRate={
            groupedEmployees
              .flatMap(([_, employees]) => employees)
              .find((emp) => emp.id.toString() === tooltipEmployeeId)?.rate || 0.0
          }
          onRateUpdate={(newRate) => handleRateUpdate(tooltipEmployeeId, newRate)}
          onClose={closeTooltip}
          position={tooltipPosition}
        />
      )}
    </div>
  );
};

export default EmployeeColumn;
