import { useState, useEffect } from 'react';
import { getTemplateCustomization } from '../lib/templateCustomizations';

interface VersionHistoryProps {
  slug: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (version: any) => void;
}

export function VersionHistory({ slug, isOpen, onClose, onRestore }: VersionHistoryProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, slug]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/edit-history?slug=${slug}`);
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
    setLoading(false);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const previewVersion = async (version: any) => {
    setSelectedVersion(version);

    // Reconstruct the state at that point
    const reconstructed: any = {};
    version.edits.forEach((edit: any) => {
      if (!reconstructed[edit.edit_type]) {
        reconstructed[edit.edit_type] = {};
      }
      reconstructed[edit.edit_type][edit.field_key] = edit.old_value;
    });

    setPreviewData(reconstructed);
  };

  const handleRestore = async () => {
    if (!selectedVersion || !previewData) return;

    // Build restore data
    const restoreData: any = {};

    selectedVersion.edits.forEach((edit: any) => {
      const value = edit.old_value;

      // Parse the field key to determine what to restore
      if (edit.field_key.includes('headline')) {
        if (edit.field_key.includes('Size')) {
          restoreData.headlineSize = parseInt(value) || 48;
        } else if (edit.field_key.includes('Color')) {
          restoreData.headlineColor = value;
        } else if (edit.field_key.includes('Font')) {
          restoreData.headlineFont = value;
        } else if (edit.field_key.includes('Weight')) {
          restoreData.headlineWeight = value;
        } else {
          restoreData.headline = value;
        }
      } else if (edit.field_key.includes('subheadline')) {
        if (edit.field_key.includes('Size')) {
          restoreData.subheadlineSize = parseInt(value) || 20;
        } else if (edit.field_key.includes('Color')) {
          restoreData.subheadlineColor = value;
        } else if (edit.field_key.includes('Font')) {
          restoreData.subheadlineFont = value;
        } else if (edit.field_key.includes('Weight')) {
          restoreData.subheadlineWeight = value;
        } else {
          restoreData.subheadline = value;
        }
      } else if (edit.field_key.includes('button1')) {
        if (!restoreData.button1) restoreData.button1 = {};
        if (edit.field_key.includes('BgColor')) {
          restoreData.button1.bgColor = value;
        } else if (edit.field_key.includes('Color')) {
          restoreData.button1.textColor = value;
        } else if (edit.field_key.includes('Text')) {
          restoreData.button1.text = value;
        } else if (edit.field_key.includes('Size')) {
          restoreData.button1.size = value;
        }
      } else if (edit.field_key.includes('button2')) {
        if (!restoreData.button2) restoreData.button2 = {};
        if (edit.field_key.includes('BgColor')) {
          restoreData.button2.bgColor = value;
        } else if (edit.field_key.includes('Color')) {
          restoreData.button2.textColor = value;
        } else if (edit.field_key.includes('Text')) {
          restoreData.button2.text = value;
        } else if (edit.field_key.includes('Size')) {
          restoreData.button2.size = value;
        }
      } else if (edit.field_key.includes('image')) {
        restoreData.image = value;
      } else if (edit.field_key.includes('overlayOpacity')) {
        restoreData.overlayOpacity = parseInt(value) || 50;
      }
    });

    onRestore(restoreData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Version History</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* History List */}
          <div className="w-1/2 border-r overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No edit history found</div>
            ) : (
              <div className="divide-y">
                {history.map((version) => (
                  <div
                    key={version.id}
                    onClick={() => previewVersion(version)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedVersion?.id === version.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-sm font-medium">
                        {version.summary || 'Changes'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(version.created_at)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      {version.edits.length} change{version.edits.length > 1 ? 's' : ''}
                      {version.device_type !== 'all' && ` • ${version.device_type} only`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="w-1/2 p-4 overflow-y-auto">
            {selectedVersion ? (
              <>
                <h3 className="font-medium mb-3">Changes in this version:</h3>
                <div className="space-y-2 text-sm">
                  {selectedVersion.edits.map((edit: any, idx: number) => (
                    <div key={idx} className="p-2 bg-gray-50 rounded">
                      <div className="font-medium text-gray-700">
                        {edit.field_key.replace(/_/g, ' ').replace(/hero /gi, '')}
                      </div>
                      <div className="mt-1 text-xs">
                        <span className="text-red-600">Old: {edit.old_value || 'empty'}</span>
                        <br />
                        <span className="text-green-600">New: {edit.new_value || 'empty'}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleRestore}
                  className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Restore This Version
                </button>
              </>
            ) : (
              <div className="text-center text-gray-500">
                Select a version to preview changes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}