'use client';

import { useWallet } from '@/contexts/WalletContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaInfoCircle, FaEthereum } from '@/components/icons';
import { Button } from '@/components/ui/Button';

export default function AuthorizationBanner() {
  const { isConnected, isAuthorized, connectWallet } = useWallet();

  if (isAuthorized) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 mb-6"
      >
        <div className="flex items-start gap-3">
          <FaInfoCircle className="size-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
              {isConnected ? '인가되지 않은 지갑' : '지갑 연결 필요'}
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
              {isConnected ? (
                <>
                  현재 연결된 지갑은 <span className="font-semibold text-yellow-900 dark:text-yellow-100">toris-dev</span>의 할일을 추가, 수정, 삭제할 권한이 없습니다. 할일은 누구나 볼 수 있지만, 변경하려면 인가된 지갑으로 연결해주세요.
                </>
              ) : (
                <>
                  <span className="font-semibold text-yellow-900 dark:text-yellow-100">toris-dev</span>의 할일을 추가, 수정, 삭제하려면 이더리움 지갑(MetaMask 등)을 연결해주세요. 할일은 누구나 볼 수 있습니다.
                </>
              )}
            </p>
            {!isConnected && (
              <Button
                onClick={connectWallet}
                size="sm"
                className="gap-2 bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <FaEthereum className="size-4" />
                지갑 연결하기
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

