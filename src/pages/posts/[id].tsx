import { createClient } from '@/utils/supabase/server';
import { GetServerSideProps } from 'next';

type PostProps = {
  id: string;
};

export default function Post({ id }: PostProps) {
  return <div className="flex">Post: {id}</div>;
}

export const getServerSideProps: GetServerSideProps = async ({
  query,
  req
}) => {
  const { id } = query;
  const supabase = createClient(req.cookies);
  const res = await supabase.from('Post').select('*');
  console.log(res);
  return {
    props: {
      id
    }
  };
};
