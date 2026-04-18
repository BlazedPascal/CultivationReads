import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api.js';
import ChapterReader from '../components/ChapterReader.jsx';
import { useReadingProgress, useScrollProgress } from '../hooks/useReadingProgress.js';

export default function ChapterPage() {
  const { slug, chapterSlug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { save } = useReadingProgress(slug);

  useEffect(() => {
    setLoading(true);
    window.scrollTo(0, 0);
    api.getChapter(slug, chapterSlug)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug, chapterSlug]);

  useScrollProgress(chapterSlug, save);

  if (loading) return <div className="loading-spinner" />;
  if (!data) return <div className="error-page"><h1>Chapter not found</h1></div>;

  const pageTitle = `Chapter ${data.chapter.chapter_number}${data.chapter.title ? ` - ${data.chapter.title}` : ''} - ${data.novel.title} | CultivationReads`;

  return (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content={`Read ${data.novel.title} Chapter ${data.chapter.chapter_number} in English translation on CultivationReads.`} />
      <ChapterReader
        novelSlug={slug}
        chapter={data.chapter}
        prev={data.prev}
        next={data.next}
        novelTitle={data.novel.title}
      />
    </>
  );
}
