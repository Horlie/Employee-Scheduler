import React, { useState, useEffect, useRef } from "react";
import { Employee } from "../types/scheduler";
import { getWeek } from "date-fns";
import EmployeeEventTooltip from "./EmployeeEventTooltip";

interface CalendarGridProps {
  groupedEmployees: [string, Employee[]][];
  days: Date[];
  daysOfWeek: string[];
  cellWidth: number;
  isToday: (date: Date) => boolean;
  isLatvianHoliday: (date: Date) => boolean;
  hoveredDay: number | null;
  hoveredEmployee: string | null;
  hoveredGroup: string | null;
  handleCellHover: (day: number, employeeId: string, group: string) => void;
  handleCellLeave: () => void;
  renderGroupSeparator: (text: string) => JSX.Element;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  groupedEmployees,
  days,
  daysOfWeek,
  cellWidth,
  isToday,
  isLatvianHoliday,
  hoveredDay,
  hoveredEmployee,
  hoveredGroup,
  handleCellHover,
  handleCellLeave,
  renderGroupSeparator,
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [cellColors, setCellColors] = useState<Record<string, string>>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        handleCloseTooltip();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCellClick = (
    employee: Employee,
    date: Date,
    event: React.MouseEvent
  ) => {
    setSelectedEmployee(employee);
    setSelectedDate(date);
    setTooltipPosition({ top: event.clientY, left: event.clientX });
  };

  const handleCloseTooltip = () => {
    setSelectedEmployee(null);
    setSelectedDate(null);
  };

  const handleAction = (
    action: "unavailable" | "unreachable" | "preferable" | "delete"
  ) => {
    if (selectedEmployee && selectedDate) {
      const cellKey = `${selectedEmployee.id}-${selectedDate.toISOString()}`;
      let newColor = "";
      switch (action) {
        case "unavailable":
          newColor = "bg-yellow-200";
          break;
        case "unreachable":
          newColor = "bg-red-200";
          break;
        case "preferable":
          newColor = "bg-green-200";
          break;
        case "delete":
          newColor = "";
          break;
      }
      setCellColors((prev) => ({ ...prev, [cellKey]: newColor }));
    }
    handleCloseTooltip();
  };

