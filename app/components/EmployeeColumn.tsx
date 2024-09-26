import React, { useState } from "react";
import { Employee } from "../types/scheduler";
import RateToolTip from "./RateToolTip";
import { useEmployee } from "../context/EmployeeContext";

interface EmployeeColumnProps {
  groupedEmployees: [string, Employee[]][];
  renderGroupSeparator: (text: string) => JSX.Element;
  renderSearchBar: () => JSX.Element;
  hoveredEmployee: string | null;
  showTooltips: boolean;
}

const EmployeeColumn: React.FC<EmployeeColumnProps> = ({
  groupedEmployees,
  renderGroupSeparator,
  renderSearchBar,
  hoveredEmployee,
  showTooltips,
}) => {
  const [tooltipEmployeeId, setTooltipEmployeeId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  const { setEmployees } = useEmployee();

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
                className={`flex items-center p-2 border-l border-b border-r border-gray-300 h-[46px]
                  ${hoveredEmployee === employee.id.toString() ? "bg-lightblue z-[49]" : ""}`}
                style={{
                  boxShadow:
                    hoveredEmployee === employee.id.toString()
                      ? "0px 0px 10px 3px lightblue"
                      : "none",
                }}
              >
                <div
                  className="w-8 h-8 rounded-full border border-gray-500 flex items-center justify-center mr-2 cursor-pointer"
                  onClick={(e) => handleRateClick(employee.id.toString(), employee.rate, e)}
                >
                  {employee.rate.toFixed(1)}
                </div>
                <div>
                  <div className="font-semibold text-sm">{employee.name}</div>
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
