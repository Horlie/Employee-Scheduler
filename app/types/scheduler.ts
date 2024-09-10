export interface Employee {
  id: string;
  name: string;
  role: string;  // Add this line
  // ... other properties ...
}

export interface SchedulerEvent {
  id: string;
  employeeId: string;
  startDate: Date;
  endDate: Date;
  title: string;
  color: string;
}