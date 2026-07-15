---
title: 'Supabase + Next.js — 토리스가 MVP를 빠르게 출시하는 표준 스택'
date: '2024-01-15'
description: '토리스가 밈캐치·YM Guide·LOVETRIP 등 실제 제품에 적용해 온 Supabase + Next.js 실무 기준. PostgreSQL, 인증, RLS, 실시간 구독, 스토리지 구성을 프로덕션 관점에서 정리했다.'
tags:
  ['Supabase', 'Next.js', 'React', 'PostgreSQL', 'Authentication', 'Fullstack']
categories: ['Learning']
---

# Supabase + Next.js — 토리스가 MVP를 빠르게 출시하는 표준 스택

> **Q. 토리스는 왜 Supabase + Next.js를 표준 스택으로 쓰나요?**
> @supabase/supabase-js 하나로 PostgreSQL·인증·실시간·스토리지를 연결하고, 보안 경계를 RLS로 데이터베이스에 두면 별도 백엔드 없이 몇 주 안에 프로덕션 수준의 MVP를 낼 수 있기 때문입니다.

## 🚀 개요

토리스는 밈캐치, YM Guide, LOVETRIP 등 실제 제품에서 Supabase + Next.js를 표준 스택으로 쓴다. Supabase는 Firebase의 오픈소스 대안으로 PostgreSQL 기반의 백엔드 서비스를 제공하는데, 백엔드 서버를 따로 운영하지 않고도 데이터베이스·인증·실시간 구독·스토리지를 한 번에 확보할 수 있어 제품마다 인프라를 새로 설계하는 비용이 사라진다. 1인 스튜디오에서 여러 제품을 병렬로 운영하려면 이 비용 절감이 결정적이다.

이 글은 그 제품들을 만들고 운영하는 과정에서 정리한 실무 기준이다. 프로젝트 초기 설정부터 스키마 설계, RLS, 인증, 실시간 기능, 스토리지, 배포까지 — 새 제품을 시작할 때마다 반복하는 구성을 순서대로 담았다. 튜토리얼이 아니라, 우리가 실제로 쓰는 기본값이라고 보면 된다.

### 우리가 이 조합을 선택한 기준

**Supabase의 장점:**

- 🗄️ PostgreSQL 기반의 강력한 데이터베이스
- 🔐 내장된 인증 시스템 (소셜 로그인 포함)
- 📡 실시간 구독 (Real-time subscriptions)
- 🛡️ Row Level Security (RLS)
- 📁 파일 스토리지
- 🔧 자동 생성되는 REST/GraphQL API

**Next.js의 장점:**

- ⚡ 뛰어난 성능 (SSR, SSG, ISR)
- 📱 풀스택 개발 가능 (API Routes)
- 🎨 모던 React 기능 지원
- 🚀 간편한 배포 (Vercel)

## 🛠️ 프로젝트 설정

### 1. Next.js 프로젝트 생성

```bash
npx create-next-app@latest my-supabase-app
cd my-supabase-app
```

### 2. Supabase 클라이언트 설치

```bash
npm install @supabase/supabase-js
npm install @supabase/auth-helpers-nextjs
npm install @supabase/auth-helpers-react
npm install @supabase/auth-ui-react
npm install @supabase/auth-ui-shared
```

### 3. 환경 변수 설정

`.env.local` 파일 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Supabase 클라이언트 설정

`lib/supabase.js` 파일 생성:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

`lib/supabase-server.js` (서버사이드용):

```javascript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const createServerSupabaseClient = () => {
  return createServerComponentClient({ cookies });
};
```

## 🗄️ 데이터베이스 설계

### 블로그 애플리케이션 예시

초기 스키마는 Supabase 대시보드의 SQL 에디터에서 바로 잡는 것을 기준으로 한다. 블로그 애플리케이션을 예로 들면:

```sql
-- 프로필 테이블
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 게시글 테이블
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  slug TEXT UNIQUE NOT NULL,
  published BOOLEAN DEFAULT FALSE,
  author_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 댓글 테이블
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 카테고리 테이블
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 게시글-카테고리 관계 테이블
CREATE TABLE post_categories (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);
```

### RLS (Row Level Security) 설정

