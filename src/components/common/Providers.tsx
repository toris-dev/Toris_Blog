'use client';

import ToasterContext from '@/components/context/ToasterContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useMemo,
  useState
} from 'react';

const SidebarContext = createContext<{
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}>({
  isOpen: false,
  setIsOpen: () => {}
});

const Providers = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const [queryClient] = useState(() => new QueryClient());

  const sidebarContextValue = useMemo(() => ({ isOpen, setIsOpen }), [isOpen]);

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ToasterContext />
        <SidebarContext.Provider value={sidebarContextValue}>
          {children}
        </SidebarContext.Provider>
      </QueryClientProvider>
    </SessionProvider>
  );
};

export default Providers;

export const useSidebar = () => useContext(SidebarContext);
