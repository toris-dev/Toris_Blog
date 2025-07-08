import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getOctokit } from '@/utils/github';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

const OBSIDIAN_OWNER = 'toris-dev';
const OBSIDIAN_REPO = 'obsidian_note';

async function getFileFromGithub(slug: string) {
  const octokit = getOctokit();
  try {
    const { data: tree } = await octokit.rest.git.getTree({
      owner: OBSIDIAN_OWNER,
      repo: OBSIDIAN_REPO,
      tree_sha: 'main',
      recursive: 'true'
    });

    const file = tree.tree.find(
      (f) => f.path && path.basename(f.path, '.md') === slug
    );

    if (!file || !file.path) {
      return null;
    }

    const { data: contentData } = await octokit.rest.repos.getContent({
      owner: OBSIDIAN_OWNER,
      repo: OBSIDIAN_REPO,
      path: file.path
    });

    if ('content' in contentData) {
      const content = Buffer.from(contentData.content, 'base64').toString(
        'utf-8'
      );
      return { file, content };
    }
    return null;
  } catch (error) {
    console.error('Error fetching file from GitHub:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const fileData = await getFileFromGithub(params.slug);

    if (!fileData) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    return NextResponse.json(fileData.content);
  } catch (error) {
    console.error(`Error fetching post ${params.slug}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch post ${params.slug}` },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.login !== 'toris-dev') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const octokit = getOctokit();
  const { content } = await request.json();

  try {
    const fileData = await getFileFromGithub(params.slug);
    if (!fileData || !fileData.file.path) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: OBSIDIAN_OWNER,
      repo: OBSIDIAN_REPO,
      path: fileData.file.path,
      message: `Update ${params.slug}`,
      content: Buffer.from(content).toString('base64'),
      sha: fileData.file.sha
    });

    return NextResponse.json({ message: 'File updated successfully' });
  } catch (error) {
    console.error('Error updating file on GitHub:', error);
    return NextResponse.json(
      { error: 'Failed to update file on GitHub' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.login !== 'toris-dev') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const octokit = getOctokit();

  try {
    const fileData = await getFileFromGithub(params.slug);
    if (!fileData || !fileData.file.path) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    await octokit.rest.repos.deleteFile({
      owner: OBSIDIAN_OWNER,
      repo: OBSIDIAN_REPO,
      path: fileData.file.path,
      message: `Delete ${params.slug}`,
      sha: fileData.file.sha!
    });

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file from GitHub:', error);
    return NextResponse.json(
      { error: 'Failed to delete file from GitHub' },
      { status: 500 }
    );
  }
}
