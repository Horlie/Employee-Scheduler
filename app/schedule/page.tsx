"use client";

import React, { useState, useEffect } from "react";
import CustomScheduler from "../components/CustomScheduler";
import LoadingSpinner from "../components/LoadingSpinner";
import Navigation from "../components/Navigation";
import { useRouter } from "next/navigation";
import { useEmployee } from "../context/EmployeeContext";
import exampleData from "../schedule/example.json";
import { Employee, EmployeeAvailability } from "../types/scheduler";

export default function Schedule() {
  const {
    employees,
    setEmployees,
    cellScheduleColors,
    setCellScheduleColors,
    scheduleData,
    setScheduleData,
  } = useEmployee();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      setIsLoggedIn(true);
      // Fetch and parse availability data from example.json
      const parseAvailability = () => {
        const shifts = exampleData.shifts;
        const parsedData = shifts.map((shift) => {
          const employeeName = shift.employee.name;
          const employeeId = getEmployeeIdByName(employeeName); // Function to get ID by name
          return {
            id: parseInt(shift.id),
            employeeId,
            startDate: localToUTC(new Date(shift.start)),
            finishDate: localToUTC(new Date(shift.end)),
            status: "scheduled",
          } as EmployeeAvailability;
        });

        return parsedData;
      };
      setScheduleData(parseAvailability());

      const newCellColors: Record<string, string> = {};
      scheduleData.flat().forEach((availability: EmployeeAvailability) => {
        const cellKey = `${availability.employeeId}-${
          new Date(availability.startDate).toISOString().split("T")[0]
        }`;
        switch (availability.status) {
          case "scheduled":
            newCellColors[cellKey] = "bg-purple-100";
            break;
        }
      });

      setCellScheduleColors(newCellColors);
    } else {
      setIsLoading(false); // Stop loading if not logged in
    }
  }, []);
  const localToUTC = (date: Date) => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  };
  // Function to get employee ID by name from localStorage
  const getEmployeeIdByName = (name: string) => {
    const employee = employees.find((emp: Employee) => emp.name === name);
    console.log(employee);
    return employee ? employee.id : null;
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setEmployees([]);
    router.replace("/");
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
        />
      </div>
    </>
  );
}
