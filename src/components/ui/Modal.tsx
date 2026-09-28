import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  size?: ModalSize;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={`relative w-full ${sizeClasses[size]} mx-4 my-6 z-50 animate-in fade-in zoom-in-95 duration-200`}>
        <div
          ref={modalRef}
          tabIndex={-1}
          className="relative flex flex-col w-full bg-white border-0 rounded-xl shadow-xl outline-none focus:outline-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
        >
          {title && (
            <div className="flex items-start justify-between p-5 border-b border-solid border-gray-200 rounded-t-xl">
              <h3 className="text-xl font-semibold text-gray-900" id="modal-title">
                {title}
              </h3>
              <button
                className="p-1 ml-auto bg-transparent border-0 text-gray-500 float-right text-3xl leading-none font-semibold outline-none focus:outline-none hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100"
                onClick={onClose}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          {!title && (
             <button
                className="absolute top-4 right-4 p-1 bg-transparent border-0 text-gray-500 text-3xl leading-none font-semibold outline-none focus:outline-none hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100 z-10"
                onClick={onClose}
                aria-label="Close modal"
             >
               <X className="w-5 h-5" />
             </button>
          )}
          <div className="relative p-6 flex-auto max-h-[80vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
};
