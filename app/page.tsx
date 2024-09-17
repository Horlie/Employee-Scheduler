"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Updated import for Next.js App Directory
import LandingPage from "./components/LandingPage";
import LoginModal from "./components/LoginModal";
import LoadingSpinner from "./components/LoadingSpinner";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      setIsLoggedIn(true);
      router.replace("/planning"); // Redirect to Planning if logged in
    } else {
      setIsLoading(false); // Stop loading if not logged in
    }
  }, [router]);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
    router.replace("/planning"); // Redirect after successful login
  };

  return (
    <div className="flex flex-col">
      {isLoading ? (
        <LoadingSpinner /> // Show loading spinner while checking auth
      ) : (
        !isLoggedIn && <LandingPage onLoginClick={() => setIsLoginModalOpen(true)} />
      )}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLogin} // Handle successful login
      />
    </div>
  );
}
