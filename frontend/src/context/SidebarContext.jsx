import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('vector_sidebar_collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('vector_sidebar_collapsed', JSON.stringify(isCollapsed));
    } catch (err) {
      console.error('Failed to save sidebar state:', err);
    }
  }, [isCollapsed]);

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);
  const toggleMobile = () => setIsMobileOpen((prev) => !prev);
  const closeMobile = () => setIsMobileOpen(false);
  const openMobile = () => setIsMobileOpen(true);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        toggleCollapse,
        isMobileOpen,
        toggleMobile,
        closeMobile,
        openMobile
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
