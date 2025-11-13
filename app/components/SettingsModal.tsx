"use client";

import React, { useState, useEffect } from "react";
import { Employee, Shift, RoleSettings } from "../types/scheduler";
import { useEmployee } from "../context/EmployeeContext";
import { useRouter } from "next/navigation";
import { useTranslation } from 'react-i18next';
import { Gender } from "../types/scheduler";

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
  const [employeeName, setEmployeeName] = useState<string>();
  const [employeeRole, setEmployeeRole] = useState<string>();
  const [employeeGender, setEmployeeGender] = useState<Gender>();
  const [createEmployeeStatus, setCreateEmployeeStatus] = useState<string | null>(null);
  const [createEmployeeError, setCreateEmployeeError] = useState<string | null>(null);
  const [numberEmployeesToSplitAt, setNumberEmployeesToSplitAt] = useState<string>("7");
  const [hourToSplitAt, setHourToSplitAt] = useState<string>("17");
  const [selectedGenders, setSelectedGenders] = useState<Gender[]>([]); // Added for shift gender selection (multiple)
  const { employees, setEmployees } = useEmployee();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { t } = useTranslation();

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
      setError(t('errors.select_at_least_one_day'));
      return;
    }
    if (selectedRoles.length < 1) {
      setError(t('errors.select_at_least_one_role'));
      return;
    }

    const newShift: Shift = {
      id: 0,
      userId,
      startTime: startTime + ":00",
      endTime: endTime + ":00",
      days: shiftDays,
      roles: selectedRoles,
      isFullDay: isFullDay,
      numberToSplitAt: isFullDay ? numberEmployeesToSplitAt : null,
      hourToSplitAt: isFullDay ? hourToSplitAt : null,
      gender: selectedGenders.length > 0 ? selectedGenders.join(",") : null, // Store as comma-separated string
    };

    setRoleSettings(prevSettings => {
      const newSettings = { ...prevSettings }; 
      
      const shiftString = newShift.isFullDay
        ? `FullDay (${newShift.startTime.slice(0, -3)} - ${newShift.endTime.slice(0, -3)})`
        : `${newShift.startTime.slice(0, -3)}-${newShift.endTime.slice(0, -3)}`;

      newShift.roles.forEach(role => {
        if (!newSettings[role]) {
          newSettings[role] = {};
        }
        
        const daySettings: { [key: string]: number } = {};
        
        newShift.days.forEach(day => {
          daySettings[day] = 1; 
        });

        newSettings[role][shiftString] = daySettings;
      });

      return newSettings; 
    });

    setPendingShifts([...pendingShifts, newShift]);
    setActiveShifts([...activeShifts, newShift]);

    // Reset form
    setSelectedRoles([]);
    setShiftDays([]);
    setStartTime("");
    setEndTime("");
    setIsFullDay(false);
    setSelectedGenders([]);
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
          body: JSON.stringify({ add: pendingShifts, delete: shiftsToDelete, userId: userId, numberEmployeesToSplitAt, hourToSplitAt}),
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
            roles: Array.isArray(employee.roles) ? employee.roles : [employee.roles || ""],
            gender: employee.gender,
            userId: userId,
            rate: 1.0,
          },
        ]);
      });
      setUploadStatus(t('status.import_success'));
      const response2 = await fetch(`/api/employees?userId=${JSON.parse(localStorage.getItem("user") ?? "").id}`);
      if (!response2.ok) {
        throw new Error(`Failed to fetch employees: ${response2.statusText}`);
      }
      const employeesData = await response2.json();
      
      let allEmployees = employeesData.employees; 
      setEmployees(allEmployees);
      setUploadStatus("Employees imported successfully!");
      setSelectedFile(null);
    } catch (error: any) {
      console.error("Import Error:", error);
      setImportError(error.message);
    } finally {
      setLoading(false);
    }
  };

  async function handleCreateEmployee(name: string, role: string, gender: Gender) {
    setCreating(true);
    setCreateEmployeeStatus(null);
    setCreateEmployeeError(null);
    try {
      // Convert comma-separated roles to array
      const rolesArray = role.split(",").map(r => r.trim()).filter(r => r.length > 0);
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name, roles: rolesArray, gender }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create employee.");
      }

      setCreateEmployeeStatus(t('status.create_employee_success'));
      setEmployeeName("");
      setEmployeeRole("");
      router.refresh();
    } catch (error: any) {
      console.error("Error creating employee:", error);
      setCreateEmployeeError(t('errors.create_employee_failed'));
    } finally {
      setCreating(false);
      const response2 = await fetch(`/api/employees?userId=${JSON.parse(localStorage.getItem("user") ?? "").id}`);
      if (!response2.ok) {
        throw new Error(`Failed to fetch employees: ${response2.statusText}`);
      }
      const employeesData = await response2.json();
      
      let allEmployees = employeesData.employees; 
      setEmployees(allEmployees);
    }
  }

  const getUniqueShifts = (role: string): string[] => {
    const shifts = activeShifts
      .filter((shift) => shift.roles.includes(role))
      .map((shift) =>
        shift.isFullDay
          ? `FullDay (${shift.startTime.slice(0, -3)} - ${shift.endTime.slice(0, -3)})`
          : `${shift.startTime.slice(0, -3)}-${shift.endTime.slice(0, -3)}`
      );
    return Array.from(new Set(shifts));
  };

  const translateDay = (day: string) => {
    const dayKey = `settings_tab.${day.toLowerCase()}`;
    return t(dayKey);
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
                {t('settings_tab.general')}
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
                {t('settings_tab.shifts')}
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
                {t('settings_tab.other')}
              </a>
            </div>
            {activeTab === "General" && (
              <>
                <div className="flex flex-col w-full max-w-2xl mx-auto">
                  <div className="flex flex-col justify-between items-center">
                    <label htmlFor="monthlyHours" className="text-nowrap my-2">
                      {t('settings_tab.hours_per_month')}
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
                          <label className="mb-4 mt-2 font-semibold ...">
                            {shift.startsWith('FullDay') 
                              ? t('settings_tab.fullday_time_shift', { time: shift.match(/\((.*)\)/)?.[1] || '' })
                              : t('settings_tab.time_shift', { time: shift })
                            }
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
                              <label className="my-1 text-sm">{translateDay(day)}</label>
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
                        {t('settings_tab.shift_start_time')}
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
                        {t('settings_tab.shift_end_time')}
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
                          {t('settings_tab.or')}
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
                      <span className="text-indigo-600">{t('settings_tab.full_day')}</span>
                    </label>
                  </div>
                  {isFullDay && (
                    <div className="mb-2 flex justify-center space-x-12">
                      <div className="grid">
                        <label htmlFor="employeeSplit">{t('settings_tab.when_to_split_shift')}</label>
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
                        <label htmlFor="timeSplit">{t('settings_tab.at_what_hour_to_split')}</label>
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
                        {translateDay(day)}
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
                      {t('settings_tab.every_day')}
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

                  {/* Gender selection for shift - similar to role selection */}
                  <div className="flex flex-col mt-4 border-t border-gray-300 pt-4">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[Gender.MALE, Gender.FEMALE].map((gender) => {
                        const isSelected = selectedGenders.includes(gender);
                        let bgColor = "bg-gray-50 text-gray-500";
                        let selectedBgColor = "";
                        
                        if (gender === Gender.MALE) {
                          selectedBgColor = "bg-blue-200 text-blue-700";
                        } else if (gender === Gender.FEMALE) {
                          selectedBgColor = "bg-pink-200 text-pink-700";
                        } else {
                          selectedBgColor = "bg-indigo-200 text-indigo-700";
                        }
                        
                        return (
                          <button
                            key={gender}
                            type="button"
                            className={`px-3 py-2 rounded font-medium ${
                              isSelected ? selectedBgColor : bgColor
                            } hover:opacity-80 transition-opacity`}
                            onClick={() => {
                              if (selectedGenders.includes(gender)) {
                                setSelectedGenders(selectedGenders.filter((g) => g !== gender));
                              } else {
                                setSelectedGenders([...selectedGenders, gender]);
                              }
                            }}
                          >
                            {gender === Gender.MALE && (t('settings_tab.male') || 'Male')}
                            {gender === Gender.FEMALE && (t('settings_tab.female') || 'Female')}
                          </button>
                        );
                      })}
                    </div>
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
                  <h3 className="text-lg font-semibold mb-2">{t('settings_tab.active_shifts')}</h3>
                  <div className="space-y-3">
                    {!showAllShifts
                      ? activeShifts.slice(0, 2).map((shift) => (
                          <div key={shift.id} className="p-4 border border-gray-300 rounded">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">
                                  {shift.isFullDay ? (
                                    t('settings_tab.full_day_with_time', { 
                                      start: shift.startTime.slice(0, -3), 
                                      end: shift.endTime.slice(0, -3) 
                                    })
                                  ) : (
                                    `${shift.startTime.slice(0, -3)} - ${shift.endTime.slice(0, -3)}`
                                  )}
                                </span>
                                <div className="flex flex-wrap gap-1 my-1">
                                  {shift.roles.map((role) => (
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
                                      {translateDay(day)}
                                    </span>
                                  ))}
                                </div>
                                {shift.gender && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {(typeof shift.gender === 'string' && shift.gender.includes(',') 
                                      ? shift.gender.split(',') 
                                      : Array.isArray(shift.gender) 
                                        ? shift.gender 
                                        : [shift.gender]
                                    ).map((gender: string) => {
                                      const genderStr = typeof gender === 'string' ? gender.trim() : gender;
                                      let bgColor = "bg-indigo-200 text-indigo-700";
                                      if (genderStr === Gender.MALE) {
                                        bgColor = "bg-blue-200 text-blue-700";
                                      } else if (genderStr === Gender.FEMALE) {
                                        bgColor = "bg-pink-200 text-pink-700";
                                      }
                                      return (
                                        <span
                                          key={genderStr}
                                          className={`px-2 py-1 text-xs rounded ${bgColor}`}
                                        >
                                          {genderStr === Gender.MALE ? t('settings_tab.male') : t('settings_tab.female')}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
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
                                {t('settings_tab.remove')}
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
                                    t('settings_tab.full_day_with_time', { 
                                      start: shift.startTime.slice(0, -3), 
                                      end: shift.endTime.slice(0, -3) 
                                    })
                                  ) : (
                                    `${shift.startTime.slice(0, -3)} - ${shift.endTime.slice(0, -3)}`
                                  )}
                                </span>
                                <div className="flex flex-wrap gap-1 my-1">
                                  {shift.roles.map((role) => (
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
                                      {translateDay(day)}
                                    </span>
                                  ))}
                                </div>
                                {shift.gender && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {(typeof shift.gender === 'string' && shift.gender.includes(',') 
                                      ? shift.gender.split(',') 
                                      : Array.isArray(shift.gender) 
                                        ? shift.gender 
                                        : [shift.gender]
                                    ).map((gender: string) => {
                                      const genderStr = typeof gender === 'string' ? gender.trim() : gender;
                                      let bgColor = "bg-indigo-200 text-indigo-700";
                                      if (genderStr === Gender.MALE) {
                                        bgColor = "bg-blue-200 text-blue-700";
                                      } else if (genderStr === Gender.FEMALE) {
                                        bgColor = "bg-pink-200 text-pink-700";
                                      }
                                      return (
                                        <span
                                          key={genderStr}
                                          className={`px-2 py-1 text-xs rounded ${bgColor}`}
                                        >
                                          {genderStr === Gender.MALE ? t('settings_tab.male') : t('settings_tab.female')}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
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
                                {t('settings_tab.remove')}
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
                        {showAllShifts ? t('settings_tab.show_less') : t('settings_tab.show_more')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {activeTab === "Other" && (
              // Other settings
              <div className="flex flex-col mb-4">
                <p>{t('settings_tab.import_employees_csv')}</p>
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
                  {loading ? t('settings_tab.importing') : t('settings_tab.import')}
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
                  <span className="mx-2 text-gray-500">{t('settings_tab.or')}</span>
                  <hr className="flex-grow border-t" />
                </div>
                {/* Form to create a single employee */}
                <div className="flex flex-col">
                  <p>{t('settings_tab.create_single_employee')}</p>
                  <input
                    type="text"
                    placeholder={t('settings_tab.employee_name')}
                    value={employeeName ?? ""}
                    onChange={(e) => {
                      setEmployeeName(e.target.value);
                    }}
                    className="mt-2 p-2 border border-gray-300 rounded"
                  />
                  <input required
                    type="text"
                    placeholder={t('settings_tab.employee_role')}
                    value={employeeRole ?? ""}
                    onChange={(e) => {
                      setEmployeeRole(e.target.value);
                    }}
                    className="mt-2 p-2 border border-gray-300 rounded"
                  />
                  <select defaultValue={'DEFAULT'}
                    onChange={(e) => {
                      setEmployeeGender(e.target.value as Gender);
                    }}
                    className="mt-2 p-2 border border-gray-300 rounded"
                  >
                  <option value="" disabled>{t('settings_tab.select_gender')}</option>
                  <option value={Gender.MALE}>{t('settings_tab.male')}</option>
                  <option value={Gender.FEMALE}>{t('settings_tab.female')}</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleCreateEmployee(employeeName ?? "", employeeRole ?? "", employeeGender ?? Gender.PREFER_NOT_TO_SAY)}
                    className={`py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-500 mt-4 ${
                      creating || !employeeGender || !employeeName || !employeeRole ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={creating || !employeeGender || !employeeName || !employeeRole}
                  >
                    {creating ? t('settings_tab.creating_employee') : t('settings_tab.create_employee')}
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
                  {loading ? t('settings_tab.applying') : t('settings_tab.apply')}
                </button>
              )}
              <button
                className="py-1.5 border border-indigo-600 bg-white text-indigo-600 rounded hover:bg-indigo-600 hover:text-white w-full"
                onClick={onClose}
              >
                {t('settings_tab.close')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;
