'use client';

import Button from '@/components/Button';
import Input from '@/components/Input';
import { MarkdownEditor } from '@/components/Markdown';
import { useCategories, useTags } from '@/utils/hooks';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FormEvent, useRef, useState } from 'react';
import { FileDrop } from 'react-file-drop';
import ReactSelect from 'react-select/creatable';
export default function WritePage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [boardColor, setBoardColor] = useState(false);
  const { data: existingCategories } = useTags();
  const { data: existingTags } = useCategories();

  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!titleRef.current?.value || titleRef.current.value.length === 0)
      return alert('제목을 입력해주세요');
    if (category.length === 0) return alert('카테고리를 입력해주세요');
    if (tags.length === 0) return alert('태그를 입력해주세요');
    if (content.length === 0) return alert('본문을 입력해주세요');

    const formData = new FormData();

    formData.append('title', titleRef.current?.value ?? '');
    formData.append('category', category);
    formData.append('tags', tags);
    formData.append('content', content);

    if (fileRef.current?.files?.[0]) {
      formData.append('preview_image', fileRef.current.files[0]);
    }

    const response = await fetch('/api/posts', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (data.id) router.push(`/posts/${data.id}`);
  };
  return (
    <div className="container flex flex-col px-4 pb-20 pt-12">
      <h1 className="mb-8 text-2xl font-medium">새로운 글</h1>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3">
          <Input type="text" placeholder="제목" ref={titleRef} />
          <Input type="file" accept="image/*" ref={fileRef} multiple />
          <ReactSelect
            options={(existingCategories ?? []).map((category) => ({
              label: category,
              value: category
            }))}
            id="long-value-select"
            instanceId="long-value-select"
            inputId="category"
            placeholder="카테고리"
            isMulti={false}
            onChange={(e) => e && setCategory(e?.value)}
          />
          <ReactSelect
            options={(existingTags ?? []).map((tag) => ({
              label: tag,
              value: tag
            }))}
            id="long-value-select"
            inputId="tags"
            instanceId="long-value-select"
            placeholder="태그"
            isMulti
            onChange={(e) =>
              e && setTags(JSON.stringify(e.map((e) => e.value)))
            }
          />
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
          >
            <MarkdownEditor
              height={500}
              value={content}
              onChange={(s) => setContent(s ?? '')}
              style={{
                backgroundColor: boardColor ? '#adb5bd' : '#FFFFFF'
              }}
            />
          </FileDrop>
          <Button type="submit" className="mt-4">
            작성하기
          </Button>
        </div>
      </form>
    </div>
  );
}
