---
title: '[React] 불필요한 DOM 요소를 피하는 방법: React.Fragment'
date: 2025-07-12T16:00:00.000Z
slug: avoiding-unnecessary-dom-elements-with-react-fragment
category: 'React'
tags: ['React', 'JSX', 'DOM', 'Fragment']
---

## 🤔 JSX의 규칙: 단일 루트 요소

React 컴포넌트에서 여러 엘리먼트를 반환하려면, 반드시 하나의 부모(루트) 요소로 감싸야 한다는 규칙이 있습니다. 이 때문에 종종 불필요한 `<div>` 태그를 추가하게 됩니다.

```javascript
// ❌ 잘못된 예: 여러 개의 루트 요소를 반환
function MyComponent() {
  return (
    <h1>제목</h1>
    <p>내용</p>
  );
}

// ✅ 일반적인 해결책: 불필요한 <div>로 감싸기
function MyComponent() {
  return (
    <div>
      <h1>제목</h1>
      <p>내용</p>
    </div>
  );
}
```

이 방식은 유효하지만, 실제 DOM에 불필요한 `<div>`가 추가되어 HTML 구조가 복잡해지고, 특정 CSS 스타일(예: Flexbox, Grid) 적용에 문제를 일으킬 수 있습니다.

## ✨ 해결책: `React.Fragment`

`React.Fragment`는 이러한 문제를 해결하기 위해 등장했습니다. `Fragment`는 DOM에 별도의 노드를 추가하지 않고 여러 자식 엘리먼트를 그룹화할 수 있게 해주는 특별한 컴포넌트입니다.

```javascript
import React from 'react';

function MyComponent() {
  return (
    <React.Fragment>
      <h1>제목</h1>
      <p>내용</p>
    </React.Fragment>
  );
}
```

위 코드는 렌더링될 때 `<h1>`과 `<p>` 태그만 남기고, `<React.Fragment>`는 사라집니다. 결과적으로 더 깔끔하고 의미 있는 HTML 구조를 만들 수 있습니다.

### 단축 문법: `<>`

`React.Fragment`를 매번 타이핑하는 것은 번거로울 수 있습니다. 다행히도 React는 이를 위한 단축 문법을 제공합니다.

```javascript
function MyComponent() {
  return (
    <>
      <h1>제목</h1>
      <p>내용</p>
    </>
  );
}
```

`<></>`는 `<React.Fragment></React.Fragment>`와 거의 동일하게 동작합니다. 단, 한 가지 중요한 차이점이 있습니다.

### `<>` vs `React.Fragment`

| 특징             | `<>` (단축 문법) | `<React.Fragment>` (명시적 문법) | 
| ---------------- | ---------------- | --------------------------------- |
| **DOM 추가**     | 없음             | 없음                              |
| **`key` 속성**   | **불가능**       | **가능**                          |
| **기타 속성**    | 불가능           | 불가능                            |

배열을 렌더링할 때와 같이 `key` prop을 전달해야 하는 경우에는 반드시 명시적인 `<React.Fragment>` 문법을 사용해야 합니다.

```javascript
function Glossary(props) {
  return (
    <dl>
      {props.items.map(item => (
        // `key` prop이 필요하므로, 단축 문법을 사용할 수 없습니다.
        <React.Fragment key={item.id}>
          <dt>{item.term}</dt>
          <dd>{item.description}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
```

### `React.createElement`와의 관계

JSX는 내부적으로 `React.createElement(component, props, ...children)` 함수 호출로 변환됩니다. `React.Fragment`도 마찬가지입니다.

```javascript
// 이 JSX 코드는
const jsx = (
  <>
    <td>Hello</td>
    <td>World</td>
  </>
);

// 아래의 `React.createElement` 호출로 변환됩니다.
const element = React.createElement(
  React.Fragment,
  null,
  React.createElement('td', null, 'Hello'),
  React.createElement('td', null, 'World')
);
```

결론적으로, 불필요한 `<div>` 래퍼(wrapper)를 피하고 싶을 때 `React.Fragment` 또는 단축 문법 `<>`를 사용하는 것은 React 개발의 기본적이면서도 중요한 패턴입니다. 이를 통해 더 깔끔하고 효율적인 컴포넌트를 작성할 수 있습니다.