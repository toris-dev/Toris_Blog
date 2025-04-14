import { isAuthenticated } from '@/utils/auth';
import { OWNER, REPO, USE_MOCK_DATA, getOctokit } from '@/utils/github';
import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function POST(request: NextRequest) {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const category = (formData.get('category') as string) || 'Uncategorized';
    const tagsStr = (formData.get('tags') as string) || '';

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Create a slug from the title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Add metadata to the markdown content
    const timestamp = new Date().toISOString();
    const metadataContent = `---
title: ${title}
date: ${timestamp}
slug: ${slug}
category: ${category}
tags: ${tagsStr}
---

${content}`;

    // Ensure the directory exists
    const markdownDir = path.join(process.cwd(), 'public', 'markdown');
    await fs.mkdir(markdownDir, { recursive: true });

    // Write the file
    const filePath = path.join(markdownDir, `${slug}.md`);
    await fs.writeFile(filePath, metadataContent, 'utf-8');

    // GitHub 이슈 생성 및 커밋 처리
    let issueNumber: number | null = null;
    let issueUrl: string | null = null;

    if (!USE_MOCK_DATA) {
      try {
        const octokit = getOctokit();

        // 1. GitHub 이슈 생성
        const tagsFormatted = tagsStr ? `\n\n**태그**: \`${tagsStr}\`` : '';
        const categoryFormatted = `\n\n**카테고리**: \`${category}\``;
        const issueBody = `새 블로그 글이 작성되었습니다.${categoryFormatted}${tagsFormatted}\n\n${content.substring(0, 500)}${content.length > 500 ? '...' : ''}`;

        const issueResponse = await octokit.rest.issues.create({
          owner: OWNER,
          repo: REPO,
          title: `[새 글] ${title}`,
          body: issueBody,
          labels: ['blog-post', 'article']
        });

        if (issueResponse.status === 201) {
          issueNumber = issueResponse.data.number;
          issueUrl = issueResponse.data.html_url;

          // 2. 커밋 생성 시도 (파일 업로드)
          try {
            // 현재 리포지토리의 기본 브랜치 정보 가져오기
            const repoResponse = await octokit.rest.repos.get({
              owner: OWNER,
              repo: REPO
            });

            const defaultBranch = repoResponse.data.default_branch;

            // 파일이 이미 존재하는지 확인하고 SHA 가져오기
            let fileSha = '';
            try {
              const fileResponse = await octokit.rest.repos.getContent({
                owner: OWNER,
                repo: REPO,
                path: `content/${slug}.md`,
                ref: defaultBranch
              });

              if ('sha' in fileResponse.data) {
                fileSha = fileResponse.data.sha;
              }
            } catch (fileError) {
              // 파일이 없는 경우 새로 생성하므로 에러 무시
              console.log('File does not exist yet, creating new file');
            }

            // 파일 생성 또는 업데이트 매개변수
            const commitParams: any = {
              owner: OWNER,
              repo: REPO,
              path: `content/${slug}.md`, // GitHub 리포지토리 내 파일 경로
              message: `New blog post: ${title} (Closes #${issueNumber})`,
              content: Buffer.from(metadataContent).toString('base64'),
              branch: defaultBranch
            };

            // 파일이 이미 있는 경우 SHA 추가
            if (fileSha) {
              commitParams.sha = fileSha;
            }

            // 파일 생성 또는 업데이트 요청
            const commitResponse =
              await octokit.rest.repos.createOrUpdateFileContents(commitParams);

            console.log(
              'Blog post committed to GitHub:',
              commitResponse.data.commit.html_url
            );
          } catch (commitError) {
            // 커밋 에러는 로깅만 하고 계속 진행 (로컬 파일은 이미 저장됨)
            console.error('Error creating commit:', commitError);
          }
        }
      } catch (githubError) {
        // GitHub 관련 오류는 로깅만 하고 마크다운 파일은 로컬에 저장
        console.error('Error integrating with GitHub:', githubError);
      }
    }

    return NextResponse.json({
      success: true,
      slug,
      filePath: `/markdown/${slug}.md`,
      issueNumber,
      issueUrl
    });
  } catch (error) {
    console.error('Error saving markdown file:', error);
    return NextResponse.json(
      { error: 'Failed to save markdown file' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const markdownDir = path.join(process.cwd(), 'public', 'markdown');

    // Create the directory if it doesn't exist
    await fs.mkdir(markdownDir, { recursive: true });

    // Get all markdown files
    const files = await fs.readdir(markdownDir);
    const markdownFiles = files.filter((file) => file.endsWith('.md'));

    // Read the metadata from each file
    const markdownContents = await Promise.all(
      markdownFiles.map(async (file) => {
        const content = await fs.readFile(
          path.join(markdownDir, file),
          'utf-8'
        );

        // Extract metadata
        const metadataMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
        const metadata: Record<string, string> = {};

        if (metadataMatch) {
          const metadataContent = metadataMatch[1];
          const lines = metadataContent.split('\n');

          for (const line of lines) {
            const [key, value] = line.split(': ');
            if (key && value) {
              metadata[key.trim()] = value.trim();
            }
          }
        }

        // Parse tags to array
        let tags: string[] = [];
        if (metadata.tags) {
          tags = metadata.tags.split(',').map((tag) => tag.trim());
        }

        return {
          slug: file.replace('.md', ''),
          filePath: `/markdown/${file}`,
          title: metadata.title || 'Untitled',
          date: metadata.date || new Date().toISOString(),
          category: metadata.category || 'Uncategorized',
          tags,
          content: content.replace(/^---\n[\s\S]*?\n---\n/, '')
        };
      })
    );

    return NextResponse.json(markdownContents);
  } catch (error) {
    console.error('Error listing markdown files:', error);
    return NextResponse.json(
      { error: 'Failed to list markdown files' },
      { status: 500 }
    );
  }
}
