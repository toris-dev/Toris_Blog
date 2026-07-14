---
title: '[Career] Java Stream 완전 정리'
date: 2025-07-09T16:55:19.886Z
slug: java-stream-guide
category: Career
tags: [Career, Java, Algorithm]
---

# Java Stream 완전 정리

> Java 8에서 도입된 Stream API를 활용하여 Collection 데이터를 효율적으로 처리하는 방법을 정리합니다.

<img src="https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=1200&h=600&fit=crop&auto=format" alt="Java Programming" style="border-radius: 12px; margin: 20px 0;" />

## Java Stream이란?

Java Stream은 Java 8에서 도입된 기능으로, **선언형으로 Collection 데이터를 처리**할 수 있게 해주는 API입니다.

> 함수형 프로그래밍의 개념을 Java에 도입하여 더욱 간결하고 읽기 쉬운 코드 작성을 가능하게 합니다.

### 핵심 특징

- **선언형 프로그래밍**: "어떻게"가 아닌 "무엇을" 수행할지 선언
- **병렬 처리**: 멀티스레드 코드 없이도 자동으로 병렬 처리 가능
- **함수형 프로그래밍**: 람다 표현식과 함께 사용하여 간결한 코드 작성

### 기본 구조

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// Stream 파이프라인
long count = numbers.stream()        // 스트림 생성
    .filter(x -> x < 4)              // 중간 연산 (스트림 변환)
    .count();                        // 최종 연산 (결과 반환)
```

**스트림 파이프라인 구성:**

1. **스트림 생성**: `stream()` - Collection에서 Stream 생성
2. **중간 연산**: `filter()`, `map()`, `sorted()` 등 - 연속적으로 수행 가능
3. **최종 연산**: `count()`, `collect()`, `forEach()` 등 - 마지막에 단 한 번만 사용

## Stream의 핵심 특징

### 1. 데이터를 변경하지 않음 (Immutable)

Stream은 원본 데이터를 변경하지 않고, 새로운 Stream을 생성합니다.

```java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");
List<String> upperNames = names.stream()
    .map(String::toUpperCase)
    .collect(Collectors.toList());

// 원본 리스트는 변경되지 않음
System.out.println(names);        // [Alice, Bob, Charlie]
System.out.println(upperNames);   // [ALICE, BOB, CHARLIE]
```

### 2. 1회용 (One-time use)

Stream은 한 번만 사용할 수 있습니다. 최종 연산 후에는 Stream이 소비되어 재사용할 수 없습니다.

```java
Stream<Integer> stream = Arrays.asList(1, 2, 3).stream();
stream.forEach(System.out::println);  // 정상 동작
stream.forEach(System.out::println);  // IllegalStateException 발생!
```

### 3. 지연 연산 (Lazy Evaluation)

중간 연산은 최종 연산이 호출될 때까지 실행되지 않습니다.

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

Stream<Integer> stream = numbers.stream()
    .filter(n -> {
        System.out.println("필터링: " + n);  // 이 코드는 실행되지 않음
        return n > 2;
    });

// 최종 연산이 호출될 때 비로소 실행됨
long count = stream.count();  // 이 시점에 filter가 실행됨
```

### 4. 병렬 실행 가능

`parallelStream()`을 사용하면 자동으로 병렬 처리됩니다.

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// 순차 처리
long sequentialSum = numbers.stream()
    .mapToInt(Integer::intValue)
    .sum();

// 병렬 처리
long parallelSum = numbers.parallelStream()
    .mapToInt(Integer::intValue)
    .sum();
```

## Stream 생성 방법

### 1. Collection에서 생성

```java
List<String> list = Arrays.asList("a", "b", "c");
Stream<String> stream = list.stream();
```

### 2. 배열에서 생성

```java
String[] array = {"a", "b", "c"};
Stream<String> stream = Arrays.stream(array);
```

### 3. Stream.of() 사용

```java
Stream<String> stream = Stream.of("a", "b", "c");
```

### 4. 빈 Stream 생성

```java
Stream<String> emptyStream = Stream.empty();
```

### 5. 무한 Stream 생성

```java
// 무한 스트림 생성 (0부터 시작)
Stream<Integer> infiniteStream = Stream.iterate(0, n -> n + 2);

// 처음 10개만 가져오기
infiniteStream.limit(10).forEach(System.out::println);
```

## 중간 연산 (Intermediate Operations)

중간 연산은 Stream을 변환하여 새로운 Stream을 반환합니다. 여러 개를 연속적으로 사용할 수 있습니다.

### filter() - 필터링

조건에 맞는 요소만 필터링합니다.

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

List<Integer> evenNumbers = numbers.stream()
    .filter(n -> n % 2 == 0)
    .collect(Collectors.toList());
// 결과: [2, 4, 6, 8, 10]
```

### map() - 변환

각 요소를 다른 형태로 변환합니다.

