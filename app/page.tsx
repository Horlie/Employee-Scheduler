"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Employee } from "./types/scheduler";
import Navigation from "./components/Navigation";
import LandingPage from "./components/LandingPage";
import LoginModal from "./components/LoginModal";

const CustomScheduler = dynamic(() => import("./components/CustomScheduler"), {
  ssr: false,
});

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      setIsLoggedIn(true);
      fetchEmployees();
    }
  }, []);

  const fetchEmployees = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await fetch(`/api/employees?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees);
      } else {
        console.error("Failed to fetch employees");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
    fetchEmployees();
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setEmployees([]);
  };

  return (
    <div className="flex flex-col">
      <Navigation isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      {isLoggedIn ? (
        <div className="flex-grow overflow-y-auto rounded-2xl border-2 border-gray-300 mt-10 bg-gray-100 overflow-x-auto">
          <CustomScheduler employees={employees} initialEvents={[]} />
        </div>
      ) : (
        <LandingPage onLoginClick={() => setIsLoginModalOpen(true)} />
      )}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLogin}
      />
    </div>
  );
}
