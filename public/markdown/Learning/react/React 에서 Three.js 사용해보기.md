---
title: '[React] React와 Three.js로 인터랙티브 3D 웹 만들기'
date: 2025-07-11T11:00:00.000Z
slug: react-with-threejs-interactive-3d-web
category: 'React'
tags: ['React', 'Three.js', '3D', 'WebGL', 'JavaScript']
---

## 🚀 React에서 Three.js로 3D 웹 시작하기

최근 웹 트렌드 중 하나는 사용자에게 더욱 몰입감 있는 경험을 제공하는 인터랙티브 3D 웹입니다. Three.js는 WebGL을 기반으로 하는 강력한 JavaScript 3D 라이브러리로, 웹 브라우저에서 GPU 가속 3D 애니메이션을 만들 수 있게 해줍니다.

React와 Three.js를 함께 사용하면 복잡한 3D 장면을 컴포넌트 기반으로 관리하고, React의 선언적인 UI 패턴을 3D 그래픽스에 적용할 수 있습니다. `@react-three/fiber`와 `@react-three/drei` 같은 라이브러리는 이러한 통합을 더욱 쉽게 만들어 줍니다.

### 왜 React와 Three.js를 함께 사용할까?

-   **컴포넌트 기반 개발**: 3D 장면의 각 요소를 재사용 가능한 React 컴포넌트로 만들 수 있습니다.
-   **상태 관리**: React의 `useState`, `useReducer` 등을 사용하여 3D 객체의 상태를 쉽게 관리할 수 있습니다.
-   **생태계 활용**: React의 방대한 생태계와 도구들을 그대로 활용할 수 있습니다.

### 시작하기: 기본 3D 큐브 만들기

`@react-three/fiber`를 사용하면 Three.js의 객체들을 JSX 태그처럼 선언적으로 사용할 수 있습니다.

```javascript
// components/Cube.js
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';

function Cube(props) {
  // 3D 객체에 접근하기 위한 ref
  const meshRef = useRef();

  // 마우스 호버 상태 관리
  const [hovered, setHover] = useState(false);
  // 클릭 상태 관리
  const [active, setActive] = useState(false);

  // 매 프레임마다 실행되는 훅
  useFrame((state, delta) => {
    // 큐브를 회전시킵니다.
    if (meshRef.current) {
      meshRef.current.rotation.x += delta;
      meshRef.current.rotation.y += delta;
    }
  });

  return (
    <mesh
      {...props}
      ref={meshRef}
      scale={active ? 1.5 : 1}
      onClick={(event) => setActive(!active)}
      onPointerOver={(event) => setHover(true)}
      onPointerOut={(event) => setHover(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  );
}

export default Cube;
```

### 3D 장면 설정하기

`@react-three/fiber`의 `Canvas` 컴포넌트는 3D 렌더링이 일어날 DOM 요소를 생성합니다.

```javascript
// pages/index.js
import React from 'react';
import { Canvas } from '@react-three/fiber';
import Cube from '../components/Cube';

export default function HomePage() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas>
        {/* 조명 설정 */}
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />

        {/* 3D 객체 배치 */}
        <Cube position={[-1.2, 0, 0]} />
        <Cube position={[1.2, 0, 0]} />
      </Canvas>
    </div>
  );
}
```

### 다음 단계는?

-   **모델링**: Blender와 같은 3D 모델링 도구를 사용하여 자신만의 모델을 만들고, `gltfjsx`를 사용하여 React 컴포넌트로 변환할 수 있습니다.
-   **애니메이션**: `useFrame` 훅을 사용하여 시간에 따른 복잡한 애니메이션을 구현할 수 있습니다.
-   **물리 엔진**: `@react-three/cannon`과 같은 라이브러리를 사용하여 3D 장면에 물리 법칙을 적용할 수 있습니다.

React와 Three.js의 조합은 웹 개발자에게 3D 그래픽스의 세계를 열어주는 강력한 도구입니다. 처음에는 복잡해 보일 수 있지만, `@react-three/fiber`와 같은 추상화 라이브러리를 통해 점진적으로 학습해 나간다면, 곧 놀라운 인터랙티브 경험을 만들어낼 수 있을 것입니다.