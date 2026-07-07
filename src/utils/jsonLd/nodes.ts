import { absoluteUrl, getNodeIds, SITE } from './site';

type JsonLdNode = Record<string, unknown>;

export type BreadcrumbItem = {
  name: string;
  url: string;
};

export function createJsonLdGraph(nodes: JsonLdNode[]): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes
  };
}

export function buildPersonNode(baseUrl: string): JsonLdNode {
  const ids = getNodeIds(baseUrl);

  return {
    '@type': 'Person',
    '@id': ids.person,
    name: SITE.person.name,
    givenName: SITE.person.givenName,
    alternateName: SITE.person.alternateName,
    url: baseUrl,
    image: SITE.person.image,
    sameAs: [...SITE.person.sameAs],
    jobTitle: SITE.person.jobTitle,
    description: SITE.person.description,
    knowsAbout: [...SITE.person.knowsAbout]
  };
}

export function buildOrganizationNode(baseUrl: string): JsonLdNode {
  const ids = getNodeIds(baseUrl);

  return {
    '@type': 'Organization',
    '@id': ids.organization,
    name: SITE.organization.name,
    alternateName: SITE.organization.alternateName,
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl(baseUrl, SITE.organization.logoPath),
      width: SITE.organization.logoWidth,
      height: SITE.organization.logoHeight
    },
    founder: { '@id': ids.person },
    sameAs: [...SITE.organization.sameAs]
  };
}

export function buildWebSiteNode(
  baseUrl: string,
  variant: 'full' | 'compact' = 'compact'
): JsonLdNode {
  const ids = getNodeIds(baseUrl);

  if (variant === 'compact') {
    return {
      '@type': 'WebSite',
      '@id': ids.website,
      url: baseUrl,
      name: SITE.name
    };
  }

  return {
    '@type': 'WebSite',
    '@id': ids.website,
    url: baseUrl,
    name: SITE.name,
    alternateName: SITE.alternateName,
    description: SITE.description,
    inLanguage: SITE.inLanguage,
    image: absoluteUrl(baseUrl, SITE.imagePath),
    publisher: { '@id': ids.organization },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/posts?search={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
}

export function buildBreadcrumbNode(
  baseUrl: string,
  pageUrl: string,
  items: BreadcrumbItem[]
): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(baseUrl, item.url)
    }))
  };
}

export function buildWebPageNode(
  baseUrl: string,
  options: {
    url: string;
    name: string;
    description?: string;
    type?: 'WebPage' | 'ProfilePage' | 'CollectionPage' | 'ContactPage';
    mainEntityId?: string;
    aboutId?: string;
    breadcrumbId?: string;
  }
): JsonLdNode {
  const ids = getNodeIds(baseUrl);
  const pageId = `${options.url}#webpage`;

  const node: JsonLdNode = {
    '@type': options.type ?? 'WebPage',
    '@id': pageId,
    url: options.url,
    name: options.name,
    isPartOf: { '@id': ids.website },
    inLanguage: SITE.inLanguage
  };

  if (options.description) {
    node.description = options.description;
  }

  if (options.mainEntityId) {
    node.mainEntity = { '@id': options.mainEntityId };
  }

  if (options.aboutId) {
    node.about = { '@id': options.aboutId };
  }

  if (options.breadcrumbId) {
    node.breadcrumb = { '@id': options.breadcrumbId };
  }

  return node;
}
