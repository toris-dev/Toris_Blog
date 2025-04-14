import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('preview_image') as File;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size is too large (max 5MB)' },
        { status: 400 }
      );
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type. Only jpg, jpeg, png, and gif are allowed'
        },
        { status: 400 }
      );
    }

    // Get file extension
    const fileExt = file.name.split('.').pop();

    // Create unique filename
    const uniqueFilename = `${randomUUID()}.${fileExt}`;

    // Ensure images directory exists
    const imagesDir = path.join(process.cwd(), 'public', 'images');
    await fs.mkdir(imagesDir, { recursive: true });

    // Save file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const filePath = path.join(imagesDir, uniqueFilename);
    await fs.writeFile(filePath, buffer);

    // Return URL for the saved image
    const preview_image_url = `/images/${uniqueFilename}`;

    return NextResponse.json({ preview_image_url });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
