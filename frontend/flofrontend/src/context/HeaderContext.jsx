import { createContext, useContext, useState, useCallback } from 'react';

const HeaderContext = createContext();

export const useHeader = () => {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
};

export const HeaderProvider = ({ children }) => {
  const [headerInfo, setHeaderInfo] = useState({
    title: 'Healthcare Dashboard',
    subtitle: 'Manage your healthcare services'
  });

  const updateHeader = useCallback((title, subtitle) => {
    setHeaderInfo(prev => {
      if (prev.title === title && prev.subtitle === subtitle) {
        return prev;
      }
      return { title, subtitle };
    });
  }, []);

  return (
    <HeaderContext.Provider value={{ headerInfo, updateHeader }}>
      {children}
    </HeaderContext.Provider>
  );
};
