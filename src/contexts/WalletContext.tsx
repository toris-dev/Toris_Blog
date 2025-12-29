'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isAuthorized: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isLoading: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// 인가된 주소 목록 (환경 변수에서 가져오거나 기본값 사용)
const getAuthorizedAddresses = (): string[] => {
  if (typeof window === 'undefined') return [];
  
  const envAddresses = process.env.NEXT_PUBLIC_AUTHORIZED_ADDRESSES;
  if (envAddresses) {
    return envAddresses.split(',').map(addr => addr.trim().toLowerCase());
  }
  
  // 기본값: 빈 배열 (환경 변수가 없으면 아무도 인가되지 않음)
  return [];
};

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const authorizedAddresses = getAuthorizedAddresses();

  // 지갑 연결 상태 확인
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window === 'undefined' || !window.ethereum) {
        setIsLoading(false);
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const userAddress = await signer.getAddress();
          setAddress(userAddress.toLowerCase());
        }
      } catch (error) {
        console.error('지갑 연결 확인 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkWalletConnection();

    // 계정 변경 감지
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0].toLowerCase());
        } else {
          setAddress(null);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      toast.error('MetaMask 또는 다른 이더리움 지갑을 설치해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // 계정 접근 권한 요청
      await provider.send('eth_requestAccounts', []);
      
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const normalizedAddress = userAddress.toLowerCase();
      
      setAddress(normalizedAddress);
      toast.success('지갑이 연결되었습니다.');
    } catch (error: any) {
      console.error('지갑 연결 실패:', error);
      if (error.code === 4001) {
        toast.error('지갑 연결이 거부되었습니다.');
      } else {
        toast.error('지갑 연결에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    toast.success('지갑 연결이 해제되었습니다.');
  };

  const isConnected = !!address;
  const isAuthorized = isConnected && authorizedAddresses.length > 0
    ? authorizedAddresses.includes(address.toLowerCase())
    : false;

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        isAuthorized,
        connectWallet,
        disconnectWallet,
        isLoading
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// Window 타입 확장
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
      removeListener: (event: string, callback: (accounts: string[]) => void) => void;
      send: (method: string, params?: any[]) => Promise<any>;
    };
  }
}

