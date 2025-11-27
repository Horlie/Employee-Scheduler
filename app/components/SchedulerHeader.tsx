import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

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

  isDirty?: boolean;
  onSaveChanges?: () => void;
  onCancelChanges?: () => void;


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

  isDirty,
  onSaveChanges,
  onCancelChanges,


}) => {
  const { t, i18n } = useTranslation();
  const [dateLabel, setDateLabel] = useState<string>("");
  useEffect(() => {
    setDateLabel(
      currentDate.toLocaleString(i18n.language, {
        month: "long",
        year: "numeric",
      })
    );
  }, [currentDate, i18n.language]);
  return (
    <div className="relative flex bg-gray-100 justify-between items-center px-10 py-5 border-b border-gray-300">
      <div className="text-left ml-3 text-2xl text-gray-700 font-bold uppercase tracking-widest">
        {dateLabel || "\u00A0"}
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
              {t('scheduler_header.current_month')}
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
                {t('scheduler_header.settings')}
              </button>
            </>
          )}
          {!showSettings && (
            <>
              <div className="w-px h-py bg-gray-300 mx-2"></div>
              {isDirty ? (
                <div className="bg-white p-2 rounded-lg shadow-md flex items-center gap-2 border border-gray-200">
                  <p className="text-sm text-gray-600 mr-2 px-2">{t('scheduler_header.unsaved_changes')}</p>
                  <button
                    onClick={onCancelChanges}
                    className="px-4 py-2 text-sm font-semibold bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    {t('scheduler_header.cancel')}
                  </button>
                  <button
                    onClick={onSaveChanges}
                    className="px-4 py-2 text-sm font-semibold bg-teal-500 text-white rounded-md shadow-sm hover:bg-teal-600"
                  >
                    {t('scheduler_header.save_changes')}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    className={`px-3 py-1.5 ml-2 text-white font-medium rounded-lg bg-green-600 hover:bg-green-700 ${
                      loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={onSolveClick}
                    disabled={loading}
                  >
                    {loading ? t('scheduler_header.solving') : t('scheduler_header.solve')}
                  </button>

                  <button
                    onClick={onDownloadClick}
                    disabled={loading || isDownloading}
                    className="px-4 py-2 ml-2 font-semibold bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isDownloading ? t('scheduler_header.creating_pdf') : t('scheduler_header.download_pdf')}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchedulerHeader;
