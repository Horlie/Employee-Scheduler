"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Employee, EmployeeAvailability } from "../types/scheduler";
import SchedulerHeader from "./SchedulerHeader";
import EmployeeColumn from "./EmployeeColumn";
import CalendarGrid from "./CalendarGrid";
import SettingsModal from "./SettingsModal";
import LoadingSpinner from "./LoadingSpinner";
import { useEmployee } from "../context/EmployeeContext";

// Add this function near the top of the file, after imports
function isLatvianHoliday(date: Date): boolean {
  const month = date.getMonth();
  const day = date.getDate();

  // List of Latvian national holidays (month is 0-indexed)
  const holidays = [
    { month: 0, day: 1 }, // New Year's Day
    { month: 4, day: 1 }, // Labour Day
    { month: 4, day: 4 }, // Restoration of Independence Day
    { month: 5, day: 23 }, // Midsummer Eve
    { month: 5, day: 24 }, // Midsummer Day
    { month: 10, day: 18 }, // Proclamation of the Republic of Latvia
    { month: 11, day: 24 }, // Christmas Eve
    { month: 11, day: 25 }, // Christmas Day
    { month: 11, day: 26 }, // Second Day of Christmas
    { month: 11, day: 31 }, // New Year's Eve
  ];

  return holidays.some((holiday) => holiday.month === month && holiday.day === day);
}

interface CustomSchedulerProps {
  employees: Employee[];
  cellColors: Record<string, string>;
  setCellColors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  availabilityData: EmployeeAvailability[];
  setAvailabilityData: React.Dispatch<React.SetStateAction<EmployeeAvailability[]>>;
  scheduleData: EmployeeAvailability[];
  setScheduleData: React.Dispatch<React.SetStateAction<EmployeeAvailability[]>>;
  showSettings: boolean;
  showTooltips: boolean;
  roles: string[];
  employeeHours: Record<number, Map<number, number>>;
  needsRefresh: (value: boolean) => void;
  isScheduleFullDay: Map<number, boolean>;
  isPlanningFullDay: Map<number, boolean>;
}

