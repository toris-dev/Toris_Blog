### react.createPortal 없이 만들어보기

```js
const modalWrapperStyle = {
	position: 'relative',
	zIndex:0
}

const higherIndexWrapperStyle = {
	position: 'relative',
	zIndex: 1,
	backgroundColor: 'blue',
	padding: '10px'
}

const App = () => {
	return(
		<div>
			<div style={modalWrapperStyle}>
				<button>모달 열기</button>
			</div>
			<div style={higherIndexWrapperStyle}
				Z-iNDEX 2
			</div>
		</div>
	)
}

const modalStyle = {
	position: 'fixed',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	backgroundColor: '#fff',
	padding: '50px',
	zIndex: 1000
}

const overlayStyle = {
	position: 'fixed',
	top:0,
	left:0,
	right:0,
	bottom: 0,
	backgroundColor: 'rgba(0,0,0,.7)',
	zIndex: 1000
}

export default function Modal() {
	return (
		<>
			<div style={overlayStyle} />
			<div style={modalStyle}>
				<button>모달 닫기</button>
			</div>
		</>
	)

}
```