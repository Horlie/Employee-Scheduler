import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import { EmployeeProvider } from "./context/EmployeeContext"; // Import the provider
import I18nProvider from "./i18n-provider"; 

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
        
        <I18nProvider>
          <EmployeeProvider>
            {" "}
            {/* Wrap with provider */}
            {children}
          </EmployeeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
