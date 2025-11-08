import { JsonObject } from "@prisma/client/runtime/library";

export interface Employee {
  id: number; // Changed from string to number
  name: string;
  rate: number;
  role: string;
  availability?: EmployeeAvailability[];
  gender: string | null;
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
  employee?: { name: string, role?: string }; 
}

// export interface EmployeeAvailability {
//   id: number;
//   employeeId: number;
//   startDate: Date | string;
//   finishDate: Date | string;
//   status: string;
//   isFullDay: boolean;
// }

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

export interface Schedule {
  id: number;
  userId: number;
  month: number;
  data: JsonObject;
}

export interface TimefoldShift {
  employee: {
    name: string;
  };
  id: string;
  isFullDay: boolean;
  start: string;
  end: string;
}
