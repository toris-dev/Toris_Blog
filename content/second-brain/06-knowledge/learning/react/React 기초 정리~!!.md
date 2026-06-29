---
title: '[React] React 핵심 개념 정리'
date: 2025-07-10T10:00:00.000Z
slug: react-core-concepts
category: 'React'
tags: ['React', 'JavaScript', 'Frontend']
---

## ⚛️ React 핵심 개념: 컴포넌트, 상태, 그리고 훅

React는 사용자 인터페이스를 구축하기 위한 선언적이고 효율적이며 유연한 JavaScript 라이브러리입니다. "컴포넌트"라고 불리는 작고 고립된 코드 조각을 사용하여 복잡한 UI를 구성할 수 있습니다.

### 1. 컴포넌트와 상태(State)

- **컴포넌트 (Component)**: UI를 구성하는 독립적인 단위입니다. 함수형 컴포넌트와 클래스형 컴포넌트가 있으며, 현재는 함수형 컴포넌트와 훅(Hook)을 사용하는 것이 일반적입니다.
- **상태 (State)**: 컴포넌트의 데이터를 관리하는 객체입니다. `useState` 훅을 사용하여 컴포넌트 내에서 동적인 데이터를 다룰 수 있습니다.

> #### 🎣 훅 (Hook) 이란?
>
> 훅은 함수형 컴포넌트에서 React의 상태(state)와 생명주기(lifecycle) 기능을 "연동(hook into)"할 수 있게 해주는 특별한 함수입니다. 훅은 클래스 컴포넌트의 `this`, `state`, `setState` 없이도 함수형 컴포넌트에서 상태 관리와 다른 React 기능을 사용할 수 있게 해줍니다.

### 2. 사이드 이펙트 (Side Effect) 다루기: `useEffect`

- **사이드 이펙트**: 데이터 가져오기, 구독 설정, 수동으로 React 컴포넌트의 DOM을 수정하는 것과 같이 컴포넌트의 주된 역할(UI 렌더링) 외의 작업을 의미합니다.
- `useEffect`: 함수형 컴포넌트 내에서 사이드 이펙트를 수행할 수 있게 해주는 훅입니다.

#### `useState`의 지연 초기화 (Lazy Initialize)

`useState`는 초기 상태를 설정할 때 함수를 전달하여, 비용이 많이 드는 계산(예: `localStorage` 접근, 복잡한 배열 조작)을 최초 렌더링 시에만 실행하도록 할 수 있습니다.

```javascript
const Calculator = () => {
  // 'key'에 해당하는 localStorage 값을 최초 렌더링 시에만 읽어옵니다.
  const [num, setNum] = useState(() => {
    const savedValue = window.localStorage.getItem('key');
    return savedValue ? JSON.parse(savedValue) : 0;
  });
};
```

#### `useEffect`의 의존성 배열 (Dependency Array)

`useEffect`의 두 번째 인자로 전달되는 배열은, 이펙트가 어떤 값의 변화에 의존하는지를 명시합니다.

- **배열이 없는 경우**: 매 렌더링마다 이펙트가 실행됩니다.
- **빈 배열 (`[]`)**: 최초 렌더링 시에만 이펙트가 실행됩니다.
- **배열에 값이 있는 경우 (`[value]`)**: 해당 값이 변경될 때마다 이펙트가 실행됩니다.

### 3. 커스텀 훅 (Custom Hook) 만들기

반복되는 로직을 함수로 분리하듯, 컴포넌트 간에 반복되는 상태 관련 로직은 커스텀 훅으로 만들어 재사용할 수 있습니다. 커스텀 훅은 이름이 `use`로 시작하는 JavaScript 함수입니다.

```javascript
// useLocalStorage 커스텀 훅 예제
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    // ... localStorage에서 값 읽어오는 로직 ...
  });

  // ... 값 설정 로직 ...

  return [storedValue, setStoredValue];
}
```

### 4. 훅의 실행 흐름 (Hook Flow) 이해하기

훅의 호출 순서와 타이밍을 이해하는 것은 React 애플리케이션의 동작을 예측하는 데 매우 중요합니다.

- **`useState`**: 컴포넌트의 상태를 관리합니다. `setState` 함수는 비동기적으로 동작할 수 있으며, 함수형 업데이트 `(prev => !prev)`를 사용하여 이전 상태를 기반으로 안전하게 상태를 업데이트할 수 있습니다.

  ```javascript
  function handleClick() {
    // 이전 상태(prev)를 받아와서 새로운 상태를 반환합니다.
    setShow((prev) => !prev);
  }
  ```

- **`useEffect`**: 렌더링이 완료된 후에 실행됩니다.

#### 렌더링 순서 예제

```javascript
const Child = () => {
  console.log('Child: 렌더링 시작');
  useEffect(() => {
    console.log('Child: useEffect 실행');
    return () => console.log('Child: useEffect 클린업');
  });
  return <p>자식 컴포넌트</p>;
};

const App = () => {
  console.log('App: 렌더링 시작'); // 1. 부모 렌더링 시작
  const [show, setShow] = useState(false);

  useEffect(() => {
    console.log('App: useEffect 실행'); // 4. 부모 useEffect 실행
    return () => console.log('App: useEffect 클린업');
  });

  return (
    <>
      <button onClick={() => setShow(!show)}>토글</button>
      {show && <Child />}
    </>
  );
};

// 최초 렌더링: App 렌더링 -> App useEffect
// '토글' 클릭 시:
// 1. App 렌더링 시작
// 2. Child 렌더링 시작
// 3. Child useEffect 클린업 (이전 이펙트)
// 4. App useEffect 클린업 (이전 이펙트)
// 5. Child useEffect 실행
// 6. App useEffect 실행
```

#### 업데이트 시 `useEffect`의 클린업(Clean-up)

`useEffect`는 다음 렌더링에서 새로운 이펙트를 실행하기 전에 이전 이펙트를 정리(clean-up)하는 함수를 반환할 수 있습니다. 이는 메모리 누수를 방지하고 불필요한 동작을 막는 데 중요합니다.

이처럼 React의 핵심 개념인 컴포넌트, 상태, 그리고 훅을 잘 이해하고 활용하면 더욱 견고하고 효율적인 애플리케이션을 만들 수 있습니다.
