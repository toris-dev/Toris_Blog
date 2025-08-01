---
title: [Career] Java Stream 정리!!!
date: 2025-07-09T16:55:19.886Z
slug: java-stream-정리
category: Career
tags: Career, Java, Algorithm
---

[[Java Lambda 가 무엇일까]]

### Java Stream 이란?

- Java 8 API에 새로 추가된 기능이다.
- **스트림을 이용하면 선언형으로 Collection 데이터를 처리할 수 있다.**
- **스트림을 이용하면 멀티스레드 코드를 구현하지 않아도 데이터를 투명하게 병렬로 처리할 수 있다.**
- 자바에서는 파일이나 콘솔의 입출력을 직접 다루지 않고, 스트림(Stream)이라는 흐름을 통해 다룹니다.
- 스트림이란 실제의 입력이나 출력이 표현된 데이터의 이상화된 흐름을 의미한다.
- 즉, 스트림은 운영체제에 의해 생성되는 가상의 연결고리를 의미하며, 중간 매개자 역할을 한다.

스트림은 람다를 활용할 수 있는 기술 중 하나이다.
`exapmle.stream().filter(x -> x < 2).count`
stream() -> 스트림 생성
filter() -> 중간 연산 (스트림 변환) : 연속에서 수행 가능하다.
count -> 최종연산 (스트림 사용) : 마지막에 단 한 번만 사용 가능하다.

### Stream 특징

- Stream은 데이터를 변경하지 않는다.
- Stream은 1회용 이다.
- Stream은 지연 연산을 수행한다.
- Stream은 병렬 실행이 가능하다.

### Stream의 종류

![[캡처.png]]

![[캡처 1.png]]

![[캡처 2.png]]
