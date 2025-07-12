---
title: [Career] js 유용 함수
date: 2025-07-09T16:55:19.898Z
slug: js-유용-함수
category: Career
tags: Career, JavaScript, CodingTest
---

1. Map key,value 에 해당하는 자료형태로 많이 사용하는 자료구조

```js
const map = new Map();

// map 추가하기
map.set(1, { key: 'one', password: 'good' });
map.set(2, { key: 'two', password: 'bad' });
map.set(3, { key: 'three', password: 'haha' });

// map 순회
for (const [key, value] of map) {
  console.log(`key: ${key}, value: ${value}`);
}

// map 정렬
const arr = [...map];
arr.sort((a, b) => {
  if (a[1].password < b[1].password) {
    return 1;
  }
  return -1;
});
const newMap = new Map(arr);
for (const [key, value] of newMap) {
  console.log(`key: ${key}, value: ${value}`);
}

// map에 값 있는지 체크
console.log(newMap.has(1)); // true key 값으로 찾기

// map value 가져오기
console.log(newMap.get(1)); // a key 값으로 가져오기

// map 요소 개수
console.log(newMap.size);

// map 요소 삭제
newMap(1); // key값으로 삭제
```

2. Set 중복을 허용하지 않는 value 만 가진 자료구조

```js
const set = new Set();

// 값 추가하기
set.add('value1');
set.add('value2');
set.add('value3');
set.add('value4');

// 값 있는지 체크
console.log(set.has('value1')); // true 반환
console.log(set.has('value5')); // false 반환

// 값 지우기
console.log(set.delete('value1')); // true 반환
console.log(set.has('value1')); // false 반환

// Set 요소 개수 반환
console.log(set.size); // 1

// Set 객체 순환하기
for (const value of set) {
  console.log(value);
}

// Set 정렬하기
const sortArr = [...set];
sortArr.sort((a, b) => {
  if (a < b) {
    return 1;
  }
  return -1;
});
console.log(sortArr);
```

## 배열 관련한 함수 학습하기

### map

map 을 이용하여 어떤 과정을 거친 배열을 만들어내보기
순환하고 있는 요소를 리턴 값과 바꾼다고 생각하면 이해하기 편하다.

```js
const arr = [
  { name: 'aaa', number: 1111 },
  { name: 'bbb', number: 2222 },
  { name: 'ccc', number: 3333 }
];

const mapArr = arr.map((data) => {
  data.number *= 2;
  return data;
});

console.log(mapArr);
```

### filter

filter 를 이용하여 특정 조건에 해당하는 것을 걸러 배열로 만들어보자.
filter 를 사용하는 이유는 map 에서 조건분기문을 사용하면 배열의 size 만큼 생성되기에 return 을 시키지 않으면 `null`, `undefined` 가 들어가지만 filter 를 사용하면 배열의 size 만큼의 배열을 생성하는 것 이 아니라 `return` 이 `true` 인 것만 배열의 요소로 넣는다.

```js
const arr = [
  { name: 'aaa', number: 1111 },
  { name: 'bbb', number: 2222 },
  { name: 'ccc', number: 3333 }
];

const filterArr = arr.filter((data, index) => {
  if (data.number > 2000) return true;
  return false;
});

console.log(filterArr);
```

### reduce

배열을 순회하면서, 한 변수에 어떤 과정을 거칠 때 많이 사용된다.

```js
const arr = [
  { name: 'aaa', number: 1111 },
  { name: 'bbb', number: 2222 },
  { name: 'ccc', number: 3333 }
];

const sumArr = arr.reduce((a, b) => {
  return a + b.number;
}, 0);

console.log(sumArr); // 6666
```

### includes()

- 배열함수인거는 알고 있었다만 string 에도 사용가능
- `string(or array).includes( searchString, length)`

```js
'abzcd'.includes('z'); // true
'abzcd'.includes('z', 3); // false
```

### 배열을 문자열로 변환 - join()

