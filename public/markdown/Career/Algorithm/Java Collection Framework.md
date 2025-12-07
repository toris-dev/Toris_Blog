---
title: 'Java Collection Framework 모음'
date: 2025-07-14T10:00:00.000Z
slug: java-collection-framework
category: 'Algorithm'
tags:
  - Algorithm
  - Java
---

> [!faq] java Collection Framework 란?
> Java에서 데이터를 저장하는 자료구조들을 한 곳에 모아 편리하게 사용하기 위해 제공하는 List, Set, Map으로 구분할 수 있다.

![[Pasted image 20231023220222.png]]

    Collection은 기본 데이터형이 아닌, 참조 데이터형만 저장이 가능하다.

따라서 Collection에서의 데이터는 Object 타입의 객체로서 저장이 되는 것인데, 그렇다면 여기서 기본 데이터형은 어떻게 저장하고 관리할 수 있을까?

### List : 인터페이스

1. 동일한 데이터의 중복을 허용한다.
2. 데이터 저장 순서가 유지된다.
3. 힙 영역 내에서 List는 객체를 일렬로 늘어놓은 구조를 하고 있다.
4. 객체를 인덱스로 관리하기 때문에 객체를 저장하면 자동으로 인덱스가 부여되고 인덱스로 객체를 검색, 삭제할 수 있다. 이 때 List 컬렉션은 객체 자체를 저장하여 인덱스를 부여하는게 아니라, 해당하는 인덱스에 객체의 주소값을 참조하여 저장한다.
5. List 컬렉션에서 공통적으로 사용가능한 추가, 검색, 삭제 메소드를 갖고 있다.

---

### ArrayList

- ArrayList는 List 인터페이스의 구현 클래스로, 여기서의 객체는 인덱스로 관리된다.
- ArrayList에 객체를 추가하면 객체가 인덱스로 관리되는 것이다.
- 이 점은 일반 배열과 별 다를바 없지만, **자바에서 배열은 초기화 시 그 크기가 고정되어야 하고 사용 중에 크기를 변경할 수 없다는 점** 에서 ArrayList는 가치가 있다.
- 설정하고 싶은 초기 용량이 n이라고 했을 때에는 아래와 같이 선언한다.
  `List<T> list = new ArrayList<T>(n);`

```java
import java.util.*;
public class Example {
	public static void main(String[] args) {
		List<String> list = new ArrayList<String>();
		list.add("A");
		list.add("B");
		list.add("C");
		list.add("D");
		list.add("E");
		list.add("F");
		list.add("G");
		list.remove(1);
		list.remove(1);
		int size = list.size();
		for(int i = 0; i<size ; i++) {
			System.out.println(i + "번째 : " + list.get(i));
		}
	}
}
```

> [!help] ArrayList를 주로 저렇게 업캐스팅해서 선언하는 이유는?
> 객체지향 프로그래밍의 일환으로, 다형성을 지원하기 위해서이다.
> 처음부터 변경에 유연한 구조로 미리 설계하는 방식이라고 할 수 있다.
> ex) ArrayList는 빠른 탐색에 유리하다는 장점이 있다.
> 마찬가지로 List 인터페이스를 구현한 LinkedList는 삽입/삭제에 유리하다는 장점이 있다.
> 결론 : 나중에 기존 코드를 바꾸지 않고 인터페이스 내에서 변경하기 쉽도록 하기 위해서이다.
> 객체는 인터페이스를 사용해 선언하는게 좋다는 결론!!!

만약 `ArrayList<> list = new ArrayList<>();` 와 같이 ArrayList 라는 인스턴스로 선언하면,
나중에 데이터의 용도가 바뀌어 삽입/삭제가 유리한 LinkedList 자료구조로 변경해야 할 때 ArrayList로 선언된 모든 부분을 LinkedList로 변경해 주어야 한다.
또, ArrayList에서는 지원하지만 LinkedList에서는 지원하지 않는 메소드를 사용했다면 그 메소드를 더 이상 사용할 수 없게 됩니다.
`list.remove(1);` : 이 코드를 두 번 실행하였으나 컴파일 도중 아무런 문제가 없었다. ArrayList는 중간에 위치한 객체를 삭제하여도, 그 인덱스를 자동으로 업데이트 해주기 때문에, 인덱스 1 이 처음 삭제된 후, 뒤의 객체들이 앞으로 한 칸씩 이동하며 그 자리를 자동으로 메꾸는 형태가 된다.

