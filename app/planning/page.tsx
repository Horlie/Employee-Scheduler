"use client";

import React, { useState, useEffect, useMemo } from "react";
import Navigation from "../components/Navigation";
import CustomScheduler from "../components/CustomScheduler";
import { Employee, EmployeeAvailability } from "../types/scheduler";
import { useRouter } from "next/navigation";
import { useEmployee } from "../context/EmployeeContext";
import LoadingSpinner from "../components/LoadingSpinner";
import { fromZonedTime } from "date-fns-tz";

export default function Planning() {
  const {
    employees,
    setEmployees,
    cellColors,
    setCellColors,
    availabilityData,
    setAvailabilityData,
    handleSaveChanges,
  } = useEmployee();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullDay, setIsFullDay] = useState<Map<number, boolean>>(new Map());

  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      setIsLoggedIn(true);
      if (employees.length === 0) {
        fetchEmployees();
      }
    }
  }, [employees.length]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await fetch(`/api/employees?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees);

        // Fetch availability for all employees
        const employeeIds = data.employees.map((employee: Employee) => employee.id).join(",");
        const availabilityResponse = await fetch(
          `/api/employee-availability?employeeIds=${employeeIds}`
        );
        let allAvailability: EmployeeAvailability[] = [];
        if (availabilityResponse.ok) {
          const availabilityData = await availabilityResponse.json();
          allAvailability = availabilityData.availability;
        }
        setAvailabilityData(allAvailability.flat());

        // Update cell colors based on fetched availability
        const newCellColors: Record<string, string> = {};
        allAvailability.flat().forEach((availability: EmployeeAvailability) => {
          const cellKey = `${availability.employeeId}-${
            fromZonedTime(availability.startDate, "UTC").toISOString().split("T")[0]
          }`;
          switch (availability.status) {
            case "unavailable":
              newCellColors[cellKey] = "bg-yellow-200";
              break;
            case "unreachable":
              newCellColors[cellKey] = "bg-red-200";
              break;
            case "preferable":
              newCellColors[cellKey] = "bg-green-200";
              break;
            case "vacation":
              newCellColors[cellKey] = "bg-blue-200"; 
              break;
          }
        });

        setCellColors(newCellColors);
      } else {
        console.error("Failed to fetch employees");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setEmployees([]);
    router.replace("/");
  };

  // Extract unique roles
  const roles = useMemo(() => {
    const roleSet = new Set<string>();
    employees.forEach((employee) => roleSet.add(employee.role));
    return Array.from(roleSet);
  }, [employees]);

  useEffect(() => {
    const newIsFullDay = new Map<number, boolean>();
    availabilityData.forEach((availability) => {
      const startDate = new Date(availability.startDate);
      const finishDate = new Date(availability.finishDate);
      if (
        startDate.getHours() === 0 &&
        startDate.getMinutes() === 0 &&
        finishDate.getHours() === 23 &&
        finishDate.getMinutes() === 59
      ) {
        newIsFullDay.set(availability.id, true);
      }
    });
    setIsFullDay(newIsFullDay);
  }, [availabilityData]);
  return (
    <>
      <Navigation isLoggedIn={isLoggedIn} onLogout={handleLogout} activePage="planning" />
      {isLoading && <LoadingSpinner />}
      <div className="overflow-y-auto rounded-2xl border-2 border-gray-300 mt-16 bg-gray-100 overflow-x-auto">
        <CustomScheduler
          employees={employees}
          cellColors={cellColors}
          setCellColors={setCellColors}
          availabilityData={availabilityData}
          setAvailabilityData={setAvailabilityData}
          scheduleData={[]}
          setScheduleData={() => {}}
          showSettings={true} // Ensure settings are shown
          showTooltips={true} // Ensure tooltips are enabled
          roles={roles}
          employeeHours={{}}
          needsRefresh={() => {}}
          isPlanningFullDay={isFullDay}
          isScheduleFullDay={new Map()}
          onSaveChanges={handleSaveChanges}
        />
      </div>
    </>
  );
}
