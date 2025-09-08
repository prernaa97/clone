import { createContext, useCallback, useContext, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const StatsContext = createContext();

export const useStats = () => {
  const ctx = useContext(StatsContext);
  if (!ctx) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return ctx;
};

export const StatsProvider = ({ children }) => {
  const [pendingCount, setPendingCount] = useState(0);

  const refreshStats = useCallback(async (tokenOverride) => {
    try {
      const token = tokenOverride || Cookies.get('token');
      if (!token) return;
      const response = await axios.get('http://localhost:5000/api/profiles/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) {
        setPendingCount(response.data.stats?.pending || 0);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to refresh stats', error);
    }
  }, []);

  return (
    <StatsContext.Provider value={{ pendingCount, setPendingCount, refreshStats }}>
      {children}
    </StatsContext.Provider>
  );
};


