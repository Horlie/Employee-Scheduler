import React from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";

interface LandingPageProps {
  onLoginClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative overflow-hidden">
      {/* Background illustration */}
      <div className="absolute inset-0 z-0 opacity-20">
        <Image
          src="/calendar-background.svg"
          alt="Calendar Background"
          fill
          style={{ objectFit: "cover" }}
        />
      </div>

      {/* Content */}
      <div className="z-10 text-center px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-800">
          {t('landing.title')}
        </h1>
        <p className="text-xl text-center max-w-2xl mb-8 text-gray-600">
          {t('landing.description')}
        </p>
        <button
          onClick={onLoginClick}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105"
        >
          {t('landing.login_button')}
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
