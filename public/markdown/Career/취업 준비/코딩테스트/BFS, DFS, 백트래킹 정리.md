---
title: '[Career] BFS, DFS, 백트래킹 정리'
date: 2025-07-09T16:55:19.894Z
slug: bfs-dfs-백트래킹-정리
category: Career
tags: [Career, CodingTest]
---

## DFS (Depth-first search, DFS)

그래프를 탐색하는 알고리즘의 하나로, 시작 정점으로부터 하나의 방향을 잡아 끝까지 탐색한 후 마지막 분기점으로 돌아와 다시 다른 방향으로 끝까지 탐색을 반복하는 방식.

1. 한 분기를 탐색한 후, 다음 분기로 넘어서기 전에 해당 분기를 완벽하게 탐색한다.
2. 더 이상 탐색이 불가능한 상태가 되면 이전 분기로 돌아와 다음 분기를 탐색한다.
3. 모든 정점을 방문한 후, 탐색을 종료한다.

**스택 자료구조나 재귀를 통해서 구현할 수 있다.**

- 효율은 스택이 좀 더 좋지만 재귀가 더 구현하기 쉽고 빨라서 일반적으로 재귀를 통해서 구현한다.

스택을 활용한 DFS (Iteractive DFS)

1. 시작 정점을 스택에 삽입한다.
2. 스택에서 하나의 정점을 꺼낸다.
3. 스택에서 꺼낸 정점이 아직 방문하지 않은 정점이라면, 방문 표시 후 이웃 정점들을 스택에 삽입한다.
4. 스택에 담긴 정점이 없을 때까지 2-3번 과정을 반복한다.

```js
function dfs(graph, start, visited) {
  const stack = [];
  stack.push(start);
  while (stack.length) {
    let v = stack.pop();
    if (!visited[v]) {
      console.log(v);
      visited[v] = true;
      for (let node of graph[v]) {
        if (!visited[node]) {
          stack.push(node);
        }
      }
    }
  }
}

const graph = [[1, 2, 4], [0, 5], [0, 5], [4], [0, 3], [1, 2]];
const visited = Array(7).fill(false);

dfs(graph, 0, visited);
```

재귀함수를 활용한 DFS (Recursive DFS)

1. 시작 정점을 인자로 받는 DFS 함수를 정의 한다.
2. 현재 정점을 방문 처리 한다.
3. 현재 정점과 연결된 인접 정점들을 확인한다.
4. 인접 정점 중 방문하지 않은 정점을 재귀적으로 DFS에 호출한다.
   재귀 함수는 항상 탈출 조건이 있어야 함을 기억!!

```js
const dfs = (graph, v, visited) => {
  visited[v] = true;
  console.log(v);

  for (let node of graph[v]) {
    if (!visited[node]) {
      dfs(graph, node, visited);
    }
  }
};

const graph = [[1, 2, 4], [0, 5], [0, 5], [4], [0, 3], [1, 2]];
const visited = Array(7).fill(false);

dfs(graph, 0, visited);
```

### DFS 를 활용해야 하는 경우

**😁경로의 특징을 저장해 둬야 하는 문제**

- 예를 들어 각 정점에 숫자가 적혀있고 a부터 b까지 가는 경로를 구하는데 경로에 같은 숫자가 있으면 안된다는 문제와 같이 각각의 경로마다 특징을 저장해야 할 때 FS를 주로 사용한다.

**😁검색 대상 그래프가 큰 경우 (노드와 간선이 많은 경우)**
단지 현 경로상의 정점들만을 기억하면 되므로 저장 공간의 수요가 비교적 적고, 목표한 정점이 깊은 단계에 있으면 방문할 수 있는 루트를 빨리 구할 수 있다는 장점이 있다.

**😁백트래킹 VS DFS**
백트래킹 = 더 이상 탐색할 필요가 없다면, 앞선 선택으로 되돌아와 탐색을 반복
DFS = 그래프의 탐색 기법으로 단순하게 이어진 길을 쭉 반복하는 과정

이 둘은 뗄레야 뗄 수 없다... DFS 에서 백트래킹을 자주 사용.

## 백트래킹 (Backtracking)

백트래킹은 문제를 해결하기 위해 가능한 모든 경우의 수를 탐색하되, 더 이상 진행할 수 없는 경우 이전 단계로 돌아가서 다른 경로를 시도하는 알고리즘 기법입니다.

### 백트래킹의 핵심 개념

1. **조건을 만족하지 않으면 즉시 중단**: 현재 경로가 해답이 될 수 없다고 판단되면 즉시 되돌아감
2. **상태 복원**: 이전 단계로 돌아갈 때 변경했던 상태를 원래대로 복원
3. **가지치기 (Pruning)**: 불필요한 탐색을 줄여 효율성 향상

### 백트래킹의 동작 과정

1. 현재 상태에서 가능한 선택지를 시도
2. 선택한 경로가 유효한지 검사 (제약 조건 확인)
3. 유효하지 않으면 이전 상태로 되돌아감 (백트래킹)
4. 유효하면 다음 단계로 진행
5. 목표에 도달하거나 모든 경우를 탐색할 때까지 반복

### 백트래킹 구현 예제

#### 예제 1: N-Queen 문제

N×N 체스판에 N개의 퀸을 서로 공격할 수 없도록 배치하는 문제

