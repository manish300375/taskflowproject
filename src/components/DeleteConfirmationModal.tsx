import { Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function DeleteConfirmationModal({
  onConfirm,
  onCancel,
  loading = false
}: DeleteConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div
        className="bg-white rounded-2xl shadow-xl max-w-[380px] w-full p-8 relative animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-coral bg-opacity-10 rounded-full flex items-center justify-center mb-5">
            <Trash2 className="w-8 h-8 text-coral" />
          </div>

          <h2 className="text-2xl font-bold text-charcoal mb-3">Delete Task?</h2>

          <p className="text-mutedGray text-base leading-relaxed mb-8">
            This action cannot be undone. Are you sure you want to delete this task?
          </p>

          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-5 py-3 border-2 border-sage text-sage rounded-xl font-semibold hover:bg-sage hover:bg-opacity-5 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-5 py-3 bg-coral text-white rounded-xl font-semibold hover:bg-[#E07A5F] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-sm"
            >
              {loading ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
