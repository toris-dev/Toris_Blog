import {
  buildAboutGraph,
  buildArticleGraph,
  buildBlogListingGraph,
  buildCollectionGraph,
  buildGlobalGraph,
  buildHomeGraph,
  buildSoftwareGraph,
  buildWebPageGraph,
  type ArticleStructuredData,
  type BreadcrumbItem,
  type CollectionStructuredData,
  type SoftwareStructuredData
} from '@/utils/jsonLd';

export type StructuredDataPage =
  | 'global'
  | 'home'
  | 'about'
  | 'blog-listing'
  | 'collection'
  | 'article'
  | 'software'
  | 'webpage'
  | 'contact';

interface StructuredDataProps {
  page: StructuredDataPage;
  data?: ArticleStructuredData | CollectionStructuredData | SoftwareStructuredData;
  breadcrumb?: BreadcrumbItem[];
}

/**
 * SEO / AEO / GEO를 위한 JSON-LD 구조화 데이터 (@graph)
 * 단일 페이지 스크래퍼·LLM을 위해 Person 노드는 각 그래프에 포함합니다.
 */
const StructuredData = ({ page, data, breadcrumb }: StructuredDataProps) => {
  const getGraph = () => {
    switch (page) {
      case 'global':
        return buildGlobalGraph();
      case 'home':
        return buildHomeGraph();
      case 'about':
        return buildAboutGraph(breadcrumb);
      case 'blog-listing':
        return buildBlogListingGraph(breadcrumb);
      case 'collection':
        return buildCollectionGraph(
          data as CollectionStructuredData,
          breadcrumb
        );
      case 'article':
        return buildArticleGraph(data as ArticleStructuredData, breadcrumb);
      case 'software':
        return buildSoftwareGraph(data as SoftwareStructuredData, breadcrumb);
      case 'contact':
        return buildWebPageGraph(
          data as CollectionStructuredData,
          breadcrumb,
          'ContactPage'
        );
      case 'webpage':
        return buildWebPageGraph(
          data as CollectionStructuredData,
          breadcrumb,
          'WebPage'
        );
      default:
        return null;
    }
  };

  const graph = getGraph();
  if (!graph) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(graph)
      }}
    />
  );
};

export default StructuredData;
