---
title: 'DeFi 서비스 아키텍처 노트 — 제품 관점에서 본 구성 요소'
date: 2025-07-13T10:00:00.000Z
slug: defi-services-development-guide-with-nextjs
category: 'Blockchain'
tags: ['DeFi', 'Blockchain', 'Next.js', 'Solidity', 'Smart Contracts', 'Web3']
description: 'DEX·대출·스테이킹 등 DeFi 핵심 구성 요소를 제품 관점에서 정리한 토리스 엔지니어링 노트. Solidity 컨트랙트 구조와 Next.js 연동, 재진입 방지 같은 보안 판단 기준까지 다룹니다.'
---

# DeFi 서비스 아키텍처 노트 — 제품 관점에서 본 구성 요소

> **Q. DeFi 서비스는 Next.js와 Solidity로 어떻게 개발하나요?**
> 스마트 컨트랙트로 DEX·대출·스테이킹 같은 핵심 로직을 구현하고, Next.js에서 ethers.js·thirdweb로 지갑을 연동해 사용자 대시보드를 만듭니다. 어떤 구성 요소를 직접 구현하고 어떤 것을 기존 프로토콜에 위임할지가 제품 설계의 핵심 판단입니다.

토리스는 웹 제품을 설계할 때 기술 스택을 "쓸 수 있는가"보다 "제품에 넣을 이유가 있는가"로 판단합니다. Web3 영역도 마찬가지입니다. DeFi를 구성하는 DEX·대출·스테이킹은 각각 독립적인 금융 로직이자 스마트 컨트랙트 모듈이고, 제품에 도입할 때는 "이 로직을 온체인에 두는 것이 사용자에게 어떤 가치를 주는가", "그 대가로 어떤 보안·운영 부담을 지는가"를 먼저 따집니다.

이 노트는 토리스가 Web3 제품을 검토할 때 기준으로 삼는 DeFi 핵심 구성 요소를 정리한 엔지니어링 노트입니다. 각 구성 요소의 동작 원리를 Solidity 코드로 확인하고, Next.js 프론트엔드와의 연결 지점, 그리고 도입 여부를 가르는 보안 판단 기준을 함께 다룹니다.

## 🌟 DeFi란 무엇인가?

**DeFi (Decentralized Finance)**는 블록체인 기술, 특히 스마트 컨트랙트를 활용하여 은행, 증권사 같은 중앙 중개자 없이 금융 서비스를 제공하는 시스템입니다. 제품 관점에서 보면 "중개자를 코드로 대체한다"는 것이 핵심인데, 이는 곧 중개자가 하던 신뢰 보증과 예외 처리를 전부 컨트랙트 설계와 검증으로 감당해야 한다는 뜻이기도 합니다.

### 전통 금융 vs. DeFi

| 항목           | 전통 금융 (CeFi)        | 탈중앙화 금융 (DeFi)        |
| -------------- | ----------------------- | --------------------------- |
| **중개자**     | 은행, 정부, 카드사      | 스마트 컨트랙트 (코드)      |
| **접근성**     | KYC/AML, 지역/신용 제한 | 누구나 참여 가능 (무허가성) |
| **투명성**     | 제한적, 내부 정보       | 모든 거래가 공개 (온체인)   |
| **운영 시간**  | 영업시간 제한           | 24/7, 365일 중단 없음       |
| **상호운용성** | 폐쇄적인 시스템         | 레고 블록처럼 조합 가능     |

**제품 관점**: 위 표에서 제품 설계에 가장 크게 작용하는 항목은 상호운용성입니다. 기존 프로토콜을 조합해 쓸 수 있다는 것은, 모든 것을 직접 구현하지 않고도 제품 범위를 좁게 유지할 수 있다는 뜻입니다.

## 🔧 핵심 DeFi 서비스와 Solidity 코드 예제

### 1. 탈중앙화 거래소 (DEX - Decentralized Exchange)

중앙화된 오더북 없이 사용자들이 직접 토큰을 교환하는 플랫폼입니다. **AMM (Automated Market Maker)** 모델이 주로 사용됩니다. 제품에 토큰 교환 기능이 필요할 때 AMM을 직접 구현할지, 기존 DEX를 연동할지가 첫 번째 판단 지점입니다. 아래 코드는 그 판단에 필요한 최소 구조 — 유동성 풀, 스왑, 가격 결정 공식 — 를 보여줍니다.

