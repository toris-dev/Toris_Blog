import { createClient } from '@/utils/supabase/server';
import { NextRequest } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const { commentId } = await request.json();
    const { data, error } = await supabase.rpc('increment_like', {
      comment_id: commentId
    });
    if (error) {
      return Response.json({ message: error }, { status: 404 });
    }
    return Response.json(data);
  } catch (error) {
    return Response.json(
      { meessage: '좋아요 버튼을 누르지 못했습니다.' },
      { status: 404 }
    );
  }
}
