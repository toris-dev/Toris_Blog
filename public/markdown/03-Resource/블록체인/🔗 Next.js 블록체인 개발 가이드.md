# 🔗 Next.js 블록체인 개발 가이드

> Next.js로 NFT 마켓플레이스와 포인트 시스템을 구축하는 완전한 가이드

## 📋 목차

1. [개발 환경 구성](#-개발-환경-구성)
2. [NFT 개발](#-nft-개발)
3. [포인트 시스템](#-포인트-시스템)
4. [실전 프로젝트](#-실전-프로젝트)
5. [배포 및 운영](#-배포-및-운영)

## 🚀 개발 환경 구성

### 필수 도구 설치

```bash
# Node.js 프로젝트 초기화
npx create-next-app@latest my-blockchain-app
cd my-blockchain-app

# 블록체인 개발 도구
npm install hardhat @nomiclabs/hardhat-ethers ethers
npm install @openzeppelin/contracts
npm install @thirdweb-dev/react @thirdweb-dev/sdk

# 개발 편의 도구
npm install -D typescript @types/node
npm install web3modal @walletconnect/web3-provider
```

### Hardhat 설정

```javascript
// hardhat.config.js
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.19",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
```

### 환경 변수 설정

```bash
# .env.local
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
PRIVATE_KEY=your_wallet_private_key
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret
```

## 🎨 NFT 개발

### 1. NFT 컨트랙트 작성

참고: [NFT Marketplace by Markkop](https://github.com/Markkop/nft-marketplace) - 완전한 NFT 마켓플레이스 구현 예제

```solidity
// contracts/MyNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MyNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() ERC721("MyNFT", "MNFT") {}

    function mintNFT(address recipient, string memory tokenURI)
        public onlyOwner
        returns (uint256)
    {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);
        return newItemId;
    }
}
```

### 2. NFT 마켓플레이스 컨트랙트

```solidity
// contracts/NFTMarketplace.sol
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarketplace is ReentrancyGuard {
    struct MarketItem {
        uint256 itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    mapping(uint256 => MarketItem) private idToMarketItem;
    uint256 private _itemIds;
    uint256 private _itemsSold;
    uint256 listingPrice = 0.025 ether;

    event MarketItemCreated (
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant {
        require(price > 0, "Price must be greater than 0");
        require(msg.value == listingPrice, "Price must be equal to listing price");

        _itemIds++;
        uint256 itemId = _itemIds;

        idToMarketItem[itemId] = MarketItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false
        );

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit MarketItemCreated(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            address(0),
            price,
            false
        );
    }

    function createMarketSale(
        address nftContract,
        uint256 itemId
    ) public payable nonReentrant {
        uint price = idToMarketItem[itemId].price;
        uint tokenId = idToMarketItem[itemId].tokenId;

        require(msg.value == price, "Please submit the asking price");

        idToMarketItem[itemId].seller.transfer(msg.value);
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        idToMarketItem[itemId].owner = payable(msg.sender);
        idToMarketItem[itemId].sold = true;
        _itemsSold++;
    }
}
```

### 3. Next.js NFT 컴포넌트

참고: [thirdweb Mint NFT Guide](https://blog.thirdweb.com/guides/mint-nft-using-nextjs/) - Next.js NFT 민팅 가이드

```typescript
// components/NFTCard.tsx
import { useState } from "react";
import { ethers } from "ethers";
import Image from "next/image";

interface NFTCardProps {
  nft: {
    tokenId: string;
    name: string;
    description: string;
    image: string;
    price?: string;
    owner: string;
  };
  onBuy?: (tokenId: string) => void;
}

export default function NFTCard({ nft, onBuy }: NFTCardProps) {
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    if (!onBuy) return;

    setLoading(true);
    try {
      await onBuy(nft.tokenId);
    } catch (error) {
      console.error("구매 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative h-64">
        <Image src={nft.image} alt={nft.name} layout="fill" objectFit="cover" />
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{nft.name}</h3>
        <p className="text-gray-600 mb-4">{nft.description}</p>

        {nft.price && (
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold">
              {ethers.utils.formatEther(nft.price)} ETH
            </span>

            <button
              onClick={handleBuy}
              disabled={loading}
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

### 4. NFT 민팅 페이지

```typescript
// pages/mint.tsx
import { useState } from "react";
import { useContract, useAddress, Web3Button } from "@thirdweb-dev/react";

export default function MintPage() {
  const address = useAddress();
  const { contract } = useContract("YOUR_NFT_CONTRACT_ADDRESS");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null as File | null,
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  const mintNFT = async () => {
    if (!contract || !formData.image) return;

    try {
      // 이미지를 IPFS에 업로드
      const imageUpload = await contract.storage.upload(formData.image);

      // 메타데이터 생성
      const metadata = {
        name: formData.name,
        description: formData.description,
        image: imageUpload,
      };

      // NFT 민팅
      const tx = await contract.mintTo(address, metadata);
      console.log("NFT 민팅 성공:", tx);
    } catch (error) {
      console.error("민팅 실패:", error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">NFT 민팅</h1>

      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">NFT 이름</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">설명</label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full p-2 border rounded"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">이미지</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full p-2 border rounded"
          />
        </div>

        <Web3Button
          contractAddress="YOUR_NFT_CONTRACT_ADDRESS"
          action={mintNFT}
          className="w-full"
        >
          NFT 민팅하기
        </Web3Button>
      </form>
    </div>
  );
}
```

## 💰 포인트 시스템

### 1. ERC20 포인트 토큰 컨트랙트

```solidity
// contracts/PointToken.sol
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PointToken is ERC20, Ownable {
    mapping(address => bool) public minters;

    constructor() ERC20("MyPoint", "MPT") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        _;
    }

    function addMinter(address minter) public onlyOwner {
        minters[minter] = true;
    }

    function removeMinter(address minter) public onlyOwner {
        minters[minter] = false;
    }

    function mint(address to, uint256 amount) public onlyMinter {
        _mint(to, amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}
```

### 2. 포인트 리워드 시스템

```solidity
// contracts/RewardSystem.sol
pragma solidity ^0.8.19;

import "./PointToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RewardSystem is Ownable {
    PointToken public pointToken;

    mapping(address => uint256) public userPoints;
    mapping(address => uint256) public lastClaimTime;

    uint256 public dailyReward = 100 * 10**18; // 100 포인트
    uint256 public constant CLAIM_INTERVAL = 24 hours;

    event PointsEarned(address indexed user, uint256 amount, string activity);
    event PointsRedeemed(address indexed user, uint256 amount, string item);

    constructor(address _pointToken) {
        pointToken = PointToken(_pointToken);
    }

    function claimDailyReward() public {
        require(
            block.timestamp >= lastClaimTime[msg.sender] + CLAIM_INTERVAL,
            "Daily reward already claimed"
        );

        lastClaimTime[msg.sender] = block.timestamp;
        pointToken.mint(msg.sender, dailyReward);

        emit PointsEarned(msg.sender, dailyReward, "Daily Login");
    }

    function earnPoints(address user, uint256 amount, string memory activity)
        public onlyOwner
    {
        pointToken.mint(user, amount);
        emit PointsEarned(user, amount, activity);
    }

    function redeemPoints(uint256 amount, string memory item) public {
        require(pointToken.balanceOf(msg.sender) >= amount, "Insufficient points");

        pointToken.transferFrom(msg.sender, address(this), amount);
        emit PointsRedeemed(msg.sender, amount, item);
    }
}
```

### 3. 포인트 시스템 React 훅

```typescript
// hooks/usePoints.ts
import { useState, useEffect } from "react";
import { useContract, useAddress, useContractRead } from "@thirdweb-dev/react";

export function usePoints() {
  const address = useAddress();
  const { contract: pointContract } = useContract("POINT_TOKEN_ADDRESS");
  const { contract: rewardContract } = useContract("REWARD_SYSTEM_ADDRESS");

  const { data: balance, refetch: refetchBalance } = useContractRead(
    pointContract,
    "balanceOf",
    [address]
  );

  const claimDailyReward = async () => {
    if (!rewardContract) return;

    try {
      const tx = await rewardContract.call("claimDailyReward");
      await refetchBalance();
      return tx;
    } catch (error) {
      console.error("일일 리워드 수령 실패:", error);
      throw error;
    }
  };

  const redeemPoints = async (amount: string, item: string) => {
    if (!rewardContract) return;

    try {
      const tx = await rewardContract.call("redeemPoints", [amount, item]);
      await refetchBalance();
      return tx;
    } catch (error) {
      console.error("포인트 사용 실패:", error);
      throw error;
    }
  };

  return {
    balance,
    claimDailyReward,
    redeemPoints,
    refetchBalance,
  };
}
```

### 4. 포인트 대시보드 컴포넌트

```typescript
// components/PointsDashboard.tsx
import { useState } from "react";
import { usePoints } from "../hooks/usePoints";
import { ethers } from "ethers";

export default function PointsDashboard() {
  const { balance, claimDailyReward, redeemPoints } = usePoints();
  const [loading, setLoading] = useState(false);

  const handleClaimReward = async () => {
    setLoading(true);
    try {
      await claimDailyReward();
      alert("일일 리워드를 받았습니다!");
    } catch (error) {
      alert("리워드 수령에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (amount: string, item: string) => {
    setLoading(true);
    try {
      await redeemPoints(ethers.utils.parseEther(amount), item);
      alert(`${item}을(를) 구매했습니다!`);
    } catch (error) {
      alert("구매에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">내 포인트</h2>
        <div className="text-4xl font-bold">
          {balance ? ethers.utils.formatEther(balance) : "0"} MPT
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleClaimReward}
          disabled={loading}
          className="bg-white text-purple-500 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 disabled:opacity-50"
        >
          {loading ? "처리 중..." : "일일 리워드 받기"}
        </button>

        <div className="space-y-2">
          <h3 className="font-semibold">포인트 상점</h3>
          <button
            onClick={() => handleRedeem("50", "Special Badge")}
            disabled={loading}
            className="w-full bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            특별 뱃지 (50 MPT)
          </button>
          <button
            onClick={() => handleRedeem("100", "Premium Access")}
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
          >
            프리미엄 액세스 (100 MPT)
          </button>
        </div>
      </div>
    </div>
  );
}
```

## 🛠️ 실전 프로젝트

### 통합 게이밍 플랫폼 예제

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
  const [nfts, setNfts] = useState([]);
  const { earnPoints } = usePoints();

  const playGame = () => {
    // 간단한 게임 로직
    const score = Math.floor(Math.random() * 100);
    setGameScore(score);

    // 점수에 따라 포인트 지급
    if (score > 80) {
      earnPoints(address, "50", "High Score Achievement");
    } else if (score > 50) {
      earnPoints(address, "20", "Good Score");
    } else {
      earnPoints(address, "10", "Participation");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        블록체인 게임 플랫폼
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 포인트 대시보드 */}
        <div className="lg:col-span-1">
          <PointsDashboard />
        </div>

        {/* 게임 영역 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">미니 게임</h2>

            <div className="text-center">
              <div className="text-2xl mb-4">점수: {gameScore}</div>
              <button
                onClick={playGame}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
              >
                게임하기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* NFT 갤러리 */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">게임 아이템 NFT</h2>
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

## 🚀 배포 및 운영

### 1. 스마트 컨트랙트 배포

```javascript
// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  // NFT 컨트랙트 배포
  const MyNFT = await ethers.getContractFactory("MyNFT");
  const nft = await MyNFT.deploy();
  await nft.deployed();
  console.log("NFT 컨트랙트 주소:", nft.address);

  // 포인트 토큰 배포
  const PointToken = await ethers.getContractFactory("PointToken");
  const pointToken = await PointToken.deploy();
  await pointToken.deployed();
  console.log("포인트 토큰 주소:", pointToken.address);

  // 마켓플레이스 배포
  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
  const marketplace = await NFTMarketplace.deploy();
  await marketplace.deployed();
  console.log("마켓플레이스 주소:", marketplace.address);

  // 리워드 시스템 배포
  const RewardSystem = await ethers.getContractFactory("RewardSystem");
  const rewardSystem = await RewardSystem.deploy(pointToken.address);
  await rewardSystem.deployed();
  console.log("리워드 시스템 주소:", rewardSystem.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 2. Vercel 배포 설정

```json
// vercel.json
{
  "build": {
    "env": {
      "NEXT_PUBLIC_ALCHEMY_API_KEY": "@alchemy_api_key",
      "NEXT_PUBLIC_THIRDWEB_CLIENT_ID": "@thirdweb_client_id"
    }
  }
}
```

### 3. 모니터링 및 분석

```typescript
// utils/analytics.ts
export const trackNFTMint = (tokenId: string, user: string) => {
  console.log(`NFT 민팅: Token ${tokenId}, User ${user}`);
  // 실제 분석 도구로 전송
};

export const trackPointsEarned = (
  user: string,
  amount: string,
  activity: string
) => {
  console.log(`포인트 획득: ${user} - ${amount} points for ${activity}`);
};

export const trackMarketplaceSale = (tokenId: string, price: string) => {
  console.log(`NFT 판매: Token ${tokenId}, Price ${price} ETH`);
};
```

## 📚 추가 학습 자료

### 권장 리소스

1. **[NFT Marketplace by Markkop](https://github.com/Markkop/nft-marketplace)** - 완전한 NFT 마켓플레이스 구현 예제
2. **[thirdweb Mint NFT Guide](https://blog.thirdweb.com/guides/mint-nft-using-nextjs/)** - Next.js NFT 민팅 가이드
3. **OpenZeppelin Contracts** - 표준 스마트 컨트랙트 라이브러리
4. **Hardhat Documentation** - 이더리움 개발 환경

### 실습 프로젝트 아이디어

- **게임 아이템 NFT**: 게임에서 사용할 수 있는 유니크한 아이템들
- **멤버십 NFT**: 커뮤니티 접근 권한을 제공하는 토큰
- **업적 시스템**: 특정 활동 완료 시 NFT 뱃지 발행
- **포인트 스테이킹**: 포인트를 예치하여 추가 보상 획득

### 보안 고려사항

1. **스마트 컨트랙트 감사**: 메인넷 배포 전 코드 리뷰 필수
2. **프라이빗 키 관리**: 환경 변수로 안전하게 보관
3. **가스비 최적화**: 효율적인 컨트랙트 로직 작성
4. **프론트엔드 보안**: 사용자 입력 검증 및 XSS 방지

### 실무 팁

#### 개발 단계별 체크리스트

1. **로컬 개발**

   - [ ] Hardhat 로컬 네트워크 구성
   - [ ] 컨트랙트 테스트 작성
   - [ ] 프론트엔드 기본 기능 구현

2. **테스트넷 배포**

   - [ ] Mumbai (Polygon) 또는 Goerli (Ethereum) 배포
   - [ ] 메타마스크 테스트 네트워크 연결
   - [ ] 실제 사용자 시나리오 테스트

3. **메인넷 런칭**
   - [ ] 컨트랙트 보안 감사
   - [ ] 가스비 최적화 확인
   - [ ] 백업 및 복구 계획 수립

#### 성능 최적화

```typescript
// 가스비 절약을 위한 배치 처리
const batchMintNFTs = async (recipients: string[], tokenURIs: string[]) => {
  const promises = recipients.map((recipient, index) =>
    contract.mintNFT(recipient, tokenURIs[index])
  );

  return Promise.all(promises);
};

// 메타데이터 캐싱
const useNFTMetadata = (tokenId: string) => {
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    const cached = localStorage.getItem(`nft-${tokenId}`);
    if (cached) {
      setMetadata(JSON.parse(cached));
      return;
    }

    // API 호출 후 캐시 저장
    fetchMetadata(tokenId).then((data) => {
      setMetadata(data);
      localStorage.setItem(`nft-${tokenId}`, JSON.stringify(data));
    });
  }, [tokenId]);

  return metadata;
};
```

## 🎯 다음 단계

1. **로컬 환경에서 테스트** - Hardhat 로컬 네트워크 활용
2. **테스트넷 배포** - Mumbai (Polygon) 또는 Goerli (Ethereum)
3. **사용자 테스트** - 베타 사용자들과 피드백 수집
4. **메인넷 배포** - 실제 서비스 런칭

### 업그레이드 로드맵

- **Phase 1**: 기본 NFT + 포인트 시스템
- **Phase 2**: 마켓플레이스 + 경매 기능
- **Phase 3**: DAO 거버넌스 + 스테이킹
- **Phase 4**: 크로스체인 + L2 최적화

이 가이드를 따라하면 NFT와 포인트 시스템을 결합한 완전한 블록체인 애플리케이션을 개발할 수 있습니다! 🚀

#블록체인 #NFT #포인트시스템 #NextJS #web3 #개발가이드 #스마트컨트랙트
