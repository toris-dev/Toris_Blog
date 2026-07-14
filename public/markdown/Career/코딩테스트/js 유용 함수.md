---
title: '[Career] JavaScript 코딩테스트 유용 함수 정리'
date: 2025-07-09T16:55:19.898Z
slug: js-유용-함수
category: Career
tags: [Career, JavaScript, CodingTest]
---

# JavaScript 코딩테스트 유용 함수 정리

> 코딩테스트를 준비하면서 자주 사용하는 JavaScript 함수와 자료구조를 정리했습니다. 실무에서도 유용하게 사용할 수 있습니다.

## 📚 자료구조

### 1. Map - key-value 쌍을 저장하는 자료구조

Map은 key-value 형태로 데이터를 저장하는 자료구조입니다. 코딩테스트에서 자주 사용합니다.

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
console.log(newMap.has(1)); // true - key 값으로 찾기

// map value 가져오기
console.log(newMap.get(1)); // key 값으로 가져오기

// map 요소 개수
console.log(newMap.size);

// map 요소 삭제
newMap.delete(1); // key값으로 삭제
```

### 2. Set - 중복을 허용하지 않는 값만 저장하는 자료구조

Set은 중복을 허용하지 않는 값만 저장하는 자료구조입니다. 배열에서 중복을 제거하거나 특정 값의 존재 여부를 확인할 때 유용합니다.

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

## 배열 관련 함수

### map() - 배열 변환

map을 이용하여 배열의 각 요소를 변환한 새로운 배열을 만들 수 있습니다. 순환하고 있는 요소를 리턴 값으로 바꾼다고 생각하면 이해하기 편합니다.

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

### filter() - 조건에 맞는 요소만 필터링

filter를 이용하여 특정 조건에 해당하는 요소만 걸러서 새로운 배열을 만들 수 있습니다.

**filter를 사용하는 이유:**

- map에서 조건문을 사용하면 배열의 길이만큼 생성되며, return을 하지 않으면 `null`이나 `undefined`가 들어갑니다.
- filter를 사용하면 `return`이 `true`인 것만 배열의 요소로 넣어서 원하는 길이의 배열을 만들 수 있습니다.

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

### reduce() - 배열을 하나의 값으로 축소

배열을 순회하면서 한 변수에 어떤 과정을 거칠 때 많이 사용합니다. 합계, 곱셈, 최대값 등을 구할 때 유용합니다.

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

### includes() - 포함 여부 확인

배열뿐만 아니라 문자열에서도 사용할 수 있습니다. `string(or array).includes(searchString, length)` 형태로 사용합니다.

```js
'abzcd'.includes('z'); // true
'abzcd'.includes('z', 3); // false - 3번 인덱스부터 검색
```

### join() - 배열을 문자열로 변환

배열의 요소들을 하나의 문자열로 합칠 때 사용합니다.

```js
const elements = ['fire', 'air', 'water'];

console.log(elements.join());
// "fire,air,water"

console.log(elements.join(''));
// "fireairwater"

console.log(elements.join('-'));
// "fire-air-water"
```

### 배열에서 최대값 구하기

```js
const arr = [1, 2, 3, 4, 5];

// ❌ 잘못된 방법
console.log(Math.max(arr)); // NaN

// ✅ spread operator 활용
console.log(Math.max(...arr)); // 5

// ✅ 정렬 후 첫 번째 요소
arr.sort((a, b) => b - a); // 내림차순 정렬
console.log(arr[0]); // 5
```

### 2차원 배열을 Map으로 전환

2차원 배열을 `new Map()` 안에 넣어서 바로 새로운 Map을 만들 수 있습니다.

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

sort 함수처럼 배열 자체가 바뀌어버리는 함수를 쓸 때 복사본에만 적용하고 싶다면 `slice()`를 사용할 수 있습니다. `[...arr]`로도 가능합니다.

```js
const sorted1 = arr.slice().sort((a, b) => b - a);
const sorted2 = [...arr].sort((a, b) => b - a);
```

### splice() - 배열에서 특정 요소 삭제

`array.splice(2, 1)` 형태로 사용하며, 2번 인덱스부터 1개만큼만 삭제합니다.

```js
const array = [1, 2, 3, 4, 5];
array.splice(2, 1);

console.log(array); // [1, 2, 4, 5]
```

### 인덱스 범위 주의사항

0보다 작은 인덱스를 사용하면 out of range 오류가 날 것 같지만, JavaScript에서는 가능합니다. JavaScript는 인덱스 범위를 벗어나는 인덱스에 접근하면 오류를 발생시키지 않고 `undefined`를 반환하기 때문입니다. 인덱스 관련 예외 처리는 안심하고 사용할 수 있습니다.

```js
const solution = (arr) => arr.filter((e, i) => e != arr[i - 1]);
```

### 2차원 행렬을 전치행렬로 만들기

고민하지 말고 이렇게 한 줄로 작성할 수 있습니다. map을 두 번 사용하는 것입니다.

```js
const matrix = matrix[0].map((_, i) => matrix.map((row) => row[i]));
```

### 배열에서 원소별 개수 세기

`filter` 메소드를 활용해서 조건에 맞는 원소를 필터링해 그 길이를 가져옵니다.

```js
const fail = stages.filter((stage) => stage === i).length;
```

### Object.entries() - 객체를 2차원 배열로 만들기

`Object.entries()`를 활용하여 객체를 2차원 배열로 변환할 수 있습니다. 1차원 배열로 바꾸고 싶다면 map을 활용해서 원하는 값으로 바꾸면 됩니다.

```js
const result = Object.entries(obj);
```

## Array 생성 방법

### 1. new Array()와 fill()

배열 객체를 만들고 `fill(채울 요소)`를 통해 원하는 값으로 채울 수 있습니다.

```js
const arr = new Array(3).fill(5);
console.log(arr); // [5, 5, 5]
```

### 2. Array.from() - length 사용

길이를 인자로 던져주면 해당 길이의 배열을 생성할 수 있습니다.

```js
const arr = Array.from({ length: 5 }, (value, index) => index);
console.log(arr); // [0, 1, 2, 3, 4]
```

### 3. Array.from() - 다른 배열 사용

길이 대신에 배열을 던져주면 map 메소드처럼 사용할 수 있습니다.

```js
const otherArr = [1, 2, 3, 4, 5];

