import React, { useState, useEffect, useRef, type JSX } from "react";
import { Employee, EmployeeAvailability } from "../types/scheduler";
import { getWeek } from "date-fns";
import EmployeeEventTooltip from "./EmployeeEventTooltip";

import { DndContext, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { DraggableShift } from './DraggableShift';
import { ShiftTooltip } from "./ShiftTooltip";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";

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
  cellColors: Record<string, string>;
  setCellColors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  availabilityData: EmployeeAvailability[];
  setAvailabilityData: React.Dispatch<React.SetStateAction<EmployeeAvailability[]>>;
  scheduleData: EmployeeAvailability[];
  setScheduleData: React.Dispatch<React.SetStateAction<EmployeeAvailability[]>>;
  showTooltips: boolean;
  isScheduleFullDay: Map<string | number, boolean>;
  isPlanningFullDay: Map<string | number, boolean>;
  onScheduleChange: () => void;
  enableDragAndDrop?: boolean;
}
const DroppableCell: React.FC<{ employee: Employee; day: Date; children: React.ReactNode; role: string }> = ({ employee, day, children, role }) => {
  const { setNodeRef } = useDroppable({
    id: `cell-${employee.id}-${day.toISOString().split('T')[0]}-${role}`,
    data: { employeeId: employee.id, date: day, role: role }, 
  });
  return <div ref={setNodeRef} className="w-full h-full">{children}</div>;
};

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
  cellColors,
  setCellColors,
  availabilityData,
  setAvailabilityData,
  scheduleData,
  setScheduleData,
  showTooltips,
  isScheduleFullDay,
  isPlanningFullDay,
  onScheduleChange,
  enableDragAndDrop = true 
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [selectedCell, setSelectedCell] = useState<EmployeeAvailability | null>(null);
  const [multiSelectedCells, setMultiSelectedCells] = useState<{ employeeId: string; date: Date; employee: Employee }[]>([]);
  const { t } = useTranslation();
  const pathname = usePathname();
  const isSchedulePage = pathname === "/schedule";
  
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (tooltipRef.current && tooltipRef.current.contains(target)) {
        return;
      }
      
      if (target.closest('.calendar-cell')) {
        return;
      }

      handleCloseTooltip();
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (selectedEmployee || multiSelectedCells.length > 0) {
        handleCloseTooltip();
      }
    };

    window.addEventListener("scroll", handleScroll, { capture: true });
    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, [selectedEmployee, multiSelectedCells]);

  const findShiftForDay = (employeeId: number, date: Date): EmployeeAvailability | null => {
    return scheduleData.find(s =>
      s.employeeId === employeeId &&
      new Date(s.startDate).toDateString() === date.toDateString()
    ) ?? null;
  };

  const handleCellClick = (
    employee: Employee,
    date: Date,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    const cellElement = event.currentTarget;
    const rect = cellElement.getBoundingClientRect();

    if (!isSchedulePage && (event.ctrlKey || event.metaKey)) {
      setSelectedEmployee(null);
      setSelectedDate(null);
      setSelectedCell(null);

      setMultiSelectedCells((prev) => {
        const exists = prev.find(
          (cell) => cell.employeeId === employee.id.toString() && cell.date.toDateString() === date.toDateString()
        );

        if (exists) {
          return prev.filter((cell) => cell !== exists);
        } else {
          setTooltipPosition({
            top: rect.top, 
            left: rect.left + rect.width / 2,
          });
          return [...prev, { employeeId: employee.id.toString(), date, employee }];
        }
      });
    } else {
      setMultiSelectedCells([]);

      setSelectedEmployee(employee);
      setSelectedDate(date);
      setTooltipPosition({
        top: rect.top, 
        left: rect.left + rect.width / 2,
      });
      const existingShift = findShiftForDay(employee.id, date);
      setSelectedCell(existingShift);
    }
  };

  const handleCloseTooltip = () => {
    setSelectedCell(null);
    setSelectedEmployee(null);
    setSelectedDate(null);
    setMultiSelectedCells([]);
  };

  const handleSaveShift = (shiftToSave: EmployeeAvailability) => {
    setScheduleData(prevShifts => {
      const index = prevShifts.findIndex(s => s.id === shiftToSave.id);
      if (index > -1) {
        const newShifts = [...prevShifts];
        newShifts[index] = shiftToSave;
        return newShifts;
      }
      return [...prevShifts, shiftToSave];
    });
    handleCloseTooltip();
  
    console.log(shiftToSave);
    handleCloseTooltip();
    const cellKey = `${shiftToSave.employeeId}-${
      typeof shiftToSave.startDate === "string"
      ? shiftToSave.startDate.split("T")[0]
      : shiftToSave.startDate.toISOString().split("T")[0]
    }`;
    setCellColors(prev => ({
      ...prev,
      [cellKey]: "bg-purple-100",
    }))
    if (shiftToSave) isScheduleFullDay.set(shiftToSave.id, shiftToSave.isFullDay!);
    onScheduleChange();
  };

  const handleDeleteShift = (shiftId: number | string) => {
    setScheduleData(prevScheduleData => prevScheduleData.filter(s => s.id !== shiftId));
    handleCloseTooltip();
  };
  const handleMultiAction = async (
    action: "unavailable" | "unreachable" | "preferable" | "delete" | "vacation",
    startTimeStr: string,
    endTimeStr: string,
    isFullDay: boolean
  ) => {
    const promises = multiSelectedCells.map(async (cell) => {
      const { employeeId, date } = cell;
      const cellKey = `${employeeId}-${date.toISOString().split("T")[0]}`;

      if (action === "delete") {
        const availability = availabilityData.find(
          (a) => a.employeeId === Number(employeeId) && new Date(a.startDate).toDateString() === date.toDateString()
        );
        if (availability) {
           try {
             await fetch(`/api/employee-availability?employeeId=${employeeId}&startDate=${availability.startDate}`, { method: "DELETE" });
             setCellColors((prev) => { const n = { ...prev }; delete n[cellKey]; return n; });
             setAvailabilityData((prev) => prev.filter(a => a.id !== availability.id));
           } catch (e) { console.error(e); }
        }
      } else {
        const startDate = new Date(date);
        const finishDate = new Date(date);

        if (isFullDay) {
            startDate.setHours(0, 0, 0, 0);
            finishDate.setHours(23, 59, 59, 999);
        } else {
            const [sh, sm] = startTimeStr.split(":").map(Number);
            const [eh, em] = endTimeStr.split(":").map(Number);
            startDate.setHours(sh, sm, 0, 0);
            finishDate.setHours(eh, em, 0, 0);
        }

        let newColor = "";
        if (action === "unavailable") newColor = "bg-yellow-200";
        if (action === "unreachable") newColor = "bg-red-200";
        if (action === "preferable") newColor = "bg-green-200";
        if (action === "vacation") newColor = "bg-blue-200";

        try {
            const res = await fetch("/api/employee-availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ employeeId: Number(employeeId), startDate, finishDate, status: action }),
            });

            if(res.ok) {
                setCellColors((prev) => ({ ...prev, [cellKey]: newColor }));
                setAvailabilityData(prev => prev.filter(a => !(a.employeeId === Number(employeeId) && new Date(a.startDate).toDateString() === date.toDateString())));
                
                const newAvail: EmployeeAvailability = {
                    id: Date.now() + Math.random(),
                    employeeId: Number(employeeId),
                    startDate: startDate.toISOString(),
                    finishDate: finishDate.toISOString(),
                    status: action,
                    isFullDay: isFullDay,
                };
                setAvailabilityData((prev) => [...prev, newAvail]);
            }
        } catch (e) { console.error(e); }
      }
    });

    await Promise.all(promises);
    setMultiSelectedCells([]);
    handleCloseTooltip();
  };
  const handleAction = async (
    action: "unavailable" | "unreachable" | "preferable" | "delete" | "vacation",
    startDate: Date,
    finishDate: Date
  ) => {
    if (selectedEmployee && selectedDate) {
      const cellKey = `${selectedEmployee.id}-${
        startDate.toISOString().split("T")[0]
      }`;
      if (action === "delete") {
        try {
          const availability = availabilityData.find(
            (a: EmployeeAvailability) =>
              a.employeeId === Number(selectedEmployee.id) &&
              new Date(a.startDate).toDateString() === selectedDate.toDateString()
          );
          if (availability) {
            const startDate = availability ? new Date(availability.startDate) : selectedDate;
            const response = await fetch(
              `/api/employee-availability?employeeId=${
                selectedEmployee.id
              }&startDate=${startDate.toISOString()}`,
              {
                method: "DELETE",
              }
            );

            if (response.ok) {
              setCellColors((prev) => {
                const newColors = { ...prev };
                delete newColors[cellKey];
                return newColors;
              });
              setAvailabilityData((prev) => {
                const updatedAvailability = prev.filter(
                  (a: EmployeeAvailability) =>
                    !(
                      a.employeeId === Number(selectedEmployee.id) &&
                      new Date(a.startDate).toDateString() === selectedDate.toDateString()
                    )
                );
                return updatedAvailability;
              });
            }
          } else {
            console.error("Failed to delete availability");
          }
        } catch (error) {
          console.error("Error deleting availability:", error);
        }
      } else {
        const existingAvailability = availabilityData.find(
          (a) =>
            a.employeeId === Number(selectedEmployee.id) &&
            new Date(a.startDate).toDateString() === selectedDate.toDateString()
        );
        if (existingAvailability) {
          try {
            const deleteResponse = await fetch(
              `/api/employee-availability?employeeId=${
                selectedEmployee.id
              }&startDate=${      
                typeof existingAvailability.startDate === "string"
                ? existingAvailability.startDate.split("T")[0]
                : existingAvailability.startDate.toISOString().split("T")[0]}`,
              {
                method: "DELETE",
              }
            );
            if (deleteResponse.ok) {
              setAvailabilityData((prev) => {
                const updatedAvailability = prev.filter(
                  (a: EmployeeAvailability) =>
                    !(
                      a.employeeId === Number(selectedEmployee.id) &&
                      new Date(a.startDate).toDateString() === selectedDate.toDateString()
                    )
                );
                return updatedAvailability;
              });
            }
            if (!deleteResponse.ok) {
              console.error("Failed to delete existing availability");
              return;
            }
          } catch (error) {
            console.error("Error deleting existing availability:", error);
            return;
          }
        }
        let newColor = "";
        let status = "";
        switch (action) {
          case "unavailable":
            newColor = "bg-yellow-200";
            status = "unavailable";
            break;
          case "unreachable":
            newColor = "bg-red-200";
            status = "unreachable";
            break;
          case "preferable":
            newColor = "bg-green-200";
            status = "preferable";
            break;
          case "vacation":
            newColor = "bg-blue-200"; 
            status = "vacation";
            break;
        }

        try {
          // Convert local dates to UTC

          const response = await fetch("/api/employee-availability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              employeeId: Number(selectedEmployee.id),
              startDate: startDate,
              finishDate: finishDate,
              status,
            }),
          });
          if (response.ok) {
            setCellColors((prev) => ({
              ...prev,
              [cellKey]: newColor,
            }));

            const newAvailability: EmployeeAvailability = {
              id: Date.now(), // Generate a temporary ID
              employeeId: Number(selectedEmployee.id),
              // start: JSON.stringify(startDate),
              // end: JSON.stringify(finishDate),
              startDate: startDate.toISOString(),
              finishDate: finishDate.toISOString(),
              status,
              isFullDay: false,
            };
            setAvailabilityData((prev) => [...prev, newAvailability]);
          } else {
            console.error("Failed to update availability");
          }
        } catch (error) {
          console.error("Error updating availability:", error);
        }
      }
    }
    handleCloseTooltip();
  };

  const handleDragEnd = (event: DragEndEvent) => { 
    const { active, over } = event;
    if (!over || !active.data.current || !over.data.current) return;

    const employees = groupedEmployees.flatMap(([role, employeeList]) => employeeList);

    const draggedShift: EmployeeAvailability = active.data.current.shift;
    const targetEmployeeId = over.data.current.employeeId;
    const targetDate: Date = over.data.current.date;
    const targetRole = over.data.current.role;

    const draggedShiftEmployee = employees.find(e => e.id === draggedShift.employeeId);
    if (!draggedShiftEmployee?.roles.includes(targetRole)) {
      alert(t('calendar.error_move_role'));
      return;
    }
    
    const shiftsInTargetCell = scheduleData.filter(
      (s: EmployeeAvailability) =>
        s.id !== draggedShift.id &&
        s.employeeId === targetEmployeeId &&
        s.start && new Date(s.start).toDateString() === targetDate.toDateString()
    );

    if (shiftsInTargetCell.length > 0) {
      alert(t('calendar.error_slot_occupied'));
      return;
    }

    if (!draggedShift.startDate) {
        console.error("Dragged shift is missing 'start' property", draggedShift);
        return;
    }

    const oldStartDate = new Date(draggedShift.startDate);
    if (isNaN(oldStartDate.getTime())) {
        console.error("Invalid start date for dragged shift", draggedShift);
        return;
    }

    if (oldStartDate.toDateString() === targetDate.toDateString() && draggedShift.employeeId === targetEmployeeId) {
      return;
    }

    const duration = new Date(draggedShift.finishDate!).getTime() - oldStartDate.getTime();
    const newStartDate = new Date(targetDate);
    newStartDate.setHours(oldStartDate.getHours(), oldStartDate.getMinutes(), oldStartDate.getSeconds());
    const newFinishDate = new Date(newStartDate.getTime() + duration);

    if (isNaN(newStartDate.getTime()) || isNaN(newFinishDate.getTime())) {
        console.error("Calculated new dates are invalid");
        return;
    }

    
    setScheduleData(prev =>
      prev.map((s: EmployeeAvailability) =>
        s.id === draggedShift.id
          ? {
              ...s,
              employeeId: targetEmployeeId,
              start: newStartDate.toISOString(),
              end: newFinishDate.toISOString(),
              startDate: newStartDate.toISOString(),      
              finishDate: newFinishDate.toISOString(),    
            }
          : s
      )
    );
    setCellColors(prev => {
    
    const oldCellKey = `${draggedShift.employeeId}-${      
      typeof draggedShift.startDate === "string"
      ? draggedShift.startDate.split("T")[0]
      : draggedShift.startDate.toISOString().split("T")[0]}`;
    const newCellKey = `${targetEmployeeId}-${newStartDate.toISOString().split("T")[0]}`;
    
    let newColor = prev[oldCellKey] || "bg-purple-100";
    if (draggedShift.status === "preferable") newColor = "bg-green-200";
    if (draggedShift.status === "unavailable") newColor = "bg-yellow-200";
    if (draggedShift.status === "unreachable") newColor = "bg-red-200";
    if (draggedShift.status === "vacation") newColor = "bg-blue-200";
    if (oldStartDate.toDateString() !== targetDate.toDateString()) {   
    }
    
    const updated = { ...prev };
    delete updated[oldCellKey]; 
    updated[newCellKey] = newColor; 
    return updated;
  });
  onScheduleChange();
    

  };
  
  

  const renderDayHeaders = (currentGroup: string) => (
    <div className="flex bg-gray-100 sticky top-0 z-2">
      {days.map((day, index) => (
        <React.Fragment key={index}>
          {day.getDay() === 1 && (
            <div className="border-gray-300 w-6 relative bg-gray-100 flex-shrink-0">
              <div className="absolute top-0 left-0 w-6 h-20 flex items-center justify-center bg-gray-100 border-r border-gray-300">
                <span className="transform -rotate-90 origin-center whitespace-nowrap text-xs text-gray-500 font-medium">
                  {t('calendar.week')} {getWeek(day)}
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
    <div className="flex bg-gray-100 sticky bottom-0 z-2">
      {days.map((day, index) => (
        <React.Fragment key={index}>
          {day.getDay() === 1 && (
            <div className="border-gray-300 w-6 relative bg-gray-100 flex-shrink-0">
              <div className="absolute bottom-0 left-0 w-6 h-20 flex items-center justify-center bg-gray-100 border-r border-gray-300">
                <span className="transform -rotate-90 origin-center whitespace-nowrap text-xs text-gray-500 font-medium">
                  {t('calendar.week')} {getWeek(day)}
                </span>
              </div>
            </div>
          )}
          <div
            className={`flex-shrink-0 text-center py-1 text-xs border-r border-t border-b border-gray-300 relative
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
              <div className="absolute bottom-0 right-0 w-0 h-0 border-b-[10px] border-l-[10px] border-b-red-500 border-l-transparent"></div>
            )}
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  const renderAvailabilityTile = (employee: Employee, day: Date, role: string) => {
    const cellKey = `${employee.id}-${day.toISOString().split("T")[0]}`;
    const isMultiSelected = multiSelectedCells.some(
        (cell) => cell.employeeId === employee.id.toString() && cell.date.toDateString() === day.toDateString()
    );
    const isSingleSelected = selectedEmployee?.id === employee.id && 
                             selectedDate?.toDateString() === day.toDateString();
    
    const isSelected = isMultiSelected || isSingleSelected;
    const cellColor =
      cellColors[cellKey] ||
      `${
        isToday(day)
          ? "bg-indigo-100"
          : `${[0, 6].includes(day.getDay()) ? "bg-blue-50" : "bg-white"}`
      }`;
    const finalColor = isSelected ? "bg-gray-200 ring-2 ring-inset ring-blue-600" : cellColor;
    const availability = availabilityData.find(
      (a: EmployeeAvailability) =>
        a.employeeId === Number(employee.id) &&
        new Date(a.startDate).toDateString() === day.toDateString()
    );
    // Filter schedule shifts by role - only show shifts that match the current role group
    // For backward compatibility, show shifts without a role in all groups
    const schedule = scheduleData.find(
      (a: EmployeeAvailability & { role?: string }) =>
        a.employeeId === Number(employee.id) &&
        new Date(a.startDate).toDateString() === day.toDateString() &&
        (a.role === undefined || a.role === null || a.role === role) // Only show shift if it matches the current role group (or has no role for backward compatibility)
    );
    const formatTime = (date: Date | string) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.getHours().toString().padStart(2, '0') + ':' + dateObj.getMinutes().toString().padStart(2, '0');
    }

    const isHovered = hoveredDay === day.getDate() && hoveredEmployee === employee.id.toString();

    const renderShiftContent = (shift: EmployeeAvailability, isFullDayMap: Map<string | number, boolean>, onContentClick: (e: React.MouseEvent<HTMLDivElement>) => void) => {
      let isFull = shift.isFullDay === true || isFullDayMap?.get(Number(shift.id)) === true;

      if (!isFull && shift.startDate && shift.finishDate) {
        const start = new Date(shift.startDate);
        const end = new Date(shift.finishDate);
        
        const durationMs = end.getTime() - start.getTime();
        const hours = durationMs / (1000 * 60 * 60);

        if (hours >= 23.9) {
          isFull = true;
        }
      }
      return (
        <div
          onPointerUp={(e) => {
             if (e.button === 0) {
                onContentClick(e);
             }
          }}
          className="w-full h-full flex items-center justify-center text-xs px-1 cursor-pointer relative z-10">
            {isFull ? (
              <span className="text-gray-600 font-medium">{t('calendar.all_day')}</span>
            ) : (
              <span className="text-gray-700 text-center">
                {`${formatTime(new Date(shift.startDate))} - ${formatTime(new Date(shift.finishDate))}`}
              </span>
            )}
        </div>
      );
    };
    return (
      <DroppableCell employee={employee} day={day} role={role}>
        <div
          className={`calendar-cell flex-shrink-0 border-r border-b border-gray-300 ${finalColor} ${
            isHovered ? "relative z-[3]" : ""
          }`}
          style={{
            width: `${cellWidth}px`,
            height: "50px",
            boxShadow: isHovered ? "0 0 12px 1px lightblue" : "none",
            cursor: "pointer", 
            userSelect: "none"
          }}
          onMouseEnter={() => handleCellHover(day.getDate(), employee.id.toString(), role)}
          onMouseLeave={handleCellLeave}
          onClick={(e) => handleCellClick(employee, day, e)}
        >
          {availability && (
            enableDragAndDrop ? (
              <DraggableShift shift={availability}>
                  {renderShiftContent(availability, isPlanningFullDay, (e) => {
                    e.stopPropagation(); 
                    handleCellClick(employee, day, e);
                  })}
              </DraggableShift>
            ) : (
              renderShiftContent(availability, isPlanningFullDay, (e) => {
                e.stopPropagation(); 
                handleCellClick(employee, day, e);
              })
            )
          )}
          {schedule && (
            enableDragAndDrop ? (
                <DraggableShift shift={schedule}>

                  {renderShiftContent(schedule, isScheduleFullDay, (e) => {
                    e.stopPropagation(); 
                    handleCellClick(employee, day, e);
                  })}
              </DraggableShift>
            ) : (
              renderShiftContent(schedule, isScheduleFullDay, (e) => {
                e.stopPropagation(); 
                handleCellClick(employee, day, e);
              })
            )
          )}
        </div>
      </DroppableCell>
    );
  };
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
              {days.map((day, dayIndex) => (
                <React.Fragment key={`${employee.id}-${dayIndex}`}>
                  {day.getDay() === 1 && (
                    <div className="flex-shrink-0 w-6 border-r border-gray-300"></div>
                  )}
                  {renderAvailabilityTile(employee, day, role)}
                </React.Fragment>
              ))}
            </div>
          ))}
          {renderDayFooter(role)}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <DndContext onDragEnd={handleDragEnd}>
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

        {( (selectedEmployee && selectedDate) || multiSelectedCells.length > 0 ) && showTooltips && !isSchedulePage && (
          <div ref={tooltipRef}>
            <EmployeeEventTooltip
              position={tooltipPosition}
              onClose={handleCloseTooltip}
              
              selectedCount={multiSelectedCells.length}
              onMultiAction={multiSelectedCells.length > 0 ? handleMultiAction : undefined}

              employee={multiSelectedCells.length === 0 ? (selectedEmployee ?? undefined) : undefined}
              date={multiSelectedCells.length === 0 ? (selectedDate ?? undefined) : undefined}
              onAction={multiSelectedCells.length === 0 ? handleAction : undefined}
            />
          </div>
        )}

        {selectedEmployee && selectedDate && isSchedulePage && multiSelectedCells.length === 0 && (
          <div ref={tooltipRef}>
            <ShiftTooltip             
              shift={selectedCell ?? null}
              date={selectedDate}
              employeeId={selectedEmployee.id}
              onSave={handleSaveShift}
              onDelete={handleDeleteShift}
              onClose={handleCloseTooltip}
              position={tooltipPosition}   
            />
          </div>
        )}
      </div>
    </DndContext>

  );
};

export default CalendarGrid;
