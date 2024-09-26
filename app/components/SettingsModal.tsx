import React, { useState, useEffect } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: string[];
}

interface Shift {
  id?: number;
  userId: number;
  startTime: string;
  endTime: string;
  days: string[];
  role: string[];
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
  const [userId, setUserId] = useState<number>(0); // Added userId state
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]); // Added selectedRoles state
  const [showAllShifts, setShowAllShifts] = useState(false); // {{ edit_1 }}
  const [monthlyHours, setMonthlyHours] = useState<number>(0);
  const [dailyShiftsPerWorkerPerMonth, setDailyShiftsPerWorkerPerMonth] = useState<number>(0);
  const [initialMonthlyHours, setInitialMonthlyHours] = useState<number>(0);
  const [initialDailyShiftsPerWorkerPerMonth, setInitialDailyShiftsPerWorkerPerMonth] =
    useState<number>(0);

  const initializeRoleSettings = () => {
    const initialSettings: { [key: string]: { min: number; max: number } } = {};
    roles.forEach((role) => {
      initialSettings[role] = { min: 0, max: 0 };
    });
    return initialSettings;
  };

  const [roleSettings, setRoleSettings] = useState<{ [key: string]: { min: number; max: number } }>(
    initializeRoleSettings()
  );
  const [initialRoleSettings, setInitialRoleSettings] = useState<{
    [key: string]: { min: number; max: number };
  }>(initializeRoleSettings());

  useEffect(() => {
    if (isOpen) {
      const user = localStorage.getItem("user");
      if (user) {
        const parsedUser = JSON.parse(user);
        setUserId(parsedUser.id);
      } else {
        setError("User not found. Please log in again.");
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Fetch shifts from the database
      fetch("/api/shifts")
        .then((res) => res.json())
        .then((data) => setActiveShifts(data))
        .catch(() => setError("Failed to fetch shifts. Please try again."));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const user = localStorage.getItem("user");
      if (user) {
        const parsedUser = JSON.parse(user);
        fetch("/api/settings", {
          method: "POST", // Using POST for fetching
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: parsedUser.email,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.error) {
              setError(data.error);
            } else if (!data.roleSettings) {
              setError("Role settings are missing in the fetched data.");
            } else {
              setMonthlyHours(data.monthlyHours);
              setInitialMonthlyHours(data.monthlyHours);
              setDailyShiftsPerWorkerPerMonth(data.dailyShiftsPerWorkerPerMonth);
              setInitialDailyShiftsPerWorkerPerMonth(data.dailyShiftsPerWorkerPerMonth);
              const updatedRoleSettings = initializeRoleSettings();
              roles.forEach((role) => {
                if (data.roleSettings && data.roleSettings[role]) {
                  updatedRoleSettings[role] = {
                    min: data.roleSettings[role].min,
                    max: data.roleSettings[role].max,
                  };
                } else {
                  console.warn(`RoleSettings for "${role}" is missing. Using default values.`);
                }
              });
              setRoleSettings(updatedRoleSettings);
              setInitialRoleSettings(updatedRoleSettings);
            }
          })
          .catch((error) => {
            console.error("Error fetching settings:", error);
            setError("Failed to fetch settings. Please try again.");
          });
      } else {
        setError("User not found. Please log in again.");
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
      userId, // Include userId
      startTime,
      endTime,
      days: shiftDays,
      role: selectedRoles, // Include selected roles
    };
    if (isFullDay) {
      newShift.startTime = "00:00";
      newShift.endTime = "23:59";
    }
    setPendingShifts([...pendingShifts, newShift]);
    setActiveShifts([...activeShifts, newShift]);
    setSelectedRoles([]); // Reset selectedRoles after submission
    // ... existing logic ...
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
          body: JSON.stringify({ add: pendingShifts, delete: shiftsToDelete }),
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
          dailyShiftsPerWorkerPerMonth: dailyShiftsPerWorkerPerMonth,
          roleSettings: roleSettings, // Changed from 'roles' to 'roleSettings'
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-6 w-150 max-h-[90vh] overflow-y-auto">
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
            <div className="flex flex-row justify-between">
              <label htmlFor="monthlyHours" className="content-center">
                Hours per month
              </label>
              <input
                id="monthlyHours"
                type="text"
                className="w-40 p-2 focus:border-b-2 focus:border-indigo-500 border-b border-gray-300 outline-none bg-gray-50 placeholder:text-center"
                placeholder={initialMonthlyHours.toString()}
                onChange={(e) => setMonthlyHours(parseInt(e.target.value))}
              />
            </div>
            <div className="flex flex-row justify-between gap-4">
              <label htmlFor="dailyShifts" className=" content-center">
                Daily shifts per worker per month
              </label>
              <input
                id="dailyShifts"
                type="text"
                className="w-40 p-2 focus:border-b-2 focus:border-indigo-500 border-b border-gray-300 outline-none bg-gray-50 placeholder:text-center"
                placeholder={initialDailyShiftsPerWorkerPerMonth.toString()}
                onChange={(e) => setDailyShiftsPerWorkerPerMonth(parseInt(e.target.value))}
              />
            </div>

            {roles && roles.length > 0 ? (
              roles
                .map((role) => (
                  <React.Fragment key={role}>
                    <div className="flex-grow flex items-center justify-center mt-2">
                      <span className="text-xl tracking-wide font-normal text-gray-500 uppercase">
                        {role}
                      </span>
                    </div>
                    <hr className="w-full h-[1px] bg-gray-300 mb-2" />
                    <div className="flex flex-row justify-between">
                      <label htmlFor={`workersPerDay-${role}`} className="content-center">
                        Workers per day
                      </label>
                      <span className="mx-2 content-center">min</span>
                      <input
                        id={`minumumWorkersPerDay-${role}`}
                        type="text"
                        className="w-20 p-2 focus:border-b-2 focus:border-indigo-500 border-b border-gray-300 outline-none bg-gray-50 placeholder:text-center"
                        placeholder={initialRoleSettings[role]?.min.toString() || "0"}
                        onChange={(e) =>
                          setRoleSettings({
                            ...roleSettings,
                            [role]: {
                              ...roleSettings[role],
                              min: parseInt(e.target.value),
                            },
                          })
                        }
                      />
                      <span className="mx-2 content-center">max</span>
                      <input
                        id={`maximumWorkersPerDay-${role}`}
                        type="text"
                        className="w-20 p-2 focus:border-b-2 focus:border-indigo-500 border-b border-gray-300 outline-none bg-gray-50 placeholder:text-center"
                        placeholder={initialRoleSettings[role]?.max.toString() || "0"}
                        onChange={(e) =>
                          setRoleSettings({
                            ...roleSettings,
                            [role]: {
                              ...roleSettings[role],
                              max: parseInt(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                  </React.Fragment>
                ))
                .reverse()
            ) : (
              <p>No roles available.</p>
            )}
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
                    disabled={isFullDay}
                    className={`p-2 border border-gray-300 rounded focus:outline-none focus:border-indigo-500 ${
                      isFullDay ? "bg-gray-200 cursor-not-allowed" : ""
                    }`}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
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
                    onChange={() => setIsFullDay(!isFullDay)}
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

              <div className="flex flex-wrap gap-2">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                  (day) => (
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
                  )
                )}
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
                              {shift.startTime === "00:00" && shift.endTime === "23:59" ? (
                                <span>Full Day</span>
                              ) : (
                                <span>
                                  {shift.startTime} - {shift.endTime}
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
                                <span key={day} className="px-2 py-1 bg-gray-200 text-xs rounded">
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
                              {shift.startTime === "00:00" && shift.endTime === "23:59" ? (
                                <span>Full Day</span>
                              ) : (
                                <span>
                                  {shift.startTime} - {shift.endTime}
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
                                <span key={day} className="px-2 py-1 bg-gray-200 text-xs rounded">
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
            <p>Nothing in here yet</p>
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
          <button
            className="py-1.5 border border-indigo-600 bg-white text-indigo-600 rounded hover:bg-indigo-600 hover:text-white w-full"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
