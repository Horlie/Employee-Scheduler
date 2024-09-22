"use client";

import React, { useState, useEffect } from "react";
import CustomScheduler from "../components/CustomScheduler";
import LoadingSpinner from "../components/LoadingSpinner";
import Navigation from "../components/Navigation";
import { useRouter } from "next/navigation";
import { useEmployee } from "../context/EmployeeContext";

export default function Schedule() {
  const { employees, setEmployees } = useEmployee();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      setIsLoggedIn(true);
    } else {
      setIsLoading(false); // Stop loading if not logged in
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setEmployees([]);
    router.replace("/");
  };
  return (
    <>
      <Navigation isLoggedIn={isLoggedIn} onLogout={handleLogout} activePage="schedule" />
      {isLoading && <LoadingSpinner />}
      <div className="flex-grow overflow-y-auto rounded-2xl border-2 border-gray-300 mt-16 bg-gray-100 overflow-x-auto">
        <CustomScheduler
          employees={employees}
          cellColors={{}}
          setCellColors={() => {}}
          availabilityData={[]}
          setAvailabilityData={() => {}}
          showSettings={false}
          showTooltips={false}
          roles={[]}
        />
      </div>
    </>
  );
}
