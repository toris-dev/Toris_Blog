import { createClient } from '@/utils/supabase/server';
import { NextRequest } from 'next/server';

// export async function GET(request: NextRequest) {
//   try {

//   } catch (error) {
//     return NextResponse.json({ message: error }, { status: 404 });
//   }
// }

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
      return Response.json({ message: error }, { status: 404 });
    }
    return Response.json(data[0]);
  } catch (error) {
    return Response.json({ message: '댓글이 없습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { comment_id, writer_id, password } = await request.json();
    const { data } = await supabase
      .from('Comments')
      .delete()
      .match({
        id: Number(comment_id),
        password: password
      })
      .select('*');
    if (data?.length !== 1) {
      return Response.json({
        message: '댓글을 삭제하지 못했습니다.',
        error: true
      });
    }
    return Response.json(data[0]);
  } catch (error) {
    return Response.json(
      { message: '댓글을 삭제하지 못했습니다.', error: true },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const { id, pwd, content } = await request.json();
    const { data, error } = await supabase
      .from('Comments')
      .update({ content })
      .match({ writer_id: id, password: pwd })
      .select('*');

    if (error) {
      return Response.json({ message: error }, { status: 404 });
    }
    return Response.json(data[0]);
  } catch (error) {
    Response.json(
      {
        message: '댓글을 업데이트 하지 못했습니다.'
      },
      { status: 404 }
    );
  }
}
