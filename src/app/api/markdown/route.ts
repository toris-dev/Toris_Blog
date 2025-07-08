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

const getAllMarkdownFilesFromGitHub = async () => {
  const octokit = getOctokit();

  const repoInfo = await octokit.rest.repos.get({
    owner: OBSIDIAN_OWNER,
    repo: OBSIDIAN_REPO
  });
  const mainBranch = repoInfo.data.default_branch;

  const { data: tree } = await octokit.rest.git.getTree({
    owner: OBSIDIAN_OWNER,
    repo: OBSIDIAN_REPO,
    tree_sha: mainBranch,
    recursive: 'true'
  });

  const markdownFiles = tree.tree.filter(
    (file) =>
      file.path &&
      file.path.endsWith('.md') &&
      file.type === 'blob' &&
      !file.path.includes('.obsidian/') &&
      !file.path.includes('images/') &&
      !file.path.includes('template/')
  );

  const posts = await Promise.all(
    markdownFiles.map(async (file) => {
      try {
        if (!file.path) return null;

        const { data: contentData } = await octokit.rest.repos.getContent({
          owner: OBSIDIAN_OWNER,
          repo: OBSIDIAN_REPO,
          path: file.path
        });

        if ('content' in contentData) {
          const content = Buffer.from(contentData.content, 'base64').toString(
            'utf-8'
          );

          const metadataMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
          const metadata: Record<string, string> = {};

          if (metadataMatch) {
            const metadataContent = metadataMatch[1];
            const lines = metadataContent.split('\n');

            for (const line of lines) {
              const [key, ...valueParts] = line.split(':');
              if (key && valueParts.length > 0) {
                metadata[key.trim()] = valueParts.join(':').trim();
              }
            }
          }

          const pathParts = file.path.split('/');
          const category =
            pathParts.length > 1 ? pathParts[0] : 'Uncategorized';
          const slug = path.basename(file.path, '.md');

          let tags: string[] = [];
          if (metadata.tags) {
            tags = metadata.tags
              .replace(/^\[|\]$/g, '')
              .split(',')
              .map((tag) => tag.trim());
          }

          return {
            slug: slug,
            filePath: `https://github.com/${OBSIDIAN_OWNER}/${OBSIDIAN_REPO}/blob/main/${file.path}`,
            title: metadata.title || 'Untitled',
            date: metadata.date || new Date().toISOString(),
            category: category,
            tags,
            content: content.replace(/^---\n[\s\S]*?\n---\n/, '')
          };
        }
      } catch (error) {
        console.error(`Error fetching or parsing file ${file.path}:`, error);
        return null;
      }
      return null;
    })
  );

  return posts.filter(
    (post): post is NonNullable<typeof post> => post !== null
  );
};

export async function GET(request: NextRequest) {
  try {
    const markdownContents = await getAllMarkdownFilesFromGitHub();
    return NextResponse.json(markdownContents);
  } catch (error) {
    console.error('Error listing markdown files from GitHub:', error);
    return NextResponse.json(
      { error: 'Failed to list markdown files from GitHub' },
      { status: 500 }
    );
  }
}
