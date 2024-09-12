"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Employee, EmployeeAvailability } from "./types/scheduler";
import Navigation from "./components/Navigation";
import LandingPage from "./components/LandingPage";
import LoginModal from "./components/LoginModal";
import LoadingSpinner from "./components/LoadingSpinner";

const CustomScheduler = dynamic(() => import("./components/CustomScheduler"), {
  ssr: false,
});

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cellColors, setCellColors] = useState<Record<string, string>>({});

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      setIsLoggedIn(true);
      fetchEmployees();
    }
  }, []);
  const [allAvailability, setAllAvailability] = useState<EmployeeAvailability[]>([]);
  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await fetch(`/api/employees?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees);

        // Fetch availability for all employees
        const availabilityPromises = data.employees.map(async (employee: Employee) => {
          const availabilityResponse = await fetch(
            `/api/employee-availability?employeeId=${employee.id}`
          );
          if (availabilityResponse.ok) {
            const availabilityData = await availabilityResponse.json();
            return availabilityData.availability;
          }
          return [];
        });

        const allAvailability: EmployeeAvailability[] = await Promise.all(availabilityPromises);
        setAllAvailability(allAvailability);
        // Update cell colors based on fetched availability
        const newCellColors: Record<string, string> = {};
        allAvailability.flat().forEach((availability: EmployeeAvailability) => {
          const cellKey = `${availability.employeeId}-${
            new Date(availability.startDate).toISOString().split("T")[0]
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

  const handleLogin = () => {
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
    fetchEmployees();
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setEmployees([]);
  };

  return (
    <div className="flex flex-col">
      <Navigation isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      {isLoading && <LoadingSpinner />}
      {isLoggedIn ? (
        <div className="flex-grow overflow-y-auto rounded-2xl border-2 border-gray-300 mt-10 bg-gray-100 overflow-x-auto">
          <CustomScheduler
            employees={employees}
            cellColors={cellColors}
            setCellColors={setCellColors}
            availabilityData={allAvailability.flat().filter(Boolean)}
            setAvailabilityData={setAllAvailability}
          />
        </div>
      ) : (
        <LandingPage onLoginClick={() => setIsLoginModalOpen(true)} />
      )}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLogin}
      />
    </div>
  );
}
