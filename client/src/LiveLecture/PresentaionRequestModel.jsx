export default function PresentationRequestModal({ onConfirm, onCancel }) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-6 rounded-lg max-w-md">
          <h3 className="text-xl font-bold mb-4">Request to Present</h3>
          <p className="mb-6">You're requesting to share your screen and present to the class.</p>
          <div className="flex justify-end space-x-3">
            <button 
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            >
              Send Request
            </button>
          </div>
        </div>
      </div>
    );
  }