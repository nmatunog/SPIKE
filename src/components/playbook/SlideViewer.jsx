/** @param {{ slide: { title: string, body: string } }} props */
export function SlideViewer({ slide }) {
  const paragraphs = slide.body.split('\n').filter(Boolean);

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
