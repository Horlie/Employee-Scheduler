import React, { useState, useEffect, useRef, type JSX, useMemo } from "react";
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
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  
  const flatEmployees = useMemo(() => {
    return groupedEmployees.flatMap(([_, emps]) => emps);
  }, [groupedEmployees]);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ empIdx: number; dayIdx: number } | null>(null);
  const getEmployeeIndex = (id: number) => flatEmployees.findIndex(e => e.id === id);

  const handleMouseDown = (
    employee: Employee, 
    date: Date, 
    dayIndex: number, 
    e: React.MouseEvent
  ) => {
    if (isSchedulePage || e.button !== 0) return;

    e.preventDefault(); 
    setIsDragging(true);

    const empIdx = getEmployeeIndex(employee.id);
    setDragStart({ empIdx, dayIdx: dayIndex });

    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      top: rect.top,
      left: rect.left + rect.width / 2,
    });

    let initialSelection = [...multiSelectedCells];
    if (!e.ctrlKey && !e.metaKey) {
      initialSelection = [];
    }

    
    const cellId = `${employee.id}-${date.toDateString()}`;
    if (!initialSelection.some(c => `${c.employeeId}-${c.date.toDateString()}` === cellId)) {
        initialSelection.push({ employeeId: employee.id.toString(), date, employee });
    }
    
    setMultiSelectedCells(initialSelection);
    setSelectedEmployee(null); 
  };
  const handleMouseEnterCell = (
    employee: Employee, 
    dayIndex: number,
    e: React.MouseEvent
  ) => {
    if (!isDragging || !dragStart) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      top: rect.top,
      left: rect.left + rect.width / 2,
    });

    const currentEmpIdx = getEmployeeIndex(employee.id);
    const currentDayIdx = dayIndex;

    const startEmp = Math.min(dragStart.empIdx, currentEmpIdx);
    const endEmp = Math.max(dragStart.empIdx, currentEmpIdx);
    const startDay = Math.min(dragStart.dayIdx, currentDayIdx);
    const endDay = Math.max(dragStart.dayIdx, currentDayIdx);

    const newSelection: { employeeId: string; date: Date; employee: Employee }[] = [];

 
    for (let r = startEmp; r <= endEmp; r++) {
      for (let c = startDay; c <= endDay; c++) {
        const emp = flatEmployees[r];
        const d = days[c];
        
        newSelection.push({
          employeeId: emp.id.toString(),
          date: d,
          employee: emp
        });
      }
    }

    setMultiSelectedCells(newSelection);
    
    
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragStart(null);
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging]);

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
    return scheduleData.find(s =>{ 
      const sDate = new Date(s.startDate);
      return s.employeeId === employeeId &&
        sDate.getUTCFullYear() === date.getUTCFullYear() &&
        sDate.getUTCMonth() === date.getUTCMonth() &&
        sDate.getUTCDate() === date.getUTCDate();
      }) ?? null;
  };

  const handleCellClick = (
    employee: Employee,
    date: Date,
    role: string,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
  
    if (isDragging) return;

    if (!isSchedulePage) {
      setSelectedEmployee(employee);
      setSelectedDate(date);
      setSelectedRole(role);

      const rect = event.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top,
        left: rect.left + rect.width / 2,
      });
    }
    else{
      setMultiSelectedCells([]);
      setSelectedEmployee(employee);
      setSelectedDate(date);
      setSelectedRole(role);
    }
    
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      top: rect.top,
      left: rect.left + rect.width / 2,
    });

    const existingShift = findShiftForDay(employee.id, date);
    setSelectedCell(existingShift);
  };

  const handleCloseTooltip = () => {
    setSelectedCell(null);
    setSelectedEmployee(null);
    setSelectedDate(null);
    setMultiSelectedCells([]);
  };

  const handleSaveShift = (shiftToSave: EmployeeAvailability) => {
    let index = -1;
    if (shiftToSave.id && Number(shiftToSave.id) > 0) {
      index = scheduleData.findIndex(s => s.id === shiftToSave.id);
    }
    if (index === -1) {
      index = scheduleData.findIndex(s => {
        const d1 = new Date(s.startDate);
        const d2 = new Date(shiftToSave.startDate);
        return s.employeeId === shiftToSave.employeeId &&
               d1.getUTCFullYear() === d2.getUTCFullYear() &&
               d1.getUTCMonth() === d2.getUTCMonth() &&
               d1.getUTCDate() === d2.getUTCDate();
      });
    }

      
    const existingShift = index > -1 ? scheduleData[index] : null;

    const updatedShift = { ...shiftToSave } as EmployeeAvailability;

    if (existingShift) {
      updatedShift.id = existingShift.id;
    } else if (!updatedShift.id || Number(updatedShift.id) <= 0) {
      updatedShift.id = -Math.floor(Math.random() * 1000000000);
    }

    (updatedShift as any).role = (shiftToSave as any).role || (existingShift as any)?.role || selectedRole || null;

    setScheduleData(prevShifts => {
      const newShifts = [...prevShifts];
      if (index > -1) {
        newShifts[index] = updatedShift;
      } else {
        newShifts.push(updatedShift);
      }
      return newShifts;
    });
  
    handleCloseTooltip();
    const cellKey = `${updatedShift.employeeId}-${
      new Date(updatedShift.startDate).toISOString().split("T")[0]
    }`;

    setCellColors(prev => ({
      ...prev,
      [cellKey]: "bg-purple-100",
    }));

    isScheduleFullDay.set(updatedShift.id, updatedShift.isFullDay!);
    onScheduleChange();
  };

  const handleDeleteShift = (shiftId: number | string) => {
    const shiftToDelete = scheduleData.find(s => s.id === shiftId);
    setScheduleData(prevScheduleData => prevScheduleData.filter(s => s.id !== shiftId));
    if (shiftToDelete) {
      const dateStr = typeof shiftToDelete.startDate === "string" 
        ? shiftToDelete.startDate.split("T")[0] 
        : shiftToDelete.startDate.toISOString().split("T")[0];
        
      const cellKey = `${shiftToDelete.employeeId}-${dateStr}`;

      setCellColors(prev => {
        const newColors = { ...prev };
        delete newColors[cellKey]; 
        return newColors;
      });
    }
    handleCloseTooltip();
    onScheduleChange();
  };  
  const handleMultiAction = async (
    action: "unavailable" | "unreachable" | "preferable" | "delete" | "vacation",
    startTimeStr: string,
    endTimeStr: string,
    isFullDay: boolean
  ) => {

    const idsToRemove: (number | string)[] = [];
    const keysToRemove: string[] = [];
    const newAvailabilities: EmployeeAvailability[] = [];
    const colorsToUpdate: Record<string, string> = {};

    const promises = multiSelectedCells.map(async (cell) => {
      const { employeeId, date } = cell;

      const dateKey = date.toISOString().split("T")[0];
      const cellKey = `${employeeId}-${dateKey}`;

      const existing = availabilityData.find(
        (a) => a.employeeId === Number(employeeId) && 
        new Date(a.startDate).getUTCDate() === date.getUTCDate() 
      );

      if (action === "delete") {
        if (existing) {
          try {
            const res = await fetch(`/api/employee-availability?employeeId=${employeeId}&startDate=${existing.startDate}`, { method: "DELETE" });
            if (res.ok) {
              idsToRemove.push(existing.id);
              keysToRemove.push(cellKey);
            }
          } catch (e) { console.error(`Failed to delete cell ${cellKey}`, e); }
        }
      } else {
        if (existing) {
          try {
            await fetch(`/api/employee-availability?employeeId=${employeeId}&startDate=${encodeURIComponent(existing.startDate.toString())}`, { method: "DELETE" });
            idsToRemove.push(existing.id);
          } catch (e) { console.error(`Failed to clear old cell ${cellKey}`, e); }
        }
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();

        let startDate: Date;
        let finishDate: Date;

        if (isFullDay) {
            startDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
            finishDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
        } else {
            const [startHours, startMinutes] = startTimeStr.split(":").map(Number);
            const [endHours, endMinutes] = endTimeStr.split(":").map(Number);
            startDate = new Date(Date.UTC(year, month, day, startHours, startMinutes, 0));
            finishDate = new Date(Date.UTC(year, month, day, endHours, endMinutes, 0));
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
                body: JSON.stringify({ employeeId: Number(employeeId), startDate: startDate.toISOString(), finishDate: finishDate.toISOString(), status: action, isFullDay: isFullDay }),
            });

            if (res.ok) {
            const { availability: savedAvail } = await res.json();
            newAvailabilities.push(savedAvail);
            colorsToUpdate[cellKey] = newColor;
          }
        } catch (e) { console.error(`Failed to save cell ${cellKey}`, e); }
      }
    });

    await Promise.all(promises);

    setAvailabilityData(prev => {
      const filtered = prev.filter(a => !idsToRemove.includes(a.id));
      return [...filtered, ...newAvailabilities];
    });

    setCellColors(prev => {
      const nextColors = { ...prev };
      keysToRemove.forEach(key => delete nextColors[key]);
      return { ...nextColors, ...colorsToUpdate };
    });

    setMultiSelectedCells([]);
    handleCloseTooltip();
  };

  const handleAction = async (
    action: "unavailable" | "unreachable" | "preferable" | "delete" | "vacation",
    startDate: Date,
    finishDate: Date,
    isFullDay: boolean = false
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
            const oldStartDateStr = typeof existingAvailability.startDate === "string"
              ? existingAvailability.startDate
              : existingAvailability.startDate.toISOString();

            const deleteResponse = await fetch(
              `/api/employee-availability?employeeId=${selectedEmployee.id}&startDate=${encodeURIComponent(oldStartDateStr)}`,
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
          
          const response = await fetch("/api/employee-availability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              employeeId: Number(selectedEmployee.id),
              startDate: startDate.toISOString(),
              finishDate: finishDate.toISOString(),
              status,
              isFullDay: isFullDay,
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
              isFullDay: isFullDay,
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
    const isSameDayUTC = (d1: Date | string, d2: Date) => {
        const date1 = new Date(d1);
        return date1.getUTCFullYear() === d2.getUTCFullYear() &&
               date1.getUTCMonth() === d2.getUTCMonth() &&
               date1.getUTCDate() === d2.getUTCDate();
    };
    
    const shiftsInTargetCell = scheduleData.filter(
      (s: EmployeeAvailability) =>
        String(s.id) !== String(draggedShift.id) &&
        s.employeeId === targetEmployeeId &&
        isSameDayUTC(s.startDate, targetDate)
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
    const newStartDate = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        oldStartDate.getUTCHours(),
        oldStartDate.getUTCMinutes(),
        0
    ));
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
      const oldDateKey = new Date(draggedShift.startDate).toISOString().split("T")[0];
      const newDateKey = newStartDate.toISOString().split("T")[0];
      
      const oldCellKey = `${draggedShift.employeeId}-${oldDateKey}`;
      const newCellKey = `${targetEmployeeId}-${newDateKey}`;
      
      const updated = { ...prev };
      const color = updated[oldCellKey] || "bg-purple-100";
      delete updated[oldCellKey]; 
      updated[newCellKey] = color; 
      return updated;
    });
    
    const updatedShiftInState = {
        ...draggedShift,
        employeeId: targetEmployeeId,
        startDate: newStartDate.toISOString(),
        finishDate: newFinishDate.toISOString(),
    };
    setSelectedDate(newStartDate); 
    setSelectedEmployee(employees.find(e => e.id === targetEmployeeId) || null);
    setSelectedCell(updatedShiftInState);

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
      (a: EmployeeAvailability & { role?: string }) => {
        const aDate = new Date(a.startDate);
        return a.employeeId === Number(employee.id) &&
          aDate.getUTCFullYear() === day.getUTCFullYear() &&
          aDate.getUTCMonth() === day.getUTCMonth() &&
          aDate.getUTCDate() === day.getUTCDate() &&
          (a.role === undefined || a.role === null || a.role === role) // Only show shift if it matches the current role group (or has no role for backward compatibility)
      }
    );

    const formatTime = (date: Date | string) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.getUTCHours().toString().padStart(2, '0') + ':' + dateObj.getUTCMinutes().toString().padStart(2, '0');
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
    const dayIndex = days.findIndex(d => d.toDateString() === day.toDateString());

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
          onMouseDown={(e) => handleMouseDown(employee, day, dayIndex, e)}
          onMouseEnter={(e) => {
             handleCellHover(day.getDate(), employee.id.toString(), role);
             handleMouseEnterCell(employee, dayIndex, e); 
          }}
          onMouseLeave={handleCellLeave}
          onClick={(e) => {
             handleCellClick(employee, day, role, e); 
          }}
        >
          {availability && (
            enableDragAndDrop ? (
              <DraggableShift shift={availability}>
                  {renderShiftContent(availability, isPlanningFullDay, (e) => {
                    e.stopPropagation(); 
                    handleCellClick(employee, day, role, e);
                  })}
              </DraggableShift>
            ) : (
              renderShiftContent(availability, isPlanningFullDay, (e) => {
                e.stopPropagation(); 
                handleCellClick(employee, day, role, e);
              })
            )
          )}
          {schedule && (
            enableDragAndDrop ? (
                <DraggableShift shift={schedule}>

                  {renderShiftContent(schedule, isScheduleFullDay, (e) => {
                    e.stopPropagation(); 
                    handleCellClick(employee, day, role, e);
                  })}
              </DraggableShift>
            ) : (
              renderShiftContent(schedule, isScheduleFullDay, (e) => {
                e.stopPropagation(); 
                handleCellClick(employee, day, role, e);
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
              onMultiAction={multiSelectedCells.length > 1 ? handleMultiAction : undefined}

              employee={multiSelectedCells.length === 1 
                  ? multiSelectedCells[0].employee 
                  : (multiSelectedCells.length === 0 ? (selectedEmployee ?? undefined) : undefined)
              }
              date={multiSelectedCells.length === 1 
                  ? multiSelectedCells[0].date 
                  : (multiSelectedCells.length === 0 ? (selectedDate ?? undefined) : undefined)
              }
              onAction={multiSelectedCells.length === 1 ? handleAction : undefined}
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
