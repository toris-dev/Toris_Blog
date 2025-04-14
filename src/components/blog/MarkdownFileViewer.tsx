'use client';

import React, { useEffect, useState } from 'react';
import GitHubComments from '../comments/GitHubComments';
import { MarkdownViewer } from './Markdown';

interface MarkdownFileViewerProps {
  slug: string;
}

interface Metadata {
  title: string;
  date: string;
  slug: string;
}

const MarkdownFileViewer: React.FC<MarkdownFileViewerProps> = ({ slug }) => {
  const [content, setContent] = useState<string>('');
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarkdownFile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/markdown/${slug}.md`);

        if (!response.ok) {
          throw new Error('Failed to load markdown file');
        }

        const text = await response.text();

        // Extract metadata from frontmatter
        const metadataMatch = text.match(/^---\n([\s\S]*?)\n---\n/);
        let parsedMetadata: Metadata | null = null;
        let contentWithoutMetadata = text;

        if (metadataMatch) {
          const metadataContent = metadataMatch[1];
          const metadataObj: Record<string, string> = {};
          const lines = metadataContent.split('\n');

          for (const line of lines) {
            const [key, value] = line.split(': ');
            if (key && value) {
              metadataObj[key.trim()] = value.trim();
            }
          }

          parsedMetadata = {
            title: metadataObj.title || 'Untitled',
            date: metadataObj.date || new Date().toISOString(),
            slug: metadataObj.slug || slug
          };

          // Remove metadata from content
          contentWithoutMetadata = text.replace(/^---\n[\s\S]*?\n---\n/, '');
        }

        setMetadata(parsedMetadata);
        setContent(contentWithoutMetadata);
        setError(null);
      } catch (err) {
        console.error('Error loading markdown file:', err);
        setError('Failed to load markdown file');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchMarkdownFile();
    }
  }, [slug]);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="container my-8 flex flex-col gap-8 rounded-3xl bg-white p-12 shadow-2xl">
      {metadata && (
        <>
          <h1 className="text-4xl font-bold">{metadata.title}</h1>
          <div className="text-sm text-gray-500">
            {new Date(metadata.date).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <hr />
        </>
      )}

      <MarkdownViewer value={content} />

      {metadata && (
        <>
          <hr />
          <h2 className="text-2xl font-bold">댓글</h2>
          <GitHubComments slug={metadata.slug} title={metadata.title} />
        </>
      )}
    </div>
  );
};

export default MarkdownFileViewer;
