/** @param {{ slide: { title: string, body?: string, imageUrl?: string } }} props */
export function SlideViewer({ slide }) {
  if (slide.imageUrl) {
    return (
      <article className="spike-slide">
        <h4 className="sr-only">{slide.title}</h4>
        <img
          src={slide.imageUrl}
          alt={slide.title}
          className="w-full rounded-xl border border-slate-200 bg-white object-contain"
        />
      </article>
    );
  }

  const paragraphs = (slide.body ?? '').split('\n').filter(Boolean);

  return (
    <article className="spike-slide">
      <h4 className="spike-slide-title">{slide.title}</h4>
      <div className="spike-slide-body">
        {paragraphs.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </article>
  );
}
