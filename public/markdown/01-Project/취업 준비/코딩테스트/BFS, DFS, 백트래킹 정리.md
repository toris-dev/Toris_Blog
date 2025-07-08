## DFS (Depth-first search, DFS)
그래프를 탐색하는 알고리즘의 하나로, 시작 정점으로부터 하나의 방향을 잡아 끝까지 탐색한 후 마지막 분기점으로 돌아와 다시 다른 방향으로 끝까지 탐색을 반복하는 방식.

1. 한 분기를 탐색한 후, 다음 분기로 넘어서기 전에 해당 분기를 완벽하게 탐색한다.
2. 더 이상 탐색이 불가능한 상태가 되면 이전 분기로 돌아와 다음 분기를 탐색한다.
3. 모든 정점을 방문한 후, 탐색을 종료한다.

**스택 자료구조나 재귀를 통해서 구현할 수 있다.**
* 효율은 스택이 좀 더 좋지만 재귀가 더 구현하기 쉽고 빨라서 일반적으로 재귀를 통해서 구현한다.

스택을 활용한 DFS (Iteractive DFS)
1. 시작 정점을 스택에 삽입한다.
2. 스택에서 하나의 정점을 꺼낸다.
3. 스택에서 꺼낸 정점이 아직 방문하지 않은 정점이라면, 방문 표시 후 이웃 정점들을 스택에 삽입한다.
4. 스택에 담긴 정점이 없을 때까지 2-3번 과정을 반복한다.
```js
function dfs(graph, start, visited) {
	const stack = [];
	stack.push(start);
	while(stack.length) {
		let v = stack.pop();
		if(!visited[v]) {
			console.log(v);
			visited[v] = true;
		for(let node of graph[v]) {
			if(!visited[node]) {
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

	for(let node of graph[v]) {
		if(!visited[node]) {
			dfs(graph, node, visited)
		}
	}
}

const graph = [[1, 2, 4], [0, 5], [0, 5], [4], [0, 3], [1, 2]];
const visited = Array(7).fill(false);

dfs(graph, 0, visited);
```


### DFS 를 활용해야 하는 경우
**😁경로의 특징을 저장해 둬야 하는 문제**
* 예를 들어 각 정점에 숫자가 적혀있고 a부터 b까지 가는 경로를 구하는데 경로에 같은 숫자가 있으면 안된다는 문제와 같이 각각의 경로마다 특징을 저장해야 할 때 FS를 주로 사용한다.

**😁검색 대상 그래프가 큰 경우 (노드와 간선이 많은 경우)**
단지 현 경로상의 정점들만을 기억하면 되므로 저장 공간의 수요가 비교적 적고, 목표한 정점이 깊은 단계에 있으면 방문할 수 있는 루트를 빨리 구할 수 있다는 장점이 있다.

**😁백트래킹 VS DFS**
백트래킹 = 더 이상 탐색할 필요가 없다면, 앞선 선택으로 되돌아와 탐색을 반복
DFS = 그래프의 탐색 기법으로 단순하게 이어진 길을 쭉 반복하는 과정

이 둘은 뗄레야 뗄 수 없다... DFS 에서 백트래킹을 자주 사용.


### 너비 우선 탐색 (Breadth-first search, BFS)
가장 먼저 시작 정점을 방문한 후,  그 시작 장점과 인접한 모든 정점들을 우선적으로 탐색해나가는 방법

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
  A: ["B", "C"],
  B: ["A", "D"],
  C: ["A", "G", "H", "I"],
  D: ["B", "E", "F"],
  E: ["D"],
  F: ["D"],
  G: ["C"],
  H: ["C"],
  I: ["C", "J"],
  J: ["I"]
};

const BFS = (graph, startNode) => {
	let visited = [] // 탐색을 마친 노드들
	let needVisit = []; // 탐색 해야할 노드들
	
	needVisit.push(startNode);

	while(needVisit.length !== 0) { // 탐색해야할 노드가 남아있다면
		const node = needVisit.shift(); // 가장 오래 남아있던 정점을 뽑아냄.
		if(!visited.includes(node)) {
			visited.push(node);
			needVisit = [...needVisit, ...graph[node]]
		}
	}
	return visited;
}

console.log(BFS(graph, "A"))
``````

BFS 를 활용해야 하는 경우
* 최단 거리 문제


**BFS 와 DFS의 시간 복잡도**
DFS와 BFS는 노드 수 + 간선 수 만큼의 복잡도를 지닌다. 즉, O(n)