```java
List<String> names = Arrays.asList("alice", "bob", "charlie");

List<String> upperNames = names.stream()
    .map(String::toUpperCase)
    .collect(Collectors.toList());
// 결과: [ALICE, BOB, CHARLIE]

// 숫자를 제곱으로 변환
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);
List<Integer> squares = numbers.stream()
    .map(n -> n * n)
    .collect(Collectors.toList());
// 결과: [1, 4, 9, 16, 25]
```

### flatMap() - 평탄화

중첩된 구조를 평탄화합니다.

```java
List<List<String>> nestedList = Arrays.asList(
    Arrays.asList("a", "b"),
    Arrays.asList("c", "d"),
    Arrays.asList("e", "f")
);

List<String> flatList = nestedList.stream()
    .flatMap(List::stream)
    .collect(Collectors.toList());
// 결과: [a, b, c, d, e, f]
```

### distinct() - 중복 제거

중복된 요소를 제거합니다.

```java
List<Integer> numbers = Arrays.asList(1, 2, 2, 3, 3, 3, 4, 5);

List<Integer> uniqueNumbers = numbers.stream()
    .distinct()
    .collect(Collectors.toList());
// 결과: [1, 2, 3, 4, 5]
```

### sorted() - 정렬

요소를 정렬합니다.

```java
List<String> names = Arrays.asList("Charlie", "Alice", "Bob");

// 오름차순 정렬
List<String> sorted = names.stream()
    .sorted()
    .collect(Collectors.toList());
// 결과: [Alice, Bob, Charlie]

// 내림차순 정렬
List<String> reverseSorted = names.stream()
    .sorted(Comparator.reverseOrder())
    .collect(Collectors.toList());
// 결과: [Charlie, Bob, Alice]
```

## 최종 연산 (Terminal Operations)

최종 연산은 Stream 파이프라인을 실행하고 결과를 반환합니다.

### collect() - 수집

```java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

// List로 수집
List<String> list = names.stream()
    .filter(n -> n.length() > 3)
    .collect(Collectors.toList());

// Set으로 수집
Set<String> set = names.stream()
    .collect(Collectors.toSet());

// Map으로 수집
Map<String, Integer> map = names.stream()
    .collect(Collectors.toMap(
        name -> name,
        String::length
    ));
```

### forEach() - 반복

각 요소에 대해 작업을 수행합니다.

```java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

names.stream()
    .forEach(System.out::println);
```

### count() - 개수

요소의 개수를 반환합니다.

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

long count = numbers.stream()
    .filter(n -> n > 2)
    .count();
// 결과: 3
```

### reduce() - 축소

요소들을 하나의 값으로 축소합니다.

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// 합계 구하기
Optional<Integer> sum = numbers.stream()
    .reduce((a, b) -> a + b);
// 결과: Optional[15]

// 초기값과 함께 사용
Integer sumWithInitial = numbers.stream()
    .reduce(0, (a, b) -> a + b);
// 결과: 15
```

## 실전 예제

### 예제 1: 사용자 데이터 처리

```java
class User {
    private String name;
    private int age;

    public User(String name, int age) {
        this.name = name;
        this.age = age;
    }
}

List<User> users = Arrays.asList(
    new User("Alice", 25),
    new User("Bob", 30),
    new User("Charlie", 20),
    new User("David", 35)
);

// 30세 이상 사용자의 이름만 추출하여 정렬
List<String> names = users.stream()
    .filter(user -> user.getAge() >= 30)
    .map(User::getName)
    .sorted()
    .collect(Collectors.toList());
// 결과: [Bob, David]
```

### 예제 2: 문자열 처리

```java
List<String> words = Arrays.asList("hello", "world", "java", "stream");

// 모든 단어를 대문자로 변환하고 길이가 4 이상인 것만 필터링
List<String> result = words.stream()
    .map(String::toUpperCase)
    .filter(s -> s.length() >= 4)
    .collect(Collectors.toList());
// 결과: [HELLO, WORLD, JAVA, STREAM]
```

## 정리

Java Stream API는 Collection 데이터를 효율적이고 선언적으로 처리할 수 있게 해주는 강력한 도구입니다.

**핵심 포인트:**

- Stream은 데이터를 변경하지 않음 (Immutable)
- Stream은 1회용
- 중간 연산은 지연 연산
- 최종 연산이 호출될 때 비로소 실행됨
- 병렬 처리가 쉬움

---

## 참고 자료

### 공식 문서 및 튜토리얼

- [Oracle Java 8 Stream API 공식 문서](https://docs.oracle.com/javase/8/docs/api/java/util/stream/Stream.html)
- [Java Stream Tutorial - Baeldung](https://www.baeldung.com/java-streams)
- [Stream API Guide - GeeksforGeeks](https://www.geeksforgeeks.org/stream-in-java/)

### 관련 포스팅

- [Java Collection Framework](/posts/Java-Collection-Framework)
- [알고리즘 학습 로드맵](/posts/algorithm-roadmap)

### 개발 도구

- [Online Java Compiler - JDoodle](https://www.jdoodle.com/online-java-compiler/)
- [LeetCode Java Solutions](https://leetcode.com/)
