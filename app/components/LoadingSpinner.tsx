import React from "react";

const LoadingSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ">
      <div className="bg-white p-4 rounded">
        <img src="/spinner.gif" alt="Loading..." className="w-16 h-16" />
      </div>
    </div>
  );
};

export default LoadingSpinner;
