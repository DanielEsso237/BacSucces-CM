import { createPortal } from 'react-dom'

interface Props {
  src: string
  onClose: () => void
}

function ImageLightbox({ src, onClose }: Props) {
  return createPortal(
    <div className="img-lightbox-overlay" onClick={onClose}>
      <button className="img-lightbox-close" onClick={onClose} aria-label="Fermer">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <img src={src} alt="" className="img-lightbox-img" onClick={e => e.stopPropagation()} />
    </div>,
    document.body
  )
}

export default ImageLightbox