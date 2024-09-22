"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import LoadingSpinner from "./LoadingSpinner";

interface NavigationProps {
  isLoggedIn: boolean;
  onLogout: () => void;
  activePage: string;
}

const activePageCss =
  "border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-md font-medium";
const inactivePageCss =
  "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-md font-medium";

const Navigation: React.FC<NavigationProps> = ({ isLoggedIn, onLogout, activePage }) => {
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);

  const handleNavigation = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  if (!isLoggedIn) return null;

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-semibold text-gray-800">EMPLOYEE SCHEDULER</span>
            </div>
            <div className="hidden sm:flex sm:space-x-8">
              <Link
                onClick={() => handleNavigation()}
                className={activePage === "schedule" ? activePageCss : inactivePageCss}
                href="/schedule"
              >
                Schedule
              </Link>
              <Link
                onClick={() => handleNavigation()}
                className={activePage === "planning" ? activePageCss : inactivePageCss}
                href="/planning"
              >
                Planning
              </Link>
            </div>
            <div className="hidden sm:flex sm:items-center">
              <button
                onClick={onLogout}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
