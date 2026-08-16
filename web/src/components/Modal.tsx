import { useEffect, type PropsWithChildren } from 'react';

interface ModalProps extends PropsWithChildren {
  title: string;
  description?: string;
  onClose: () => void;
}

export function Modal({ title, description, onClose, children }: ModalProps) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className="modal-layer">
      <button
        className="modal-layer__backdrop"
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal__header">
          <div>
            <p>Centro de operaciones</p>
            <h2 id="modal-title">{title}</h2>
            {description ? <span>{description}</span> : null}
          </div>
          <button className="modal__close" type="button" aria-label="Cerrar" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="modal__body">{children}</div>
      </section>
    </div>
  );
}
