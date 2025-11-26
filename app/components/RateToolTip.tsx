import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";


interface RateToolTipProps {
  employeeId: string;
  currentRate: number;
  onRateUpdate: (newRate: number) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

const RateToolTip: React.FC<RateToolTipProps> = ({
  employeeId,
  currentRate,
  onRateUpdate,
  onClose,
  position,
}) => {
  const [rate, setRate] = useState<string>(currentRate.toFixed(1));
  const [error, setError] = useState<string>("");
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      // Allow only one decimal place
      setRate(value);
      setError("");
    } else {
      setError(t('rate_tooltip.error_invalid_number'));
    }
  };

  const handleSubmit = async () => {
    const parsedRate = parseFloat(rate);
    if (isNaN(parsedRate) || parsedRate < 0.0 || parsedRate > 1.0) {
      setError(t('rate_tooltip.error_range'));
      return;
    }

    try {
      const response = await fetch(`/api/employees/update-rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          newRate: parsedRate,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        onRateUpdate(parsedRate);
        onClose();
      } else {
        setError(data.error || t('rate_tooltip.error_failed_update'));
      }
    } catch (err) {
      console.error("Error updating rate:", err);
      setError(t('rate_tooltip.error_unexpected'));
    }
  };

  // Handle outside clicks to close the tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Handle Escape key to close the tooltip
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={tooltipRef}
      className="absolute bg-white border border-gray-300 p-2 rounded shadow-lg z-50 flex flex-row items-center justify-center"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        transform: "translate(0, 0)", // Adjust as needed
      }}
    >
      <input
        type="number"
        step="0.1"
        min="0.0"
        max="1.0"
        value={rate}
        onChange={handleChange}
        className="p-1 w-20 text-center focus:border-b-2 focus:border-indigo-500 border-b border-gray-300 outline-none bg-gray-50"
        autoFocus
      />
      {error && <div className="text-red-500 text-sm">{error}</div>}

      <button
        onClick={handleSubmit}
        className="bg-indigo-500 text-white px-2 py-1 ml-2 rounded hover:bg-indigo-600"
      >
        {t('rate_tooltip.save')}
      </button>
    </div>
  );
};

export default RateToolTip;
