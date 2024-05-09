import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { id, pwd, content, postId, parent_comment_id } =
      await request.json();
    const { data, error } = await supabase
      .from('Comments')
      .insert({
        password: pwd,
        content,
        post_id: postId,
        writer_id: id,
        parent_comment_id
      })
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.log(error);
      return NextResponse.json({ message: error }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: '댓글이 없습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { comment_id, writer_id, password } = await request.json();
    const { statusText } = await supabase
      .from('Comments')
      .delete()
      .match({
        id: Number(comment_id),
        writer_id: writer_id,
        password: password
      })
      .select('*');
    if (statusText !== 'OK') {
      return NextResponse.json({ message: '댓글을 삭제하지 못했습니다.' });
    }
    return NextResponse.json({ message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    return NextResponse.json(
      { message: '댓글을 삭제하지 못했습니다.' },
      { status: 500 }
    );
  }
}
