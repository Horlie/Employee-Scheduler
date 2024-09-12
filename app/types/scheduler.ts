export interface Employee {
  id: number;
  name: string;
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