const arr = Array.from(otherArr, (element, index) => element * 2);
console.log(arr); // [2, 4, 6, 8, 10]
```

### 4. 2차원 배열 생성

```js
// arr[5][2] 빈 배열 생성
const arr1 = Array.from(Array(5), () => new Array(2));

// arr[5][2] (null로 초기화하여 생성)
const arr2 = Array.from(Array(5), () => Array(2).fill(null));
```

### 5. 배열의 중복 제거

Set을 활용하여 배열의 중복을 제거할 수 있습니다.

```js
const arr = [1, 2, 3, 3, 2, 2, 1, 4, 5];

const set = [...new Set(arr)];
console.log(set); // [1, 2, 3, 4, 5]
```

## 실전 예제

### 최빈값 구하기

코딩테스트에서 자주 나오는 최빈값을 구하는 방법입니다.

```js
function solution(array) {
  const map = new Map();

  // 각 숫자의 빈도수 계산
  array.forEach((i) => map.set(i, (map.get(i) || 0) + 1));

  // 빈도수 기준으로 내림차순 정렬
  const sortArr = [...map].sort((a, b) => b[1] - a[1]);

  // 최빈값이 하나인지 여러 개인지 확인
  // sortArr[0]이 더 크면 최빈값을 return, 같으면 최빈값이 여러 개이므로 -1 return
  return sortArr.length === 1 || sortArr[0][1] > sortArr[1][1]
    ? sortArr[0][0]
    : -1;
}
```

**설명:**

- Map을 사용하여 각 숫자의 빈도수를 계산합니다.
- 빈도수를 기준으로 내림차순 정렬합니다.
- 최빈값이 하나인지 여러 개인지 확인하여 결과를 반환합니다.

## 객체 메서드

### 객체 값 관리

```js
const obj = {};
for (let num of arr) {
  // obj[num] 값이 없다면 0, 있으면 그 값에 + 1
  obj[num] = (obj[num] || 0) + 1;
}

// Object.values()로 value 값들을 배열 형태로 가져오기
const answer = Object.values(obj).filter((val) => val > 1);

// Object.entries()로 key와 value 둘 다 가져오기
for (let [key, value] of Object.entries(parkingObj)) {
  // ...
}
```

## 유용한 확인 함수들

### isNaN() - NaN 확인

전달된 값이 "Not-a-Number" (NaN)인지 확인합니다. JavaScript에서는 NaN을 확인할 때 `a == NaN` 같은 방식이 안 되므로 `isNaN()`을 사용해야 합니다. 문자와 숫자를 구별해야 할 때 사용합니다.

- value가 숫자이면 false
- value가 NaN이면 true 반환
- value가 문자열일 때 숫자로 변환될 수 없는 경우에만 true를 반환

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

### Array.isArray()와 Number.isInteger()

`Array`라는 객체에 `isArray`라는 함수가 포함되어 있습니다. `isInteger`도 같은 원리입니다.

```js
console.log(Array.isArray([1, 2, 3])); // true
console.log(Number.isInteger(5)); // true
console.log(isNaN('a')); // true
```

### Math.round() - 반올림

반올림 함수입니다. 조합 문제를 풀다가 소수점 오류가 발생해서 사용한 적이 있습니다.

**음수 반올림 주의사항:**

- 소수 부분이 0.5보다 작으면 내림합니다.
- 소수 부분이 0.5보다 크면 올림합니다.

이 설명을 바탕으로 `Math.round(-5.5)`의 동작을 살펴보면:

- `-5.5`의 소수 부분은 `-0.5`입니다.
- `-0.5`는 `-0.5 < -0.5` 조건을 만족하므로 내림되어 `-5`로 반올림됩니다.
- 따라서 `Math.round(-5.5)`는 `-5`로 결과가 나옵니다.

```js
console.log(Math.round(0.9)); // 1
console.log(Math.round(5.95), Math.round(5.5), Math.round(5.05)); // 6 6 5
console.log(Math.round(-5.05), Math.round(-5.5), Math.round(-5.95)); // -5 -5 -6
```

## 문자열 관련 함수

### 문자열 뒤집기

배열로 바꾼 후에 reverse 함수를 적용하고 join으로 다시 string으로 변환합니다. join 안에 `""`를 안 주면 쉼표가 포함됩니다.

```js
const myString = 'abc';
const reverseString = myString.split('').reverse().join(''); // "cba"
```

### padStart() - 문자열 채우기

자릿수만큼만 앞에 채우고 싶을 때 사용합니다.

```js
const str = '123';
const paddedStr = str.padStart(5, '0');

console.log(paddedStr); // "00123"
```

### 대소문자 변환

대소문자인지 확인만 하고 싶다면 `el === el.toUpperCase()` 같은 식으로 진행할 수 있습니다.

```js
'a'.toUpperCase(); // "A"
'A'.toLowerCase(); // "a"
'A'.toUpperCase(); // "A"
```
