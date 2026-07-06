---
title: 'SQL 기본 개념과 실무 활용'
date: '2024-01-15'
description: '관계형 데이터베이스와 SQL의 기본 개념부터 실무에서 자주 사용하는 쿼리까지 종합적으로 정리한 가이드'
tags: ['SQL', 'Database', 'Backend', 'PostgreSQL', 'MySQL']
categories: ['Learning']
---

# SQL 기본 개념과 실무 활용

<img src="https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1200&h=600&fit=crop&auto=format" alt="SQL Database" style="border-radius: 12px; margin: 20px 0;" />

## 🗄️ 데이터베이스 기본 개념

### 관계형 데이터베이스(RDBMS)란?

관계형 데이터베이스는 데이터를 테이블 형태로 저장하고 관리하는 시스템입니다. 각 테이블은 행(Row)과 열(Column)로 구성되며, 테이블 간의 관계를 통해 복잡한 데이터 구조를 표현할 수 있습니다.

### 주요 RDBMS

- **PostgreSQL**: 오픈소스, 강력한 기능, 표준 SQL 준수
- **MySQL**: 빠른 성능, 웹 애플리케이션에서 많이 사용
- **SQLite**: 경량, 임베디드 데이터베이스
- **Oracle**: 엔터프라이즈급, 고성능
- **SQL Server**: Microsoft 제품군과 호환성

## 📝 SQL 기본 문법

### DDL (Data Definition Language) - 데이터 정의어