`list.get(i)` : 이렇게 얻어온 데이터를 바로 출력하는 것이 아니라, String 형의 변수에 다시 담는다고 생각해보자. 위에서도 언급했듯이, list.add(); 로 저장되는 모든 데이터는 **Object 타입**의 객체이다. 따라서, String 형 변수에 get해온 값을 담고 싶다면 String alphabet = (String)list.get(i) 와 같은 형변환을 반드시 해주어야 한다. 자신이 넣어준 데이터 타입으로 형 변환해주는 것은 필수이다.

위에서 언급한 저장소의 용량 확장에는 ArrayList<>의 **단점**이라 말할 수 있는 문제점이 있다.

바로, **저장소의 용량을 늘리는 과정에서 많은 시간이 소요된다**는 점이다.

저장 공간 부족으로 ArrayList의 용량을 늘리게 되는 경우, 기존의 ArraList에 추가하는 것이 아닌, 확장된 크기의 ArrayList를 새로 생성하고, 그 새로 생성된 ArrayList에 기존의 ArrayList 값들을 복사해주는 과정을 거친다. 그리고 기존의 ArrayList는 가비지 컬렉션에 의해 메모리에서 제거된다. 따라서 ArrayList에서 용량을 늘린다는 것은 새로운 배열 인스턴스의 생성과 기존 데이터의 복사가 필요한 번거로운 작업이 되는 것이다.

---

### Vector

Vector는 ArrayList와 동일한 내부 구조를 가지고 있다. Vector를 생성하기 위해서는 지정할 객체 타입을 타입 파라미터로 표기하고 기본 생성자를 호출하면 된다.

```java
import java.util.Vector;
List<E> list = new Vector<E>();
```

- ArrayList와 다르게, Vector는 동기화된 메소드로 구성되어 있기 때문에 멀티 스레드가 동시에 이 메소드들을 실행할 수 없고,
- 하나의 스레드가 실행을 완료해야하만 다른 스레드가 실행할 수 있다.
- 따라서 멀티 스레드 환경에서 안전하게 객체를 추가, 삭제 할 수 있다.
- 객체를 추가하고 삭제하고 가져오는 메소드는 ArrayList 코드와 같다.

---

### LinkedList

- LinkedList 는 List 구현 클래스 이므로 ArrayList 와 사용하는 메소드는 같지만 내부 구조는 완전히 다르다.
- ArrayList는 내부 배열 객체를 저장해서 인덱스로 관리하지만
- LinkedList는 양방향 포인터 구조로 각각마다 인접하는 참조를 링크해서 체인처럼 관리한다.

![[Pasted image 20231023234609.png]]

따라서, LinkedList 는 특정 인덱스의 객체를 제거하거나 삽입하면, 앞 뒤 링크만 변경하고 나머지 링크는 변경되지 않는다. 그러므로 중간 삽입/삭제가 빈번할 수록 LinkedList를 쓰는 것이 효율적이다.

LinkedList를 생성할 때, 처음에는 어떠한 링크도 만들어지지 않기 때문에 내부적으로 비어있다.

```java
List<E> list = new LinkedList<E>();
```

- java 에서 LinkedList 클래스는 스택과 큐를 구현하는 데에 자주 쓰인다.
- 그 중 Queue는 자바에서 일반적으로 두가지 방법으로 구현된다.
- 배열을 사용하여 구현하거나, LinkedList나 ArrayList 클래스를 사용한다.

> [!tip] LinkedList -> Queue 자료구조 구현
> 이 코드를 구현하면서 흥미로웠던 점은 `List<E> list = new LikedList<E>();` 로 선언을 권장했던 기존 자료구조 코드들과는 달리, 큐를 구현할 때는 사용하는 메소드를 집어넣기 위해 반드시 `LinkedList<E> list = new LinkedList<E>();` 라는 생성자를 사용해야 한다는 점이였다.
> 그 말은 즉, offer(), poll(), peek() 와 같은 메소드가 List 인터페이스에서 제공하지 않는, LinkedList 클래스 만의 메소드라는 말이 되겠다.

```java
import java.util.*;
class QueueExample{
    public void method(){
        LinkedList<Integer> queue = new LinkedList<Integer>();
        
        //Queue에 삽입
        queue.offer(11);
        queue.offer(22);
        queue.offer(33);
        queue.offer(44);
        queue.offer(55);

        System.out.println(queue);
        System.out.println(queue.poll()); //Queue에서 맨 앞 요소 제거하며 읽기
        System.out.println(queue);
        System.out.println(queue.peek()); //Queue에서 제거하지 않고 맨 뒤 요소 읽기
        System.out.println();
        ListIterator<Integer> it = queue.listIterator();

        if(it.hasNext()){
            System.out.println(it.next());
            System.out.println(it.next());
            System.out.println(it.previous());
            System.out.println(it.previous());
        }
    }
}

public class Sample {
    public static void main(String[] args){
        QueueExample ex = new QueueExample();
        ex.method();
    }
}
/*

----------------------------------print----------------------------------

[11, 22, 33, 44, 55]
11
[22, 33, 44, 55]
22
22
33
33
22

-------------------------------------------------------------------------
 */
```

