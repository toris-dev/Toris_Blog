import { getMarkdownFilesFromDisk } from '@/utils/fetch';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const files = await getMarkdownFilesFromDisk();
    const allCategories = files.map((file) => file.category || 'Uncategorized');

    // Return unique categories using Array.filter for compatibility
    const uniqueCategories: string[] = [];
    allCategories.forEach((category) => {
      if (!uniqueCategories.includes(category)) {
        uniqueCategories.push(category);
      }
    });

    return NextResponse.json(uniqueCategories);
  } catch (error) {
    console.error('Error getting categories:', error);
    return NextResponse.json(
      { error: 'Failed to get categories' },
      { status: 500 }
    );
  }
}
