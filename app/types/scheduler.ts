export interface Employee {
  id: number; // Changed from string to number
  name: string;
  rate: number;
  role: string;
  availability?: EmployeeAvailability[];
}

export interface EmployeeAvailability {
  id: number;
  employeeId: number;
  startDate: Date | string;
  finishDate: Date | string;
  status: string;
}

export interface SchedulerEvent {
  id: string;
  employeeId: string;
  startDate: Date;
  endDate: Date;
  title: string;
  color: string;
}

export interface Shift {
  id: number;
  userId: number;
  startTime: string;
  endTime: string;
  days: string[];
  role: string[];
  isFullDay: boolean;
}

export interface User {
  id: number;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  monthlyHours: number;
  dailyShiftsPerWorkerPerMonth: number;
  roleSettings: RoleSettings;
}

export interface RoleSettings {
  role?: {
    Monday?: number;
    Tuesday?: number;
    Wednesday?: number;
    Thursday?: number;
    Friday?: number;
    Saturday?: number;
    Sunday?: number;
  };
}
