---
title: '[React] React Testing Library와 Jest로 컴포넌트 테스트하기'
date: 2025-07-12T14:00:00.000Z
slug: testing-react-components-with-rtl-and-jest
category: 'React'
tags: ['React', 'Testing', 'Jest', 'React Testing Library', 'Frontend']
---

## 🧪 React 컴포넌트 테스트, 왜 필요할까?

테스트 코드는 안정적인 애플리케이션을 만드는 데 필수적입니다. 특히 복잡한 상호작용이 많은 React 애플리케이션에서는, 새로운 기능 추가나 리팩토링 시에 기존 기능이 깨지지 않았는지 확인하는 회귀 테스트(Regression Test)의 중요성이 더욱 커집니다. `console.log()`를 이용한 수동적인 확인은 비효율적이고 실수를 유발하기 쉽습니다. 자동화된 테스트 코드를 작성함으로써, 우리는 더 빠르고 안정적으로 코드를 개선해 나갈 수 있습니다.

### 추천 도구: Jest와 React Testing Library (RTL)

- **Jest**: Facebook에서 만든 JavaScript 테스트 러너(Test Runner)입니다. 테스트를 실행하고, 단언(assertion)하며, 모의(mocking) 객체를 만드는 등의 기능을 제공합니다. `create-react-app`에 기본적으로 내장되어 있습니다.
- **React Testing Library (RTL)**: 사용자의 관점에서 컴포넌트를 테스트하도록 돕는 도구 모음입니다. 컴포넌트의 내부 구현(props, state 등)을 직접 테스트하기보다는, 실제 사용자가 화면에서 보고 상호작용하는 방식을 테스트하도록 유도합니다. 이는 테스트가 구현의 세부 사항에 덜 의존하게 만들어, 리팩토링 시에도 테스트 코드가 깨질 가능성을 줄여줍니다.

이 두 도구는 함께 사용될 때 강력한 시너지를 발휘하여, 견고하고 유지보수하기 좋은 테스트 코드를 작성할 수 있게 돕습니다.

### 테스트 코드 작성하기: 카운터 앱 예제

간단한 카운터 앱을 예제로 테스트 코드를 작성해보겠습니다.

#### 1. 컴포넌트 코드

```javascript
// src/App.js
import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1 data-testid="count-display">{count}</h1>
      <button onClick={() => setCount(count + 1)}>증가</button>
      <button onClick={() => setCount(count - 1)}>감소</button>
    </div>
  );
}

export default App;
```

#### 2. 테스트 코드

`create-react-app`은 `src/App.test.js` 파일을 자동으로 생성합니다. 이 파일에 테스트 코드를 작성합니다.

```javascript
// src/App.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// describe: 여러 테스트를 하나의 그룹으로 묶습니다.
describe('<App /> 컴포넌트', () => {
  // it (또는 test): 개별 테스트 케이스를 정의합니다.
  it('카운터가 올바르게 렌더링되고 동작해야 합니다.', () => {
    // 1. 렌더링: 테스트할 컴포넌트를 렌더링합니다.
    render(<App />);

    // 2. 요소 찾기: screen 객체를 사용하여 화면의 요소를 찾습니다.
    const countDisplay = screen.getByTestId('count-display');
    const incrementButton = screen.getByRole('button', { name: '증가' });
    const decrementButton = screen.getByRole('button', { name: '감소' });

    // 3. 단언 (Assertion): 요소가 존재하는지, 초기 상태가 올바른지 확인합니다.
    expect(countDisplay).toBeInTheDocument();
    expect(incrementButton).toBeInTheDocument();
    expect(decrementButton).toBeInTheDocument();
    expect(countDisplay).toHaveTextContent('0');

    // 4. 이벤트 발생: fireEvent를 사용하여 사용자 이벤트를 시뮬레이션합니다.
    fireEvent.click(incrementButton);

    // 5. 상태 변경 확인: 이벤트 발생 후 상태가 올바르게 변경되었는지 확인합니다.
    expect(countDisplay).toHaveTextContent('1');

    // 감소 버튼 클릭
    fireEvent.click(decrementButton);
    fireEvent.click(decrementButton);

    // 최종 상태 확인
    expect(countDisplay).toHaveTextContent('-1');
  });

  it('증가 버튼 클릭 시 모의 함수가 호출되는지 확인합니다.', () => {
    // 모의 함수(Mock Function) 생성
    const mockIncrement = jest.fn();

    // 모의 함수를 props로 전달하여 렌더링
    render(<button onClick={mockIncrement}>증가</button>);

    const incrementButton = screen.getByRole('button', { name: '증가' });

    // 버튼 클릭
    fireEvent.click(incrementButton);

    // 모의 함수가 1번 호출되었는지 확인
    expect(mockIncrement).toHaveBeenCalledTimes(1);
  });
});
```

### 테스트 커버리지 확인

테스트 코드가 프로젝트의 얼마나 많은 부분을 검증하는지 확인하려면 다음 명령어를 사용합니다.

```bash
npm test -- --coverage
```

이 명령어는 테스트 커버리지 리포트를 생성하여, 어떤 파일과 코드 라인이 테스트되었는지 시각적으로 보여줍니다.

### 느낀점

테스트 코드 작성은 처음에는 번거롭게 느껴질 수 있지만, 장기적으로는 디버깅 시간을 줄여주고 코드의 안정성을 크게 높여줍니다. 특히 RTL을 통해 사용자 관점의 테스트를 작성하는 습관은, 단순히 기능을 검증하는 것을 넘어 더 나은 사용자 경험을 고민하게 만드는 계기가 될 수 있습니다. `console.log()` 지옥에서 벗어나, 자신감 있게 코드를 리팩토링하고 새로운 기능을 추가하기 위해 테스트 코드 작성은 이제 선택이 아닌 필수입니다.
