'use client';

import ToasterContext from '@/components/context/ToasterContext';
import { SidebarProvider } from '@/components/common/SidebarToggle';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';

const Providers = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="cyberpunk" enableSystem={false}>
        <SidebarProvider>
          <ToasterContext />
          {children}
        </SidebarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default Providers;
