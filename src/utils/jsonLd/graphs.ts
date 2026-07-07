import {
  buildBreadcrumbNode,
  buildOrganizationNode,
  buildPersonNode,
  buildWebPageNode,
  buildWebSiteNode,
  createJsonLdGraph,
  type BreadcrumbItem
} from './nodes';
import { absoluteUrl, getBaseUrl, getNodeIds, SITE } from './site';

export type ArticleStructuredData = {
  title: string;
  description: string;
  image: string;
  publishedAt: string;
  modifiedAt?: string;
  url: string;
  tags?: string[];
  category?: string;
  wordCount?: number;
};

export type CollectionStructuredData = {
  url: string;
  name: string;
  description: string;
};

export type SoftwareStructuredData = {
  url: string;
  name: string;
  description: string;
  applicationCategory?: string;
  sameAs?: string[];
};

export function buildGlobalGraph() {
  const baseUrl = getBaseUrl();

  return createJsonLdGraph([
    buildPersonNode(baseUrl),
    buildOrganizationNode(baseUrl),
    buildWebSiteNode(baseUrl, 'compact')
  ]);
}

export function buildHomeGraph() {
  const baseUrl = getBaseUrl();
  const ids = getNodeIds(baseUrl);
  const pageUrl = baseUrl;

  return createJsonLdGraph([
    buildPersonNode(baseUrl),
    buildOrganizationNode(baseUrl),
    buildWebSiteNode(baseUrl, 'full'),
    buildWebPageNode(baseUrl, {
      url: pageUrl,
      name: SITE.name,
      description: SITE.description,
      type: 'ProfilePage',
      mainEntityId: ids.person
    })
  ]);
}

export function buildAboutGraph(breadcrumb?: BreadcrumbItem[]) {
  const baseUrl = getBaseUrl();
  const ids = getNodeIds(baseUrl);
  const pageUrl = `${baseUrl}/about`;
  const breadcrumbId = breadcrumb?.length
    ? `${pageUrl}#breadcrumb`
    : undefined;

  const nodes = [
    buildPersonNode(baseUrl),
    buildOrganizationNode(baseUrl),
    buildWebSiteNode(baseUrl, 'compact'),
    buildWebPageNode(baseUrl, {
      url: pageUrl,
      name: '소개 - 풀스택 웹 개발자 토리스',
      description:
        '풀스택 웹 개발자 토리스를 소개합니다. React, Next.js, TypeScript, Node.js를 주력으로 하는 개발자의 경력, 기술 스택, 프로젝트 경험을 확인하세요.',
      type: 'ProfilePage',
      mainEntityId: ids.person,
      breadcrumbId
    })
  ];

  if (breadcrumb?.length) {
    nodes.push(buildBreadcrumbNode(baseUrl, pageUrl, breadcrumb));
  }

  return createJsonLdGraph(nodes);
}

export function buildBlogListingGraph(breadcrumb?: BreadcrumbItem[]) {
  const baseUrl = getBaseUrl();
  const ids = getNodeIds(baseUrl);
  const pageUrl = `${baseUrl}${SITE.blog.path}`;
  const breadcrumbId = breadcrumb?.length
    ? `${pageUrl}#breadcrumb`
    : undefined;

  const nodes = [
    buildPersonNode(baseUrl),
    buildOrganizationNode(baseUrl),
    buildWebSiteNode(baseUrl, 'compact'),
    {
      '@type': 'Blog',
      '@id': ids.blog,
      url: pageUrl,
      name: SITE.blog.name,
      description: SITE.blog.description,
      inLanguage: SITE.inLanguage,
      author: { '@id': ids.person },
      publisher: { '@id': ids.organization },
      license: SITE.license
    },
    buildWebPageNode(baseUrl, {
      url: pageUrl,
      name: 'toris-dev 작성글 - 웹 개발 기술 아티클',
      description:
        '토리스의 웹 개발 기술 블로그 포스트 모음입니다. React, Next.js, TypeScript, JavaScript 등 최신 웹 개발 기술과 실무 경험을 공유합니다.',
      type: 'CollectionPage',
      aboutId: ids.person,
      breadcrumbId
    })
  ];

  if (breadcrumb?.length) {
    nodes.push(buildBreadcrumbNode(baseUrl, pageUrl, breadcrumb));
  }

  return createJsonLdGraph(nodes);
}

