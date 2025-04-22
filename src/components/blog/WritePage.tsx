'use client';

import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FormEvent, KeyboardEvent, useRef, useState } from 'react';
import { FileDrop } from 'react-file-drop';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { MarkdownEditor } from './Markdown';

export default function WritePage() {
  const titleRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);
  const tagsRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [boardColor, setBoardColor] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [issueUrl, setIssueUrl] = useState<string | null>(null);
  const [issueNumber, setIssueNumber] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [content, setContent] = useState('');

  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  // 태그 입력 처리
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);

    // 콤마 입력 시 태그 추가
    if (value.endsWith(',')) {
      const newTag = value.slice(0, -1).trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
        setTagInput('');
      } else {
        setTagInput('');
      }
    }
  };

  // 태그 삭제
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // 엔터 키 이벤트 처리
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // 엔터키 눌렀을 때
    if (e.key === 'Enter') {
      e.preventDefault(); // 폼 제출 방지

      // 태그 입력 필드에서 엔터 키 눌렀을 때 태그 추가
      if (e.currentTarget === tagsRef.current && tagInput.trim()) {
        if (!tags.includes(tagInput.trim())) {
          setTags([...tags, tagInput.trim()]);
          setTagInput('');
        }
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!titleRef.current?.value || titleRef.current.value.length === 0)
      return alert('제목을 입력해주세요');
    if (content.length === 0) return alert('본문을 입력해주세요');

    setSubmitting(true);
    setIssueUrl(null);
    setIssueNumber(null);

    // Save as markdown file
    const formData = new FormData();
    formData.append('title', titleRef.current?.value ?? '');
    formData.append('content', content);
    formData.append('category', categoryRef.current?.value ?? 'Uncategorized');
    formData.append('tags', tags.join(','));

    try {
      const response = await fetch('/api/markdown', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save markdown');
      }

      const data = await response.json();

      // 이슈 URL과 번호 저장
      if (data.issueUrl) {
        setIssueUrl(data.issueUrl);

        // GitHub 이슈 URL에서 이슈 번호 추출
        const issueMatch = data.issueUrl.match(/\/issues\/(\d+)$/);
        if (issueMatch && issueMatch[1]) {
          const extractedIssueNumber = parseInt(issueMatch[1], 10);
          setIssueNumber(extractedIssueNumber);

          // 서버에 이슈 번호 연결 요청 보내기 (선택적)
          try {
            await fetch('/api/linkIssue', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                slug: data.slug,
                issueNumber: extractedIssueNumber
              })
            });
          } catch (linkError) {
            console.error('이슈 번호 연결 실패:', linkError);
            // 실패해도 계속 진행
          }
        }
      }

      alert('마크다운 파일이 성공적으로 저장되었습니다.');

      // 3초 후에 새 글 페이지로 이동
      setTimeout(() => {
        // 이슈 번호가 있으면 쿼리 파라미터로 포함시켜 전달
        const url = issueNumber
          ? `/markdown/${data.slug}?issueNumber=${issueNumber}`
          : `/markdown/${data.slug}`;
        router.push(url);
      }, 3000);
    } catch (error) {
      console.error('Error saving markdown:', error);
      alert('마크다운 파일 저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container flex items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // useAuth 훅에서 자동으로 로그인 페이지로 리다이렉트
  }

  return (
    <div className="container flex flex-col px-4 pb-20 pt-12">
      <h1 className="mb-8 text-2xl font-medium">새로운 글</h1>
      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3">
          <Input
            type="text"
            placeholder="제목"
            ref={titleRef}
            onKeyDown={handleKeyDown}
          />

          <Input
            type="text"
            placeholder="카테고리"
            ref={categoryRef}
            onKeyDown={handleKeyDown}
          />

          <div className="relative">
            <Input
              type="text"
              placeholder="태그 (쉼표로 구분, 예: JavaScript, React, NextJS)"
              ref={tagsRef}
              value={tagInput}
              onChange={handleTagInputChange}
              onKeyDown={handleKeyDown}
            />
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    {tag}
                    <button
                      type="button"
                      className="ml-1 text-sm"
                      onClick={() => removeTag(tag)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <FileDrop
            onDragOver={(event) => {
              setBoardColor(true);
            }}
            onDragLeave={(event) => {
              setBoardColor(false);
            }}
            onDrop={(files, event) => {
              if (!files) return;
              const formdata = new FormData();
              formdata.append('preview_image', files[0]);
              const headers = { 'Content-Type': files[0].type };
              if (files[0].size >= 5000000) {
                alert('5MB 이상 파일은 업로드가 불가능합니다.');
              } else if (
                files[0].type == 'image/png' ||
                files[0].type == 'image/jpeg' ||
                files[0].type == 'image/jpg' ||
                files[0].type == 'image/gif'
              ) {
                axios
                  .post('/api/posts/image', formdata, { headers })
                  .then(function (response) {
                    let { preview_image_url, error } = response.data;
                    if (error) {
                      alert('이미지 올리기 실패!');
                    }
                    let newValue =
                      content +
                      '\n\n ![' +
                      files[0].name +
                      '](' +
                      preview_image_url +
                      ')';
                    setContent(newValue);
                  });
              } else {
                alert('png, jpg, jpeg,gif 파일이 아닙니다.');
              }

              setBoardColor(false);
            }}
            className={boardColor ? 'border-blue-500' : ''}
          >
            <div className="min-h-96 w-full">
              <MarkdownEditor
                height="500"
                value={content}
                onChange={(s) => {
                  setContent(s ?? '');
                }}
              />
            </div>
          </FileDrop>

          {issueUrl && (
            <div className="mt-2 rounded-md bg-green-50 p-4 text-green-700">
              <p className="mb-2">
                ✅ 글이 성공적으로 저장되었으며 GitHub 이슈가 생성되었습니다.
                {issueNumber && ` (이슈 번호: #${issueNumber})`}
              </p>
              <p>
                <a
                  href={issueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-green-800 underline hover:text-green-900"
                >
                  GitHub 이슈 보기 →
                </a>
              </p>
              <p className="mt-2 text-sm">
                잠시 후 새 글 페이지로 이동합니다...
              </p>
            </div>
          )}

          <Button type="submit" className="mt-4" disabled={submitting}>
            {submitting ? '저장 중...' : '마크다운 파일로 저장'}
          </Button>
        </div>
      </form>
    </div>
  );
}
