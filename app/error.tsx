"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ">
      <div className="bg-white p-4 rounded">
        <div className="p-4 bg-red-100 text-red-800 rounded">
          <h2>Something went wrong!</h2>
          <pre>{error.message}</pre>
          <button
            onClick={() => reset()}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}