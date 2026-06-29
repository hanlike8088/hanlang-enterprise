import { createContext, useContext } from 'react';

interface ResponsiveContextType {
  isMobile: boolean;
}

export const ResponsiveContext = createContext<ResponsiveContextType>({ isMobile: false });

export function useResponsive() {
  return useContext(ResponsiveContext);
}