#### 테이블 생성

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    age INTEGER CHECK (age >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 테이블 수정

```sql
-- 컬럼 추가
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- 컬럼 수정
ALTER TABLE users ALTER COLUMN name TYPE VARCHAR(150);

-- 컬럼 삭제
ALTER TABLE users DROP COLUMN phone;
```

#### 테이블 삭제

```sql
DROP TABLE users;
```

### DML (Data Manipulation Language) - 데이터 조작어

#### 데이터 삽입

```sql
-- 단일 데이터 삽입
INSERT INTO users (name, email, age)
VALUES ('김개발', 'kim@example.com', 25);

-- 다중 데이터 삽입
INSERT INTO users (name, email, age) VALUES
    ('이백엔드', 'lee@example.com', 30),
    ('박프론트', 'park@example.com', 28),
    ('최풀스택', 'choi@example.com', 32);
```

#### 데이터 조회

```sql
-- 기본 조회
SELECT * FROM users;

-- 특정 컬럼 조회
SELECT name, email FROM users;

-- 조건부 조회
SELECT * FROM users WHERE age >= 30;

-- 정렬
SELECT * FROM users ORDER BY age DESC;

-- 제한
SELECT * FROM users LIMIT 10 OFFSET 20;
```

#### 데이터 수정

```sql
-- 조건부 수정
UPDATE users
SET age = 26
WHERE email = 'kim@example.com';

-- 다중 컬럼 수정
UPDATE users
SET name = '김시니어', age = 35
WHERE id = 1;
```

#### 데이터 삭제

```sql
-- 조건부 삭제
DELETE FROM users WHERE age < 18;

-- 전체 삭제 (주의!)
DELETE FROM users;
```

## 🔍 고급 쿼리 기법

### JOIN 연산

#### 테이블 설계 예시

```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    post_id INTEGER REFERENCES posts(id),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### INNER JOIN

```sql
-- 사용자와 그들의 게시글 조회
SELECT u.name, p.title, p.created_at
FROM users u
INNER JOIN posts p ON u.id = p.user_id
ORDER BY p.created_at DESC;
```

#### LEFT JOIN

```sql
-- 모든 사용자와 그들의 게시글 수 조회 (게시글이 없는 사용자도 포함)
SELECT u.name, COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id, u.name;
```

#### 복합 JOIN

```sql
-- 게시글, 작성자, 댓글 정보 함께 조회
SELECT
    p.title,
    u.name as author,
    c.content as comment,
    cu.name as commenter
FROM posts p
JOIN users u ON p.user_id = u.id
LEFT JOIN comments c ON p.id = c.post_id
LEFT JOIN users cu ON c.user_id = cu.id
ORDER BY p.created_at DESC, c.created_at ASC;
```

### 집계 함수와 GROUP BY

```sql
-- 사용자별 게시글 통계
SELECT
    u.name,
    COUNT(p.id) as post_count,
    AVG(LENGTH(p.content)) as avg_content_length,
    MAX(p.created_at) as last_post_date
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id, u.name
HAVING COUNT(p.id) > 0
ORDER BY post_count DESC;
```

### 서브쿼리

```sql
-- 가장 많은 댓글을 받은 게시글
SELECT title,
       (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
FROM posts p
WHERE (SELECT COUNT(*) FROM comments WHERE post_id = p.id) = (
    SELECT MAX(comment_count)
    FROM (
        SELECT COUNT(*) as comment_count
        FROM comments
        GROUP BY post_id
    ) subquery
);
```

### 윈도우 함수 (PostgreSQL, MySQL 8.0+)

```sql
-- 사용자별 게시글에 순위 매기기
SELECT
    name,
    title,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as post_rank,
    COUNT(*) OVER (PARTITION BY user_id) as total_posts
FROM posts p
JOIN users u ON p.user_id = u.id;
```

## 🚀 성능 최적화

### 인덱스 생성

```sql
-- 단일 컬럼 인덱스
CREATE INDEX idx_users_email ON users(email);

-- 복합 인덱스
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at);

-- 부분 인덱스
CREATE INDEX idx_active_users ON users(email) WHERE age >= 18;
```

### 쿼리 실행 계획 확인

```sql
-- PostgreSQL
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'kim@example.com';

-- MySQL
EXPLAIN SELECT * FROM users WHERE email = 'kim@example.com';
```

### 성능 최적화 팁

1. **적절한 인덱스 사용**

   - WHERE, JOIN, ORDER BY 절에서 자주 사용되는 컬럼에 인덱스 생성
   - 너무 많은 인덱스는 INSERT/UPDATE 성능 저하

2. **쿼리 최적화**

   - SELECT \* 대신 필요한 컬럼만 조회
   - 서브쿼리보다 JOIN 사용 고려
   - LIMIT 사용으로 불필요한 데이터 조회 방지

3. **정규화와 비정규화**
   - 적절한 정규화로 데이터 중복 제거
   - 성능이 중요한 경우 선택적 비정규화 고려

## 🛡️ 데이터 무결성과 제약조건

### 기본 제약조건

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) CHECK (price > 0),
    category_id INTEGER NOT NULL,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id) REFERENCES categories(id),
    UNIQUE (name, category_id)
);
```

### 트랜잭션

```sql
BEGIN;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- 모든 작업이 성공하면 커밋
COMMIT;

-- 문제가 있으면 롤백
-- ROLLBACK;
```

## 📊 실무에서 자주 사용하는 패턴

### 페이지네이션

```sql
-- OFFSET 방식 (간단하지만 큰 OFFSET에서 성능 저하)
SELECT * FROM posts
ORDER BY created_at DESC
LIMIT 20 OFFSET 100;

-- 커서 기반 페이지네이션 (성능 우수)
SELECT * FROM posts
WHERE created_at < '2024-01-01 12:00:00'
ORDER BY created_at DESC
LIMIT 20;
```

### 검색 기능

```sql
-- 기본 텍스트 검색
SELECT * FROM posts
WHERE title ILIKE '%검색어%'
   OR content ILIKE '%검색어%';

-- PostgreSQL 전문 검색
SELECT * FROM posts
WHERE to_tsvector('korean', title || ' ' || content)
@@ plainto_tsquery('korean', '검색어');
```

### 통계 쿼리

```sql
-- 월별 게시글 통계
SELECT
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as post_count,
    COUNT(DISTINCT user_id) as unique_authors
FROM posts
WHERE created_at >= '2024-01-01'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;
```

## 🔧 유용한 함수들

### 문자열 함수

```sql
SELECT
    UPPER(name) as upper_name,
    LENGTH(email) as email_length,
    SUBSTRING(email FROM 1 FOR POSITION('@' IN email) - 1) as username,
    CONCAT(name, ' (', age, '세)') as display_name
FROM users;
```

### 날짜 함수

```sql
SELECT
    NOW() as current_time,
    DATE_PART('year', created_at) as year,
    AGE(NOW(), created_at) as post_age,
    created_at + INTERVAL '7 days' as expires_at
FROM posts;
```

### 조건부 함수

```sql
SELECT
    name,
    age,
    CASE
        WHEN age < 20 THEN '10대'
        WHEN age < 30 THEN '20대'
        WHEN age < 40 THEN '30대'
        ELSE '40대 이상'
    END as age_group,
    COALESCE(phone, '미등록') as phone_display
FROM users;
```

## 📚 추가 학습 리소스

### 권장 학습 순서

1. **기본 문법 익히기**: SELECT, INSERT, UPDATE, DELETE
2. **관계 이해하기**: JOIN의 다양한 유형과 활용
3. **고급 기능**: 서브쿼리, 윈도우 함수, CTE
4. **성능 최적화**: 인덱스, 실행계획, 쿼리 튜닝
5. **실무 적용**: 트랜잭션, 저장 프로시저, 함수

### 연습 플랫폼

- **LeetCode Database**: SQL 문제 해결
- **HackerRank SQL**: 단계별 SQL 학습
- **SQLBolt**: 인터랙티브 SQL 튜토리얼
- **PostgreSQL Tutorial**: 공식 문서와 예제

SQL은 데이터를 다루는 모든 개발자에게 필수적인 기술입니다. 기본기를 탄탄히 다지고 실무에서 다양한 상황에 적용해보면서 실력을 향상시켜 나가세요! 🚀