#### Uniswap 스타일의 간단한 AMM 구현

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// 간단한 DEX 컨트랙트
contract SimpleDEX is ReentrancyGuard {
    IERC20 public immutable tokenA;
    IERC20 public immutable tokenB;

    uint256 public reserveA;
    uint256 public reserveB;

    // 유동성 공급자의 지분을 추적
    mapping(address => uint256) public liquidity;
    uint256 public totalLiquidity;

    // 이벤트 정의
    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB);
    event TokensSwapped(address indexed trader, address indexed tokenIn, uint256 amountIn, uint256 amountOut);

    constructor(address _tokenA, address _tokenB) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    // 유동성 공급 함수
    function addLiquidity(uint256 _amountA, uint256 _amountB) external nonReentrant {
        // ... (생략)
    }

    // 토큰 스왑 함수 (A -> B)
    function swapAtoB(uint256 _amountAIn) external nonReentrant {
        require(_amountAIn > 0, "Input amount must be positive");

        uint256 amountBOut = getAmountOut(_amountAIn, reserveA, reserveB);
        require(amountBOut > 0, "Insufficient output");

        // 토큰 전송
        tokenA.transferFrom(msg.sender, address(this), _amountAIn);
        tokenB.transfer(msg.sender, amountBOut);

        // 유동성 풀 업데이트
        reserveA += _amountAIn;
        reserveB -= amountBOut;

        emit TokensSwapped(msg.sender, address(tokenA), _amountAIn, amountBOut);
    }

    // 교환될 토큰 양 계산 (x * y = k 모델)
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256) {
        uint256 amountInWithFee = amountIn * 997; // 0.3% 수수료 적용
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        return numerator / denominator;
    }
}
```

**제품 관점**: 스왑 기능 자체가 제품의 차별점이 아니라면, 검증된 기존 DEX를 연동하는 쪽이 감사 비용과 유동성 확보 부담을 모두 줄이는 선택입니다.

### 2. 대출/차용 프로토콜 (Lending/Borrowing)

암호화폐를 담보로 다른 암호화폐를 빌리거나, 자신의 자산을 예치하고 이자를 받을 수 있는 서비스입니다. 핵심 설계 변수는 담보 비율과 청산 로직이며, 이 두 가지가 프로토콜의 안정성을 좌우합니다.

```solidity
// 간단한 대출 프로토콜
contract LendingProtocol is ReentrancyGuard {
    // ... (생략)

    // 자산 예치 (공급)
    function supply(address token, uint256 amount) external nonReentrant {
        // ... (생략)
    }

    // 담보 기반 대출
    function borrow(address token, uint256 amount) external nonReentrant {
        // ... (생략)
        // isAccountHealthy(msg.sender) 와 같은 함수로 담보 비율을 확인해야 함
    }
}
```

**제품 관점**: 대출·차용은 담보 가격을 알려주는 오라클 의존성이 생기는 순간 위험 표면이 크게 넓어지므로, 소규모 팀이라면 가장 신중하게 도입을 판단해야 하는 구성 요소입니다.

### 3. 스테이킹 (Staking)

특정 토큰을 프로토콜에 예치(락업)하고, 그 대가로 보상을 받는 시스템입니다. 네트워크 보안에 기여하거나, 거버넌스에 참여하는 등의 역할을 합니다. 세 구성 요소 중 상태 전이가 가장 단순해, 온체인 로직을 처음 도입할 때 검토하기 좋은 출발점입니다.

```solidity
// 간단한 스테이킹 보상 컨트랙트
contract StakingRewards is ReentrancyGuard {
    // ... (생략)

    // 스테이킹 함수
    function stake(uint256 amount) external nonReentrant {
        // ... (생략)
    }

    // 보상 수령 함수
    function getReward() external nonReentrant {
        // ... (생략)
    }
}
```

**제품 관점**: 보상 계산은 로직 자체보다 "예치 기간·이율을 사용자에게 어떻게 예측 가능하게 보여줄 것인가"라는 UX 문제가 제품 완성도를 가릅니다.

## 💻 Next.js로 DeFi 대시보드 만들기

컨트랙트가 백엔드라면, 사용자가 실제로 만나는 제품은 프론트엔드입니다. Next.js와 `ethers.js` 또는 `thirdweb` 같은 라이브러리를 사용하면 스마트 컨트랙트와 상호작용하는 대시보드를 일반 웹 제품과 같은 개발 흐름으로 구축할 수 있습니다.

```typescript
// components/DeFiDashboard.tsx
import { useState } from "react";
import { useContract, useAddress, useContractRead, Web3Button } from "@thirdweb-dev/react";
import { ethers } from "ethers";