RLS는 이 스택에서 보안의 핵심이다. 우리는 접근 제어를 API 레이어가 아니라 데이터베이스 정책으로 강제하는 것을 기본값으로 둔다 — 클라이언트에서 Supabase를 직접 호출하는 구조에서는 이게 유일하게 믿을 수 있는 경계다.

```sql
-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 프로필 정책
CREATE POLICY "프로필은 자신만 수정 가능" ON profiles
  FOR ALL USING (auth.uid() = id);

-- 게시글 정책
CREATE POLICY "게시글은 누구나 읽기 가능" ON posts
  FOR SELECT USING (published = true OR auth.uid() = author_id);

CREATE POLICY "게시글은 작성자만 생성/수정 가능" ON posts
  FOR ALL USING (auth.uid() = author_id);

-- 댓글 정책
CREATE POLICY "댓글은 누구나 읽기 가능" ON comments
  FOR SELECT USING (true);

CREATE POLICY "댓글은 로그인한 사용자만 작성 가능" ON comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);
```

## 🔐 인증 시스템 구현

### 1. 인증 컨텍스트 설정

`contexts/AuthContext.js`:

```javascript
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### 2. 로그인 컴포넌트

`components/auth/LoginForm.jsx`:

```javascript
'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';

export default function LoginForm() {
  const { user } = useAuth();

  if (user) {
    return <div>이미 로그인되어 있습니다.</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={['google', 'github']}
        redirectTo={`${window.location.origin}/auth/callback`}
        onlyThirdPartyProviders={false}
        showLinks={true}
        localization={{
          variables: {
            sign_in: {
              email_label: '이메일',
              password_label: '비밀번호',
              button_label: '로그인',
              loading_button_label: '로그인 중...',
              link_text: '이미 계정이 있으신가요? 로그인하세요'
            },
            sign_up: {
              email_label: '이메일',
              password_label: '비밀번호',
              button_label: '회원가입',
              loading_button_label: '가입 중...',
              link_text: '계정이 없으신가요? 회원가입하세요'
            }
          }
        }}
      />
    </div>
  );
}
```

### 3. 인증 콜백 처리

`app/auth/callback/route.js`:

```javascript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(requestUrl.origin);
}
```

## 📊 데이터 CRUD 작업

### 1. 게시글 생성

`components/posts/CreatePost.jsx`:

```javascript
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function CreatePost() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const slug = title
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');

    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          title,
          content,
          slug,
          author_id: user.id,
          published: true
        }
      ])
      .select();

    if (error) {
      console.error('Error creating post:', error);
    } else {
      console.log('Post created:', data);
      setTitle('');
      setContent('');
    }

    setLoading(false);
  };

  if (!user) {
    return <div>로그인이 필요합니다.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">제목</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">내용</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? '게시 중...' : '게시글 작성'}
      </button>
    </form>
  );
}
```

### 2. 게시글 목록 조회

`components/posts/PostList.jsx`:

```javascript
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(
          `
          *,
          profiles:author_id (
            full_name,
            avatar_url
          )
        `
        )
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">최신 게시글</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-3">
                <Link
                  href={`/posts/${post.slug}`}
                  className="text-gray-900 hover:text-blue-600"
                >
                  {post.title}
                </Link>
              </h2>

              {post.excerpt && (
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{post.profiles?.full_name || '익명'}</span>
                <time dateTime={post.created_at}>
                  {new Date(post.created_at).toLocaleDateString('ko-KR')}
                </time>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
```

## 📡 실시간 기능 구현

### 실시간 댓글 시스템

`components/comments/CommentSection.jsx`:

```javascript
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function CommentSection({ postId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();

    // 실시간 구독 설정
    const subscription = supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setComments((prev) => [...prev, payload.new]);
          } else if (payload.eventType === 'DELETE') {
            setComments((prev) =>
              prev.filter((comment) => comment.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [postId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(
          `
          *,
          profiles:author_id (
            full_name,
            avatar_url
          )
        `
        )
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      const { error } = await supabase.from('comments').insert([
        {
          content: newComment.trim(),
          post_id: postId,
          author_id: user.id
        }
      ]);

      if (error) throw error;
      setNewComment('');
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-bold mb-6">댓글 ({comments.length})</h3>

      {user && (
        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 작성해주세요..."
            rows={3}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            댓글 작성
          </button>
        </form>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="font-medium">
                {comment.profiles?.full_name || '익명'}
              </span>
              <time className="ml-2 text-sm text-gray-500">
                {new Date(comment.created_at).toLocaleDateString('ko-KR')}
              </time>
            </div>
            <p className="text-gray-700">{comment.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 📁 파일 업로드 (Storage)

### 이미지 업로드 컴포넌트

`components/upload/ImageUpload.jsx`:

```javascript
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function ImageUpload({ onUpload }) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (event) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('파일을 선택해주세요.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, file);

      if (error) throw error;

      // 공개 URL 가져오기
      const {
        data: { publicUrl }
      } = supabase.storage.from('images').getPublicUrl(fileName);

      onUpload(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">이미지 업로드</label>
      <input
        type="file"
        accept="image/*"
        onChange={uploadImage}
        disabled={uploading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {uploading && <p className="mt-2 text-sm text-gray-500">업로드 중...</p>}
    </div>
  );
}
```

## 🔍 고급 기능

### 1. 전문 검색 구현

```javascript
// utils/search.js
export const searchPosts = async (query) => {
  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      profiles:author_id (
        full_name
      )
    `
    )
    .or(`title.ilike.%${query}%, content.ilike.%${query}%`)
    .eq('published', true)
    .order('created_at', { ascending: false });

  return { data, error };
};

// PostgreSQL 전문 검색 사용
export const fullTextSearch = async (query) => {
  const { data, error } = await supabase.rpc('search_posts', {
    search_query: query
  });

  return { data, error };
};
```

### 2. 페이지네이션

```javascript
const [posts, setPosts] = useState([]);
const [loading, setLoading] = useState(false);
const [hasMore, setHasMore] = useState(true);
const POSTS_PER_PAGE = 10;

const loadMorePosts = async (page = 0) => {
  setLoading(true);

  const from = page * POSTS_PER_PAGE;
  const to = from + POSTS_PER_PAGE - 1;

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (data && data.length < POSTS_PER_PAGE) {
    setHasMore(false);
  }

  if (page === 0) {
    setPosts(data || []);
  } else {
    setPosts((prev) => [...prev, ...(data || [])]);
  }

  setLoading(false);
};
```

## 🚀 배포 및 최적화

### 1. Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 배포
vercel

# 환경 변수 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

### 2. 성능 최적화

**데이터베이스 최적화:**

```sql
-- 인덱스 생성
CREATE INDEX posts_published_created_idx ON posts (published, created_at DESC);
CREATE INDEX comments_post_id_idx ON comments (post_id);
CREATE INDEX profiles_id_idx ON profiles (id);
```

**Next.js 최적화:**

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['your-supabase-project.supabase.co']
  },
  experimental: {
    appDir: true
  }
};

module.exports = nextConfig;
```

### 3. 보안 강화

```sql
-- RLS 정책 강화
CREATE POLICY "게시글 작성자만 수정 가능" ON posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "댓글 작성자만 삭제 가능" ON comments
  FOR DELETE USING (auth.uid() = author_id);

-- 함수 보안
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📚 참고 자료

### 공식 문서

- [Supabase 공식 문서](https://supabase.com/docs)
- [Next.js 공식 문서](https://nextjs.org/docs)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

### 여기서 더 깊게 들어가는 주제

- **Database Functions**: PostgreSQL 함수 작성
- **Edge Functions**: Deno 기반 서버리스 함수
- **Webhook**: 외부 서비스와 연동
- **Multi-tenancy**: 테넌트별 데이터 분리
- **Performance Monitoring**: 쿼리 성능 모니터링

## 마치며

토리스는 이 구성을 밈캐치, YM Guide, LOVETRIP 같은 실제 제품에서 그대로 쓰고 있다. 이 스택으로 몇 주 안에 MVP를 내고 싶다면 [토리스에 문의](https://toris.kr/contact)하면 된다. 진행 방식은 [toris.kr/process](https://toris.kr/process)에 정리해 두었다.