export function buildCollectionGraph(
  data: CollectionStructuredData,
  breadcrumb?: BreadcrumbItem[]
) {
  const baseUrl = getBaseUrl();
  const ids = getNodeIds(baseUrl);
  const pageUrl = data.url;
  const breadcrumbId = breadcrumb?.length
    ? `${pageUrl}#breadcrumb`
    : undefined;

  const nodes = [
    buildPersonNode(baseUrl),
    buildOrganizationNode(baseUrl),
    buildWebSiteNode(baseUrl, 'compact'),
    buildWebPageNode(baseUrl, {
      url: pageUrl,
      name: data.name,
      description: data.description,
      type: 'CollectionPage',
      aboutId: ids.person,
      breadcrumbId
    })
  ];

  if (breadcrumb?.length) {
    nodes.push(buildBreadcrumbNode(baseUrl, pageUrl, breadcrumb));
  }

  return createJsonLdGraph(nodes);
}

export function buildArticleGraph(
  data: ArticleStructuredData,
  breadcrumb?: BreadcrumbItem[]
) {
  const baseUrl = getBaseUrl();
  const ids = getNodeIds(baseUrl);
  const pageUrl = data.url;
  const breadcrumbId = breadcrumb?.length
    ? `${pageUrl}#breadcrumb`
    : undefined;
  const tags = data.tags?.filter(Boolean) ?? [];

  const nodes = [
    buildPersonNode(baseUrl),
    buildOrganizationNode(baseUrl),
    buildWebSiteNode(baseUrl, 'compact'),
    buildWebPageNode(baseUrl, {
      url: pageUrl,
      name: data.title,
      description: data.description,
      breadcrumbId
    }),
    {
      '@type': 'BlogPosting',
      '@id': `${pageUrl}#article`,
      headline: data.title,
      description: data.description,
      image: data.image,
      datePublished: data.publishedAt,
      dateModified: data.modifiedAt ?? data.publishedAt,
      author: { '@id': ids.person },
      publisher: { '@id': ids.organization },
      mainEntityOfPage: { '@id': `${pageUrl}#webpage` },
      url: pageUrl,
      inLanguage: SITE.inLanguage,
      license: SITE.license,
      ...(tags.length > 0 ? { keywords: tags.join(', ') } : {}),
      ...(data.category ? { articleSection: data.category } : {}),
      ...(data.wordCount ? { wordCount: data.wordCount } : {}),
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['article h1', 'article .prose p']
      },
      isAccessibleForFree: true,
      genre: data.category ?? 'Technology'
    }
  ];

  if (breadcrumb?.length) {
    nodes.push(buildBreadcrumbNode(baseUrl, pageUrl, breadcrumb));
  }

  return createJsonLdGraph(nodes);
}

export function buildSoftwareGraph(
  data: SoftwareStructuredData,
  breadcrumb?: BreadcrumbItem[]
) {
  const baseUrl = getBaseUrl();
  const ids = getNodeIds(baseUrl);
  const pageUrl = data.url;
  const breadcrumbId = breadcrumb?.length
    ? `${pageUrl}#breadcrumb`
    : undefined;

  const nodes = [
    buildPersonNode(baseUrl),
    buildOrganizationNode(baseUrl),
    buildWebSiteNode(baseUrl, 'compact'),
    buildWebPageNode(baseUrl, {
      url: pageUrl,
      name: data.name,
      description: data.description,
      breadcrumbId
    }),
    {
      '@type': 'WebApplication',
      '@id': `${pageUrl}#software`,
      name: data.name,
      description: data.description,
      url: pageUrl,
      applicationCategory:
        data.applicationCategory ?? 'ProductivityApplication',
      operatingSystem: 'Web',
      author: { '@id': ids.person },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'KRW'
      },
      ...(data.sameAs?.length ? { sameAs: data.sameAs } : {})
    }
  ];

  if (breadcrumb?.length) {
    nodes.push(buildBreadcrumbNode(baseUrl, pageUrl, breadcrumb));
  }

  return createJsonLdGraph(nodes);
}

export function buildWebPageGraph(
  data: CollectionStructuredData,
  breadcrumb?: BreadcrumbItem[],
  pageType: 'WebPage' | 'ContactPage' = 'WebPage'
) {
  const baseUrl = getBaseUrl();
  const pageUrl = data.url;
  const breadcrumbId = breadcrumb?.length
    ? `${pageUrl}#breadcrumb`
    : undefined;

  const nodes = [
    buildPersonNode(baseUrl),
    buildOrganizationNode(baseUrl),
    buildWebSiteNode(baseUrl, 'compact'),
    buildWebPageNode(baseUrl, {
      url: pageUrl,
      name: data.name,
      description: data.description,
      type: pageType,
      breadcrumbId
    })
  ];

  if (breadcrumb?.length) {
    nodes.push(buildBreadcrumbNode(baseUrl, pageUrl, breadcrumb));
  }

  return createJsonLdGraph(nodes);
}
