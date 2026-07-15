---
title: 'Next.js 기반 Web3 제품 스택 — 토리스 엔지니어링 노트'
date: 2025-07-13T12:00:00.000Z
slug: nextjs-blockchain-application-development-guide
category: 'Blockchain'
tags: [Next.js, Blockchain, Web3, NFT, Smart Contracts, Solidity, Frontend]
description: '토리스가 PEPEBear·CryptoTrade.gg 등 Web3 제품을 만들며 검증한 Next.js 스택 노트. Hardhat·OpenZeppelin·thirdweb·ethers.js로 컨트랙트를 배포하고 NFT·포인트 시스템을 구축한 판단을 정리했다.'
---

# 🔗 Next.js 기반 Web3 제품 스택 — 토리스 엔지니어링 노트

> **Q. Next.js로 블록체인·Web3 앱은 어떻게 개발하나요?**
> Next.js에 Hardhat·thirdweb·ethers.js를 연동해 스마트 컨트랙트를 배포하고 NFT·포인트 등 Web3 앱을 구축한다. 토리스가 실제 제품을 만들며 검증한 스택 구성을 기준으로 정리했다.

토리스는 PEPEBear·CryptoTrade.gg 같은 Web3 성격의 제품을 만들며 이 스택을 검증했다. PEPEBear는 Phantom·Solflare 지갑 연동과 포인트·업적·레벨 게임화를 얹은 밈코인 프론트엔드고, CryptoTrade.gg는 Next.js·TypeScript·Recharts로 트레이드 전적을 시각화하는 대시보드다. 이 글은 EVM(이더리움 계열) 툴체인 기준으로 쓰였지만, PEPEBear는 Solana 기반이라 컨트랙트 레이어에서 Hardhat·Solidity 대신 Anchor·Web3.js를 썼다는 차이가 있다. 그럼에도 지갑 연동 UX, 트랜잭션 상태 처리, 온체인 데이터 캐싱 같은 프론트엔드 쪽 판단은 체인과 무관하게 그대로 통했다.

Web3 프로토타입을 검증할 때 핵심은 컨트랙트 자체가 아니라 "지갑을 연결하고 트랜잭션을 보내는 순간까지의 UX"를 얼마나 빨리 돌려볼 수 있느냐다. Next.js 하나로 랜딩·대시보드·컨트랙트 연동을 전부 커버할 수 있어서, 토리스는 Web3 성격의 제품을 시작할 때 이 스택을 기본값으로 꺼낸다. 아래는 그 기준으로 정리한 EVM 개발 노트다.

## 📋 목차

