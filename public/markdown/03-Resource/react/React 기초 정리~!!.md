### 컴포넌트 상태 다루기
* 컴포넌트 -> 앨리먼트의 집합    ( <></>  ) 
* useState -> 상태값을 다루는 훅

>[!help] Hook 이란?
>Hook은 함수형 컴포넌트에서 React state와 생명주기 기능(lifecycle features)을 “연동(hook into)“할 수 있게 해주는 함수라고 합니다. Hook은 class 안에서는 동작하지 않으며, 대신 class 없이 React를 사용할 수 있게 해주는 것이라고 합니다.

### 컴포넌트 사이드 이펙트 다루기
* 사이드 이펙트 -> 부수 효과를 의도적으로 발생시킬 때 사용
* useState -> lazy initialize    비용이 많이 드는 localStorage 에 접근하거나 배열을 조작 할 때 사용.
```javascript
const Calculator = () => {
	const [num, setnum] = useState(() => window.localStorage.getItem("key"))
}
```
* useEffect -> dependency array   
사이드이펙트에 동작이 의존하는 값을 넣는다.




### 커스텀 훅 만들기

* 반복 -> 함수로 만들어서 따로 만든다.
* 훅들이 반복 -> custom Hook 으로 만들어서 사용.



### hook flow 이해하기
* hook flow -> hook들의 호출 타이밍!!
* useState -> setState시 prev이 주입된다.
```javascript
function handleClick() {
	setShow((prev) => !prev); // true면 false, false면 true로
}
```

### hook flow 이해하기 2
* useEffect -> render가 끝난 뒤
```javascript
const rootElement = document.getElementById("root");

const Child = () => {
	console.log("Child render Start")
	const element = ( 
		<>
			<input />
			<p></p>
		</>
	);
	console.log("Child render end")
	return element;
};
const App = () => {
	console.log("App render Start"); // 1
	const [show, setShow] = useState(() => {
		console.log("App useState"); // 2
		return false;
	})
	useEffect(() => {
		console.log("App useEffect, no deps"); // 4
	})
	useEffect(() => {
		console.log("App useEffect, empty deps"); // 5
	}, [])
	useEffect(() => {
		console.log("App useEffect, [show]"); // 6
	}, [show])
	
	return (
		<>
			<button onClick={handleClick}>Search</button>
			{ show ? <Child /> : null }
		</>
	)
};

ReactDoM.render(<App />, rootElement);
console.log("App render end") // 3
```
* update 시 -> useEffect clean up / useEffect
```javascript
const rootElement = document.getElementById("root");

const Child = () => {
	console.log("Child render Start") // 2
	const element = ( 
		<>
			<input />
			<p></p>
		</>
	);
	console.log("Child render end") // 3
	return element;
};
const App = () => {
	console.log("App render Start"); // 1
	const [show, setShow] = useState(() => {
		console.log("App useState"); 
		return false;
	})
	useEffect(() => {
		console.log("App useEffect, no deps"); // 4
	})
	useEffect(() => {
		console.log("App useEffect, empty deps"); 
	}, [])
	useEffect(() => {
		console.log("App useEffect, [show]"); // 5
	}, [show])
	
	return (
		<>
			<button onClick={handleClick}>Search</button>
			{ show ? <Child /> : null }
		</>
	)
};

ReactDoM.render(<App />, rootElement);
console.log("App render end") 
```
* dependency array -> 전달받은 값의 변화 있는 경우에만

