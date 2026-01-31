import React, { createContext, useContext, useState, useEffect } from 'react';

interface TimeContextValue {
  currentTime: Date;
  tick: number;
}

const TimeContext = createContext<TimeContextValue | undefined>(undefined);

export const TimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tick, setTick] = useState(0);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <TimeContext.Provider value={{ currentTime, tick }}>
      {children}
    </TimeContext.Provider>
  );
};

export const useTime = (): TimeContextValue => {
  const context = useContext(TimeContext);
  if (!context) {
    throw new Error('useTime must be used within TimeProvider');
  }
  return context;
};
