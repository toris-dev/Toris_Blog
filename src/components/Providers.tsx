'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useMemo,
  useState
} from 'react';

function makeQueryClient() {
  return new QueryClient({});
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

const SidebarContext = createContext<{
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}>({
  isOpen: false,
  setIsOpen: () => {}
});

const Providers = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = getQueryClient();
  const sidebarContextValue = useMemo(() => ({ isOpen, setIsOpen }), [isOpen]);
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarContext.Provider value={sidebarContextValue}>
        {children}
      </SidebarContext.Provider>
    </QueryClientProvider>
  );
};

export default Providers;

export const useSidebar = () => useContext(SidebarContext);
