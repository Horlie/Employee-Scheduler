import React, { useEffect, useRef, useState } from "react";

interface SchedulerHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSettingsClick: () => void;
  onSolveClick: () => void;
  showSettings: boolean;
  loading: boolean;

  onDownloadClick: () => void;
  isDownloading: boolean;

  onSaveChanges: () => void;

}

const SchedulerHeader: React.FC<SchedulerHeaderProps> = ({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  onSettingsClick,
  onSolveClick,
  showSettings,
  loading,

  onDownloadClick,
  isDownloading,

  onSaveChanges,

}) => {
  return (
    <div
      className={`flex bg-gray-100 justify-between items-center px-10 py-5 border-b border-gray-300`}>
      <div className="text-left ml-3 text-2xl text-gray-700 font-bold uppercase tracking-widest">
        {currentDate.toLocaleString("en-GB", {
          month: "long",
          year: "numeric",
        })}
      </div>
      <div className="flex items-center">
        
        <div className="flex">
          <div className="flex mr-2">
            <button
              className="px-3 py-1.5 bg-white rounded-l text-gray-400 pb-1.5 border border-r-0 border-gray-300 hover:text-gray-500 hover:bg-gray-100"
              onClick={onPrevMonth}
            >
              &lt;
            </button>
            <button
              className="px-3 py-1.5 bg-white font-medium border border-gray-300 hover:bg-gray-100"
              onClick={onToday}
            >
              Current Month
            </button>
            <button
              className="px-3 py-1.5 bg-white rounded-r text-gray-400 pb-1.5 border border-l-0 border-gray-300 hover:text-gray-500 hover:bg-gray-100"
              onClick={onNextMonth}
            >
              &gt;
            </button>
          </div>

          {showSettings && (
            <>
              <div className="w-px h-py bg-gray-300 mx-2"></div>
              <button
                className="px-3 py-1.5 ml-2 text-white font-medium rounded-md bg-indigo-600 hover:bg-indigo-700"
                onClick={onSettingsClick}
              >
                Settings
              </button>
            </>
          )}
          {!showSettings && (
            <>
              <div className="w-px h-py bg-gray-300 mx-2"></div>
              <button
                onClick={onSaveChanges}
                disabled={loading}
                className="px-4 py-1.5 mr-2 font-semibold bg-teal-500 text-white rounded-lg shadow-md hover:bg-teal-600 disabled:bg-gray-400"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 ml-2 text-white font-medium rounded-lg bg-green-600 hover:bg-green-700 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={onSolveClick}
                disabled={loading}
              >
                {loading ? "Solving..." : "Solve"}
              </button>

              <button
                onClick={onDownloadClick}
                disabled={loading || isDownloading} 
                className="px-4 py-2 font-semibold bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isDownloading ? "Creating PDF..." : "Download as PDF"}
              </button>


            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchedulerHeader;
