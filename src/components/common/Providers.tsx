'use client';

import ToasterContext from '@/components/context/ToasterContext';
import { SidebarProvider } from '@/components/common/SidebarToggle';
import { TodoProvider } from '@/contexts/TodoContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';

const Providers = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={true}
        themes={['light', 'dark']}
      >
        <WalletProvider>
          <TodoProvider>
        <SidebarProvider>
          <ToasterContext />
          {children}
        </SidebarProvider>
          </TodoProvider>
        </WalletProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default Providers;
