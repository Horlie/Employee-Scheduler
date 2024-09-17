import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import React from "react";
import { EmployeeProvider } from "./context/EmployeeContext"; // Import the provider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Scheduler",
  description: "Employee Scheduler",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        +{" "}
        <EmployeeProvider>
          {" "}
          {/* Wrap with provider */}
          {children}
        </EmployeeProvider>
      </body>
    </html>
  );
}
