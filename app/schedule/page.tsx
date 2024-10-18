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
  } = useEmployee();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isFullDay: Map<number, boolean> = new Map();
  const [employeeHours, setEmployeeHours] = useState<Record<number, Map<number, number>>>({});
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const router = useRouter();

  // Move fetchScheduleData outside the initial useEffect
  const fetchScheduleData = async () => {
    try {
      const parsedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = parsedUser.id;
      // Fetch data with userId and month as search parameters
      const response = await fetch(`/api/timefold?userId=${userId}`);
      const data = await response.json();
      // Parse the fetched data
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
      setIsLoading(true); // Ensure loading state is set
      fetchScheduleData(); // Call the moved fetchScheduleData
    } else {
      setIsLoading(false); // Stop loading if not logged in
    }
  }, [employees, router]); // Added dependencies if necessary

  // Add this useEffect to listen for needsRefresh changes
  useEffect(() => {
    if (needsRefresh) {
      setIsLoading(true); // Optional: Show loading spinner during refresh
      fetchScheduleData();
      setNeedsRefresh(false);
    }
  }, [needsRefresh]);

  // Function to get employee ID by name from localStorage
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
  function parseAndSetScheduleData(dataArray: { data: { shifts: TimefoldShift[] } }[]) {
    const allShifts: TimefoldShift[] = [];

    dataArray.forEach((data) => {
      if (data.data.shifts) {
        allShifts.push(...data.data.shifts);
      }
    });

    if (allShifts.length === 0) {
      return;
    }

    const parsedData = allShifts.map((shift: TimefoldShift) => {
      const employeeName = shift.employee.name;
      const employeeId = getEmployeeIdByName(employeeName);
      isFullDay.set(parseInt(shift.id), shift.isFullDay);
      return {
        id: parseInt(shift.id),
        employeeId,
        startDate: new Date(shift.start),
        finishDate: new Date(shift.end),
        status: "scheduled",
      } as EmployeeAvailability;
    });

    setScheduleData(parsedData);

    const newCellColors: Record<string, string> = {};
    parsedData.forEach((availability: EmployeeAvailability) => {
      const cellKey = `${availability.employeeId}-${formatInTimeZone(
        new Date(availability.startDate),
        "UTC",
        "yyyy-MM-dd"
      )}`;
      switch (availability.status) {
        case "scheduled":
          isFullDay.get(availability.id)
            ? (newCellColors[cellKey] = "bg-rose-100")
            : (newCellColors[cellKey] = "bg-purple-100");
          break;
      }
    });

    setCellScheduleColors(newCellColors);

    // Calculate total hours for each employee
    const totals: Map<number, Map<number, number>> = new Map();
    let prevMonth: number | null = null;

    parsedData.forEach((availability: EmployeeAvailability) => {
      const start = new Date(availability.startDate);
      const finish = new Date(availability.finishDate);
      const hours = (finish.getTime() - start.getTime()) / 3600000; // Convert ms to hours
      const currentMonth = start.getMonth() + 1;
      if (prevMonth !== currentMonth) {
        if (!totals.has(currentMonth)) {
          totals.set(currentMonth, new Map());
        }
        prevMonth = currentMonth;
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
          availabilityData={scheduleData}
          setAvailabilityData={setScheduleData}
          showSettings={false}
          showTooltips={false}
          roles={[]}
          employeeHours={employeeHours}
          needsRefresh={handleRefresh}
        />
      </div>
    </>
  );
}
