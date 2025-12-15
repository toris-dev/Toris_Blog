'use client';

import Script from 'next/script';

interface StructuredDataProps {
  type?:
    | 'website'
    | 'blog'
    | 'article'
    | 'person'
    | 'organization'
    | 'breadcrumb';
  data?: any;
}

const StructuredData = ({ type = 'website', data }: StructuredDataProps) => {
  const getStructuredData = () => {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app';

    switch (type) {
      case 'website':
        return {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: '토리스 블로그',
          url: baseUrl,
          description:
            '풀스택 웹 개발자 토리스의 기술 블로그입니다. React, Next.js, TypeScript, Node.js 등 웹 개발 기술과 프로젝트 경험을 공유합니다.',
          inLanguage: 'ko-KR',
          potentialAction: {
            '@type': 'SearchAction',
            target: `${baseUrl}/posts?search={search_term_string}`,
            'query-input': 'required name=search_term_string'
          },
          publisher: {
            '@type': 'Person',
            name: '토리스',
            url: 'https://github.com/toris-dev'
          }
        };

      case 'blog':
        return {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: '토리스 블로그',
          url: `${baseUrl}/posts`,
          description: '웹 개발 기술과 프로젝트 경험을 공유하는 기술 블로그',
          inLanguage: 'ko-KR',
          author: {
            '@type': 'Person',
            name: '토리스',
            url: 'https://github.com/toris-dev',
            sameAs: ['https://github.com/toris-dev']
          },
          publisher: {
            '@type': 'Person',
            name: '토리스',
            url: 'https://github.com/toris-dev'
          }
        };

      case 'person':
        return {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: '토리스',
          givenName: '토리스',
          url: baseUrl,
          sameAs: ['https://github.com/toris-dev'],
          jobTitle: 'Full Stack Developer',
          description:
            '풀스택 웹 개발자로 React, Next.js, TypeScript, Node.js를 주로 사용합니다.',
          knowsAbout: [
            'Web Development',
            'React',
            'Next.js',
            'TypeScript',
            'JavaScript',
            'Node.js',
            'Frontend Development',
            'Backend Development'
          ]
        };

      case 'organization':
        return {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: '토리스 블로그',
          url: baseUrl,
          logo: `${baseUrl}/images/logo.png`,
          description: '웹 개발 기술과 프로젝트 경험을 공유하는 기술 블로그',
          foundingDate: '2024',
          founder: {
            '@type': 'Person',
            name: '토리스'
          }
        };

      case 'article':
        const tags = Array.isArray(data?.tags)
          ? data.tags
          : typeof data?.tags === 'string'
            ? data.tags.split(',').map((t: string) => t.trim())
            : [];

        return {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: data?.title || '',
          description: data?.description || '',
          image: data?.image
            ? Array.isArray(data.image)
              ? data.image[0]
              : data.image
            : `${baseUrl}/images/og-image.png`,
          datePublished: data?.publishedAt || data?.datePublished || '',
          dateModified: data?.modifiedAt || data?.datePublished || '',
          author: {
            '@type': 'Person',
            name: '토리스',
            url: 'https://github.com/toris-dev',
            sameAs: ['https://github.com/toris-dev']
          },
          publisher: {
            '@type': 'Person',
            name: '토리스',
            url: 'https://github.com/toris-dev'
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': data?.url || baseUrl
          },
          url: data?.url || baseUrl,
          inLanguage: 'ko-KR',
          keywords: tags.length > 0 ? tags.join(', ') : data?.keywords || [],
          articleSection: data?.category || 'Technology',
          wordCount: data?.wordCount || undefined,
          ...data
        };

      case 'breadcrumb':
        const items = data?.items || [];

        return {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items.map(
            (item: { name: string; url: string }, index: number) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: item.name,
              item: item.url.startsWith('http')
                ? item.url
                : `${baseUrl}${item.url}`
            })
          )
        };

      default:
        return null;
    }
  };

  const structuredData = getStructuredData();

  if (!structuredData) return null;

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData)
      }}
    />
  );
};

export default StructuredData;
