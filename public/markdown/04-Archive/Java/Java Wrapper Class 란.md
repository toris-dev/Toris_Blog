자바의 자료형에는 기본 자료형(primitive type) 과 참조 타입(reference type)이 존재한다. 
>[!help] 참조 타입이란?
>기본 자료형을 객체로 다루기 위해서 사용하는 클래스들을 Wrapper class 라고 부른다.
>래퍼 클래스는 java.lang 패키지에 속해 있으며 기본 타입에 대응되는 클래스 들이 있다.


### 박싱과 언박싱
기본 타입의 값을 포장 객체 만드는 과정을 박싱(boxing) 이라고 하고, 포장 객체에서 기본 타입 값을 얻어내 과정을 언박싱(unboxing) 이라고 한다.
```java
// Boxing
Integer num1 = new Integer(10);
Integer num2 = Integer.valueOf(10);


// UnBoxing 
int num3 = num2.intValue();
int num4 = num2.intValue();
```
valueOf와 intValue 메서드를 호출 박싱, 언박싱을 할 수 있다.

Intellij 에서 보면 밑줄이 생기는 것을 확인할 수 있다.
왜냐하면 Deprecated 되었기 때문에 생긴 것이고, 나머지는 자동 박싱과 언박싱이 되었기 때문에 메서드를 쓸 필요가 없다.

자동 박싱은 포장 클래스 타입에 기본값이 대입될 경우 자동 언박싱은 기본 타입에 포장 객체가 대입될 경우에 발생한다.
Collection 객체에 int 값을 저장하면 자동 박싱이 일어나 Integer 객체가 저장된다.
```java
List<Integer> list = new ArrayList<>();
list.add(200); // 자동 박싱
```


### 포장값 비교
포장 객체는 내부의 값을 비교하기 위해 == , != 를 사용할 수 없다.
왜냐하면 내부 값이 아니라 참조를 비교하기 때문이다.
그러니 자바 명세에 보면 박싱된 값이 다음과 같으면 boolean, char, byte short int == 와 != 연사자로 내부의 값을 바로 비교할 수 있다.

그 이외의 경우 포장클래스의 equals() 메소드를 사용하면 된다.
```java
Integer obj1 = 10;
Integer obj2 = 10;

Integer obj3 = 127;
Integer obj4 = 127;

System.out.println(obj1 == obj2); //true
System.out.println(obj1.intValue() == obj2.intValue()); //true
System.out.println(obj1.equals(obj2)); //true

System.out.println(obj3 == obj4); //false
ystem.out.println(obj3.intValue() == obj4.intValue()); //true
System.out.println(obj3.equals(obj4)); //true
```

>[!bug] Integer 값 비교 시 왜 127 까지만 true가 나오는 걸까?
> 그 이유는 내부 로직에서 IntegerCache.low = -128, IntegerCache.high = 127 이라는 캐시값이 있다. -128 ~ 127 까지는 캐싱되어서 힙영역에 있는 주소값이 일치하여 true가 나오는 것 이다.


### Wrapper Class 를 사용하는 이유는?
>[!req] 왜 기본 타입이 아닌 Wrapper class 를 사용하는 걸까?
> * 래퍼클래스는 기본 데이터 타입을 오브젝트로 변환할 수 있다. 메소드에 전달된 인수를 수정하려는 경우 오브젝트가 필요하다~~
> *  거의 모든 패키지의 클래스들은 제네릭 타입을 파라미터로 받는다. 제네릭 타입은 래퍼 클래스만 들어갈 수 있다.
> * 컬렉션 프레임워크의 데이터 구조는 기본 타입이 아닌 객체만 저장할 수 있으며, 래퍼 클래스를 사용해 자동 박싱과 언박싱이 일어난다.
> * 래퍼 클래스는 기본 타입과 다르게 null 값을 저장할 수 있다. 웹 서버의 경우 client에서 null 값이 왔을 때 기본 타입이면 예외가 발생한다.