```js
const elements = ['fire', 'air', 'water'];

console.log(elements.join());
// "fire,air,water"

console.log(elements.join(''));
// fireairwater

console.log(elements.join('-'));
// fire-air-water
```

### 배열에서 최대값

```js
const arr = [1, 2, 3, 4, 5];
console.log(Math.max(arr)); // NaN

// spread operator 활용
console.log(Math.max(...arr)); // 5

arr.sort((a, b) => b - a); // 내림차순 정렬
console.log(arr[0]); // 5
```

### 2차원 배열 map으로 전환

- 2차원 배열을 new Map() 안에 넣어서 바로 새로운 map을 만들 수 있다.

```js
const db = [
  ['rardss', '123'],
  ['yyoom', '1234'],
  ['meosseugi', '1234']
];
const map = new Map(db);
console.log(map);
```

### 배열 사본 만들기

- sort함수처럼 배열 자체가 바뀌어버리는 함수를 쓸때 복사본에마 적용하고 싶다면 slice()를 사용가능
- `[...arr]` 해도됨

```js
const sorted1 = arr.slice().sort((a, b) => b - a);
const sorted2 = [...arr].sort((a, b) => b - a);
```

### 배열에서 특정 요소 삭제 - splice()

- `array.splice(2,1)` : 2번 인덱스부터 1개 만큼만 삭제

```js
const array = [1, 2, 3, 4, 5];
array.splice(2, 1);

console.log(array); // 1,2,4,5
```

### out of range 에러

- 0보다 작은 인덱스를 사용하면 out of range 오류가 날것같지만 js 에서는 가능하다.
- js는 인덱스 범위를 벗어나는 인덱스에 접근하면 오류를 바랭시키지 않고 undefined를 반환하기 때문에.
- 인덱스 관련 예외 처리는 이제 안심하자.

```js
cons solution = (arr) => arr.filter((e,i) => e != arr[i-1]);
```

### 2차원행렬 전치행렬로 만들기

- 고민하지 말고 이렇게 한줄로 짜자
- map을 두번 쓰는 것이다.

```js
const matrix = matrix[0].map((_, i) => matrix.map((row) => row[i]));
```

### 배열에서 원소별 개수 세기

- `filter` 메소드를 활용해서 조건에 맞는 원소를 필터링해 그 길이를 가져오자.

```js
const fail = stages.filter((stage) => stage === i).length;
```

### 객체를 2차원 배열로 만들기

- `Object.entries()` 를 활용한다.
- 2차원 배열 말고 1차원 배열로 바꾸고 싶다면 map 을 활용해서 원하는 값으로 바꾸자.

```js
const result = Object.entries(obj);
```

## Array 생성

1. new Array()
   배열 객체를 만든다. `fill(채울 요소)`를 통해서 원하는 값으로 채울 수 있다.

```js
const arr = new Array(3).fill(5);
console.log(arr);
```

Array.from -> 이는 인자에 따라 배열을 생성하는 방식이 달라진다. 2. length 인자 던져주기

```js
const arr = Array.from({ length: 5 }, (value, index) => index);
console.log(arr);
```

3. 다른 배열 던져주기
   길이 대신에 배열을 던져줘서 map 메소드처럼 사용할 수 있다.

```js
const otherArr = [1, 2, 3, 4, 5];

const arr = Array.from(otherArr, (element, index) => element * 2);
console.log(arr);
```

4. 2차원 배열 생성

```js
// arr[5][2] 빈 배열 생성
const arr1 = Array.from(Array(5), () => new Array(2));

// arr[5][2] (null로 초기화하여 생성)
const arr2 = Array.from(Array(5), () => Array(2).fill(null));
```

5. 배열의 중복 제거

```js
const arr = [1, 2, 3, 3, 2, 2, 1, 4, 5];

const set = [...new Set(arr)];
console.log(set);
```

- 최빈값 구하기

