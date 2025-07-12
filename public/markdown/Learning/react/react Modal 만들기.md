---
title: '[React] React Portal을 이용한 효율적인 모달 관리'
date: 2025-07-12T17:00:00.000Z
slug: efficient-modal-management-with-react-portals
category: 'React'
tags: ['React', 'Modal', 'Portal', 'DOM', 'Frontend']
---

## 🚪 모달(Modal)과 `z-index`의 한계

모달, 툴팁, 드롭다운 메뉴 등은 종종 부모 컴포넌트의 DOM 트리 바깥에 렌더링되어야 하는 UI 요소입니다. 일반적인 컴포넌트 트리 내에서 이를 구현하려고 하면, 부모 컴포넌트의 `overflow: hidden`이나 `z-index` 스타일에 의해 의도치 않게 가려지거나 잘리는 문제가 발생할 수 있습니다.

```css
.parent-with-style {
  position: relative;
  overflow: hidden; /* 이 스타일은 자식 모달을 잘라버릴 수 있습니다. */
  z-index: 1;
}

.modal-inside-parent {
  position: fixed;
  z-index: 9999; /* 부모의 z-index 때문에 소용없을 수 있습니다. */
}
```

이러한 "쌓임 맥락(stacking context)" 문제를 해결하기 위해 React는 **포탈(Portal)** 이라는 강력한 기능을 제공합니다.

## Portal: 컴포넌트를 다른 DOM 노드로 순간이동시키기

포탈을 사용하면, 컴포넌트의 논리적인 위치는 React 컴포넌트 트리 안에 그대로 두면서, 실제 렌더링 결과(DOM)는 부모 컴포넌트의 바깥, 즉 DOM 트리의 다른 위치에 삽입할 수 있습니다.

이를 통해 모달 컴포넌트는 부모의 CSS 스타일에 영향을 받지 않고 최상위 레벨에서 자유롭게 렌더링될 수 있습니다.

### `ReactDOM.createPortal` 사용법

포탈을 사용하려면 `ReactDOM.createPortal(child, container)` 함수를 호출합니다.

-   `child`: 렌더링할 React 자식 요소 (엘리먼트, 문자열, 프래그먼트 등)
-   `container`: 자식을 렌더링할 실제 DOM 노드

#### 1. 포탈을 위한 DOM 컨테이너 준비

먼저, 모달이 렌더링될 DOM 노드를 `public/index.html` (또는 Next.js의 경우 `_document.js`)에 추가합니다.

```html
<!-- public/index.html -->
<body>
  <div id="root"></div>
  <div id="modal-root"></div> <!-- 모달이 렌더링될 컨테이너 -->
</body>
```

#### 2. 재사용 가능한 모달 컴포넌트 만들기

이제 `createPortal`을 사용하여 모달 컴포넌트를 만듭니다.

```javascript
// components/Modal.js
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

const modalRoot = document.getElementById('modal-root');

function Modal({ children, onClose }) {
  // 모달이 열렸을 때 외부 스크롤을 막는 효과
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return ReactDOM.createPortal(
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeButtonStyle}>X</button>
        {children}
      </div>
    </div>,
    modalRoot
  );
}

export default Modal;

// 스타일 정의
const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1000
};
const modalStyle = {
  position: 'fixed', top: '50%', left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: '#fff', padding: '50px', zIndex: 1000
};
const closeButtonStyle = { position: 'absolute', top: '10px', right: '10px' };
```

#### 3. 모달 사용하기

이제 어떤 컴포넌트에서든 `Modal` 컴포넌트를 쉽게 사용할 수 있습니다.

```javascript
// App.js
import React, { useState } from 'react';
import Modal from './components/Modal';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>모달 열기</button>
      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <h2>모달 제목</h2>
          <p>이것은 포탈을 통해 렌더링된 모달입니다.</p>
        </Modal>
      )}
    </div>
  );
}
```

### 포탈의 중요한 특징: 이벤트 버블링

포탈을 사용하더라도, 이벤트는 React 컴포넌트 트리를 따라 전파(버블링)됩니다. 즉, 모달 내부에서 발생한 이벤트는 부모 컴포넌트에서 감지할 수 있습니다. 이는 포탈이 DOM 위치만 변경할 뿐, React 트리 내의 논리적 구조는 유지하기 때문입니다.

```javascript
function Parent() {
  // 모달 내부의 클릭 이벤트도 여기서 감지됩니다.
  const handleClick = () => console.log('Div clicked');

  return (
    <div onClick={handleClick}>
      <Modal>...</Modal>
    </div>
  );
}
```

이처럼 React Portal은 `z-index`, `overflow`와 같은 CSS 문제를 우아하게 해결하고, 재사용 가능하며 예측 가능한 모달 컴포넌트를 만드는 강력한 방법을 제공합니다.