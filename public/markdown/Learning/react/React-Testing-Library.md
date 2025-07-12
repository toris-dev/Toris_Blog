---
title: '[React] React Testing Library 철학과 사용법'
date: 2025-07-12T15:00:00.000Z
slug: react-testing-library-philosophy-and-usage
category: 'React'
tags: ['React', 'Testing', 'React Testing Library', 'Jest', 'Frontend']
---

## 🐐 React Testing Library (RTL) 철학: 사용자처럼 테스트하라

React Testing Library (RTL)는 "테스트는 소프트웨어가 동작하는 방식과 유사해야 한다"는 핵심 원칙을 가지고 있습니다. 이는 구현의 세부 사항(예: 컴포넌트의 내부 상태, props, 생명주기 메서드)을 테스트하는 대신, 사용자가 애플리케이션과 상호작용하는 방식에 초점을 맞추는 것을 의미합니다.

과거에 많이 사용되던 Enzyme과 같은 도구는 컴포넌트의 내부를 쉽게 조회하고 조작할 수 있게 해주었지만, 이는 테스트가 구현에 너무 밀접하게 결합되는 문제를 낳았습니다. 결과적으로, 기능은 동일하더라도 내부 리팩토링만으로도 테스트가 쉽게 깨지는 현상이 발생했습니다.

RTL은 이러한 문제를 해결하기 위해 다음과 같은 철학을 제시합니다.

> **"The more your tests resemble the way your software is used, the more confidence they can give you."**
> (테스트가 소프트웨어 사용 방식과 유사할수록, 더 큰 자신감을 줄 수 있습니다.)

즉, RTL은 `<div>` 태그나 특정 클래스명을 찾는 것보다, 사용자가 화면에서 볼 수 있는 텍스트(`"Hello, World"`)나 역할(`button`, `link` 등)을 통해 요소를 찾는 것을 권장합니다. 이를 통해 개발자는 자연스럽게 접근성을 고려하게 되며, 테스트는 내부 구현의 변경에 더 강건해집니다.

### Jest와 RTL의 관계

-   **Jest**: 테스트를 실행하고(`test runner`), 단언하며(`expect`), 모의 객체를 만드는 전반적인 테스트 프레임워크입니다.
-   **RTL**: Jest와 같은 테스트 프레임워크 위에서, React 컴포넌트를 렌더링하고 사용자와 같이 상호작용할 수 있도록 돕는 유틸리티 함수들을 제공합니다.

간단히 말해, **Jest가 테스트의 판을 깔아준다면, RTL은 그 판 위에서 React 컴포넌트를 가지고 놀 수 있는 장난감들을 제공**하는 셈입니다.

### RTL의 주요 API와 사용법

#### `render`

테스트할 컴포넌트를 가상의 DOM에 렌더링합니다.

```javascript
import { render } from '@testing-library/react';
import MyComponent from './MyComponent';

render(<MyComponent />);
```

#### `screen`

`render` 함수로 렌더링된 DOM에 접근할 수 있는 쿼리들을 담고 있는 객체입니다. `getBy...`, `findBy...`, `queryBy...` 등의 메서드를 제공합니다.

-   **`getBy...`**: 조건에 맞는 요소가 없으면 에러를 발생시킵니다. (동기)
-   **`queryBy...`**: 조건에 맞는 요소가 없으면 `null`을 반환합니다. 요소가 없는 것을 확인할 때 유용합니다. (동기)
-   **`findBy...`**: 조건에 맞는 요소가 나타날 때까지 기다립니다. 비동기적인 UI 변경을 테스트할 때 사용합니다. (비동기, Promise 반환)

#### 쿼리 우선순위

RTL은 사용자의 접근성과 가장 가까운 순서대로 쿼리를 사용할 것을 권장합니다.

1.  **`getByRole`**: `button`, `heading`, `link` 등 접근성 역할(ARIA role)로 요소를 찾습니다. 가장 우선적으로 사용해야 합니다.
2.  **`getByLabelText`**: `<label>`과 연결된 폼 요소를 찾습니다.
3.  **`getByPlaceholderText`**: `placeholder` 속성으로 폼 요소를 찾습니다.
4.  **`getByText`**: 텍스트 콘텐츠로 요소를 찾습니다.
5.  **`getByDisplayValue`**: 폼 요소의 현재 값으로 찾습니다.
6.  **`getByAltText`**: `<img>` 태그의 `alt` 속성으로 찾습니다.
7.  **`getByTitle`**: `title` 속성으로 찾습니다.
8.  **`getByTestId`**: 위 방법으로 찾을 수 없을 때, 최후의 수단으로 `data-testid` 속성을 사용합니다.

#### `fireEvent`

사용자 이벤트를 시뮬레이션합니다. (예: `click`, `change`, `submit`)

```javascript
import { fireEvent } from '@testing-library/react';

const button = screen.getByRole('button', { name: /클릭/i });
fireEvent.click(button);
```

#### `user-event`

`fireEvent`보다 더 실제 사용자 상호작용에 가깝게 이벤트를 발생시키는 라이브러리입니다. 예를 들어, `userEvent.type(input, 'hello')`는 실제 사용자가 키보드를 치는 것처럼 각 문자에 대한 `keyDown`, `keyPress`, `keyUp` 이벤트를 모두 발생시킵니다. 특별한 이유가 없다면 `fireEvent`보다 `user-event` 사용이 권장됩니다.

```javascript
import userEvent from '@testing-library/user-event';

const input = screen.getByLabelText('username-input');
await userEvent.type(input, 'Hello, World!');
```

RTL의 철학을 이해하고 올바른 쿼리를 사용하는 것은, 단순히 테스트를 통과시키는 것을 넘어, 더 견고하고 접근성 높으며 유지보수하기 좋은 React 애플리케이션을 만드는 데 큰 도움이 됩니다.