1.  [개발 환경 설정](#-개발-환경-설정)
2.  [NFT 개발: 컨트랙트부터 Next.js UI까지](#-nft-개발-컨트랙트부터-nextjs-ui까지)
3.  [포인트 시스템 구현](#-포인트-시스템-구현)
4.  [실전 프로젝트 통합 예시](#-실전-프로젝트-통합-예시)
5.  [배포 및 운영 전략](#-배포-및-운영-전략)

## 🚀 개발 환경 설정

컨트랙트 개발 환경은 Hardhat, 프론트엔드 연동은 thirdweb·ethers.js 조합을 쓴다. 검증된 조합이라 온보딩 비용이 가장 낮았다.

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

`hardhat.config.js`에 Solidity 컴파일러 버전과 네트워크 정보를 정의한다.

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

민감한 정보(API 키, 개인 키)는 `.env.local`에 저장하고 `.gitignore`로 버전 관리에서 제외한다. 개인 키가 저장소에 올라가는 사고는 Web3에서 가장 흔하고 가장 치명적이다.

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

NFT(Non-Fungible Token)는 고유하고 대체 불가능한 디지털 자산이다. 컨트랙트부터 민팅 UI까지, Next.js로 NFT 프론트엔드를 구축하는 흐름을 정리한다.

### 1. NFT 컨트랙트 작성 (Solidity)

OpenZeppelin의 표준 ERC-721 컨트랙트를 상속받아 기본 로직을 구현한다. 토큰 표준을 직접 짜지 않는 것이 원칙이다 — 보안 감사를 거친 코드가 이미 있는데 새로 쓰는 건 리스크만 늘린다.

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

NFT를 판매하고 구매할 수 있는 마켓플레이스 로직이다. 자금이 오가는 함수에는 `ReentrancyGuard`를 기본으로 건다.

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

NFT 정보를 표시하고 구매 기능을 제공하는 React 컴포넌트다. NFT 이미지는 용량이 제각각이라 Next.js `Image` 컴포넌트의 최적화를 그대로 태우는 편이 낫다.

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

사용자가 NFT를 직접 발행(민팅)하는 페이지다. 지갑 연결·트랜잭션 서명 플로우를 직접 구현하면 엣지 케이스가 끝이 없어서, `thirdweb`의 `Web3Button`으로 간소화하는 쪽을 택했다.

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

사용자 활동에 따라 포인트를 지급하고 관리하는 시스템을 ERC-20 토큰 표준으로 구현한다. PEPEBear에서 포인트·업적·레벨 게임화를 만들어보며 느낀 것은, 온체인 포인트는 "잔액·지급·차감"만 컨트랙트에 두고 나머지 로직은 오프체인에 두는 편이 운영이 쉽다는 점이다.

### 1. ERC-20 포인트 토큰 컨트랙트 (Solidity)

포인트 역할을 할 ERC-20 토큰을 발행한다. `Ownable`을 상속받아 토큰 발행(mint) 권한을 제어한다.

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

사용자가 특정 활동(예: 일일 로그인)으로 포인트를 획득하고, 이를 아이템으로 교환하는 로직을 구현한다.

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

포인트 잔액 조회·보상 청구·포인트 사용을 커스텀 훅으로 묶는다. 컨트랙트 호출 로직이 컴포넌트 곳곳에 흩어지면 유지보수 비용이 급격히 올라가서, 온체인 상호작용은 훅 한 곳으로 모으는 것을 원칙으로 한다.

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

현재 포인트 잔액을 보여주고, 일일 보상 청구와 포인트 사용 기능을 제공하는 UI 컴포넌트다.

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

NFT와 포인트 시스템을 통합해 간단한 블록체인 게임 플랫폼을 구성한 예시다. 코드 주석에도 적었지만, 관리자 권한이 필요한 포인트 지급은 반드시 서버(API Route) 경유로 처리해야 한다.

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

개발한 애플리케이션을 실제 사용자에게 내보내기까지의 배포·운영 단계를 정리한다.

### 1. 스마트 컨트랙트 배포

Hardhat 스크립트로 스마트 컨트랙트를 테스트넷 또는 메인넷에 배포한다. 배포 순서에 의존성이 있으므로(RewardSystem은 PointToken 주소가 필요) 스크립트 하나로 묶어두면 실수가 줄어든다.

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

Next.js 애플리케이션은 Vercel에 배포한다. 컨트랙트 주소가 환경 변수로 들어가므로, 배포 환경별(프리뷰/프로덕션) 환경 변수 관리만 주의하면 된다.

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

사용자 활동과 컨트랙트 상호작용을 추적해 서비스 개선에 활용한다.

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

- **[thirdweb Docs](https://portal.thirdweb.com)**: Next.js와 Web3 개발을 위한 가장 최신화된 자료.
- **[OpenZeppelin Contracts Docs](https://docs.openzeppelin.com/contracts)**: 스마트 컨트랙트 개발 표준과 보안 모범 사례.
- **[Hardhat Docs](https://hardhat.org/docs)**: 이더리움 개발 환경 설정과 테스트 레퍼런스.
- **[Ethers.js Docs](https://docs.ethers.org)**: 블록체인과 상호작용하는 JavaScript 라이브러리 문서.
- **[Next.js 공식 문서](https://nextjs.org/docs)**: App Router, 캐싱, 배포 등 프레임워크 전반의 공식 레퍼런스.

### 실무 팁

#### 개발 단계별 체크리스트

1.  **로컬 개발**: Hardhat Network에서 빠르고 비용 없이 개발·테스트를 반복한다.
2.  **테스트넷 배포**: Mumbai (Polygon), Sepolia (Ethereum) 등 테스트넷에 배포해 실제 네트워크 환경에서 테스트하고 피드백을 받는다.
3.  **메인넷 런칭**: 배포 전 스마트 컨트랙트 보안 감사와 철저한 테스트를 거친다. 배포 후에는 되돌릴 수 없다.

#### 성능 최적화 (Next.js & Web3)

- **Turbopack Dev (Stable)**: Next.js 15에서 안정화된 Turbopack은 로컬 개발 서버의 시작·업데이트 속도를 크게 끌어올린다.
- **캐싱 제어**: Next.js 15에서는 `fetch` 요청, `GET` Route Handlers, 클라이언트 탐색이 기본적으로 캐시되지 않아 캐싱 동작을 명시적으로 제어할 수 있다. 온체인 데이터처럼 신선도가 중요한 화면에서 특히 유리하다.
- **React 19 지원**: React Compiler 등 React 19의 새 기능으로 렌더링 성능을 최적화할 수 있다.
- **데이터 캐싱**: `swr`나 `react-query`로 블록체인 데이터를 캐싱해 UI 응답성을 높인다. RPC 호출은 느리고 비싸다 — 캐싱 없이 매 렌더마다 조회하면 UX가 무너진다.
- **서버 사이드 렌더링 (SSR) / 정적 사이트 생성 (SSG)**: 자주 변경되지 않는 블록체인 데이터(예: NFT 메타데이터)는 SSG로 미리 생성해 초기 로딩과 SEO를 챙긴다.
- **API Routes 활용**: 관리자 권한이 필요한 민팅 같은 민감한 트랜잭션은 API Routes를 통해 서버에서 처리해 개인 키 노출 위험을 차단한다.
- **이미지 최적화**: Next.js `Image` 컴포넌트로 NFT 이미지를 자동 최적화·지연 로딩한다.
- **개선된 TypeScript 지원**: Next.js 15는 더 빠른 타입 검사와 향상된 에디터 통합을 제공한다.
- **새로운 디버깅 도구**: Next.js 15의 디버깅 도구는 더 상세한 에러 메시지와 스택 트레이스를 제공한다.

## 🎯 마무리

Next.js 위에 컨트랙트 툴체인을 얹는 이 구성은 토리스가 Web3 성격의 제품을 만들 때 반복해서 꺼내 쓰는 기본 스택이다. 체인이 EVM이든 Solana든, 지갑 연동부터 트랜잭션 UX까지의 프론트엔드 판단은 크게 달라지지 않았다.

Web3 아이디어 검증이 필요하다면 [토리스에 문의](https://toris.kr/contact)해 주시길.
