---
title: [Career] Java Stream 정리!!!
date: 2025-07-09T16:55:19.886Z
slug: java-stream-정리
category: Career
tags: [Career, Java, Algorithm]
---

# Java Stream 완전 정리

> Java 8에서 도입된 Stream API를 활용하여 Collection 데이터를 효율적으로 처리하는 방법을 정리합니다.

## 📚 Java Stream이란?

Java Stream은 Java 8에서 도입된 기능으로, **선언형으로 Collection 데이터를 처리**할 수 있게 해주는 API입니다.

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

## 🔑 Stream의 핵심 특징

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

## 🚀 Stream 생성 방법

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

## 🔧 중간 연산 (Intermediate Operations)

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

### limit() - 제한

스트림의 요소 개수를 제한합니다.

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

List<Integer> limited = numbers.stream()
    .limit(5)
    .collect(Collectors.toList());
// 결과: [1, 2, 3, 4, 5]
```

### skip() - 건너뛰기

처음 n개의 요소를 건너뜁니다.

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

List<Integer> skipped = numbers.stream()
    .skip(5)
    .collect(Collectors.toList());
// 결과: [6, 7, 8, 9, 10]
```

## 🎯 최종 연산 (Terminal Operations)

최종 연산은 Stream 파이프라인을 실행하고 결과를 반환합니다. 최종 연산 후에는 Stream을 재사용할 수 없습니다.

### collect() - 수집

가장 많이 사용되는 최종 연산입니다. Stream의 요소를 Collection으로 변환합니다.

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
// 결과: {Alice=5, Bob=3, Charlie=7}
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

### anyMatch(), allMatch(), noneMatch() - 조건 검사

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// 하나라도 조건을 만족하는지
boolean hasEven = numbers.stream()
    .anyMatch(n -> n % 2 == 0);
// 결과: true

// 모두 조건을 만족하는지
boolean allPositive = numbers.stream()
    .allMatch(n -> n > 0);
// 결과: true

// 하나도 조건을 만족하지 않는지
boolean noNegative = numbers.stream()
    .noneMatch(n -> n < 0);
// 결과: true
```

### findFirst(), findAny() - 요소 찾기

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// 첫 번째 요소
Optional<Integer> first = numbers.stream()
    .filter(n -> n > 2)
    .findFirst();
// 결과: Optional[3]

// 아무 요소나 (병렬 처리 시 유용)
Optional<Integer> any = numbers.parallelStream()
    .filter(n -> n > 2)
    .findAny();
```

### min(), max() - 최소/최대값

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

Optional<Integer> min = numbers.stream()
    .min(Integer::compareTo);
// 결과: Optional[1]

Optional<Integer> max = numbers.stream()
    .max(Integer::compareTo);
// 결과: Optional[5]
```

## 📊 실전 예제

### 예제 1: 사용자 데이터 처리

```java
class User {
    private String name;
    private int age;

    public User(String name, int age) {
        this.name = name;
        this.age = age;
    }

    // getter, setter 생략
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

### 예제 2: 그룹화 및 집계

```java
// 나이대별로 그룹화
Map<String, List<User>> groupedByAge = users.stream()
    .collect(Collectors.groupingBy(user -> {
        int age = user.getAge();
        if (age < 25) return "20대";
        else if (age < 35) return "30대";
        else return "40대 이상";
    }));

// 나이 평균 구하기
Double averageAge = users.stream()
    .collect(Collectors.averagingInt(User::getAge));
```

### 예제 3: 문자열 처리

```java
List<String> words = Arrays.asList("hello", "world", "java", "stream");

// 모든 단어를 대문자로 변환하고 길이가 4 이상인 것만 필터링
List<String> result = words.stream()
    .map(String::toUpperCase)
    .filter(s -> s.length() >= 4)
    .collect(Collectors.toList());
// 결과: [HELLO, WORLD, JAVA, STREAM]
```

## ⚡ 성능 고려사항

### 순차 vs 병렬

- **순차 처리**: 데이터가 적거나 순서가 중요한 경우
- **병렬 처리**: 데이터가 많고 독립적인 연산인 경우

```java
// 순차 처리 (일반적으로 더 빠름)
long sequentialTime = System.currentTimeMillis();
long sequentialSum = IntStream.range(0, 1000000)
    .sum();
sequentialTime = System.currentTimeMillis() - sequentialTime;

// 병렬 처리 (큰 데이터셋에서 유리)
long parallelTime = System.currentTimeMillis();
long parallelSum = IntStream.range(0, 1000000)
    .parallel()
    .sum();
parallelTime = System.currentTimeMillis() - parallelTime;
```

### 주의사항

1. **Stream은 재사용 불가**: 한 번 사용한 Stream은 재사용할 수 없습니다.
2. **지연 연산**: 중간 연산은 최종 연산이 호출될 때까지 실행되지 않습니다.
3. **병렬 처리 오버헤드**: 작은 데이터셋에서는 순차 처리가 더 빠를 수 있습니다.

## 🎓 정리

Java Stream API는 Collection 데이터를 효율적이고 선언적으로 처리할 수 있게 해주는 강력한 도구입니다. 람다 표현식과 함께 사용하면 코드가 더 간결하고 읽기 쉬워집니다.

**핵심 포인트:**

- Stream은 데이터를 변경하지 않음 (Immutable)
- Stream은 1회용
- 중간 연산은 지연 연산
- 최종 연산이 호출될 때 비로소 실행됨
- 병렬 처리가 쉬움

**학습 순서:**

1. 기본 Stream 생성 및 사용
2. 중간 연산 (filter, map, sorted 등) 익히기
3. 최종 연산 (collect, reduce 등) 익히기
4. 실전 예제로 연습
5. 병렬 처리 활용