Queue는 FIFO, 선입선출 방식을 채택.
따라서 offer(); 메소드를 사용하여 Queue에 요소를 삽입하고 출력했을 땐, 들어간 순서대로 출력이 된다.
**poll(); : Queue에서 맨 처음 요소를 제거하며 출력
peek(); : Queue에서 제거하지 않고 맨 뒤 요소를 출력**

마지막 부분의 ListIterator는 Iterator의 기능을 포함하지만 좀 더 유용하게 쓰일 것 같아 삽입해봤다.
기존에 많이 활용하던 Iterator는 다음 데이터만을 검색할 수 있었고, dataset의 처음부터 끝까지 순차적으로 요소들을 검색하는 기능을 제공하였다.
하지만 ListIterator는 이전에 지나간 요소도 검색할 수 있는 기능을 포함하는 인터페이스이기 때문에, 코드에서 previous() 메소드를 활용하여 이를 구현하였다.

---

### Set : 인터페이스

1. 데이터의 저장 순서를 유지하지 않는다.
2. 같은 데이터의 중복 저장을 허용하지 않는다. 따라서 null도 하나의 null만 저장할 수 있다.
3. Set 컬렉션은 List 컬렉션 처럼 인덱스로 객체를 검색해서 가져오는 메소드가 없다. 대신 전체 객체를 대상으로 한 번 씩 다 가져오는 반복자, Iterator을 제공한다.

```java
Set<String> setExample = new Set<String>();
Iterator<String> iterator = setExample.iterator();
while(iterator.hasNext()) {
	String getin  = iterator.next();
}
```

보통 위 같은 방식으로, iterator 인터페이스에 선언된 hasNext()와 next() 메소드를 사용하여 구현한다.

Set 인터페이스를 구현한 주요 클래스는 3개가 있다.

|**Class**|**특징**|
|**HashSet**|순서가 필요없는 데이터를 hash table에 저장. Set 중에 가장 성능이 좋음.|
|**TreeSet**|저장된 데이터의 값에 따라 정렬됨. red-black tree 타입으로 값이 저장됨. HashSet보다 성능이 느림.|
|**LinkedHashSet**|연결된 목록 타입으로 구현된 hash table에 데이터 저장. 저장된 순서에 따라 값이 정렬되나 셋 중 가장 느림|

- 3개의 클래스의 성능 차이는 클래스 때문인데, 셋 중 HashSet이 특히 큰 dataset에서, 별도의 정렬작업이 없기 떄문에 가장 빠르다.
- 또한 JDK 1.2부터 제공된 HashSet 클래스는 해시 알고리즘을 사용하였기 때문에 매우 빠른 검색 속도를 가진다.
- 이제 Set인터페이스를 구현한 HashSet에 대해서 좀 더 자세히 살펴보자.

---

### HashSet

> [!help] 해시 알고리즘 이란?
> 해시 함수(hash Fucntion)를 사용하여 데이터를 해시 테이블에 저장하고, 다시 그것을 검색하는 알고리즘이다.
> ![[Pasted image 20231024001256.png]]

- 자바에서 해시 알고리즘을 이용한 자료구조는 위의 그림과 같이 배열과 연결 리스트로 구현된다.
- 저장할 key값과 value를 넣으면 해시함수는 `int index = key.hashCode() % capacity` 연산으로 배열의 인덱스를 구하여 해당 인덱스에 저장된 연결 리스트에 데이터를 저장한다.
  기본생성자 -> `Set<E> set = new HashSet<E>();`

