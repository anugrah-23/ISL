// frontend/src/components/ExitForfeitModal.jsx
import React from "react";

/**
 * ExitForfeitModal
 *
 * Props:
 *  - open: boolean
 *  - onCancel: () => void
 *  - onConfirm: () => void
 *  - matchId: string (optional)
 *
 * Notes:
 *  - Uses explicit z-index and pointer-events to ensure buttons are clickable.
 *  - No external animation libs required.
 */
export default function ExitForfeitModal({ open, onCancel, onConfirm, matchId }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-forfeit-title"
    >
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        style={{ pointerEvents: "auto" }}
      />

      {/* MODAL BOX */}
      <div
        className="relative z-[10000] w-full max-w-md mx-4 bg-white rounded-lg shadow-lg"
        style={{ pointerEvents: "auto" }}
      >
        <div className="p-5">
          <h3 id="exit-forfeit-title" className="text-lg font-semibold mb-2">
            Leave match?
          </h3>

          <p className="text-sm text-gray-700 mb-4">
            Leaving the match will count as a forfeit and you will lose. Are you sure you want
            to exit?
          </p>

          {matchId && (
            <div className="text-xs text-gray-400 mb-3">Match: {matchId}</div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded bg-white hover:bg-gray-50"
              aria-label="Cancel leaving match"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              aria-label="Confirm forfeit and leave match"
            >
              Yes, Forfeit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
