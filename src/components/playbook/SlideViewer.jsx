/** @param {{ slide: { title: string, body: string } }} props */
export function SlideViewer({ slide }) {
  const paragraphs = slide.body.split('\n').filter(Boolean);

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
      <h4 className="mb-4 text-xl font-bold text-gray-900 sm:text-2xl">{slide.title}</h4>
      <div className="space-y-3 text-sm leading-relaxed text-gray-700 sm:text-base">
        {paragraphs.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </article>
  );
}
