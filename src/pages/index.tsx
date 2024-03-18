import PostList from '@/components/PostList';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

export default function Home() {
  return <PostList />;
}
