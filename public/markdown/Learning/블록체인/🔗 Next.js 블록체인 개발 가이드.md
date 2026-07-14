---
title: '[Blockchain] Next.js 기반 블록체인 애플리케이션 개발 가이드'
date: 2025-07-13T12:00:00.000Z
slug: nextjs-blockchain-application-development-guide
category: 'Blockchain'
tags: [Next.js, Blockchain, Web3, NFT, Smart Contracts, Solidity, Frontend]
---

# 🔗 Next.js 기반 블록체인 애플리케이션 개발 가이드

> Next.js의 강력한 프론트엔드 기능과 블록체인 기술을 결합하여 NFT 마켓플레이스, 포인트 시스템 등 다양한 Web3 애플리케이션을 구축하는 방법을 상세히 안내합니다.

## 📋 목차

1.  [개발 환경 설정](#-개발-환경-설정)
2.  [NFT 개발: 컨트랙트부터 Next.js UI까지](#-nft-개발-컨트랙트부터-nextjs-ui까지)
3.  [포인트 시스템 구현](#-포인트-시스템-구현)
4.  [실전 프로젝트 통합 예시](#-실전-프로젝트-통합-예시)
5.  [배포 및 운영 전략](#-배포-및-운영-전략)

## 🚀 개발 환경 설정

Next.js 기반의 블록체인 애플리케이션 개발을 위한 필수 도구들을 설치하고 설정합니다.

### 필수 도구 설치

```bash
# 1. Next.js 프로젝트 초기화 (TypeScript 포함)
# Next.js 15는 React 19를 지원하며, Turbopack 개발 서버가 안정화되었습니다.
npx create-next-app@latest my-web3-app --typescript
cd my-web3-app

# 2. 블록체인 개발 도구 설치
# Hardhat: 이더리움 개발 환경 (컨트랙트 컴파일, 테스트, 배포)
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers
# OpenZeppelin Contracts: 보안 검증된 스마트 컨트랙트 라이브러리
npm install @openzeppelin/contracts
# thirdweb SDK: Next.js에서 블록체인 상호작용을 간소화하는 라이브러리
npm install @thirdweb-dev/react @thirdweb-dev/sdk

# 3. 개발 편의 도구 (선택 사항)
# Next.js 15는 next.config.ts 파일 지원 및 개선된 TypeScript 지원을 제공합니다.
# npm install web3modal @walletconnect/web3-provider
```

### Hardhat 설정

`hardhat.config.js` 파일을 설정하여 Solidity 컴파일러 버전, 네트워크 정보 등을 정의합니다.

```javascript
// hardhat.config.js
require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle'); // Waffle 플러그인 추가 (테스트 용이)

module.exports = {
  solidity: '0.8.19', // 사용할 Solidity 컴파일러 버전
  networks: {
    hardhat: {
      // 로컬 개발용 Hardhat 네트워크
      chainId: 31337 // 일반적으로 사용되는 로컬 체인 ID
    },
    mumbai: {
      // Polygon Mumbai 테스트넷 설정
      url: 'https://rpc-mumbai.maticvigil.com', // Mumbai RPC URL
      accounts: [process.env.PRIVATE_KEY] // .env 파일에서 개인 키 로드
    }
    // 다른 네트워크 (예: Sepolia, Polygon Mainnet)도 여기에 추가 가능
  },
  paths: {
    artifacts: './artifacts', // 컴파일된 컨트랙트 아티팩트 저장 경로
    sources: './contracts', // Solidity 소스 코드 경로
    cache: './cache', // 캐시 경로
    tests: './test' // 테스트 파일 경로
  }
};
```

### 환경 변수 설정

민감한 정보(API 키, 개인 키)는 `.env.local` 파일에 저장하고, `.gitignore`에 추가하여 버전 관리에서 제외합니다.

```bash
# .env.local (프로젝트 루트에 생성)
# Alchemy 또는 Infura와 같은 노드 제공자의 API 키 (선택 사항)
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
# thirdweb 대시보드에서 발급받은 클라이언트 ID (필수)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
# 컨트랙트 배포에 사용될 지갑의 개인 키 (절대 외부에 노출 금지! 테스트용으로만 사용)
PRIVATE_KEY=your_wallet_private_key
# IPFS 서비스 (예: Pinata) API 키 (NFT 이미지/메타데이터 업로드 시 필요)
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret
```

## 🎨 NFT 개발: 컨트랙트부터 Next.js UI까지

NFT(Non-Fungible Token)는 고유하고 대체 불가능한 디지털 자산입니다. Next.js를 사용하여 NFT를 민팅하고 관리하는 프론트엔드를 구축합니다.

### 1. NFT 컨트랙트 작성 (Solidity)

OpenZeppelin의 표준 ERC-721 컨트랙트를 상속받아 NFT를 생성하고 관리하는 기본 로직을 구현합니다.

```solidity
// contracts/MyNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// MyNFT 컨트랙트는 ERC721 표준을 따르며, URI 저장 및 소유자 권한을 가집니다.
contract MyNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter; // 토큰 ID를 안전하게 증가시키기 위한 라이브러리
    Counters.Counter private _tokenIds; // 발행될 NFT의 고유 ID 카운터

    // 컨트랙트 배포 시 NFT의 이름과 심볼을 설정합니다.
    constructor() ERC721("MyAwesomeNFT", "MANFT") {}

    // NFT의 URI를 오버라이드하여 ERC721URIStorage 기능을 사용합니다.
    function _baseURI() internal view virtual override returns (string memory) {
        return ""; // 기본 URI는 비워두고, 각 토큰마다 URI를 설정합니다.
    }

    // 새로운 NFT를 민팅(발행)하는 함수. 오직 컨트랙트 소유자만 호출할 수 있습니다.
    function mintNFT(address recipient, string memory tokenURI)
        public onlyOwner
        returns (uint256)
    {
        _tokenIds.increment(); // 다음 토큰 ID 증가
        uint256 newItemId = _tokenIds.current(); // 현재 토큰 ID 가져오기
        _mint(recipient, newItemId); // 지정된 주소로 NFT 발행
        _setTokenURI(newItemId, tokenURI); // NFT의 메타데이터 URI 설정
        return newItemId; // 발행된 NFT의 ID 반환
    }

    // ERC721URIStorage를 사용하기 위해 필요한 함수 오버라이드
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}
```

### 2. NFT 마켓플레이스 컨트랙트 (Solidity)

NFT를 판매하고 구매할 수 있는 마켓플레이스 로직을 구현합니다.

```solidity
// contracts/NFTMarketplace.sol
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarketplace is ReentrancyGuard {
    // 마켓 아이템의 구조체 정의
    struct MarketItem {
        uint256 itemId; // 마켓플레이스 내 아이템 고유 ID
        address nftContract; // NFT 컨트랙트 주소
        uint256 tokenId; // NFT의 고유 ID
        address payable seller; // 판매자 주소
        address payable owner; // 현재 소유자 주소 (판매 완료 후 구매자)
        uint256 price; // 판매 가격
        bool sold; // 판매 완료 여부
    }

    mapping(uint256 => MarketItem) private idToMarketItem; // itemId로 MarketItem 조회
    uint256 private _itemIds; // 마켓 아이템 ID 카운터
    uint256 private _itemsSold; // 판매된 아이템 카운터
    uint256 public listingPrice = 0.025 ether; // NFT 리스팅 수수료

    // 이벤트 정의
    event MarketItemCreated (
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    // NFT를 마켓플레이스에 리스팅하는 함수
    function createMarketItem(
        address nftContractAddress, // 리스팅할 NFT 컨트랙트 주소
        uint256 tokenId, // 리스팅할 NFT의 토큰 ID
        uint256 price // 판매 가격
    ) public payable nonReentrant {
        require(price > 0, "Price must be greater than 0");
        require(msg.value == listingPrice, "Price must be equal to listing price"); // 리스팅 수수료 확인

        _itemIds++;
        uint256 itemId = _itemIds;

        idToMarketItem[itemId] = MarketItem(
            itemId,
            nftContractAddress,
            tokenId,
            payable(msg.sender), // 판매자는 함수 호출자
            payable(address(0)), // 초기 소유자는 없음
            price,
            false // 아직 판매되지 않음
        );

        // NFT를 판매자로부터 마켓플레이스 컨트랙트로 전송
        IERC721(nftContractAddress).transferFrom(msg.sender, address(this), tokenId);

        emit MarketItemCreated(
            itemId,
            nftContractAddress,
            tokenId,
            msg.sender,
            address(0),
            price,
            false
        );
    }

    // NFT를 구매하는 함수
    function createMarketSale(
        address nftContractAddress, // 구매할 NFT 컨트랙트 주소
        uint256 itemId // 구매할 마켓 아이템 ID
    ) public payable nonReentrant {
        uint256 price = idToMarketItem[itemId].price;
        uint256 tokenId = idToMarketItem[itemId].tokenId;

        require(msg.value == price, "Please submit the asking price"); // 정확한 가격 지불 확인

        // 판매자에게 대금 전송
        idToMarketItem[itemId].seller.transfer(msg.value);
        // NFT를 마켓플레이스 컨트랙트에서 구매자에게 전송
        IERC721(nftContractAddress).transferFrom(address(this), msg.sender, tokenId);

        idToMarketItem[itemId].owner = payable(msg.sender); // 구매자를 소유자로 설정
        idToMarketItem[itemId].sold = true; // 판매 완료 처리
        _itemsSold++;
    }
}
```

### 3. Next.js NFT 컴포넌트 (React)

NFT 정보를 표시하고 구매 기능을 제공하는 React 컴포넌트입니다. Next.js의 `Image` 컴포넌트를 사용하여 이미지 최적화를 활용합니다.

```typescript
// components/NFTCard.tsx
import { useState } from "react";
import { ethers } from "ethers";
import Image from "next/image"; // Next.js Image 컴포넌트 사용

interface NFTCardProps {
  nft: {
    tokenId: string;
    name: string;
    description: string;
    image: string; // 이미지 URL
    price?: string; // 판매 가격 (선택 사항)
    owner: string; // 소유자 주소
  };
  onBuy?: (tokenId: string) => void; // 구매 핸들러 함수
}

export default function NFTCard({ nft, onBuy }: NFTCardProps) {
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    if (!onBuy) return; // 구매 함수가 없으면 실행하지 않음

    setLoading(true);
    try {
      await onBuy(nft.tokenId);
    } catch (error) {
      console.error("NFT 구매 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative h-64 w-full"> {/* Next.js Image를 위한 부모 요소 */}
        <Image
          src={nft.image}
          alt={nft.name}
          layout="fill"
          objectFit="cover"
          priority // LCP 개선을 위해 우선순위 높음
        />
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{nft.name}</h3>
        <p className="text-gray-600 mb-4">{nft.description}</p>

        {nft.price && (
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold">
              {ethers.utils.formatEther(nft.price)} ETH {/* 가격을 ETH 단위로 표시 */}
            </span>

            <button
              onClick={handleBuy}
              disabled={loading} // 로딩 중에는 버튼 비활성화
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "구매 중..." : "구매하기"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 4. NFT 민팅 페이지 (Next.js)

사용자가 NFT를 직접 발행(민팅)할 수 있는 페이지입니다. `thirdweb`의 `Web3Button`을 사용하여 지갑 연결 및 트랜잭션 서명을 간소화합니다.

```typescript
// pages/mint.tsx
import { useState } from "react";
import { useContract, useAddress, Web3Button } from "@thirdweb-dev/react";

export default function MintPage() {
  const address = useAddress(); // 현재 연결된 지갑 주소 가져오기
  const { contract } = useContract("YOUR_NFT_CONTRACT_ADDRESS"); // NFT 컨트랙트 인스턴스 가져오기

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null as File | null, // 이미지 파일 객체
  });

  // 이미지 파일 선택 핸들러
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  // NFT 민팅 로직
  const mintNFT = async () => {
    if (!contract || !formData.image) {
      alert("NFT 이름, 설명, 이미지를 모두 입력해주세요.");
      return;
    }

    try {
      // 1. 이미지를 IPFS에 업로드 (thirdweb storage 사용)
      const imageUploadResult = await contract.storage.upload(formData.image);
      const imageUrl = imageUploadResult.uris[0]; // 업로드된 이미지의 URI

      // 2. NFT 메타데이터 생성 (ERC721URIStorage 표준)
      const metadata = {
        name: formData.name,
        description: formData.description,
        image: imageUrl, // IPFS 이미지 URI
      };

      // 3. NFT 민팅 트랜잭션 전송
      // contract.call("mintNFT", [recipientAddress, tokenURI])
      // thirdweb SDK의 mintTo 함수는 메타데이터 객체를 직접 받아 처리
      const tx = await contract.erc721.mintTo(address, metadata);
      console.log("NFT 민팅 성공:", tx);
      alert("NFT가 성공적으로 민팅되었습니다!");
      // 폼 초기화
      setFormData({ name: "", description: "", image: null });
    } catch (error) {
      console.error("NFT 민팅 실패:", error);
      alert(`NFT 민팅 실패: ${error.message}`);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">NFT 민팅하기</h1>

      <form className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">NFT 이름</label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">설명</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">이미지 파일</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full p-2 border border-gray-300 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <Web3Button
          contractAddress="YOUR_NFT_CONTRACT_ADDRESS" // 실제 배포된 NFT 컨트랙트 주소로 변경
          action={mintNFT} // 버튼 클릭 시 실행될 함수
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          NFT 민팅하기
        </Web3Button>
      </form>
    </div>
  );
}
```

## 💰 포인트 시스템 구현

사용자 활동에 따라 포인트를 지급하고 관리하는 시스템을 블록체인 기반으로 구현합니다. ERC-20 토큰 표준을 활용합니다.

### 1. ERC-20 포인트 토큰 컨트랙트 (Solidity)

포인트 역할을 할 ERC-20 토큰을 발행합니다. `Ownable`을 상속받아 토큰 발행(mint) 권한을 제어합니다.

```solidity
// contracts/PointToken.sol
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// MyPointToken 컨트랙트는 ERC20 표준을 따르며, 소유자만 토큰을 발행할 수 있습니다.
contract MyPointToken is ERC20, Ownable {
    // 컨트랙트 배포 시 토큰의 이름과 심볼을 설정하고, 초기 발행량을 소유자에게 민팅합니다.
    constructor() ERC20("MyPoint", "MPT") {
        _mint(msg.sender, 1000000 * (10**decimals())); // 100만 MPT 토큰 초기 발행
    }

    // 지정된 주소로 새로운 토큰을 발행하는 함수. 오직 컨트랙트 소유자만 호출할 수 있습니다.
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // 토큰을 소각하는 함수. 토큰 소유자만 자신의 토큰을 소각할 수 있습니다.
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}
```

### 2. 포인트 리워드 시스템 컨트랙트 (Solidity)

사용자가 특정 활동(예: 일일 로그인)을 통해 포인트를 획득하고, 이를 사용하여 아이템을 교환할 수 있는 로직을 구현합니다.

```solidity
// contracts/RewardSystem.sol
pragma solidity ^0.8.19;

import "./PointToken.sol"; // 위에서 정의한 PointToken 컨트랙트 임포트
import "@openzeppelin/contracts/access/Ownable.sol";

// RewardSystem 컨트랙트는 포인트 토큰을 관리하고 보상을 지급합니다.
contract RewardSystem is Ownable {
    MyPointToken public pointToken; // 발행된 포인트 토큰 컨트랙트 주소

    mapping(address => uint256) public lastClaimTime; // 사용자별 마지막 보상 수령 시간

    uint256 public dailyReward = 100 * (10**18); // 일일 보상량 (100 MPT, 18 decimals)
    uint256 public constant CLAIM_INTERVAL = 24 hours; // 24시간마다 보상 가능

    // 이벤트 정의
    event PointsEarned(address indexed user, uint256 amount, string activity);
    event PointsRedeemed(address indexed user, uint256 amount, string item);

    // 컨트랙트 배포 시 포인트 토큰 컨트랙트 주소를 연결합니다.
    constructor(address _pointTokenAddress) {
        pointToken = MyPointToken(_pointTokenAddress);
    }

    // 사용자가 일일 보상을 청구하는 함수
    function claimDailyReward() public {
        require(
            block.timestamp >= lastClaimTime[msg.sender] + CLAIM_INTERVAL,
            "Daily reward already claimed or not enough time has passed."
        );

        lastClaimTime[msg.sender] = block.timestamp; // 마지막 청구 시간 업데이트
        pointToken.mint(msg.sender, dailyReward); // 사용자에게 포인트 토큰 발행

        emit PointsEarned(msg.sender, dailyReward, "Daily Login");
    }

    // 관리자가 특정 사용자에게 포인트를 지급하는 함수 (예: 퀘스트 완료 보상)
    function earnPoints(address user, uint256 amount, string memory activity)
        public onlyOwner // 오직 컨트랙트 소유자만 호출 가능
    {
        pointToken.mint(user, amount);
        emit PointsEarned(user, amount, activity);
    }

    // 사용자가 포인트를 사용하여 아이템을 교환하는 함수
    function redeemPoints(uint256 amount, string memory item)
        public
    {
        require(pointToken.balanceOf(msg.sender) >= amount, "Insufficient points"); // 포인트 잔액 확인

        // 사용자로부터 포인트 토큰을 컨트랙트로 전송 (소각 또는 재활용)
        pointToken.transferFrom(msg.sender, address(this), amount);
        emit PointsRedeemed(msg.sender, amount, item);

        // 실제 아이템 지급 로직 (예: NFT 발행, 데이터베이스 업데이트 등)은 여기에 추가
    }
}
```

### 3. 포인트 시스템 React 훅 (Next.js)

Next.js 컴포넌트에서 포인트 잔액을 조회하고, 보상을 청구하며, 포인트를 사용하는 기능을 쉽게 사용할 수 있도록 커스텀 훅을 만듭니다.

```typescript
// hooks/usePoints.ts
import { useState, useEffect } from 'react';
import { useContract, useAddress, useContractRead } from '@thirdweb-dev/react';
import { ethers } from 'ethers';

export function usePoints() {
  const address = useAddress(); // 현재 연결된 지갑 주소
  // 포인트 토큰 컨트랙트 인스턴스
  const { contract: pointContract } = useContract(
    process.env.NEXT_PUBLIC_POINT_TOKEN_ADDRESS
  );
  // 리워드 시스템 컨트랙트 인스턴스
  const { contract: rewardContract } = useContract(
    process.env.NEXT_PUBLIC_REWARD_SYSTEM_ADDRESS
  );

  // 사용자의 포인트 잔액 조회
  const {
    data: balance,
    isLoading: isBalanceLoading,
    refetch: refetchBalance
  } = useContractRead(pointContract, 'balanceOf', [address]);

  // 일일 보상 청구 함수
  const claimDailyReward = async () => {
    if (!rewardContract) throw new Error('Reward contract not loaded.');

    try {
      const tx = await rewardContract.call('claimDailyReward');
      await tx.wait(); // 트랜잭션이 블록에 포함될 때까지 대기
      await refetchBalance(); // 잔액 새로고침
      return tx;
    } catch (error) {
      console.error('일일 리워드 수령 실패:', error);
      throw error;
    }
  };

  // 포인트 사용 함수
  const redeemPoints = async (amount: string, item: string) => {
    if (!rewardContract) throw new Error('Reward contract not loaded.');

    try {
      // ERC-20 approve 먼저 호출 (RewardSystem이 사용자 대신 토큰을 전송할 수 있도록)
      const approveTx = await pointContract.call('approve', [
        process.env.NEXT_PUBLIC_REWARD_SYSTEM_ADDRESS,
        ethers.utils.parseEther(amount)
      ]);
      await approveTx.wait();

      const redeemTx = await rewardContract.call('redeemPoints', [
        ethers.utils.parseEther(amount),
        item
      ]);
      await redeemTx.wait();
      await refetchBalance();
      return redeemTx;
    } catch (error) {
      console.error('포인트 사용 실패:', error);
      throw error;
    }
  };

  return {
    balance: balance ? ethers.utils.formatEther(balance) : '0', // 읽기 쉬운 형태로 변환
    isBalanceLoading,
    claimDailyReward,
    redeemPoints,
    refetchBalance
  };
}
```

### 4. 포인트 대시보드 컴포넌트 (Next.js)

사용자에게 현재 포인트 잔액을 보여주고, 일일 보상 청구 및 포인트 사용 기능을 제공하는 UI 컴포넌트입니다.

```typescript
// components/PointsDashboard.tsx
import { useState } from "react";
import { usePoints } from "../hooks/usePoints"; // 위에서 정의한 커스텀 훅 임포트

export default function PointsDashboard() {
  const { balance, isBalanceLoading, claimDailyReward, redeemPoints } = usePoints();
  const [loading, setLoading] = useState(false);

  // 일일 보상 청구 버튼 클릭 핸들러
  const handleClaimReward = async () => {
    setLoading(true);
    try {
      await claimDailyReward();
      alert("일일 리워드를 성공적으로 받았습니다!");
    } catch (error) {
      alert(`리워드 수령 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 포인트 사용 버튼 클릭 핸들러
  const handleRedeem = async (amount: string, item: string) => {
    setLoading(true);
    try {
      await redeemPoints(amount, item);
      alert(`${item}을(를) 성공적으로 구매했습니다!`);
    } catch (error) {
      alert(`구매 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (isBalanceLoading) return <div className="text-center text-white">포인트 잔액 로딩 중...</div>;

  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">내 포인트</h2>
        <div className="text-4xl font-bold">
          {balance} MPT
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleClaimReward}
          disabled={loading} // 로딩 중이거나 지갑이 연결되지 않았으면 비활성화
          className="bg-white text-purple-500 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          {loading ? "처리 중..." : "일일 리워드 받기"}
        </button>

        <div className="space-y-2">
          <h3 className="font-semibold text-lg">포인트 상점</h3>
          <button
            onClick={() => handleRedeem("50", "Special Badge")}
            disabled={loading || parseFloat(balance) < 50} // 잔액 부족 시 비활성화
            className="w-full bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 disabled:opacity-50 transition-colors"
          >
            특별 뱃지 (50 MPT)
          </button>
          <button
            onClick={() => handleRedeem("100", "Premium Access")}
            disabled={loading || parseFloat(balance) < 100}
            className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            프리미엄 액세스 (100 MPT)
          </button>
        </div>
      </div>
    </div>
  );
}
```

## 🛠️ 실전 프로젝트 통합 예시

NFT와 포인트 시스템을 통합하여 간단한 블록체인 게임 플랫폼을 구축하는 예시입니다.

```typescript
// pages/game.tsx
import { useState, useEffect } from "react";
import { useAddress } from "@thirdweb-dev/react";
import NFTCard from "../components/NFTCard";
import PointsDashboard from "../components/PointsDashboard";
import { usePoints } from "../hooks/usePoints";

export default function GamePlatform() {
  const address = useAddress();
  const [gameScore, setGameScore] = useState(0);
  const [nfts, setNfts] = useState<any[]>([]); // 실제 NFT 데이터 타입에 맞게 조정
  const { earnPoints } = usePoints(); // usePoints 훅에서 earnPoints 함수 가져오기

  // 게임 플레이 로직
  const playGame = async () => {
    const score = Math.floor(Math.random() * 100); // 0-99 사이의 랜덤 점수
    setGameScore(score);

    // 점수에 따라 포인트 지급 (컨트랙트 소유자 권한 필요)
    // 실제 구현에서는 백엔드 API를 통해 관리자 지갑으로 earnPoints를 호출해야 합니다.
    let pointsToAward = 0;
    let activity = "Participation";

    if (score > 80) {
      pointsToAward = 50;
      activity = "High Score Achievement";
    } else if (score > 50) {
      pointsToAward = 20;
      activity = "Good Score";
    } else {
      pointsToAward = 10;
      activity = "Participation";
    }

    if (address && pointsToAward > 0) {
      try {
        // 이 부분은 실제로는 서버에서 호출되어야 합니다 (관리자 권한 필요)
        // 예: await fetch('/api/earn-points', { method: 'POST', body: JSON.stringify({ userAddress: address, amount: pointsToAward, activity }) });
        // 현재는 클라이언트에서 직접 호출하는 예시 (테스트용)
        // await earnPoints(address, pointsToAward.toString(), activity); // usePoints 훅의 earnPoints는 관리자용이 아님
        alert(`게임 점수: ${score}! ${pointsToAward} 포인트 획득!`);
      } catch (error) {
        console.error("포인트 지급 실패:", error);
        alert("포인트 지급에 실패했습니다.");
      }
    }
  };

  // 예시 NFT 데이터 (실제로는 컨트랙트에서 불러옴)
  useEffect(() => {
    setNfts([
      { tokenId: "1", name: "게임 아이템 #1", description: "강력한 검", image: "/images/item1.png", owner: "0x..." },
      { tokenId: "2", name: "게임 아이템 #2", description: "마법 방패", image: "/images/item2.png", owner: "0x..." },
    ]);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        블록체인 게임 플랫폼
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 포인트 대시보드 */}
        <div className="lg:col-span-1">
          <PointsDashboard />
        </div>

        {/* 게임 영역 */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">미니 게임</h2>

          <div className="text-center">
            <div className="text-2xl mb-4 text-gray-700">점수: {gameScore}</div>
            <button
              onClick={playGame}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              게임하기
            </button>
          </div>
        </div>
      </div>

      {/* NFT 갤러리 */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">게임 아이템 NFT</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {nfts.map((nft, index) => (
            <NFTCard key={index} nft={nft} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

## 🚀 배포 및 운영 전략

개발된 블록체인 애플리케이션을 실제 사용자에게 제공하기 위한 배포 및 운영 단계를 설명합니다.

### 1. 스마트 컨트랙트 배포

Hardhat 스크립트를 사용하여 개발한 스마트 컨트랙트를 테스트넷 또는 메인넷에 배포합니다.

```javascript
// scripts/deploy.js
const { ethers } = require('hardhat');

async function main() {
  // 1. MyNFT 컨트랙트 배포
  const MyNFT = await ethers.getContractFactory('MyNFT');
  const myNFT = await MyNFT.deploy();
  await myNFT.deployed();
  console.log('MyNFT 컨트랙트 주소:', myNFT.address);

  // 2. MyPointToken 컨트랙트 배포
  const MyPointToken = await ethers.getContractFactory('MyPointToken');
  const myPointToken = await MyPointToken.deploy();
  await myPointToken.deployed();
  console.log('MyPointToken 컨트랙트 주소:', myPointToken.address);

  // 3. NFTMarketplace 컨트랙트 배포
  const NFTMarketplace = await ethers.getContractFactory('NFTMarketplace');
  const nftMarketplace = await NFTMarketplace.deploy();
  await nftMarketplace.deployed();
  console.log('NFTMarketplace 컨트랙트 주소:', nftMarketplace.address);

  // 4. RewardSystem 컨트랙트 배포 (MyPointToken 주소 필요)
  const RewardSystem = await ethers.getContractFactory('RewardSystem');
  const rewardSystem = await RewardSystem.deploy(myPointToken.address); // 포인트 토큰 컨트랙트 주소 전달
  await rewardSystem.deployed();
  console.log('RewardSystem 컨트랙트 주소:', rewardSystem.address);

  // 배포된 컨트랙트 주소를 .env.local에 추가하여 Next.js 앱에서 사용
  console.log('\n--- Add these to your .env.local ---');
  console.log(`NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=${myNFT.address}`);
  console.log(
    `NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS=${nftMarketplace.address}`
  );
  console.log(`NEXT_PUBLIC_POINT_TOKEN_ADDRESS=${myPointToken.address}`);
  console.log(`NEXT_PUBLIC_REWARD_SYSTEM_ADDRESS=${rewardSystem.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 2. Next.js 애플리케이션 배포 (Vercel)

Next.js 애플리케이션은 Vercel에 쉽게 배포할 수 있습니다. 환경 변수 설정에 유의합니다.

```json
// vercel.json (선택 사항: Vercel 대시보드에서 직접 설정하는 것이 일반적)
{
  "build": {
    "env": {
      "NEXT_PUBLIC_ALCHEMY_API_KEY": "@alchemy_api_key",
      "NEXT_PUBLIC_THIRDWEB_CLIENT_ID": "@thirdweb_client_id",
      "NEXT_PUBLIC_NFT_CONTRACT_ADDRESS": "@nft_contract_address",
      "NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS": "@marketplace_contract_address",
      "NEXT_PUBLIC_POINT_TOKEN_ADDRESS": "@point_token_address",
      "NEXT_PUBLIC_REWARD_SYSTEM_ADDRESS": "@reward_system_address"
    }
  }
}
```

### 3. 모니터링 및 분석

블록체인 애플리케이션의 사용자 활동과 컨트랙트 상호작용을 추적하여 서비스 개선에 활용합니다.

```typescript
// utils/analytics.ts
// 실제 분석 도구(예: Google Analytics, Mixpanel, Dune Analytics)와 연동

export const trackNFTMint = (tokenId: string, userAddress: string) => {
  console.log(`[Analytics] NFT 민팅: Token ${tokenId}, User ${userAddress}`);
  // sendToAnalyticsService("nft_mint", { tokenId, userAddress });
};

export const trackPointsEarned = (
  userAddress: string,
  amount: string,
  activity: string
) => {
  console.log(
    `[Analytics] 포인트 획득: ${userAddress} - ${amount} MPT for ${activity}`
  );
  // sendToAnalyticsService("points_earned", { userAddress, amount, activity });
};

export const trackMarketplaceSale = (
  tokenId: string,
  price: string,
  buyerAddress: string
) => {
  console.log(
    `[Analytics] NFT 판매: Token ${tokenId}, Price ${price} ETH, Buyer ${buyerAddress}`
  );
  // sendToAnalyticsService("marketplace_sale", { tokenId, price, buyerAddress });
};
```

## 📚 추가 학습 자료 및 실무 팁

### 권장 리소스

- **thirdweb Docs**: Next.js와 Web3 개발을 위한 가장 최신화된 자료를 제공합니다.
- **OpenZeppelin Docs**: 스마트 컨트랙트 개발의 표준과 보안 모범 사례를 배울 수 있습니다.
- **Hardhat Docs**: 이더리움 개발 환경 설정 및 테스트에 대한 깊이 있는 정보를 제공합니다.
- **Ethers.js / Web3.js Docs**: 블록체인과 상호작용하는 JavaScript 라이브러리 사용법을 익힙니다.

### 실무 팁

#### 개발 단계별 체크리스트

1.  **로컬 개발**: Hardhat Network를 사용하여 빠르고 비용 없이 개발 및 테스트를 반복합니다.
2.  **테스트넷 배포**: Mumbai (Polygon), Sepolia (Ethereum) 등 테스트넷에 배포하여 실제 네트워크 환경에서 테스트하고 사용자 피드백을 받습니다.
3.  **메인넷 런칭**: 배포 전 반드시 스마트 컨트랙트 보안 감사를 받고, 철저한 테스트를 거쳐야 합니다.

#### 성능 최적화 (Next.js & Web3)

- **Turbopack Dev (Stable)**: Next.js 15에서 안정화된 Turbopack은 로컬 개발 서버의 시작 속도와 코드 업데이트 속도를 크게 향상시켜 개발 경험을 개선합니다.
- **캐싱 제어**: Next.js 15에서는 `fetch` 요청, `GET` Route Handlers, 클라이언트 탐색이 기본적으로 캐시되지 않아 개발자가 캐싱 동작을 더 명시적으로 제어할 수 있습니다. 이를 통해 불필요한 데이터 재요청을 줄일 수 있습니다.
- **React 19 지원**: React 19의 새로운 기능(예: React Compiler)을 활용하여 렌더링 성능을 최적화할 수 있습니다.
- **데이터 캐싱**: `swr` 또는 `react-query`와 같은 라이브러리를 사용하여 블록체인 데이터를 캐싱하고 UI 응답성을 높입니다.
- **서버 사이드 렌더링 (SSR) / 정적 사이트 생성 (SSG)**: Next.js의 SSR/SSG 기능을 활용하여 초기 로딩 속도를 개선하고 SEO를 최적화합니다. 특히 자주 변경되지 않는 블록체인 데이터(예: NFT 메타데이터)는 SSG로 미리 생성할 수 있습니다.
- **API Routes 활용**: 민감한 트랜잭션(예: 관리자 권한이 필요한 민팅)은 Next.js API Routes를 통해 백엔드에서 처리하여 개인 키 노출 위험을 줄입니다.
- **이미지 최적화**: Next.js `Image` 컴포넌트를 사용하여 NFT 이미지 등을 자동으로 최적화하고 지연 로딩합니다.
- **개선된 TypeScript 지원**: Next.js 15는 더 빠른 타입 검사와 향상된 에디터 통합을 제공하여 개발 생산성을 높입니다.
- **새로운 디버깅 도구**: Next.js 15의 업데이트된 디버깅 도구는 더 상세한 에러 메시지와 스택 트레이스를 제공하여 문제 해결을 돕습니다.

## 🎯 다음 단계

이 가이드를 통해 Next.js 기반의 블록체인 애플리케이션 개발에 대한 전반적인 이해를 얻으셨기를 바랍니다. 이제 다음 단계로 나아가세요!

1.  **컨트랙트 배포**: Hardhat을 사용하여 스마트 컨트랙트를 테스트넷에 배포하고, 주소를 `.env.local`에 추가합니다.
2.  **프론트엔드 개발**: Next.js 컴포넌트에서 배포된 컨트랙트와 상호작용하는 기능을 구현합니다.
3.  **테스트 및 디버깅**: 개발한 기능이 예상대로 동작하는지 철저히 테스트합니다.
4.  **배포**: Vercel과 같은 플랫폼에 Next.js 애플리케이션을 배포하여 실제 서비스로 만듭니다.

블록체인과 Next.js의 조합은 무한한 가능성을 제공합니다. 꾸준히 학습하고 실험하여 혁신적인 Web3 서비스를 만들어나가세요! 🚀
