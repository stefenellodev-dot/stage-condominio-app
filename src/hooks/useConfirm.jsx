import React, { useState, useCallback } from 'react';
import ConfirmDialog from '../components/ui/ConfirmDialog';

/**
 * Hook que reemplaza window.confirm / window.prompt por un modal accesible.
 * Uso:
 *   const { confirm, prompt, ConfirmDialogNode } = useConfirm();
 *   if (!await confirm('¿Eliminar?')) return;
 *   const reason = await prompt('Motivo:', 'Motivo de cancelación');
 *   ...
 *   return (<> ... {ConfirmDialogNode} </>);
 */
export function useConfirm() {
  const [state, setState] = useState(null); // { title, message, promptLabel, confirmLabel, cancelLabel, danger, resolve }

  const open = useCallback((opts) => {
    return new Promise((resolve) => {
      setState({ ...opts, resolve });
    });
  }, []);

  const confirm = useCallback((message, opts = {}) => {
    return open({ message, confirmLabel: opts.confirmLabel, cancelLabel: opts.cancelLabel, danger: opts.danger, title: opts.title });
  }, [open]);

  const prompt = useCallback((message, opts = {}) => {
    return open({ message: opts.message || '', promptLabel: opts.promptLabel || message, confirmLabel: opts.confirmLabel, cancelLabel: opts.cancelLabel, title: opts.title });
  }, [open]);

  const handleConfirm = useCallback((value) => {
    state?.resolve(value);
    setState(null);
  }, [state]);

  const handleCancel = useCallback(() => {
    state?.resolve(promptLabel ? '' : false);
    setState(null);
  }, [state]);

  const ConfirmDialogNode = (
    <ConfirmDialog
      open={!!state}
      title={state?.title}
      message={state?.promptLabel ? state?.message : state?.message}
      promptLabel={state?.promptLabel}
      confirmLabel={state?.confirmLabel}
      cancelLabel={state?.cancelLabel}
      danger={state?.danger}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, prompt, ConfirmDialogNode };
}
