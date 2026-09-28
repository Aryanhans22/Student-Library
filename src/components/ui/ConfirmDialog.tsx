import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
  isDanger?: boolean;
  type?: string;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  isDanger: propIsDanger,
  type,
  loading = false,
}) => {
  const handleClose = onCancel || onClose || (() => {});
  const isDanger = propIsDanger || confirmVariant === 'danger' || type === 'danger' || type === 'destructive';
  const resolvedVariant = isDanger ? 'danger' : confirmVariant;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <div className="flex flex-col items-center text-center pt-2">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDanger ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
          {isDanger ? <AlertTriangle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2" id="modal-title">
          {title}
        </h3>
        <div className="text-sm text-gray-500 mb-6">
          {message}
        </div>
        <div className="flex items-center justify-center gap-3 w-full sm:flex-row flex-col-reverse">
          <Button variant="secondary" onClick={handleClose} disabled={loading} fullWidth>
            {cancelText}
          </Button>
          <Button variant={resolvedVariant} onClick={onConfirm} loading={loading} fullWidth>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
