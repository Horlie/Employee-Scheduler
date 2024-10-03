"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";
import { Employee, EmployeeAvailability } from "../types/scheduler";

interface EmployeeContextType {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  cellColors: Record<string, string>;
  setCellColors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  availabilityData: EmployeeAvailability[];
  setAvailabilityData: React.Dispatch<React.SetStateAction<EmployeeAvailability[]>>;
  cellScheduleColors: Record<string, string>;
  setCellScheduleColors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  scheduleData: EmployeeAvailability[];
  setScheduleData: React.Dispatch<React.SetStateAction<EmployeeAvailability[]>>;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider = ({ children }: { children: ReactNode }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cellColors, setCellColors] = useState<Record<string, string>>({});
  const [availabilityData, setAvailabilityData] = useState<EmployeeAvailability[]>([]);
  const [cellScheduleColors, setCellScheduleColors] = useState<Record<string, string>>({});
  const [scheduleData, setScheduleData] = useState<EmployeeAvailability[]>([]);

  return (
    <EmployeeContext.Provider
      value={{
        employees,
        setEmployees,
        cellColors,
        setCellColors,
        availabilityData,
        setAvailabilityData,
        cellScheduleColors,
        setCellScheduleColors,
        scheduleData,
        setScheduleData,
      }}
    >
      {children}
    </EmployeeContext.Provider>
  );
};

export const useEmployee = () => {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error("useEmployee must be used within an EmployeeProvider");
  }
  return context;
};
