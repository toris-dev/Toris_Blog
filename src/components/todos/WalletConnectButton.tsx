'use client';

import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/Button';
import { FaEthereum, FaSignOutAlt } from '@/components/icons';
import { motion } from 'framer-motion';
import { cn } from '@/utils/style';

export default function WalletConnectButton() {
  const { address, isConnected, isAuthorized, connectWallet, disconnectWallet, isLoading } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted animate-pulse">
        <div className="size-4 rounded-full bg-muted-foreground/20" />
        <span className="text-sm text-muted-foreground">연결 중...</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2"
      >
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg border",
          isAuthorized
            ? "border-green-500/50 bg-green-500/10"
            : "border-yellow-500/50 bg-yellow-500/10"
        )}>
          <FaEthereum className={cn(
            "size-4",
            isAuthorized ? "text-green-500" : "text-yellow-500"
          )} />
          <span className={cn(
            "text-sm font-medium",
            isAuthorized ? "text-green-700 dark:text-green-400" : "text-yellow-700 dark:text-yellow-400"
          )}>
            {formatAddress(address!)}
          </span>
          {isAuthorized && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-700 dark:text-green-400 font-medium">
              인가됨
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={disconnectWallet}
          className="gap-2"
        >
          <FaSignOutAlt className="size-4" />
          <span className="hidden sm:inline">연결 해제</span>
        </Button>
      </motion.div>
    );
  }

  return (
    <Button
      onClick={connectWallet}
      className="gap-2"
      variant="default"
    >
      <FaEthereum className="size-4" />
      <span>지갑 연결</span>
    </Button>
  );
}

