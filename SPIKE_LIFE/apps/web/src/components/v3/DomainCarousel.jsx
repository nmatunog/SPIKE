import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import DomainTile from './DomainTile.jsx'

const VISIBLE_PAGES = 8

export default function DomainCarousel({
  domains = [],
  rolling = false,
  scanHighlightId = null,
  selectedDomainId = null,
  winnerLocked = false,
}) {
  const trackRef = useRef(null)
  const [page, setPage] = useState(0)

  const tileState = useMemo(() => {
    return (id) => {
      if (winnerLocked && selectedDomainId === id) return 'winner'
      if (rolling && scanHighlightId === id) return 'scan'
      if (rolling && scanHighlightId && scanHighlightId !== id) return 'dimmed'
      if (!rolling && selectedDomainId === id) return 'winner'
      return 'idle'
    }
  }, [rolling, scanHighlightId, selectedDomainId, winnerLocked])

  const pageCount = Math.max(1, Math.ceil(domains.length / VISIBLE_PAGES))

  const scrollToPage = useCallback((nextPage) => {
    const el = trackRef.current
    if (!el) return
    const clamped = Math.max(0, Math.min(pageCount - 1, nextPage))
    setPage(clamped)
    const tile = el.querySelector('.gsv3-domain-tile')
    const tileWidth = tile?.getBoundingClientRect().width ?? 160
    el.scrollTo({ left: clamped * tileWidth * VISIBLE_PAGES, behavior: 'smooth' })
  }, [pageCount])

  useEffect(() => {
    if (!selectedDomainId || !trackRef.current) return
    const index = domains.findIndex((d) => d.id === selectedDomainId)
    if (index >= 0) {
      scrollToPage(Math.floor(index / VISIBLE_PAGES))
      const el = trackRef.current
      const tile = el.querySelector(`[data-domain-id="${selectedDomainId}"]`)
      tile?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [selectedDomainId, domains, scrollToPage])

  const title = rolling
    ? 'Rolling life domain…'
    : winnerLocked
      ? 'Life domain selected'
      : 'Life domain board'

  const subtitle = rolling
    ? 'Where will life lead you this turn?'
    : 'One planning cycle · one domain · one decision'

  return (
    <section className="flex h-full flex-col" aria-label="Life domain board" aria-busy={rolling}>
      <div className="gsv3-board-head">
        <p className="gsv3-board-head__title">{title}</p>
        <p className="gsv3-board-head__sub">{subtitle}</p>
      </div>

      <div className="gsv3-carousel-wrap">
        <button
          type="button"
          className="gsv3-carousel-nav gsv3-carousel-nav--left"
          onClick={() => scrollToPage(page - 1)}
          disabled={page <= 0}
          aria-label="Previous domains"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div ref={trackRef} className="gsv3-carousel-track">
          {domains.map((domain) => (
            <div key={domain.id} data-domain-id={domain.id} className="h-full shrink-0">
              <DomainTile domain={domain} state={tileState(domain.id)} />
            </div>
          ))}
        </div>

        <button
          type="button"
          className="gsv3-carousel-nav gsv3-carousel-nav--right"
          onClick={() => scrollToPage(page + 1)}
          disabled={page >= pageCount - 1}
          aria-label="Next domains"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="gsv3-carousel-dots" aria-hidden>
        {Array.from({ length: pageCount }, (_, i) => (
          <span
            key={i}
            className={`gsv3-carousel-dot ${i === page ? 'gsv3-carousel-dot--active' : ''}`}
          />
        ))}
      </div>
    </section>
  )
}
