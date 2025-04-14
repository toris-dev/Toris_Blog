import { getMarkdownFilesFromDisk } from '@/utils/fetch';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const files = await getMarkdownFilesFromDisk();
    const allTags = files.flatMap((file) => file.tags || []);

    // Return unique tags without using Set
    const uniqueTags: string[] = [];
    allTags.forEach((tag) => {
      if (!uniqueTags.includes(tag)) {
        uniqueTags.push(tag);
      }
    });

    return NextResponse.json(uniqueTags);
  } catch (error) {
    console.error('Error getting tags:', error);
    return NextResponse.json({ error: 'Failed to get tags' }, { status: 500 });
  }
}
