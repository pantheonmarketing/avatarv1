"use client"

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";

interface ThemeProviderProps {
  children: ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  [key: string]: any; // Allow additional props
}

export function NextThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <ThemeProvider {...props} defaultTheme="dark">
      {children}
    </ThemeProvider>
  );
}
