---
tistoryBlogName: toris-dev
tistoryTitle: React 테스트하기!!~~
tistoryTags: 리액트,프론트엔드,테스트
tistoryVisibility: "0"
tistoryCategory: "1399376"
tistoryPostId: "10"
tistoryPostUrl: https://toris-dev.tistory.com/10
---
### Overview
테스트 코드는 필수다. 라는 식의 말을 많이 들어봤지만 막상 테스트 코드를 작성한 기억이 없습니다. 항상 에러가 어디서나는지 `console.log()` 를 찍으면서 확인을 했습니다. 
너무 불편해서 이번에는 React에서는 어떻게 테스트 코드를 작성할지 공식문서에서 글을 읽고 실습해봤습니다.

### 테스트 코드 추천 도구
**Jest**는 JavaScript 테스트 러너입니다. 
DOM에 접근하게 하는 jsdom 을 통해서 jsdom은 단지 어떻게 브라우저가 작동하는지에 대한 대략적 개요입니다.
하지만 이는 종종 React 컴포넌트를 테스팅 하기에 충분합니다. Jest는 모킹과 타이 같은 파워풀한 특징과 결합되어 훌륭한 반복속도를 제공합니다. 그래서 더 많은 제어 코드를 가집니다.

**React Testing Library** 는 실행 디테일을 가지지 않는 react 컴포넌트를 테스트하게 하는 도구 모음입니다. 이러한 접근은 디테일을 수월하게 하며 접근성에 대한 가장 좋은 연습을 가능하게 합니다. 
사용자 관점에서 컴포넌트의 동작을 테스트 하는데 중점을 두고 있습니다. 

**위에 두 가지 도구는 같이 사용할 때 큰 힘을 발휘합니다.** 

RTL은 컴포넌트 내부에 props나 state를 조회하지 않고, 실제 DOM에 접근하여 텍스트, 버튼, 이미지... 같은 필요한 테스트만 진행한다. 


### 테스트 코드 작성~
create-react-app 설치 하였을 경우에 있는 Jest, RTL를 사용하여 테스트 코드를 작성해봤습니다.
```javascript
// App.jsx
import { useState } from "react";
import CountView from "./Components/CountView";
import CountButtons from "./Components/CountButtons";

function App() {
  const [count, setCount] = useState(0);
  
  const incrementHandler = () => {
    setCount((c) => ++c);
  }
  const decrementtHandler = () => {
    setCount((c) => --c);
  }
  return (
    <div className="App">
      <CountView count={count} />
      <CountButtons
        incrementFn={incrementHandler}
        decrementFn={decrementtHandler}
      />
    </div>
  );
}

export default App;
```
위에 코드에서는 App.js 에서 count 상태 값을 다루고 있고 props 로 count 를 CountView 한테  이벤트 핸들러는 CountButtons 에게 넘기고 있다.



```javascript
// CountButtons.jsx
import React from 'react'

function CountButtons({ incrementFn, decrementFn}) { // 실전에서는 data-testid 를 상위 앨린머트에게 줘서 사용.
  return (
    <div>
        <button data-testid="incrementBtn" onClick={incrementFn}>+</button>
        <button data-testid="decrementBtn" onClick={decrementFn}>-</button>
    </div>
  )
}
export default CountButtons
```
CountButtons 에서는 증가버튼 감소버튼이 있습니다.


```javascript
// CountButtons.test.js
import { fireEvent, render, screen } from "@testing-library/react";
import CountButtons from "./CountButtons"

describe('<CountButtons />', () => {
    it('증가 버튼과 감소 버튼이 있습니다.', () => { // 테스트 함수 정의
        render(<CountButtons/>);
        const increment = screen.getByTestId('incrementBtn') // 속성 data-testid="incrementBtn" 인 앨리먼트 불러오기
        const decrement = screen.getByRole('button', {name: "-"}) // button 태그의 text 노드값이 "-" 인 앨리먼트를 불러오기
        expect(increment).toBeInTheDocument(); // 해당 요소를 가져와 그 요소가 html document에 있는지 테스트
        expect(decrement).toBeInTheDocument();
    })

    it('incrementFn decrementFn 모킹해서 클릭시 호출 되었는지 확인', () => {
        const incrementFn = jest.fn(); // mock Function 을 생성할 수 있도록 함수 제공
        const decrementFn = jest.fn();
        
        render(<CountButtons incrementFn={incrementFn} decrementFn={decrementFn} /> )

        const incrementBtn = screen.getByTestId('incrementBtn') // 속성 data-testid="incrementBtn" 인 앨리먼트 불러오기
        const decrementBtn = screen.getByRole('button', {name: "-"}) // button 태그의 text 노드값이 "-" 인 앨리먼트를 불러오기

        fireEvent.click(incrementBtn)
        fireEvent.click(decrementBtn) // 클릭 이벤트 2번 발생
  
        expect(incrementFn).toHaveBeenCalled() // 함수가 호출되었는지 여부확인
        expect(decrementFn).toHaveBeenCalled()
    })
})
```


```javascript
// CountView.jsx
import React from 'react'

function CountView({count}) {
  return (
    <div>현재 숫자: {count}</div>
  )
}
export default CountView
```


```javascript
// CountView.test.js
import { render, screen } from "@testing-library/react";
import CountView from "./CountView"

describe('<CountView />' , () => {
    it('현재 count 상태 값', () => {
        let testCount = 0
        render(<CountView count={testCount} /> ); // 테스트 할 컴포넌트 렌더링
        const initialState = screen.getByText('현재 숫자: 0');
        expect(initialState).toBeInTheDocument();
        
        testCount = 13;
        render(<CountView count={testCount} />);
        const countState = screen.getByText('현재 숫자: 13') // 렌더한 컴포넌트에서 현재 숫자: 13 이라는 텍스트를 가진 엘리먼트가 있는지 확인
        expect(countState).toBeInTheDocument();

    })

})
```

아래와 같이 정상적으로 테스트가 완료된 것을 확인할 수 있습니다.
![[images/스크린샷 2023-12-23 025817.png]]

`npm test -- --coverage .` coverage 를 확인한 결과 아래와 같이 100% 로 잘 나왔습니다.
![[스크린샷 2023-12-23 030054.png]]



### 느낀점
앞으로 프로젝트를 진행 하면서 테스트 코드를 작성하면 얼마나 편할까 라는 생각이 드네요.

아직 jest, RTL 사용법을 제대로 알지는 못하지만 사용하면 console.log() 지옥에서 벗어날 수 있다는 생각을 하면 편한 것 같기도 합니다. 

**console.log() 지옥은 다시 경험하고 싶지 않기에 공부해야 겠습니다.**