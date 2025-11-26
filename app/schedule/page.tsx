"use client";

import React, { useState, useEffect, useCallback } from "react";
import CustomScheduler from "../components/CustomScheduler";
import LoadingSpinner from "../components/LoadingSpinner";
import Navigation from "../components/Navigation";
import { useRouter } from "next/navigation";
import { useEmployee } from "../context/EmployeeContext";
import { Employee, EmployeeAvailability, TimefoldShift } from "../types/scheduler";
import { formatInTimeZone } from "date-fns-tz";
import { useTranslation } from "react-i18next";

export default function Schedule() {
  const {
    employees,
    setEmployees,
    cellScheduleColors,
    setCellScheduleColors,
    scheduleData,
    setScheduleData,
    activeMonth,
    setActiveMonth,
    availabilityData,
  } = useEmployee();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullDay, setIsFullDay] = useState<Map<string | number, boolean>>(new Map());
  const [employeeHours, setEmployeeHours] = useState<Record<number, Map<number, number>>>({});
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const router = useRouter();
  const [originalScheduleData, setOriginalScheduleData] = useState<EmployeeAvailability[]>([]);
  const [originalCellColors, setOriginalCellColors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const { t } = useTranslation();

 
  const getEmployeeIdByName = useCallback((name: string, currentEmployees: Employee[]) => {
    const employee = currentEmployees.find((emp) => emp.name === name);
    if (!employee) {
      console.warn(`Employee not found by name: ${name}`);
      return null;
    }
    return employee.id;
  }, []); 

  const parseAndSetScheduleData = useCallback((savedData: TimefoldShift[], currentEmployees: Employee[]) => {

    console.log("Parsing data received from DB:", savedData);
    if (!savedData || typeof savedData !== 'object'  || Object.keys(savedData).length === 0) {
      console.warn("Invalid or empty schedule data received.");
      setScheduleData([]);
      return;
    }
    const allShifts: TimefoldShift[] = savedData;

    console.log(`Total shifts found after parsing: ${allShifts.length}`);

    if (allShifts.length === 0) {
      setScheduleData([]);
      return;
    }
  
    const fullDayMap = new Map<string | number, boolean>();
    const parsedData = allShifts
      .map((shift: TimefoldShift) => {

        const employee = currentEmployees.find(e => e.id === shift.employeeId);
        const shiftId = shift.id; 
        

        fullDayMap.set(shiftId, shift.isFullDay);

        return {
          id: shiftId,
          employeeId: shift.employeeId,
          start: new Date(shift.start),
          end: new Date(shift.end),
          startDate: new Date(shift.start),
          finishDate: new Date(shift.end),
          status: "scheduled",
          employee,
          role: (shift as any).role, // Store the role for filtering
          isFullDay: shift.isFullDay, 
        } as EmployeeAvailability & { role?: string };
      })
      .filter((shift): shift is EmployeeAvailability => shift !== null); 
     
    console.log(`Successfully parsed ${parsedData.length} shifts.`);
    setIsFullDay(fullDayMap);
    setScheduleData(parsedData);
    setOriginalScheduleData(parsedData);

    const newCellColors: Record<string, string> = {};
    setCellScheduleColors(newCellColors);
    setOriginalCellColors(newCellColors);
    setIsDirty(false);
    parsedData.forEach((availability: EmployeeAvailability) => {
      const shiftStart = new Date(availability.startDate);
      const shiftEnd = new Date(availability.finishDate);

      const overlappingAvailability = availabilityData.find((avail) => {
        const availStart = new Date(avail.startDate);
        const availEnd = new Date(avail.finishDate);
        return (
          availability.employeeId === avail.employeeId &&
          ((shiftStart >= availStart && shiftStart < availEnd) ||
            (shiftEnd > availStart && shiftEnd <= availEnd) ||
            (shiftStart <= availStart && shiftEnd >= availEnd))
        );
      });

      let cellColor = "bg-purple-100";
      if (overlappingAvailability) {
        if (
          shiftStart.getTime() === new Date(overlappingAvailability.startDate).getTime() &&
          shiftEnd.getTime() === new Date(overlappingAvailability.finishDate).getTime()
        ) {
          cellColor = "bg-green-300";
        } else if (overlappingAvailability.status === "preferable") {
          cellColor = "bg-yellow-300";
        } else {
          cellColor = "bg-red-300";
        }
      }

      const cellKey = `${availability.employeeId}-${formatInTimeZone(
        shiftStart,
        "UTC",
        "yyyy-MM-dd"
      )}`;
      newCellColors[cellKey] = cellColor;
    });

    setCellScheduleColors(newCellColors);

    const totals: Map<number, Map<number, number>> = new Map();
    parsedData.forEach((availability: EmployeeAvailability) => {
      const start = new Date(availability.startDate);
      const finish = new Date(availability.finishDate);
      const hours = (finish.getTime() - start.getTime()) / 3600000;
      const currentMonth = start.getMonth() + 1;

      if (!totals.has(currentMonth)) {
        totals.set(currentMonth, new Map());
      }

      const monthTotals = totals.get(currentMonth)!;
      monthTotals.set(
        availability.employeeId,
        (monthTotals.get(availability.employeeId) || 0) + hours
      );
    });

    const employeeHoursObj: Record<number, Map<number, number>> = {};
    totals.forEach((value, key) => {
      employeeHoursObj[key] = value;
    });
    setEmployeeHours(employeeHoursObj);
    
  }, [getEmployeeIdByName, setScheduleData, availabilityData, setCellScheduleColors]);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/");
      return;
    }
    setIsLoggedIn(true);
    const initializePage = async () => {
      setIsLoading(true);
      try {
        const parsedUser = JSON.parse(user);
        let currentEmployees = employees;

        
        if (currentEmployees.length === 0) {
          
          const response = await fetch(`/api/employees?userId=${parsedUser.id}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch employees: ${response.statusText}`);
          }
          const employeesData = await response.json();
          
          currentEmployees = employeesData.employees; 
          setEmployees(currentEmployees);
        }

        if (currentEmployees.length === 0) {
          router.replace("/planning");
          throw new Error("No employees found. Cannot display schedule.");
        }

        
        const currentMonth = activeMonth.getMonth() + 1;
        const scheduleResponse = await fetch(`/api/schedules?userId=${parsedUser.id}&month=${currentMonth}`);
        if (scheduleResponse.status === 404) {
          console.log("No schedule found for this month.");
          setScheduleData([]);
        } else if (scheduleResponse.ok) {
          const data = await scheduleResponse.json();
          parseAndSetScheduleData(data, currentEmployees);
        } else {
          throw new Error('Failed to fetch schedule data');
        }
      } catch (error) {
        console.error("Error during page initialization:", error);
        setScheduleData([]);
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();
  }, [activeMonth, needsRefresh, router, setEmployees, employees, parseAndSetScheduleData]); 
  

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      const changedSchedule = scheduleData.filter(
        (item, i) => JSON.stringify(item) !== JSON.stringify(originalScheduleData[i])
      );
      const response = await fetch('/api/update-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule: changedSchedule,
          userId: JSON.parse(localStorage.getItem("user") || "{}").id,
          month: activeMonth.getMonth() + 1,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes to the server.');
      }
      
      console.log("Saving scheduleData:", changedSchedule);

    } catch (error) {
      console.error(error);
      alert(t('shift_tooltip.error_saving_changes'));
    } finally {
      setIsLoading(false);
    }
    setOriginalScheduleData(scheduleData);
    setOriginalCellColors(cellScheduleColors);
    setIsDirty(false);
  };
  const handleCancelChanges = () => {
    setScheduleData(originalScheduleData);
    setCellScheduleColors(originalCellColors);
    setIsDirty(false);
  };
  const handleScheduleChange = () => {
    if (!isDirty) {
      setIsDirty(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setEmployees([]);
    router.replace("/");
  };

  

  const handleRefresh = (value: boolean) => {
    
    if (value) {
      setNeedsRefresh(prev => !prev); 
    }
  };
  
  return (
    <>
      <Navigation isLoggedIn={isLoggedIn} onLogout={handleLogout} activePage="schedule" />
      {isLoading && <LoadingSpinner />}
        <div className="overflow-y-auto rounded-2xl border-2 border-gray-300 mt-16 bg-gray-100 overflow-x-auto">
          <CustomScheduler
            isDirty={isDirty}
            employees={employees}
            cellColors={cellScheduleColors}
            setCellColors={setCellScheduleColors}
            availabilityData={[]}
            setAvailabilityData={() => {}}
            scheduleData={scheduleData}
            setScheduleData={setScheduleData}
            showSettings={false}
            showTooltips={false}
            roles={[]}
            employeeHours={employeeHours}
            needsRefresh={handleRefresh}
            isScheduleFullDay={isFullDay}
            isPlanningFullDay={new Map()}
            onSaveChanges={handleSaveChanges}
            onCancelChanges={handleCancelChanges}
            onScheduleChange={handleScheduleChange}
          />
        </div>      
    </>
  );
}