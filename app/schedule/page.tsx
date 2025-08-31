"use client";

import React, { useState, useEffect } from "react";
import CustomScheduler from "../components/CustomScheduler";
import LoadingSpinner from "../components/LoadingSpinner";
import Navigation from "../components/Navigation";
import { useRouter } from "next/navigation";
import { useEmployee } from "../context/EmployeeContext";
import { Employee, EmployeeAvailability, TimefoldShift } from "../types/scheduler";
import { formatInTimeZone } from "date-fns-tz";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isFullDay, setIsFullDay] = useState<Map<number, boolean>>(new Map());
  const [employeeHours, setEmployeeHours] = useState<Record<number, Map<number, number>>>({});
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const router = useRouter();

  const fetchScheduleData = async () => {
    try {
      const parsedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = parsedUser.id;
      const response = await fetch(`/api/timefold?userId=${userId}`);
      const data = await response.json();
      parseAndSetScheduleData(data);
    } catch (error) {
      console.error("Error fetching schedule data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (employees.length === 0) {
      router.replace("/planning");
    }

    if (user) {
      setIsLoggedIn(true);
      setIsLoading(true);
      fetchScheduleData();
    } else {
      setIsLoading(false);
    }
  }, [employees, router]);

  useEffect(() => {
    if (needsRefresh) {
      setIsLoading(true);
      fetchScheduleData();
      setNeedsRefresh(false);
    }
  }, [needsRefresh]);

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      const validSchedule = scheduleData.filter(s => typeof s.id === "number" && s.id > 0);
      const normalizedSchedule = scheduleData.map(s => ({
        ...s,
        startDate: typeof s.startDate === "string" ? s.startDate : s.startDate.toISOString(),
        finishDate: typeof s.finishDate === "string" ? s.finishDate : s.finishDate.toISOString(),
        start: typeof s.start === "string" ? s.start : s.start?.toISOString?.(),
        end: typeof s.end === "string" ? s.end : s.end?.toISOString?.(),
      }));
      const response = await fetch('/api/update-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule: normalizedSchedule,
          userId: JSON.parse(localStorage.getItem("user") || "{}").id,
          month: activeMonth.getMonth() + 1,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes to the server.');
      }
      
      console.log("Saving scheduleData:", normalizedSchedule);

    } catch (error) {
      console.error(error);
      alert('Error saving changes.');
    } finally {
      setIsLoading(false);
    }
  };

  const getEmployeeIdByName = (name: string) => {
    const employee = employees.find((emp: Employee) => emp.name === name);
    return employee ? employee.id : null;
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setEmployees([]);
    router.replace("/");
  };

  function parseAndSetScheduleData(
    roleData: Record<string, { data: { shifts: TimefoldShift[] } }>
  ) {
    const allShifts: TimefoldShift[] = [];
    
    Object.values(roleData[0].data).forEach((roleEntry) => {
      if ("shifts" in roleEntry && Array.isArray(roleEntry.shifts)) {
        allShifts.push(...roleEntry.shifts);
      }
    });

    if (allShifts.length === 0) {
      return;
    }

    const fullDayMap: Map<number, boolean> = new Map();
    const parsedData = allShifts.map((shift: TimefoldShift) => {
      const employeeName = shift.employee.name;
      const employee = employees.find(e => e.name === employeeName);
      const employeeId = getEmployeeIdByName(employeeName);
      
      if (shift.isFullDay) {
        fullDayMap.set(parseInt(shift.id, 10), true);
      } else {
        fullDayMap.set(parseInt(shift.id, 10), false);
      }
      
      return {
        id: parseInt(shift.id, 10),
        employeeId,
        start: new Date(shift.start),
        end: new Date(shift.end),
        startDate: new Date(shift.start),
        finishDate: new Date(shift.end),
        status: "scheduled",
        employee: {
            name: employeeName,
            role: employee?.role,
        }
      } as EmployeeAvailability;
    });

    setIsFullDay(fullDayMap);
    setScheduleData(parsedData);

    const newCellColors: Record<string, string> = {};
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
    return parsedData;
  }

  const handleRefresh = (value: boolean) => {
    setNeedsRefresh(value);
  };

  return (
    <>
      <Navigation isLoggedIn={isLoggedIn} onLogout={handleLogout} activePage="schedule" />
      {isLoading && <LoadingSpinner />}
      <div className="flex-grow overflow-y-auto rounded-2xl border-2 border-gray-300 mt-16 bg-gray-100 overflow-x-auto">
        <CustomScheduler
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
        />
      </div>
    </>
  );
}