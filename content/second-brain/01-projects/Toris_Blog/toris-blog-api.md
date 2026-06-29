---
tags:
  - toris-blog
  - api
---

# Toris_Blog — API 명세

## API 엔드포인트

### 댓글 (`/api/comments`)

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/comments?postId=X&page=1&limit=20` | 댓글 조회 | Public |
| POST | `/api/comments` | 댓글 작성 | Public (비밀번호) |
| PUT | `/api/comments/[commentId]` | 댓글 수정 | 비밀번호 필요 |
| DELETE | `/api/comments/[commentId]` | 댓글 삭제 (soft) | 비밀번호 필요 |

**POST 요청 본문:**
```json
{
  "postId": "string",
  "authorId": "string (max 50)",
  "password": "string",
  "content": "string (max 1000)",
  "parentId": "string | null"
}
```

### 게스트북 (`/api/guestbook`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/guestbook?page=1&limit=20` | 방명록 조회 |
| POST | `/api/guestbook` | 방명록 작성 |

### 포스트 (`/api/posts`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/posts` | 전체 포스트 목록 (JSON) |

### 좋아요 (`/api/posts/[id]/like`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/posts/[id]/like` | 좋아요 토글 |
| GET | `/api/posts/[id]/like` | 좋아요 상태 조회 |

### 조회수 (`/api/posts/[id]/view`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/posts/[id]/view` | 조회수 증가 |
| GET | `/api/posts/[id]/view` | 조회수 조회 |

### Todo (`/api/todos`)

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/todos` | Todo 목록 | Public |
| POST | `/api/todos` | Todo 생성 | 지갑 인증 필요 |
| PUT | `/api/todos` | Todo 수정 | 지갑 인증 필요 |
| DELETE | `/api/todos?id=X&walletAddress=Y` | Todo 삭제 | 지갑 인증 필요 |

### 연락처 (`/api/contact`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/contact` | 연락처 제출 (GitHub Issue 댓글) |

### OG 이미지 (`/api/og-image`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/og-image?title=...&subtitle=...` | 동적 OG 이미지 생성 (Edge) |

### 캐시 재검증 (`/api/revalidate`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/revalidate` | 캐시 태그 수동 재검증 |

## Mongoose 모델

### Comment
- `postId` (String, indexed)
- `authorId` (String, max 50)
- `password` (String, select: false)
- `content` (String, max 1000)
- `parentId` (ObjectId ref Comment, nullable)
- `isDeleted` (Boolean, soft-delete)
- Timestamps: true

### Guestbook
- `nickname` (String, max 30)
- `message` (String, max 500)
- `ipAddress` (String, select: false)
- Timestamps: true

### PostView
- `postId` (String, unique)
- `viewCount` (Number, min 0)
- `uniqueViews` (Number, min 0)
- `lastViewedAt` (Date)

### PostLike
- `postId` (String, unique)
- `likeCount` (Number, min 0)
- `likedBy` ([String] — IP 목록)
- `lastLikedAt` (Date)

### Todo
- `title` (String, required)
- `description` (String)
- `status` (enum: planned/in-progress/completed)
- `priority` (enum: low/medium/high)
- `dueDate` (String)
- `tags` ([String])
- `createdAt` / `updatedAt` (String, manual)
