import { PostRequest } from '@/types';
import { createClient } from '@/utils/supabase/server';
import dayjs from 'dayjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(cookies());

    const formEntries = Array.from((await request.formData()).entries());

    const formData = formEntries.reduce<Record<string, FormDataEntryValue>>(
      (acc, [key, value]) => {
        acc[key] = value;
        return acc;
      },
      {}
    );
    const { preview_image } = formData as unknown as Omit<
      PostRequest,
      'preview_image_url'
    > & {
      preview_image?: File;
    };
    let preview_image_url: string | null = null;
    if (preview_image) {
      const fileName = `${preview_image.name}_${dayjs(new Date(new Date())).format('YYMMDDHHmmss')}`; // 파일명 isValid 영단어 제외x https://github.com/supabase/storage/issues/273
      const { data: uploadData, error } = await supabase.storage
        .from('blog-image')
        .upload(fileName, preview_image, {
          contentType: preview_image.type ?? undefined
        });
      if (error) {
        return Response.json({ error }, { status: 403 });
      }
      if (uploadData?.path) {
        const { data } = supabase.storage
          .from('blog-image')
          .getPublicUrl(uploadData.path);
        preview_image_url = data.publicUrl;
      }
    }
    return Response.json({ preview_image_url }, { status: 200 });
  } catch (error) {
    return Response.json({ error: '이미지 URL 반환 실패' }, { status: 500 });
  }
}
