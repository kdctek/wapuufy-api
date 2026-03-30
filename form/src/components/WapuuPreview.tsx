interface Props {
  imageUrl?: string;
  name: string;
  authorName: string;
  authorUrl: string;
  description: string;
  event?: string;
  tags?: string;
}

export function WapuuPreview({ imageUrl, name, authorName, authorUrl, description, event, tags }: Props) {
  const tagList = tags
    ? tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <div className="wapuu-card wapuu-preview">
      {imageUrl && (
        <img src={imageUrl} alt={name} className="wapuu-preview__image" />
      )}
      <div className="wapuu-preview__name">{name || 'Untitled Wapuu'}</div>
      <div className="wapuu-preview__author">
        by{' '}
        {authorUrl ? (
          <a href={authorUrl} target="_blank" rel="noopener noreferrer">
            {authorName || 'Unknown'}
          </a>
        ) : (
          authorName || 'Unknown'
        )}
      </div>
      <div className="wapuu-preview__description">
        {description || 'No description provided.'}
      </div>
      {event && (
        <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginBottom: 'var(--space-sm)' }}>
          Event: {event}
        </div>
      )}
      {tagList.length > 0 && (
        <div className="wapuu-preview__tags">
          {tagList.map((tag) => (
            <span key={tag} className="wapuu-preview__tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
