import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'default' | 'wide';
}

/** A stable dialog shell used by CRUD pages. */
export function Modal({ isOpen, onClose, title, children, size = 'default' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm" role="presentation">
      <div
        aria-labelledby="modal-title"
        aria-modal="true"
        className={`max-h-[90vh] w-full overflow-y-auto rounded-lg bg-white p-6 shadow-xl ${size === 'wide' ? 'max-w-4xl' : 'max-w-lg'}`}
        role="dialog"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="modal-title" className="text-xl font-semibold text-[#1a2332]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="text-[#6b7280] hover:text-[#1a2332]">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
