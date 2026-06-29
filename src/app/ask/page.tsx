import { AskPageClient } from './_components/AskPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ask',
  description: 'Private second-brain document search',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  }
};

export default function AskPage() {
  return <AskPageClient />;
}
