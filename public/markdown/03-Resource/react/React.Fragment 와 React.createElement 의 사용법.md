
React.createElement 를 사용하면 div classname="root" 밑에 div 엘리먼트로 하나 더 감싸져서 h1, h2, h3가 생성되지만
```javascript
import React from 'react'

function App() {
	return (
		<div children={[
			React.createElement('h1',null,'Hi'),
			React.createElement('h2',null,'Bye'),
			React.createElement('h3',null,'Chilren'),
		]}/>
	)
}
```


아래와 같이 Fragment로 생성하면 div classname="root" 밑에 div 엘리먼트 없이 h1, h2, h3 가 바로 생성된다.

```javascript
import React from 'react';

function App() {
  return (
    <React.Fragment>
	    <h1>Hi</h1>
	    <h2>Bye</h2>
	    <h3>Chilren</h3>
    </React.Framgment>
  );
}

export default App;
```

React.Fragment 를 쓰기엔 귀찮으니까 <> </> 이렇게 태그로 감싸서 사용할 수 있다.
<></> 와 React.Fragment 는 동일하다.
