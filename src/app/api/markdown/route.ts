import { isAuthenticated } from '@/utils/auth';
import { OWNER, REPO, USE_MOCK_DATA, getOctokit } from '@/utils/github';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

const OBSIDIAN_OWNER = 'toris-dev';
const OBSIDIAN_REPO = 'obsidian_note';

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
tags: [${tagsStr}]
---

${content}`;

    // GitHub 이슈 생성 및 커밋 처리
    let issueNumber: number | null = null;
    let issueUrl: string | null = null;
    let commitUrl: string | null = null;

    if (!USE_MOCK_DATA) {
      try {
        const octokit = getOctokit();

        // 1. GitHub 이슈 생성 (기존 블로그 레포에)
        const tagsFormatted = tagsStr ? `\n\n**태그**: \`${tagsStr}\`` : '';
        const categoryFormatted = `\n\n**카테고리**: \`${category}\``;
        const issueBody = `새 블로그 글이 작성되었습니다.${categoryFormatted}${tagsFormatted}\n\n${content.substring(
          0,
          500
        )}${content.length > 500 ? '...' : ''}`;

        const issueResponse = await octokit.rest.issues.create({
          owner: OWNER, // toris-dev/torisblog
          repo: REPO,
          title: `[게시글] ${title}`,
          body: issueBody,
          labels: ['blog-post', 'article']
        });

        if (issueResponse.status === 201) {
          issueNumber = issueResponse.data.number;
          issueUrl = issueResponse.data.html_url;
        }

        // 2. obsidian_note 리포지토리에 파일 생성
        const filePath = `${category}/${slug}.md`;
        const commitResponse =
          await octokit.rest.repos.createOrUpdateFileContents({
            owner: OBSIDIAN_OWNER,
            repo: OBSIDIAN_REPO,
            path: filePath,
            message: `New post: ${title} (Closes #${issueNumber})`,
            content: Buffer.from(metadataContent).toString('base64'),
            branch: 'main'
          });

        commitUrl = commitResponse.data.commit.html_url || null;

        console.log('Blog post committed to obsidian_note:', commitUrl);
      } catch (githubError) {
        console.error('Error integrating with GitHub:', githubError);
        // GitHub 관련 오류가 발생해도 로컬 처리 없이 오류 응답 반환
        return NextResponse.json(
          { error: 'Failed to integrate with GitHub' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      slug,
      filePath: `/${category}/${slug}.md`,
      issueNumber,
      issueUrl,
      commitUrl
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
