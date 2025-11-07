"use client";

import React, { useState, useEffect } from "react";
import { Employee, Shift, RoleSettings } from "../types/scheduler";
import { useEmployee } from "../context/EmployeeContext";
import { useRouter } from "next/navigation";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: string[];
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, roles }) => {
  const [activeTab, setActiveTab] = useState("General");
  const [shiftDays, setShiftDays] = useState<string[]>([]);
  const [isFullDay, setIsFullDay] = useState(false);
  const [activeShifts, setActiveShifts] = useState<Shift[]>([]);
  const [pendingShifts, setPendingShifts] = useState<Shift[]>([]);
  const [shiftsToDelete, setShiftsToDelete] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [userId, setUserId] = useState<number>(0); // Added userId state
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]); // Added selectedRoles state
  const [showAllShifts, setShowAllShifts] = useState(false);
  const [monthlyHours, setMonthlyHours] = useState<number>(0);
  const [initialMonthlyHours, setInitialMonthlyHours] = useState<number>(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Added for file selection
  const [uploadStatus, setUploadStatus] = useState<string | null>(null); // Added for upload status
  const [importError, setImportError] = useState<string | null>(null); // Added for import errors
  const [employeeName, setEmployeeName] = useState<string>("");
  const [employeeRole, setEmployeeRole] = useState<string>("");
  const [employeeGender, setEmployeeGender] = useState<string>("Unknown");
  const [createEmployeeStatus, setCreateEmployeeStatus] = useState<string | null>(null);
  const [createEmployeeError, setCreateEmployeeError] = useState<string | null>(null);
  const [numberEmployeesToSplitAt, setNumberEmployeesToSplitAt] = useState<string>("7");
  const [hourToSplitAt, setHourToSplitAt] = useState<string>("17");
  const { employees, setEmployees } = useEmployee();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const initializeRoleSettings = (): RoleSettings => {
    const initialSettings: RoleSettings = {};
    roles.forEach((role) => {
      initialSettings[role] = {};
    });
    return initialSettings;
  };

  const [roleSettings, setRoleSettings] = useState<RoleSettings>(initializeRoleSettings());

  const [initialRoleSettings, setInitialRoleSettings] = useState<RoleSettings>(
    initializeRoleSettings()
  );

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const user = localStorage.getItem("user");
      if (user) {
        const parsedUser = JSON.parse(user);
        setUserId(parsedUser.id);

        Promise.all([
          fetch(`/api/shifts?userId=${parsedUser.id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }).then((res) => res.json()),
          fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: parsedUser.email,
            }),
          }).then((res) => res.json()),
        ])
          .then(([shiftsData, settingsData]) => {
            setActiveShifts(shiftsData);

            if (settingsData.error) {
              setError(settingsData.error);
            } else if (!settingsData.roleSettings) {
              setError("Role settings are missing in the fetched data.");
            } else {
              setMonthlyHours(settingsData.monthlyHours);
              setInitialMonthlyHours(settingsData.monthlyHours);
              setRoleSettings(settingsData.roleSettings);
              setInitialRoleSettings(settingsData.roleSettings);
            }
          })
          .catch((error) => {
            console.error("Error fetching data:", error);
            setError("Failed to fetch data. Please try again.");
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setError("User not found. Please log in again.");
        setIsLoading(false);
      }
    }
  }, [isOpen, roles]);

  // Disable scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Added validation for days and roles
    if (shiftDays.length < 1) {
      setError("Please select at least one day.");
      return;
    }
    if (selectedRoles.length < 1) {
      setError("Please select at least one role.");
      return;
    }

    const newShift: Shift = {
      id: 0,
      userId,
      startTime: startTime + ":00",
      endTime: endTime + ":00",
      days: shiftDays,
      role: selectedRoles,
      isFullDay: isFullDay,
      numberToSplitAt: isFullDay ? numberEmployeesToSplitAt : null,
      hourToSplitAt: isFullDay ? hourToSplitAt : null,
    };
    setPendingShifts([...pendingShifts, newShift]);
    setActiveShifts([...activeShifts, newShift]);

    // Reset form
    setSelectedRoles([]);
    setShiftDays([]);
    setStartTime("");
    setEndTime("");
    setIsFullDay(false);
  };

  const handleRemove = (id: number) => {
    setShiftsToDelete([...shiftsToDelete, id]);
    setActiveShifts(activeShifts.filter((shift) => shift.id !== id));
  };

  const applyChanges = async () => {
    setLoading(true);
    setError(null);
    try {
      if (shiftsToDelete.length > 0 || pendingShifts.length > 0) {
        const response = await fetch("/api/shifts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ add: pendingShifts, delete: shiftsToDelete, userId: userId, numberEmployeesToSplitAt, hourToSplitAt }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "An error occurred while applying changes.");
        }

        setPendingShifts([]);
        setShiftsToDelete([]);
        const updatedShifts = await response.json();
        setActiveShifts(updatedShifts);
      }
      const response2 = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: JSON.parse(localStorage.getItem("user") || "{}").email,
          password: JSON.parse(localStorage.getItem("user") || "{}").password,
          monthlyHours: monthlyHours,
          roleSettings: roleSettings,
        }),
      });
      if (!response2.ok) {
        const data = await response2.json();
        throw new Error(data.error || "An error occurred while applying changes.");
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handler for file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setImportError(null);
      setUploadStatus(null);
    }
  };

  // Handler for file upload
  const handleImport = async () => {
    if (!selectedFile) {
      setImportError("Please select a CSV file to import.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("userId", userId.toString()); // Append userId

    setLoading(true);
    setImportError(null);
    setUploadStatus(null);

    try {
      const response = await fetch("/api/employees/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to import employees.");
      }
      const data = await response.json();
      data.employeesToCreate.forEach((employee: Employee) => {
        setEmployees((prevEmployees) => [
          ...prevEmployees,
          {
            id: new Date().getTime(),
            name: employee.name,
            role: employee.role,
            gender: employee.gender || null,
            userId: userId,
            rate: 1.0,
          },
        ]);
      });
      setUploadStatus("Employees imported successfully!");
      setSelectedFile(null);
      router.refresh();
    } catch (error: any) {
      console.error("Import Error:", error);
      setImportError(error.message);
    } finally {
      setLoading(false);
    }
  };

  async function handleCreateEmployee(name: string, role: string, gender: string) {
    setCreating(true);
    setCreateEmployeeStatus(null);
    setCreateEmployeeError(null);
    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name, role, gender }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create employee.");
      }

      setCreateEmployeeStatus("Employee created successfully!");
      setEmployeeName("");
      setEmployeeRole("");
      router.refresh();
    } catch (error: any) {
      console.error("Error creating employee:", error);
      setCreateEmployeeError("Failed to create employee. Please try again.");
    } finally {
      setCreating(false);
      setEmployees((prevEmployees) => [
        ...prevEmployees,
        { id: new Date().getTime(), name, role, userId, gender: gender || null, rate: 1.0 },
      ]);
    }
  }

  const getUniqueShifts = (role: string): string[] => {
    const shifts = activeShifts
      .filter((shift) => shift.role.includes(role))
      .map((shift) =>
        shift.isFullDay
          ? `FullDay (${shift.startTime.slice(0, -3)} - ${shift.endTime.slice(0, -3)})`
          : `${shift.startTime.slice(0, -3)}-${shift.endTime.slice(0, -3)}`
      );
    return Array.from(new Set(shifts));
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-6 w-150 max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            <div className="flex flex-row justify-center mb-4">
              <a
                href="#"
                className={`px-4 py-2 cursor-pointer ${
                  activeTab === "General"
                    ? "text-indigo-600 font-bold border-b-2 border-indigo-600"
                    : "text-gray-500 border-b border-gray-300 hover:border-b-2 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("General")}
              >
                General
              </a>
              <a
                href="#"
                className={`px-4 py-2 cursor-pointer ${
                  activeTab === "Shifts"
                    ? "text-indigo-600 font-bold border-b-2 border-indigo-600"
                    : "text-gray-500 border-b border-gray-300 hover:border-b-2 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("Shifts")}
              >
                Shifts
              </a>
              <a
                href="#"
                className={`px-4 py-2 cursor-pointer ${
                  activeTab === "Other"
                    ? "text-indigo-600 font-bold border-b-2 border-indigo-600"
                    : "text-gray-500 border-b border-gray-300 hover:border-b-2 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("Other")}
              >
                Other
              </a>
            </div>
            {activeTab === "General" && (
              <>
                <div className="flex flex-col w-full max-w-2xl mx-auto">
                  <div className="flex flex-col justify-between items-center">
                    <label htmlFor="monthlyHours" className="text-nowrap my-2">
                      Hours per month
                    </label>
                    <input
                      id="monthlyHours"
                      type="number"
                      min="0"
                      max="170"
                      className="p-2 focus:border-b-2 focus:border-indigo-500 border-b border-gray-300 outline-none bg-gray-50 text-center rounded-md"
                      placeholder={initialMonthlyHours.toString()}
                      value={monthlyHours}
                      onChange={(e) => setMonthlyHours(parseInt(e.target.value))}
                    />
                  </div>
                </div>

                {roles.map((role) => (
                  <React.Fragment key={role}>
                    <hr className="w-full h-[1px] bg-gray-300 mt-8" />
                    <div className="flex-grow flex items-center justify-center">
                      <span className="text-xl tracking-wide font-normal text-gray-500 uppercase">
                        {role}
                      </span>
                    </div>
                    <hr className="w-full h-[1px] bg-gray-300 mb-2" />

                    {getUniqueShifts(role).map((shift) => (
                      <div key={shift} className="mb-6">
                        <div className="flex justify-center">
                          <label className="mb-4 mt-2 font-semibold text-gray-500 border border-gray-200 rounded-md p-2">
                            {shift} shift
                          </label>
                        </div>
                        <div className="flex flex-row space-x-4">
                          {[
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                            "Sunday",
                          ].map((day) => (
                            <div key={day} className="flex flex-col items-center">
                              <label className="my-1 text-sm">{day}</label>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                className="w-20 p-2 focus:border-b-2 focus:border-indigo-500 border-b border-gray-300 outline-none bg-gray-50 text-center rounded-md"
                                value={Math.min(
                                  10,
                                  Math.max(
                                    0,
                                    roleSettings[role]?.[shift]?.[
                                      day as keyof (typeof roleSettings)[typeof role][typeof shift]
                                    ] ?? 0
                                  )
                                )}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  setRoleSettings((prev) => ({
                                    ...prev,
                                    [role]: {
                                      ...prev[role],
                                      [shift]: {
                                        ...prev[role]?.[shift],
                                        [day]: value,
                                      },
                                    },
                                  }));
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </>
            )}
            {activeTab === "Shifts" && (
              // Shifts specific settings
              <div className="flex flex-col gap-4">
                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                  <div className="flex flex-row items-center gap-4">
                    <div className="flex flex-col flex-grow mb-6">
                      <label htmlFor="shiftStart" className="mb-1">
                        Shift Start Time
                      </label>
                      <input
                        id="shiftStart"
                        type="time"
                        
                        required
                        className={`p-2 border border-gray-300 rounded focus:outline-none focus:border-indigo-500`}
                        value={startTime}
                        onChange={(e) => {
                          if (isFullDay) {
                            setStartTime(e.target.value);
                            setEndTime(e.target.value);
                          } else {
                            setStartTime(e.target.value);
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-col flex-grow mb-6">
                      <label htmlFor="shiftEnd" className="mb-1">
                        Shift End Time
                      </label>
                      <input
                        id="shiftEnd"
                        type="time"
                        required
                        disabled={isFullDay}
                        className={`p-2 border border-gray-300 rounded focus:outline-none focus:border-indigo-500 ${
                          isFullDay ? "bg-gray-200 cursor-not-allowed" : ""
                        }`}
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>

                    {/* Vertical line with "or" */}
                    <div className="flex flex-col items-center mx-4">
                      <div className="relative">
                        <div className="h-12 border-l border-gray-300"></div>
                        <span className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2 bg-white px-2 text-gray-500">
                          or
                        </span>
                      </div>
                    </div>

                    {/* Customized Checkbox */}
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={isFullDay}
                        onChange={() => {
                          setIsFullDay(!isFullDay);
                          if (!isFullDay) {
                            // If changing to full day, set endTime to startTime
                            setEndTime(startTime);
                          }
                        }}
                      />
                      <span className="w-6 h-6 inline-block border-2 border-indigo-500 rounded flex-shrink-0 flex items-center justify-center mr-2">
                        {isFullDay && (
                          <svg
                            className="w-4 h-4 text-indigo-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="text-indigo-600">Full Day</span>
                    </label>
                  </div>
                  {isFullDay && (
                    <div className="mb-2 flex justify-center space-x-12">
                      <div className="grid">
                        <label htmlFor="employeeSplit">When to split shift?</label>
                        <input
                        id="employeeSplit"
                        type="number"
                        min="1"
                        max={employees.length}
                        value={numberEmployeesToSplitAt}
                        onChange={(e) => {
                          setNumberEmployeesToSplitAt(e.target.value);
                        }}
                        className="mt-2 p-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div className="grid">
                        <label htmlFor="timeSplit">At what hour to split?</label>
                        <input
                        id="timeSplit"
                        type="number"
                        min="0"
                        max="23"
                        value={hourToSplitAt}
                        onChange={(e) => {
                          setHourToSplitAt(e.target.value);
                        }}
                        className="mt-2 p-2 border border-gray-300 rounded"
                      />
                      </div>
                    </div>
                  
                  )}

                  <div className="flex flex-wrap gap-2">
                    {[
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ].map((day) => (
                      <button
                        key={day}
                        type="button"
                        className={`px-3 py-2 rounded ${
                          shiftDays.includes(day)
                            ? "bg-indigo-200 text-indigo-700"
                            : "bg-gray-50 text-gray-500"
                        } hover:bg-indigo-200 hover:text-indigo-700 font-medium`}
                        onClick={() => {
                          if (shiftDays.includes(day)) {
                            setShiftDays(shiftDays.filter((d) => d !== day));
                          } else {
                            setShiftDays([...shiftDays, day]);
                          }
                        }}
                      >
                        {day}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="px-3 py-2 rounded bg-gray-50 border border-gray-300 text-gray-500 hover:bg-indigo-200 hover:text-indigo-700 font-medium"
                      onClick={() => {
                        if (shiftDays.length === 7) {
                          setShiftDays([]);
                        } else {
                          setShiftDays([
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                            "Sunday",
                          ]);
                        }
                      }}
                    >
                      Every Day
                    </button>
                  </div>

                  {/* Added roles selection tiles */}
                  <div className="flex flex-wrap gap-2 mt-4 justify-center border-t border-gray-300 pt-4">
                    {roles.map((role) => (
                      <button
                        key={role}
                        type="button"
                        className={`px-3 py-2 rounded ${
                          selectedRoles.includes(role)
                            ? "bg-indigo-200 text-indigo-700"
                            : "bg-gray-50 text-gray-500"
                        } hover:bg-indigo-200 hover:text-indigo-700 font-medium`}
                        onClick={() => {
                          if (selectedRoles.includes(role)) {
                            setSelectedRoles(selectedRoles.filter((r) => r !== role));
                          } else {
                            setSelectedRoles([...selectedRoles, role]);
                          }
                        }}
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="relative flex justify-center my-4 mt-10">
                    <hr className="w-full border-t border-gray-300" />
                    <button
                      type="submit"
                      className="absolute top-0 transform -translate-y-1/2 w-10 h-10 bg-indigo-200 rounded-full border border-indigo-600 flex items-center justify-center focus:outline-none hover:bg-indigo-500 group"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24"
                        width="24"
                        viewBox="0 0 24 24"
                      >
                        <path
                          className="fill-indigo-600 group-hover:fill-white"
                          d="m5.214 14.522s4.505 4.502 6.259 6.255c.146.147.338.22.53.22s.384-.073.53-.22c1.754-1.752 6.249-6.244 6.249-6.244.144-.144.216-.334.217-.523 0-.193-.074-.386-.221-.534-.293-.293-.766-.294-1.057-.004l-4.968 4.968v-14.692c0-.414-.336-.75-.75-.75s-.75.336-.75.75v14.692l-4.979-4.978c-.289-.289-.761-.287-1.054.006-.148.148-.222.341-.221.534 0 .189.071.377.215.52z"
                          fillRule="nonzero"
                        />
                      </svg>
                    </button>
                  </div>
                </form>
                <div className="mt-2">
                  <h3 className="text-lg font-semibold mb-2">Active Shifts</h3>
                  <div className="space-y-3">
                    {!showAllShifts
                      ? activeShifts.slice(0, 2).map((shift) => (
                          <div key={shift.id} className="p-4 border border-gray-300 rounded">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">
                                  {shift.isFullDay ? (
                                    <span>
                                      Full Day ({shift.startTime.slice(0, -3)} -{" "}
                                      {shift.endTime.slice(0, -3)})
                                    </span>
                                  ) : (
                                    <span>
                                      {shift.startTime.slice(0, -3)} - {shift.endTime.slice(0, -3)}
                                    </span>
                                  )}
                                </span>
                                <div className="flex flex-wrap gap-1 my-1">
                                  {shift.role.map((role) => (
                                    <span
                                      key={role}
                                      className="px-2 py-1 bg-indigo-200 text-xs rounded"
                                    >
                                      {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </span>
                                  ))}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {shift.days.map((day) => (
                                    <span
                                      key={day}
                                      className="px-2 py-1 bg-gray-200 text-xs rounded"
                                    >
                                      {day}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <button
                                className="text-red-500 hover:text-red-700"
                                onClick={() => {
                                  if (shift.id) {
                                    handleRemove(shift.id);
                                  } else {
                                    setActiveShifts(
                                      activeShifts.filter(
                                        (_, index) => index !== activeShifts.indexOf(shift)
                                      )
                                    );
                                    setPendingShifts(
                                      pendingShifts.filter(
                                        (_, index) => index !== pendingShifts.indexOf(shift)
                                      )
                                    );
                                  }
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))
                      : activeShifts.map((shift) => (
                          <div key={shift.id} className="p-4 border border-gray-300 rounded">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">
                                  {shift.isFullDay ? (
                                    <span>
                                      Full Day ({shift.startTime.slice(0, -3)} -{" "}
                                      {shift.endTime.slice(0, -3)})
                                    </span>
                                  ) : (
                                    <span>
                                      {shift.startTime.slice(0, -3)} - {shift.endTime.slice(0, -3)}
                                    </span>
                                  )}
                                </span>
                                <div className="flex flex-wrap gap-1 my-1">
                                  {shift.role.map((role) => (
                                    <span
                                      key={role}
                                      className="px-2 py-1 bg-indigo-200 text-xs rounded"
                                    >
                                      {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </span>
                                  ))}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {shift.days.map((day) => (
                                    <span
                                      key={day}
                                      className="px-2 py-1 bg-gray-200 text-xs rounded"
                                    >
                                      {day}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <button
                                className="text-red-500 hover:text-red-700"
                                onClick={() => {
                                  if (shift.id) {
                                    handleRemove(shift.id);
                                  } else {
                                    setActiveShifts(
                                      activeShifts.filter(
                                        (_, index) => index !== activeShifts.indexOf(shift)
                                      )
                                    );
                                    setPendingShifts(
                                      pendingShifts.filter(
                                        (_, index) => index !== pendingShifts.indexOf(shift)
                                      )
                                    );
                                  }
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                    {activeShifts.length > 2 && (
                      <button
                        type="button"
                        className="block mx-auto mt-2 px-4 py-2 text-indigo-600 bg-indigo-200 rounded-full border border-indigo-600 flex items-center justify-center focus:outline-none hover:bg-indigo-500 hover:text-white"
                        onClick={() => setShowAllShifts(!showAllShifts)}
                      >
                        {showAllShifts ? "Show Less" : "Show More"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {activeTab === "Other" && (
              // Other settings
              <div className="flex flex-col mb-4">
                <p>Import employees from a CSV file.</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="mt-2 mb-4"
                />
                <button
                  type="button"
                  onClick={handleImport}
                  className={`py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-500 ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={loading}
                >
                  {loading ? "Importing..." : "Import"}
                </button>
                {uploadStatus && (
                  <div className="mt-2 text-green-600 flex items-center">
                    <p>{uploadStatus}</p>
                    <button
                      className="ml-2 text-xl font-bold leading-none"
                      onClick={() => setUploadStatus(null)}
                      aria-label="Close upload status message"
                    >
                      ×
                    </button>
                  </div>
                )}
                {importError && (
                  <div className="mt-2 text-red-600 flex items-center">
                    <p>{importError}</p>
                    <button
                      className="ml-2 text-xl font-bold leading-none"
                      onClick={() => setImportError(null)}
                      aria-label="Close import error message"
                    >
                      ×
                    </button>
                  </div>
                )}
                {/* Separator with "or" */}
                <div className="flex items-center my-4">
                  <hr className="flex-grow border-t" />
                  <span className="mx-2 text-gray-500">or</span>
                  <hr className="flex-grow border-t" />
                </div>
                {/* Form to create a single employee */}
                <div className="flex flex-col">
                  <p>Create a single employee.</p>
                  <input
                    type="text"
                    placeholder="Employee Name"
                    value={employeeName}
                    onChange={(e) => {
                      setEmployeeName(e.target.value);
                    }}
                    className="mt-2 p-2 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Role"
                    value={employeeRole}
                    onChange={(e) => {
                      setEmployeeRole(e.target.value);
                    }}
                    className="mt-2 p-2 border border-gray-300 rounded"
                  />
                  <select
                    value={employeeGender}
                    onChange={(e) => {
                      setEmployeeGender(e.target.value);
                    }}
                    className="mt-2 p-2 border border-gray-300 rounded"
                  >
                    <option value="" disabled>Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="">Not specified</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleCreateEmployee(employeeName, employeeRole, employeeGender)}
                    className={`py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-500 mt-4 ${
                      creating ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={creating}
                  >
                    {creating ? "Creating..." : "Create Employee"}
                  </button>
                  {createEmployeeStatus && (
                    <div className="mt-2 text-green-600 flex items-center">
                      <p>{createEmployeeStatus}</p>
                      <button
                        className="ml-2 text-xl font-bold leading-none"
                        onClick={() => setCreateEmployeeStatus(null)}
                        aria-label="Close create employee status message"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {createEmployeeError && (
                    <div className="mt-2 text-red-600 flex items-center">
                      <p>{createEmployeeError}</p>
                      <button
                        className="ml-2 text-xl font-bold leading-none"
                        onClick={() => setCreateEmployeeError(null)}
                        aria-label="Close create employee error message"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            {error && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded flex justify-between items-center">
                <span>{error}</span>
                <button
                  className="text-red-700 font-bold"
                  onClick={() => setError(null)}
                  aria-label="Close error message"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex flex-row-reverse gap-2 mt-4 border-t border-gray-300 pt-4">
              {activeTab !== "Other" && (
                <button
                  type="button"
                  className={`py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-500 w-full ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={applyChanges}
                  disabled={loading}
                >
                  {loading ? "Applying..." : "Apply"}
                </button>
              )}
              <button
                className="py-1.5 border border-indigo-600 bg-white text-indigo-600 rounded hover:bg-indigo-600 hover:text-white w-full"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;
