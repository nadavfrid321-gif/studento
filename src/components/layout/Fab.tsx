import { useState } from 'react';
import { Icon } from '../ui/Icon';
import { ImportTaskDialog } from '../task/ImportTaskDialog';

export function Fab() {
  const [open, setOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);

  return (
    <>
      <div className="fixed bottom-20 md:bottom-6 left-6 z-40 flex flex-col items-end gap-sm">
        {open && (
          <div className="flex flex-col gap-sm">
            <button
              onClick={() => {
                setShowImport(true);
                setOpen(false);
              }}
              className="flex items-center gap-xs px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-full shadow-card text-on-surface font-display text-body-md hover:bg-surface-container"
            >
              <Icon name="auto_awesome" />
              ייבוא AI
            </button>
          </div>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-14 h-14 rounded-full bg-primary text-on-primary shadow-card-hover flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
          aria-label="פעולה מהירה"
        >
          <Icon name={open ? 'close' : 'add'} className="!text-3xl" />
        </button>
      </div>
      {showImport && <ImportTaskDialog onClose={() => setShowImport(false)} />}
    </>
  );
}
