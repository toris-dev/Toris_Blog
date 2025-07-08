### 람다 함수란?
람다 함수는 익명 함수 를 지칭하는 용어 입니다.
현재 사용되고 있는 람다의 근간은 수학과 기초 컴퓨터과학 분야에서의 람다 대수이다. 람다 대수는 간단히 말하자면 수학에서 사용하는 함수를 보다 단순하게 표현하는 방버이다.

## 람다의 특징
람다 대수는 임름 가질 필요가 없다.
두 개 이상의 입력이 있는 함수는 최정적으로 1개의 입력만 받는 람다 대수로 단순화 될 수 있다.

### 익명함수?
익명함수란 말 그대로 함수의 이름이 ㅇ없는 함수 입니다. 익명함수들을 공통으로 일급객체(First Class citizen) 라는 특징을 가지고 있다.
이 일급 객체란 일반적으로 다를 객체들에 적용 가능한 ㅇ연산으 모두 지원하는 개체를 가르킨다.
함수를 값으로 사용 할 수도 있으며 파라메터로 전달 및 변수에 대입 하기와 같은 연산들이 가능하다.

## 람다의 장단점

### 장점
1. 코드의 간결성 : 람다를 사용하면 불필요한 반복문의 삭제가 가능하며 복잡한 식을 단순하게 표현할 수 있다.
2. 지연연산 수행 : 람다는 지연연산을 수행 함으로써 불필요한 연산을 최소화 할 수 있다.
3. 병렬처리 가능 : 멀티스레드를 활용하여 병렬처리를 할 수 있다.

### 단점
1. 람다식의 호출이 까다롭다.
2. 람다 Stream 사용 for, while 문 사용 시 성능이 떨어진다.
3. 불필요하게 너무 막 사용하면 가독성을 떨어뜨린다.

## 람다의 표현식
1. 람다는 매개변수 화살표(->) 함수 몸체로 이용하여 사용할 수 있다.
2. 함수 몸체가 단일 실행문이라면 괄호{}를 생략 할 수 있다.
3. 함수몸체가 return문으로만 구성되어 있는 경우 괄호{}를 생략 할 수 없다.
```java
// 정상적인 유형
() -> {}
() -> 2
() -> { return 2; }

(int x) -> x+1
(x) -> x+1
x -> x+1
(int x) -> { return 1; }
x -> { return x+1; }


(int x, int y) -> x+y
(x, y) -> x+y
(x, y) -> { return x+y; }

(String lam) -> lam.length()
lam -> lam.length()
(Thread lamT) -> { lamT.start(); }
lamT -> { lamT.start(); }


//잘못된 유형 선언된 type과 선언되지 않은 type을 같이 사용 할 수 없다.
(x, int y) -> x+y
(x, final y) -> x+y  
```


## 람다식 Example

### 기존 자바 문법
```java
new Thread(new Runnable() {
	@Override
	public void run() {
		System.out.println("Hello Toris Blog!!!");
	}
})
```


### 람다식 문법
```java
new Thread(() -> {
	System.out.println("Hello Toris Blog!!!");
})
```
다음 예제를 통해 일반 자바 문법과 람다식 문법을 확인 해 봤다.
람다식을 사용하면 코드가 훨씬 간결해지고 가독성도 좋아진걸 확인 할 수 있다.


## 함수형 인터페이스
### FunctionalInterface
Functional Interface는 일반적으로 '구현해야 할 추상 메소드가 하나만 정의된 인터페이스'를 가리킨다.
자바 컴파일러는 이렇게 명시된 함수형 인터페이스에 두 개 이상의 메소드가 선언되면 오류를 발생시킨다.

```java
// 구현해야할 메서드가 한개이므로 Function Interface 이다.
@FunctionalInterface
public interface Math {
	public int Calc(int first, int second);
}

// 구현해야 할 메서드가 두개이므로 Functional Interface가 아니다.
@FunctionalInterface
public interface Math {
	public int Calc(int first, int second);
	public int Calc2(int first, int second);
}
```

### 함수형 인터페이스 람다 사용 예제
함수형 Interface 선언
```java
@FunctionalInterface
interface Math {
	public int Calc(int first, int second);
}
```

추상 메서드 구현 및 함수형 인터페이스 사용
```java
public static void main(String[] args) {
	Math plusLambda = (first, second) -> first + second;
	System.out.println(plusLambda(4, 2));

	Math plusLambda = (first, second) -> first - second;
	System.out.println(plusLambda(4, 2));
	
}
```

## Java에서 지원하는 java.util.function 인터페이스


### IntFunction <>
* int 값의 인수를 받아들이고 결과를 생성하는 함수를 나타낸다.
ex)
```java
IntFunction intSum = (x) -> x+1;
System.out.println(intSum.apply(1));
```

### BinaryOperator <>
동일한 유형의 두 피연산자에 대한 연산을 나타내며 피연산자와 동일한 유형의 결과를 생성한다.

ex)
```java
BinaryOperator stringSum=(x, y) -> x + " " + y;
System.out.println(stringSum.apply("Welcome", "Toris Blog"));
```


---

## Stream API

Stream 이란?