- HashSet에서는 순서 없이, 동일한 객체의 중복 저장 없이 저장을 수행한다는 점을 언급했다.
- 따라서 add() 메소드를 사용하여 해당 HashSet에 이미 존재하고 있는 요소를 추가하려면, 해당 요소를 바로 저장하지 않고 내부적으로 객체의 hashCode() 메소드와 equals() 메소드를 호출하며 검사한다.
- 이 때 사용하는 hashCode() 와 equals() 코드는 자신이 정의한 클래스 인스턴스에 대해 프로그래머가 직접 오버라이딩하여 구현할 수 있는데, 그 흐름을 이해하기 위해 먼저 String 클래스에서 오버라이딩된 두 메소드의 정의를 짚어보자.
- 문자열을 HashSet에 저장할 경우, 같은 문자열을 갖는 String 객체는 동등한 객체로, 다른 문자열을 갖는 String 객체는 다른 객체로 간주된다.
- 그 이유는 String 클래스가 hashCode()와 quals() 메소드를 오버라이딩하여, 같은 문자열일 경우 hashCode()의 리턴값을 같게 equals()의 리턴값을 true로 나오도록 구현해놓았다.

---

### Map : 인터페이스

- Map 컬렉션에는 키(Key)와 값(value)으로 구성된 Entry 객체를 저장하는 구조를 가지고 있다.
- 여기서 키와 값은 모두 객체이다.
- 값은 중복 저장이 가능하지만, 키는 중복 저장이 불가능하다. Set과 마찬가지로, Map 컬렉션에서는 키 값의 중복 저장이 허용되지 않는 데, 만약 중복 저장 시 먼저 저장된 값은 저장되지 않은 상태가 된다.
- 즉, 기존 값은 얻어지고 새로운 값으로 대체되기 때문이다.
- HashSet에서 처럼, 직접 HashMap과 HashTable 모두 키로 사용할 객체에 대해 hasCOde() equals() 메소드를 오버라이딩하여 같은 객체가 될 조건을 정의할 수 있다.

### HashMap

HashMap은 Map 인터페이스 구현을 위해 해시테이블을 사용한 클래스입니다. 또한 중복을 허용하지 않고 순서를 보장하지 않습니다. 중요한 점은, HashTable과 다르게 HashMap은 키와 값으로 null 값이 허용된다는 것입니다.

#### HashMap 생성

```java
Map<String, Integer> map = new HashMap<String, Integer>();
// 또는 다이아몬드 연산자 사용
Map<String, Integer> map = new HashMap<>();
```

#### HashMap 주요 메서드

```java
Map<String, Integer> map = new HashMap<>();

// 요소 추가
map.put("Alice", 25);
map.put("Bob", 30);
map.put("Charlie", 20);

// 요소 가져오기
Integer age = map.get("Alice");  // 25
Integer age2 = map.get("David");  // null (키가 없으면 null 반환)

// 키 존재 여부 확인
boolean hasKey = map.containsKey("Alice");  // true

// 값 존재 여부 확인
boolean hasValue = map.containsValue(25);    // true

// 요소 삭제
Integer removed = map.remove("Bob");       // 30 반환

// 크기 확인
int size = map.size();                      // 2

// 모든 키 가져오기
Set<String> keys = map.keySet();            // [Alice, Charlie]

// 모든 값 가져오기
Collection<Integer> values = map.values();  // [25, 20]

// 모든 엔트리 가져오기
Set<Map.Entry<String, Integer>> entries = map.entrySet();

// 순회
for (Map.Entry<String, Integer> entry : map.entrySet()) {
    System.out.println(entry.getKey() + ": " + entry.getValue());
}
```

#### HashMap vs HashTable

| 특징          | HashMap                         | HashTable            |
| ------------- | ------------------------------- | -------------------- |
| **동기화**    | 비동기화 (Thread-safe하지 않음) | 동기화 (Thread-safe) |
| **null 허용** | 키와 값 모두 null 허용          | null 허용 안 함      |
| **성능**      | 빠름                            | 상대적으로 느림      |
| **사용 시기** | 단일 스레드 환경                | 멀티 스레드 환경     |

#### LinkedHashMap

HashMap과 유사하지만 **삽입 순서를 보장**합니다.

```java
Map<String, Integer> linkedMap = new LinkedHashMap<>();
linkedMap.put("Alice", 25);
linkedMap.put("Bob", 30);
linkedMap.put("Charlie", 20);

// 삽입 순서대로 출력됨
for (String key : linkedMap.keySet()) {
    System.out.println(key);  // Alice, Bob, Charlie 순서대로
}
```

#### TreeMap

**키를 자동으로 정렬**하는 Map입니다. Red-Black Tree 구조를 사용합니다.

```java
Map<String, Integer> treeMap = new TreeMap<>();
treeMap.put("Charlie", 20);
treeMap.put("Alice", 25);
treeMap.put("Bob", 30);

// 키가 자동으로 정렬됨
for (String key : treeMap.keySet()) {
    System.out.println(key);  // Alice, Bob, Charlie (알파벳 순)
}
```

출처 : https://joooootopia.tistory.com/13