export default function DeFiDashboard() {
  const address = useAddress();
  const [stakingAmount, setStakingAmount] = useState("");

  // thirdweb SDK를 사용하여 컨트랙트 인스턴스 생성
  const { contract: stakingContract } = useContract("YOUR_STAKING_CONTRACT_ADDRESS");

  // 컨트랙트의 public 변수 읽기
  const { data: stakedBalance } = useContractRead(stakingContract, "balances", [address]);
  const { data: earnedRewards } = useContractRead(stakingContract, "earned", [address]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My DeFi Dashboard</h1>

      {/* 스테이킹 섹션 */}
      <div className="bg-gray-800 rounded-lg p-6 text-white">
        <h2 className="text-xl font-semibold mb-4">Staking</h2>
        <p>Staked Balance: {stakedBalance ? ethers.utils.formatEther(stakedBalance) : "0"} STK</p>
        <p>Rewards: {earnedRewards ? ethers.utils.formatEther(earnedRewards) : "0"} RWD</p>

        <input
          type="number"
          value={stakingAmount}
          onChange={(e) => setStakingAmount(e.target.value)}
          className="w-full p-2 rounded text-black mt-4"
          placeholder="Amount to stake"
        />

        {/* Web3Button을 사용하여 트랜잭션 처리 */}
        <Web3Button
          contractAddress="YOUR_STAKING_CONTRACT_ADDRESS"
          action={(contract) => contract.call("stake", [ethers.utils.parseEther(stakingAmount)])}
          onSuccess={() => alert("Staking successful!")}
          onError={(error) => alert(`Error: ${error.message}`)}
          className="w-full bg-blue-500 py-2 rounded mt-2"
        >
          Stake Now
        </Web3Button>
      </div>
    </div>
  );
}
```

**제품 관점**: 지갑 연결과 트랜잭션 대기 상태는 Web3 제품에서 이탈이 가장 많이 일어나는 지점이므로, 대시보드 설계에서 로딩·실패 상태 처리를 일반 웹보다 훨씬 보수적으로 잡아야 합니다.

## 🔒 보안과 위험 관리

보안은 DeFi 구성 요소의 도입 여부를 가르는 최종 기준입니다. 스마트 컨트랙트 버그, 오라클 문제, 유동성 위험 등은 배포 후 수정이 어렵기 때문에, 아래 항목을 설계 단계의 체크리스트로 삼습니다.

- **재진입 공격 (Reentrancy) 방지**: OpenZeppelin의 `ReentrancyGuard` 사용 또는 Checks-Effects-Interactions 패턴 적용.
- **정수 오버플로우/언더플로우**: Solidity 0.8.x 이상 버전 사용.
- **접근 제어**: `Ownable` 등 명확한 권한 관리 패턴 사용.
- **코드 감사**: 외부 전문 업체를 통한 스마트 컨트랙트 감사.
- **테스트**: 테스트 커버리지를 최대한 높여 엣지 케이스 검증.

Web3 제품 설계나 DeFi 구성 요소 도입 판단에 대해 논의하고 싶다면 [토리스 문의 페이지](https://toris.kr/contact)로 연락 주세요.

## 참고 자료

- [Solidity 공식 문서](https://docs.soliditylang.org) — 스마트 컨트랙트 언어 레퍼런스와 보안 고려 사항.
- [OpenZeppelin Contracts 문서](https://docs.openzeppelin.com/contracts) — `ReentrancyGuard`, `Ownable` 등 검증된 컨트랙트 모듈.
- [thirdweb 공식 문서](https://portal.thirdweb.com) — Next.js에서 컨트랙트와 지갑을 연동하는 SDK 가이드.
