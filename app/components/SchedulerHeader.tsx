import React from "react";

interface SchedulerHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSettingsClick: () => void;
  onSolveClick: () => void; // Ensure this prop is defined
  showSettings: boolean;
  loading: boolean; // If using loading state
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
}) => {
  return (
    <div
      className={`flex bg-gray-100 justify-between items-center px-10 py-5 border-b border-gray-300`}
    >
      <div className="text-left ml-3 text-lg text-gray-700 font-bold uppercase tracking-widest">
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
              className="px-3 py-1.5 bg-white font-medium border-y border-gray-300 hover:bg-gray-100"
              onClick={onToday}
            >
              Today
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
                type="button"
                className={`px-3 py-1.5 ml-2 text-white font-medium rounded-lg bg-green-600 hover:bg-green-700 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={onSolveClick}
                disabled={loading}
              >
                {loading ? "Solving..." : "Solve"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchedulerHeader;