```js
function solveNQueens(n) {
  const result = [];
  const board = Array(n)
    .fill()
    .map(() => Array(n).fill('.'));

  function isValid(row, col) {
    // 같은 열에 퀸이 있는지 확인
    for (let i = 0; i < row; i++) {
      if (board[i][col] === 'Q') return false;
    }

    // 왼쪽 위 대각선 확인
    for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
      if (board[i][j] === 'Q') return false;
    }

    // 오른쪽 위 대각선 확인
    for (let i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) {
      if (board[i][j] === 'Q') return false;
    }

    return true;
  }

  function backtrack(row) {
    // 모든 행에 퀸을 배치했으면 결과에 추가
    if (row === n) {
      result.push(board.map((r) => r.join('')));
      return;
    }

    // 현재 행의 각 열에 퀸을 배치 시도
    for (let col = 0; col < n; col++) {
      if (isValid(row, col)) {
        board[row][col] = 'Q'; // 퀸 배치
        backtrack(row + 1); // 다음 행으로
        board[row][col] = '.'; // 백트래킹: 상태 복원
      }
    }
  }

  backtrack(0);
  return result;
}

console.log(solveNQueens(4));
```

#### 예제 2: 부분집합 합 문제

주어진 배열에서 합이 특정 값이 되는 부분집합을 찾는 문제

```js
function findSubsetSum(arr, target) {
  const result = [];

  function backtrack(index, currentSum, path) {
    // 목표 합에 도달한 경우
    if (currentSum === target) {
      result.push([...path]);
      return;
    }

    // 배열의 끝에 도달하거나 합이 목표를 초과한 경우
    if (index >= arr.length || currentSum > target) {
      return;
    }

    // 현재 원소를 포함하는 경우
    path.push(arr[index]);
    backtrack(index + 1, currentSum + arr[index], path);

    // 현재 원소를 포함하지 않는 경우 (백트래킹)
    path.pop();
    backtrack(index + 1, currentSum, path);
  }

  backtrack(0, 0, []);
  return result;
}

const arr = [2, 3, 6, 7];
const target = 7;
console.log(findSubsetSum(arr, target)); // [[2, 2, 3], [7]]
```

#### 예제 3: 순열 생성

주어진 배열의 모든 순열을 생성하는 문제

```js
function permute(nums) {
  const result = [];
  const used = Array(nums.length).fill(false);

  function backtrack(path) {
    // 모든 원소를 사용했으면 결과에 추가
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue; // 이미 사용한 원소는 건너뛰기

      // 현재 원소를 경로에 추가
      path.push(nums[i]);
      used[i] = true;

      // 다음 단계로 진행
      backtrack(path);

      // 백트래킹: 상태 복원
      path.pop();
      used[i] = false;
    }
  }

  backtrack([]);
  return result;
}

console.log(permute([1, 2, 3]));
// [[1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]]
```

### 백트래킹을 활용해야 하는 경우

- **제약 조건이 있는 조합/순열 문제**: N-Queen, 스도쿠, 부분집합 합 등
- **모든 가능한 해를 찾아야 하는 문제**: 완전 탐색이 필요한 경우
- **조건을 만족하지 않으면 즉시 중단할 수 있는 문제**: 가지치기가 가능한 경우

### 백트래킹의 시간 복잡도

- 최악의 경우: O(b^d) (b는 분기 수, d는 깊이)
- 가지치기를 통해 실제로는 훨씬 적은 경우를 탐색
- 공간 복잡도: O(d) (재귀 호출 스택의 깊이)

### DFS와 백트래킹의 차이점

| 특징          | DFS                    | 백트래킹                        |
| ------------- | ---------------------- | ------------------------------- |
| **목적**      | 그래프 탐색            | 제약 조건을 만족하는 해 찾기    |
| **상태 복원** | 필요 없음              | 필수 (이전 상태로 되돌아감)     |
| **가지치기**  | 선택적                 | 핵심 (조건 불만족 시 즉시 중단) |
| **적용 문제** | 경로 찾기, 연결성 확인 | N-Queen, 스도쿠, 조합 문제      |

### 너비 우선 탐색 (Breadth-first search, BFS)

가장 먼저 시작 정점을 방문한 후, 그 시작 장점과 인접한 모든 정점들을 우선적으로 탐색해나가는 방법

출발점을 먼저 큐에 넣고, 큐가 빌 때까지 아래 과정을 반복한다.

1. 큐에 저장된 정점을 하나 Deueue 한다.
2. 그리고 뺀 정점과 연결된 모든 정점을 큐에 넣는다.

BFS 구현 함수

1. 탐색 스택, 방문 배열을 생성
2. 탐색을 시작하는 정점을 탐색 스택에 쌓는다.
3. 탐색 스택의 length 가 0 이 아닐 때 까지 아래 과정을 반복
   1. 스택 최상단에 있는 것을 없애고, 이를 탐색한다.
   2. 탐색 시에 방문 했는지 체크, 했다면 패스
   3. 방문 안했다면, 이를 방문 배열에 넣고 그 정점과 이어진 정점들을 배열에 다시 쌓는다.

```js
const graph = {
  A: ['B', 'C'],
  B: ['A', 'D'],
  C: ['A', 'G', 'H', 'I'],
  D: ['B', 'E', 'F'],
  E: ['D'],
  F: ['D'],
  G: ['C'],
  H: ['C'],
  I: ['C', 'J'],
  J: ['I']
};

const BFS = (graph, startNode) => {
  let visited = []; // 탐색을 마친 노드들
  let needVisit = []; // 탐색 해야할 노드들

  needVisit.push(startNode);

  while (needVisit.length !== 0) {
    // 탐색해야할 노드가 남아있다면
    const node = needVisit.shift(); // 가장 오래 남아있던 정점을 뽑아냄.
    if (!visited.includes(node)) {
      visited.push(node);
      needVisit = [...needVisit, ...graph[node]];
    }
  }
  return visited;
};

console.log(BFS(graph, 'A'));
```

BFS 를 활용해야 하는 경우

- 최단 거리 문제

**BFS 와 DFS의 시간 복잡도**
DFS와 BFS는 노드 수 + 간선 수 만큼의 복잡도를 지닌다. 즉, O(n)
