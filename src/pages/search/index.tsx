import dynamic from 'next/dynamic';

// lazy loading
const SearchPage = dynamic(() => import('@/components/SearchPage'), {
  ssr: false
});

const Search = () => <SearchPage />;

export default Search;
