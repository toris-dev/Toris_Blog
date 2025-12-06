---
title: [Learning] CSS Grid 완전 정리
date: 2025-07-09T16:55:19.906Z
slug: grid
category: Learning
tags: Learning, CSS, Grid, Layout
---

# CSS Grid 완전 정리

CSS Grid는 2차원 레이아웃 시스템으로, 행(row)과 열(column)을 동시에 제어할 수 있는 강력한 레이아웃 도구입니다. Flexbox가 1차원 레이아웃에 최적화되어 있다면, Grid는 복잡한 2차원 레이아웃을 구현하는 데 최적화되어 있습니다.

## 📚 목차

1. [Grid 기본 개념](#grid-기본-개념)
2. [Container 속성](#container-속성)
3. [Item 속성](#item-속성)
4. [실용적인 예제](#실용적인-예제)
5. [Best Practices](#best-practices)

---

## Grid 기본 개념

### Grid Container vs Grid Item

- **Grid Container**: `display: grid` 또는 `display: inline-grid`가 적용된 요소
- **Grid Item**: Grid Container의 직계 자식 요소들
- **Grid Line**: Grid를 나누는 수직선과 수평선
- **Grid Track**: Grid Line 사이의 공간 (행 또는 열)
- **Grid Cell**: Grid의 가장 작은 단위 (한 셀)
- **Grid Area**: 하나 이상의 Grid Cell로 구성된 영역

---

## Container 속성

### `display: grid` / `display: inline-grid`

Grid 레이아웃을 활성화합니다.

```css
.container {
  display: grid; /* 블록 레벨 Grid */
  /* 또는 */
  display: inline-grid; /* 인라인 레벨 Grid */
}
```

### `grid-template-columns` - 열(Column) 정의

Grid의 열(세로 방향) 크기와 개수를 정의합니다.

```css
.container {
  /* 고정 크기 */
  grid-template-columns: 200px 200px 200px;

  /* 반응형 단위 (fr = fraction) */
  grid-template-columns: 1fr 2fr 1fr; /* 1:2:1 비율 */

  /* repeat() 함수 사용 */
  grid-template-columns: repeat(3, 1fr); /* 3개의 동일한 열 */
  grid-template-columns: repeat(
    4,
    minmax(100px, 1fr)
  ); /* 최소 100px, 최대 1fr */

  /* minmax() 함수 */
  grid-template-columns: 100px minmax(100px, 3fr) 1fr;
  /* 첫 번째: 100px 고정
     두 번째: 최소 100px, 최대 3fr
     세 번째: 1fr */

  /* auto-fill / auto-fit */
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  /* 컨테이너 크기에 맞춰 자동으로 열 개수 조정 */
}
```

**주요 값:**

- `fr` (fraction): 사용 가능한 공간의 비율
- `auto`: 콘텐츠 크기에 맞춰 자동 조정
- `minmax(min, max)`: 최소값과 최대값 설정
- `repeat(count, size)`: 반복 패턴 생성

### `grid-template-rows` - 행(Row) 정의

Grid의 행(가로 방향) 크기와 개수를 정의합니다.

```css
.container {
  /* 고정 크기 */
  grid-template-rows: 100px 200px 100px;

  /* repeat() 함수 */
  grid-template-rows: repeat(2, 100px); /* 2개를 100px로 지정, 나머지는 auto */

  /* 반응형 */
  grid-template-rows: 1fr 2fr 1fr;

  /* minmax() */
  grid-template-rows: minmax(100px, auto) 1fr;
}
```

### `grid-template-areas` - 영역 이름 지정

Grid 영역에 이름을 지정하여 직관적인 레이아웃을 구성할 수 있습니다.

```css
.container {
  grid-template-areas:
    'header header header'
    'main main aside'
    'footer footer footer';
}

.header {
  grid-area: header;
}
.main {
  grid-area: main;
}
.aside {
  grid-area: aside;
}
.footer {
  grid-area: footer;
}
```

**특징:**

- 같은 이름을 사용하면 해당 영역이 병합됩니다
- `.` (점)을 사용하면 빈 셀을 만들 수 있습니다
- 각 행은 따옴표로 묶어야 합니다

### `grid-template` - 단축 속성

`grid-template-rows`, `grid-template-columns`, `grid-template-areas`를 한 번에 정의합니다.

```css
.container {
  grid-template:
    'header header' 60px
    'main aside' 1fr
    'footer footer' 40px
    / 2fr 1fr; /* 열 크기 */
}
```

### `gap` / `row-gap` / `column-gap` - 간격 설정

Grid 아이템 사이의 간격을 설정합니다. (구버전: `grid-gap`)

```css
.container {
  gap: 20px; /* 행과 열 모두 20px */
  row-gap: 20px; /* 행 간격만 20px */
  column-gap: 30px; /* 열 간격만 30px */

  /* 또는 */
  gap: 20px 30px; /* row-gap column-gap */
}
```

### `grid-auto-flow` - 자동 배치 방향

Grid 아이템이 자동으로 배치되는 방향을 제어합니다.

```css
.container {
  grid-auto-flow: row; /* 기본값: 행 방향으로 배치 */
  grid-auto-flow: column; /* 열 방향으로 배치 */
  grid-auto-flow: dense; /* 빈 공간을 채우도록 밀집 배치 */
  grid-auto-flow: row dense; /* 행 방향 + 밀집 배치 */
}
```

### `grid-auto-columns` / `grid-auto-rows` - 암시적 트랙 크기

명시적으로 정의되지 않은 열/행의 크기를 설정합니다.

```css
.container {
  grid-template-columns: repeat(3, 1fr);
  grid-auto-columns: 100px; /* 4번째 열부터는 100px */

  grid-template-rows: repeat(2, 100px);
  grid-auto-rows: 150px; /* 3번째 행부터는 150px */
}
```

### `justify-items` - 행 축 정렬 (수평)

Grid 아이템을 행 축(수평) 방향으로 정렬합니다.

```css
.container {
  justify-items: start; /* 시작점 정렬 */
  justify-items: end; /* 끝점 정렬 */
  justify-items: center; /* 중앙 정렬 */
  justify-items: stretch; /* 기본값: 늘어남 */
}
```

### `align-items` - 열 축 정렬 (수직)

Grid 아이템을 열 축(수직) 방향으로 정렬합니다.

```css
.container {
  align-items: start; /* 시작점 정렬 */
  align-items: end; /* 끝점 정렬 */
  align-items: center; /* 중앙 정렬 */
  align-items: stretch; /* 기본값: 늘어남 */
  align-items: baseline; /* 베이스라인 정렬 */
}
```

### `place-items` - 단축 속성

`align-items`와 `justify-items`를 한 번에 설정합니다.

```css
.container {
  place-items: center; /* align-items와 justify-items 모두 center */
  place-items: start end; /* align-items: start; justify-items: end; */
}
```

### `justify-content` - Grid 전체 정렬 (행 축)

Grid 전체를 컨테이너 내에서 행 축 방향으로 정렬합니다.

```css
.container {
  justify-content: start;
  justify-content: end;
  justify-content: center;
  justify-content: space-between;
  justify-content: space-around;
  justify-content: space-evenly;
}
```

### `align-content` - Grid 전체 정렬 (열 축)

Grid 전체를 컨테이너 내에서 열 축 방향으로 정렬합니다.

```css
.container {
  align-content: start;
  align-content: end;
  align-content: center;
  align-content: space-between;
  align-content: space-around;
  align-content: space-evenly;
}
```

---

## Item 속성

### `grid-column` - 열 위치 지정

Grid 아이템이 차지할 열의 범위를 지정합니다.

```css
.item {
  grid-column: 1 / 3; /* 1번째 열부터 3번째 열 전까지 (2개 열 차지) */
  grid-column: 1 / span 2; /* 1번째 열부터 2개 열 차지 */
  grid-column: span 2; /* 현재 위치부터 2개 열 차지 */
}
```

### `grid-row` - 행 위치 지정

Grid 아이템이 차지할 행의 범위를 지정합니다.

```css
.item {
  grid-row: 1 / 3; /* 1번째 행부터 3번째 행 전까지 */
  grid-row: 1 / span 2; /* 1번째 행부터 2개 행 차지 */
}
```

### `grid-area` - 영역 지정

`grid-template-areas`에서 정의한 영역 이름을 사용하거나, 행/열 위치를 지정합니다.

```css
.item {
  /* 영역 이름 사용 */
  grid-area: header;

  /* 또는 행/열 위치 지정 */
  grid-area: 1 / 1 / 3 / 3;
  /* row-start / column-start / row-end / column-end */
}
```

### `justify-self` - 개별 아이템 행 축 정렬

특정 Grid 아이템만 행 축 방향으로 정렬합니다.

```css
.item {
  justify-self: start;
  justify-self: end;
  justify-self: center;
  justify-self: stretch;
}
```

### `align-self` - 개별 아이템 열 축 정렬

특정 Grid 아이템만 열 축 방향으로 정렬합니다.

```css
.item {
  align-self: start;
  align-self: end;
  align-self: center;
  align-self: stretch;
}
```

### `place-self` - 단축 속성

`align-self`와 `justify-self`를 한 번에 설정합니다.

```css
.item {
  place-self: center; /* align-self와 justify-self 모두 center */
  place-self: start end; /* align-self: start; justify-self: end; */
}
```

---

## 실용적인 예제

### 예제 1: 기본 그리드 레이아웃

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 100px);
  gap: 20px;
}
```

### 예제 2: 반응형 그리드

```css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}
/* 화면 크기에 따라 자동으로 열 개수 조정 */
```

### 예제 3: 명시적 영역 배치

```css
.container {
  display: grid;
  grid-template-areas:
    'header header header'
    'sidebar main main'
    'footer footer footer';
  grid-template-columns: 200px 1fr 1fr;
  grid-template-rows: 80px 1fr 60px;
  gap: 20px;
}

.header {
  grid-area: header;
}
.sidebar {
  grid-area: sidebar;
}
.main {
  grid-area: main;
}
.footer {
  grid-area: footer;
}
```

### 예제 4: 카드 그리드 레이아웃

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  padding: 24px;
}
```

### 예제 5: 복잡한 레이아웃

```css
.layout {
  display: grid;
  grid-template-columns: 250px 1fr 300px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    'header header header'
    'nav main aside'
    'footer footer footer';
  min-height: 100vh;
  gap: 1rem;
}
```

---

## Best Practices

### 1. `fr` 단위 활용

고정 크기보다는 `fr` 단위를 사용하여 반응형 레이아웃을 구현하세요.

```css
/* ❌ 나쁜 예 */
grid-template-columns: 200px 200px 200px;

/* ✅ 좋은 예 */
grid-template-columns: repeat(3, 1fr);
```

### 2. `minmax()`로 유연성 확보

최소 크기를 보장하면서도 반응형으로 동작하도록 합니다.

```css
grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
```

### 3. `gap` 사용

`margin` 대신 `gap`을 사용하여 일관된 간격을 유지하세요.

```css
/* ❌ 나쁜 예 */
.item {
  margin: 10px;
}

/* ✅ 좋은 예 */
.container {
  gap: 20px;
}
```

### 4. `grid-template-areas`로 가독성 향상

복잡한 레이아웃은 `grid-template-areas`를 사용하여 시각적으로 이해하기 쉽게 만드세요.

### 5. 중첩 Grid 활용

Grid 아이템 내부에 또 다른 Grid를 사용하여 복잡한 레이아웃을 구현할 수 있습니다.

```css
.outer-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
}

.inner-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}
```

---

## Grid vs Flexbox

| 특징          | Grid                 | Flexbox                |
| ------------- | -------------------- | ---------------------- |
| **차원**      | 2차원 (행 + 열)      | 1차원 (행 또는 열)     |
| **용도**      | 전체 페이지 레이아웃 | 컴포넌트 내부 레이아웃 |
| **정렬**      | 행과 열 동시 제어    | 한 방향만 제어         |
| **적용 대상** | Container와 Item     | Container와 Item       |

**권장 사용:**

- **Grid**: 전체 페이지 레이아웃, 카드 그리드, 복잡한 2차원 레이아웃
- **Flexbox**: 네비게이션 바, 버튼 그룹, 폼 요소, 컴포넌트 내부 정렬

---

## 브라우저 호환성

CSS Grid는 모든 모던 브라우저에서 지원됩니다:

- Chrome 57+
- Firefox 52+
- Safari 10.1+
- Edge 16+

IE11에서는 부분 지원 (구버전 문법 필요)

---

## 참고 자료

- [MDN CSS Grid](https://developer.mozilla.org/ko/docs/Web/CSS/CSS_Grid_Layout)
- [CSS-Tricks Complete Guide to Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Grid by Example](https://gridbyexample.com/)
