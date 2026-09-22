import { toParagraphs } from '@/lib/format';

/**
 * Renders stored plain text as set paragraphs. The first paragraph can carry a
 * drop cap, which is what gives the feed its literary magazine feel.
 */
export default function ArticleText({ content, dropCap = false, className = '' }) {
  const paragraphs = toParagraphs(content);
  if (paragraphs.length === 0) return null;

  return (
    <div className={`post-body ${className}`}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={index === 0 && dropCap ? 'drop-cap' : undefined}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}