  const renderDayHeaders = (currentGroup: string) => (
    <div className="flex bg-gray-100 sticky top-0 z-10">
      {days.map((day, index) => (
        <React.Fragment key={index}>
          {day.getDay() === 1 && (
            <div className="border-gray-300 w-6 relative bg-gray-100 flex-shrink-0">
              <div className="absolute top-0 left-0 w-6 h-20 flex items-center justify-center bg-gray-100 border-r border-gray-300">
                <span className="transform -rotate-90 origin-center whitespace-nowrap text-xs text-gray-500">
                  Week {getWeek(day)}
                </span>
              </div>
            </div>
          )}
          <div
            className={`flex-shrink-0 text-center py-1 text-xs border-r border-t border-b-2 border-gray-300 relative
            ${
              isToday(day)
                ? "bg-indigo-100"
                : `${[0, 6].includes(day.getDay()) ? "bg-blue-50" : "bg-white"}`
            } 
            
            ${
              hoveredDay === day.getDate() && hoveredGroup === currentGroup
                ? "bg-lightblue z-[49]"
                : ""
            }`}
            style={{
              width: `${cellWidth}px`,
              boxShadow:
                hoveredDay === day.getDate() && hoveredGroup === currentGroup
                  ? "0px 0px 10px 3px lightblue"
                  : "none",
            }}
          >
            <div className={`${isToday(day) ? "font-bold text-blue-600" : ""}`}>
              {daysOfWeek[day.getDay()]}
            </div>
            <div className={`text-lg font-semibold`}>{day.getDate()}</div>
            {isLatvianHoliday(day) && (
              <div className="absolute top-0 right-0 w-0 h-0 border-t-[10px] border-l-[10px] border-t-red-500 border-l-transparent"></div>
            )}
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  const renderDayFooter = (currentGroup: string) => (
    <div className="flex bg-gray-100 sticky bottom-0 z-10">
      {days.map((day, index) => (
        <React.Fragment key={index}>
          {day.getDay() === 1 && (
            <div className="border-gray-300 w-6 relative bg-gray-100 flex-shrink-0">
              <div className="absolute bottom-0 left-0 w-6 h-20 flex items-center justify-center bg-gray-100 border-r border-gray-300">
                <span className="transform -rotate-90 origin-center whitespace-nowrap text-xs text-gray-500">
                  Week {getWeek(day)}
                </span>
              </div>
            </div>
          )}
          <div
            className={`flex-shrink-0 text-center py-1 text-xs border-r border-t border-b border-gray-300 relative
            ${isToday(day) ? "bg-indigo-100" : ""} 
            ${[0, 6].includes(day.getDay()) ? "bg-blue-50" : "bg-white"}
            ${
              hoveredDay === day.getDate() && hoveredGroup === currentGroup
                ? "bg-lightblue z-[49]"
                : ""
            }`}
            style={{
              width: `${cellWidth}px`,
              boxShadow:
                hoveredDay === day.getDate() && hoveredGroup === currentGroup
                  ? "0px 0px 10px 3px lightblue"
                  : "none",
            }}
          >
            <div className={`${isToday(day) ? "font-bold text-blue-600" : ""}`}>
              {daysOfWeek[day.getDay()]}
            </div>
            <div className={`text-lg font-semibold`}>{day.getDate()}</div>
            {isLatvianHoliday(day) && (
              <div className="absolute bottom-0 right-0 w-0 h-0 border-b-[10px] border-l-[10px] border-b-red-500 border-l-transparent"></div>
            )}
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  const renderEmployeeRows = () => (
    <div>
      {groupedEmployees.map(([role, employees], groupIndex) => (
        <React.Fragment key={role}>
          {groupIndex > 0 && (
            <>
              {renderGroupSeparator(role)}
              {renderDayHeaders(role)}
            </>
          )}
          {employees.map((employee) => (
            <div key={employee.id} className="flex">
              {days.map((day, dayIndex) => {
                const cellKey = `${employee.id}-${day.toISOString()}`;
                const cellColor = cellColors[cellKey] || "";
                return (
                  <React.Fragment key={`${employee.id}-${dayIndex}`}>
                    {day.getDay() === 1 && (
                      <div className="flex-shrink-0 w-6 border-r border-gray-300"></div>
                    )}
                    <div
                      className={`flex-shrink-0 border-r border-b border-gray-300 
                        ${
                          isToday(day)
                            ? "bg-indigo-100"
                            : `${
                                [0, 6].includes(day.getDay())
                                  ? "bg-blue-50"
                                  : "bg-white"
                              }`
                        } 
                        ${
                          hoveredDay === day.getDate() &&
                          hoveredEmployee === employee.id
                            ? "z-[49]"
                            : ""
                        }
                        ${cellColor}`}
                      style={{
                        width: `${cellWidth}px`,
                        height: "46px",
                        boxShadow:
                          hoveredDay === day.getDate() &&
                          hoveredEmployee === employee.id
                            ? "0 0 12px 1px lightblue"
                            : "none",
                      }}
                      onMouseEnter={() =>
                        handleCellHover(day.getDate(), employee.id, role)
                      }
                      onMouseLeave={handleCellLeave}
                      onClick={(e) => handleCellClick(employee, day, e)}
                    >
                      {/* Event rendering would go here */}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          ))}
          {renderDayFooter(role)}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="flex-grow">
      {groupedEmployees.length > 0 && groupedEmployees[0].length > 0 ? (
        <>
          {renderGroupSeparator(groupedEmployees[0][0])}
          {renderDayHeaders(groupedEmployees[0][0])}
        </>
      ) : (
        <>
          {renderGroupSeparator("")}
          {renderDayHeaders("")}
        </>
      )}
      {renderEmployeeRows()}
      {selectedEmployee && selectedDate && (
        <div ref={tooltipRef}>
          <EmployeeEventTooltip
            employee={selectedEmployee}
            date={selectedDate}
            onAction={handleAction}
            position={tooltipPosition}
          />
        </div>
      )}
    </div>
  );
};

export default CalendarGrid;
