import { useState } from 'react';
import { Link } from 'react-router-dom';

const FONT_SIZES = [15, 17, 19, 21, 24];

export default function ChapterReader({ novelSlug, chapter, prev, next, novelTitle }) {
  const [fontIdx, setFontIdx] = useState(1);
  const fontSize = FONT_SIZES[fontIdx];

  if (!chapter) return null;

  const paragraphs = (chapter.content_en || '').split(/\n+/).filter(Boolean);

  return (
    <article className="chapter-reader">
      <header className="reader-header">
        <div className="reader-breadcrumb">
          <Link to={`/novels/${novelSlug}`}>{novelTitle}</Link>
          <span> › </span>
          <span>Chapter {chapter.chapter_number}</span>
        </div>
        <h1 className="reader-chapter-title">
          {chapter.title || `Chapter ${chapter.chapter_number}`}
        </h1>
        <div className="reader-controls">
          <span className="font-label">Font</span>
          <button
            className="font-btn"
            disabled={fontIdx === 0}
            onClick={() => setFontIdx((i) => i - 1)}
            aria-label="Decrease font size"
          >A-</button>
          <span className="font-size-display">{fontSize}px</span>
          <button
            className="font-btn"
            disabled={fontIdx === FONT_SIZES.length - 1}
            onClick={() => setFontIdx((i) => i + 1)}
            aria-label="Increase font size"
          >A+</button>
          <span className="word-count">{chapter.word_count?.toLocaleString()} words</span>
        </div>
      </header>

      <div className="reader-content" style={{ fontSize: `${fontSize}px` }}>
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <nav className="reader-nav">
        {prev ? (
          <Link to={`/novels/${novelSlug}/${prev.slug}`} className="reader-nav-btn prev-btn">
            ← Ch. {prev.chapter_number}
          </Link>
        ) : <span />}
        <Link to={`/novels/${novelSlug}`} className="reader-nav-btn index-btn">Chapter List</Link>
        {next ? (
          <Link to={`/novels/${novelSlug}/${next.slug}`} className="reader-nav-btn next-btn">
            Ch. {next.chapter_number} →
          </Link>
        ) : <span />}
      </nav>
    </article>
  );
}