```js
function solution(array) {
  const map = new Map();
  array.forEach((i) => map.set(i, (map.get(i) || 0) + 1)); // 최빈값 count 세기
  const sortArr = [...map].sort((a, b) => b[1] - a[1]); // 내림차순으로 정렬
  console.log(sortArr);
  // 정렬한 것에서 [0], [1] 과 비교하여서 0이 크면 최빈값을 return 하고 [1] 이 더크면 최빈값이 여러개 이므로 -1 을 return
  return sortArr.length === 1 || sortArr[0][1] > sortArr[1][1]
    ? sortArr[0][0]
    : -1;
}
```

### 객체 메서드

- `obj[num]` 값이 없다면 0 있으면 그 값에 + 1
- `Object.values(obj)` 로 value 값들을 배열 형태로 가져올 수 있다. (keys도 당연히 가능)
- `Object.entries(obj)` 로 key와 value 둘다 가져올 수 있다.

```js
const obj= {};
for(let num of arr) {
	obj[num] = (obj[num] || 0) + 1;
}
const answer = Object.values(obj).filter(val => val > 1);

for(let [key, value] of Object.entries(parkingObj)) {...}
```

### isNaN()

전달된 값이 "Not-a-Number" (NaN)인지 확인

- value가 숫자이면 false
- value가 NaN이면 true 반환
- value가 문자열일 때 숫자로 변환될 수 없는 경우에만 true를 반환
  js 에서는 NaN을 확인할 때 `a==NaN` 이런게 안된다. isNaN 으로 확인해야함.
  문자 숫자 구별해야 할 때 사용

```javascript
console.log(isNaN('S')); // true
console.log(isNaN('1')); // false
console.log(isNaN(1)); // false
console.log(isNaN('dasdsa')); // true
console.log(isNaN(null)); // false
console.log(isNaN(undefined)); // true
console.log(isNaN('')); // false
console.log(isNaN(Infinity)); // false
```

### 확인하는 함수들

- `Array`라는 객체에 `isArray`라는 함수가 포함되어 있음 (`isInteger`도 같은 원리)
- `isNaN`은 문자인지 확인 하는 용도로 쓰자

```js
console.log(Array.isArray([1,2,3])) // true
console.log(Number.isInteger(5)) // true
console.log(isNaN('a'); // true
```

### `Math.round()`

- 반올림 함수
- 조합 문제 풀다가 소수점 오류 떠서 사용했음.
- 아래는 음수 -5.5 는 왜 -5 가 되는지 이유

* 소수 부분이 0.5보다 작으면 내림합니다. (소수 부분이 0.499... 미만인 경우)
* 소수 부분이 0.5보다 크면 올림합니다.
  이 설명을 바탕으로 `Math.round(-5.5)`의 동작을 살펴보면:

* `-5.5`의 소수 부분은 `-0.5`입니다.
* `-0.5`는 `-0.5 < -0.5` 조건을 만족하므로 내림되어 `-5`로 반올림됩니다.
  따라서 `Math.round(-5.5)`는 `-5`로 결과가 나옵니다.

---

## 문자열

```js
console.log(Math.round(0.9)); // 1
console.log(Math.round(5.95), Math.round(5.5), Math.round(5.05)); // 6 6 5
console.log(Math.round(-5.05), Math.round(-5.5), Math.round(-5.95)); // -5 -5 -6
```

### 문자열 뒤집기

- 배열로 바꾼 후에 reverse함수 먹이고 join으로 다시 string 으로 변환
- join 안에 "" 안주면 쉼표 포함됨

```js
const myString = 'abc';
const reverseString = myString.split('').reverse().join(''); // cba
```

### 문자열 채우기

- 자릿수 만큼만 앞에 채우고 싶을 때 사용

```js
const str = '123';
const paddedStr = str.padStart(5, '0');

console.log(paddedStr); // 00123
```

### 대소문자 바꾸기

대소문자인지 확인만 하고 싶다면 `el === el.toUpperCase()` 이런 식으로 진행

```js
'a'.toUpperCase(); // A
'A'.toLowerCase(); // a
'A'.toUpperCase(); // A
```