const CustomScheduler: React.FC<CustomSchedulerProps> = ({
  employees,
  cellColors,
  setCellColors,
  availabilityData,
  setAvailabilityData,
  scheduleData,
  setScheduleData,
  showSettings = true, // Default to true
  showTooltips = true, // Default to true
  roles,
  employeeHours,
  needsRefresh,
  isScheduleFullDay,
  isPlanningFullDay,
}) => {
  const [cellWidth, setCellWidth] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [hoveredEmployee, setHoveredEmployee] = useState<string | null>(null);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Add activeMonth from EmployeeContext
  const { activeMonth, setActiveMonth } = useEmployee();
  const [currentDate, setCurrentDate] = useState(activeMonth);

  // Update useEffect to listen to activeMonth changes
  useEffect(() => {
    setCurrentDate(activeMonth);
  }, [activeMonth]);

  const days = generateMonthDays(currentDate);
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add this function to group and sort employees
  const groupEmployeesByRole = (employees: Employee[]) => {
    const grouped = employees.reduce((acc, employee) => {
      if (!acc[employee.role]) {
        acc[employee.role] = [];
      }
      acc[employee.role].push(employee);
      return acc;
    }, {} as Record<string, Employee[]>);

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  };

  const groupedEmployees = groupEmployeesByRole(filteredEmployees);
  useEffect(() => {
    const updateCellWidth = () => {
      if (gridRef.current) {
        const containerWidth = gridRef.current.offsetWidth;
        const employeeColumnWidth = 200;
        const weekDividersWidth = Math.ceil(days.length / 7) * 24;
        const availableWidth = containerWidth - employeeColumnWidth - weekDividersWidth;
        const newCellWidth = Math.max(Math.floor(availableWidth / days.length), 50); // Set a minimum width
        setCellWidth(newCellWidth);
        console.log("availableWidth:", availableWidth);
        console.log("newCellWidth:", newCellWidth);
      }
    };

    updateCellWidth();

    window.addEventListener("resize", updateCellWidth);
    window.addEventListener("load", updateCellWidth);
    return () => {
      window.removeEventListener("resize", updateCellWidth);
      window.removeEventListener("load", updateCellWidth);
    };
  }, [days.length, gridRef]);

  // Helper functions
  const handlePrevMonth = () => {
    setActiveMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setActiveMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setActiveMonth(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleCellHover = useCallback((day: number, employeeId: string, group: string) => {
    setHoveredDay(day);
    setHoveredEmployee(employeeId);
    setHoveredGroup(group);
  }, []);

  const handleCellLeave = useCallback(() => {
    setHoveredDay(null);
    setHoveredEmployee(null);
    setHoveredGroup(null);
  }, []);

  const handleSettingsClick = () => {
    setIsSettingsModalOpen(true);
  };

  const handleSettingsClose = () => {
    setIsSettingsModalOpen(false);
  };

  // Render functions
  const renderGroupSeparator = (text: string) => (
    <div className="h-[46px] flex items-center bg-gray-100">
      <div className="flex-grow flex items-center justify-center">
        <span className="text-xl tracking-widest font-normal text-gray-400 uppercase">{text}</span>
      </div>
    </div>
  );

  const renderSearchBar = () => (
    <div className="border border-gray-300 h-[55px] flex items-center relative border-b-2">
      <input
        type="text"
        placeholder="Search"
        className="w-full h-full ml-3 px-2 pr-8 border-0 focus:ring-0 focus:outline-none"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <svg
        className="w-4 h-4 text-gray-500 absolute right-4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      </svg>
    </div>
  );

  const handleSolveClick = () => {
    setLoading(true);

    // Retrieve employee ID from localStorage
    const employeeId = JSON.parse(localStorage.getItem("user") || "{}").id;

    if (!employeeId) {
      console.error("Employee ID not found in localStorage.");
      setLoading(false);
      return;
    }

    const currentMonth = currentDate.getMonth() + 1;

    console.log(
      `Sending request to /api/timefold with employeeId: ${employeeId}, month: ${currentMonth}`
    );

    // Make POST request using fetch
    fetch("/api/timefold", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        employeeId: Number(employeeId),
        month: currentMonth,
      }),
    })
      .then(async (response) => {
        console.log(`Received response from /api/timefold. Status: ${response.status}`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error response body: ${errorText}`);
          throw new Error(
            `Network response was not ok: ${response.status} ${response.statusText}. Error: ${errorText}`
          );
        }
        return response.json();
      })
      .then((data) => {
        console.log("Successfully received data from /api/timefold. Saving to database...");
        // Save the received schedule data to the database
        return fetch("/api/saveSchedule", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employeeId: Number(employeeId),
            month: currentMonth,
            data: data,
          }),
        });
      })
      .then(async (saveResponse) => {
        console.log(`Received response from /api/saveSchedule. Status: ${saveResponse.status}`);
        if (!saveResponse.ok) {
          const errorText = await saveResponse.text();
          console.error(`Error response body: ${errorText}`);
          throw new Error(
            `Failed to save schedule to the database: ${saveResponse.status} ${saveResponse.statusText}. Error: ${errorText}`
          );
        }
        return saveResponse.json();
      })
      .then((saveData) => {
        console.log("Schedule successfully saved to database.");
        needsRefresh(true);
        alert("Schedule solved and saved successfully!");
      })
      .catch((error) => {
        console.error("Error solving schedule:", error);
        alert(`An error occurred while solving the schedule: ${error.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  return (
    <div className="flex-grow bg-white mb-5 ">
      <SchedulerHeader
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        onSettingsClick={handleSettingsClick}
        onSolveClick={handleSolveClick}
        showSettings={showSettings}
        loading={loading}
      />
      <div className="flex justify-center bg-gray-100 overflow-x-auto" ref={gridRef}>
        <div className="flex overflow-x-auto">
          <EmployeeColumn
            groupedEmployees={groupedEmployees}
            renderGroupSeparator={renderGroupSeparator}
            renderSearchBar={renderSearchBar}
            hoveredEmployee={hoveredEmployee}
            showTooltips={showTooltips}
            employeeHours={employeeHours} // Pass the prop
          />
          <CalendarGrid
            groupedEmployees={groupedEmployees}
            days={days}
            daysOfWeek={daysOfWeek}
            cellWidth={cellWidth}
            isToday={isToday}
            isLatvianHoliday={isLatvianHoliday}
            hoveredDay={hoveredDay}
            hoveredEmployee={hoveredEmployee}
            hoveredGroup={hoveredGroup}
            handleCellHover={handleCellHover}
            handleCellLeave={handleCellLeave}
            renderGroupSeparator={renderGroupSeparator}
            cellColors={cellColors}
            setCellColors={setCellColors}
            availabilityData={availabilityData}
            setAvailabilityData={setAvailabilityData}
            scheduleData={scheduleData}
            setScheduleData={setScheduleData}
            showTooltips={showTooltips}
            isScheduleFullDay={isScheduleFullDay}
            isPlanningFullDay={isPlanningFullDay}
          />
        </div>
      </div>
      {loading && <LoadingSpinner />}
      <SettingsModal isOpen={isSettingsModalOpen} onClose={handleSettingsClose} roles={roles} />
    </div>
  );
};

// Helper function to generate days for a month (unchanged)
function generateMonthDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const days = [];

  for (let d = 1; d <= lastDay; d++) {
    days.push(new Date(year, month, d));
  }

  return days;
}

export default CustomScheduler;
