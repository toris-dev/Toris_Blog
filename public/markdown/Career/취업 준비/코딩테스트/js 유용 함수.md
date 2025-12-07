---
title: [Career] js 유용 함수
date: 2025-07-09T16:55:19.896Z
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
newMap.delete(1); // key값으로 삭제
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

### 배열에서 최대값

```js
const arr = [1, 2, 3, 4, 5];
console.log(Math.max(arr)); // NaN

// spread operator 활용
console.log(Math.max(...arr)); // 5

arr.sort((a, b) => b - a); // 내림차순 정렬
console.log(arr[0]); // 5
```

### Array 생성

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

4. 다른 배열 던져주기
   길이 대신에 배열을 던져줘서 map 메소드처럼 사용할 수 있다.

```js
const otherArr = [1, 2, 3, 4, 5];

const arr = Array.from(otherArr, (element, index) => element * 2);
console.log(arr);
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
