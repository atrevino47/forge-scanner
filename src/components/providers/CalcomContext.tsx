'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';

interface CalcomPrefill {
  name?: string;
  email?: string;
  phone?: string;
  source?: string;
}

interface CalcomContextValue {
  isOpen: boolean;
  hasBooked: boolean;
  showConfirmation: boolean;
  prefill: CalcomPrefill;
  openCalcom: (prefill?: CalcomPrefill) => void;
  closeCalcom: () => void;
  onBookingSuccess: () => void;
}

const CalcomContext = createContext<CalcomContextValue | null>(null);

export function CalcomProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasBooked, setHasBooked] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [prefill, setPrefill] = useState<CalcomPrefill>({});
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openCalcom = useCallback((pf?: CalcomPrefill) => {
    if (pf) setPrefill(pf);
    setIsOpen(true);
  }, []);

  const closeCalcom = useCallback(() => setIsOpen(false), []);

  const onBookingSuccess = useCallback(() => {
    setHasBooked(true);
    setIsOpen(false);
    setShowConfirmation(true);
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = setTimeout(
      () => setShowConfirmation(false),
      3000,
    );
  }, []);

  return (
    <CalcomContext.Provider
      value={{
        isOpen,
        hasBooked,
        showConfirmation,
        prefill,
        openCalcom,
        closeCalcom,
        onBookingSuccess,
      }}
    >
      {children}
    </CalcomContext.Provider>
  );
}

export function useCalcom() {
  const ctx = useContext(CalcomContext);
  if (!ctx) throw new Error('useCalcom must be used within CalcomProvider');
  return ctx;
}
