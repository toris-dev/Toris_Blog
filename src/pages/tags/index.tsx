import { useTags } from '@/utils/hooks';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

const supabase = createClient();

const Tag = () => {
  const { data: existingTags } = useTags();

  return (
    <div className="flex flex-col items-center gap-2 px-4 pb-24 pt-20">
      <h1 className="mb-8 text-center text-2xl font-semibold">태그</h1>
      <div className="container flex flex-wrap justify-center gap-2 px-10">
        {existingTags?.map((tag) => (
          <Link
            href={`/tags/${tag}`}
            className="text-xl text-gray-500 underline hover:text-gray-700"
            key={tag}
          >
            {tag}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Tag;
