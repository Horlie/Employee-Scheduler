import { JsonObject } from "@prisma/client/runtime/library";

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
  PREFER_NOT_TO_SAY = 'Prefer not to say',
}

export interface Employee {
  id: number; // Changed from string to number
  name: string;
  rate: number;
  roles: string[];
  availability?: EmployeeAvailability[];
  gender: Gender;
}


export interface EmployeeAvailability {
  id: number | string; // может быть строкой ? когда их создает timefold
  employeeId: number;
  
  start?: string | Date; // timefold возвращает start и end
  end?: string | Date;

 
  startDate: string | Date; // для страницы planning 
  finishDate: string | Date;
  
  status?: string;
  isFullDay?: boolean;
  employee?: { name: string, roles?: string[] }; 
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
  roles: string[];
  isFullDay: boolean;
  hourToSplitAt: string | null;
  numberToSplitAt: string | null;
}

export interface User {
  id: number;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  monthlyHours: number;
  roleSettings: RoleSettings;
}

export interface RoleSettings {
  [role: string]: {
    [shift: string]: {
      Monday?: number;
      Tuesday?: number;
      Wednesday?: number;
      Thursday?: number;
      Friday?: number;
      Saturday?: number;
      Sunday?: number;
    };
  };
}


export interface TimefoldShift {
  employeeId: number;
  id: string;
  isFullDay: boolean;
  start: string;
  end: string;
  month: number;
  role?: string;
}

