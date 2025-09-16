import { useState, useEffect } from 'react';
import { getTemplateVersions, rollbackToVersion } from '../lib/templateCustomizations';

interface VersionHistoryProps {
  slug: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (version: any) => void;
}

export function VersionHistory({ slug, isOpen, onClose, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, slug]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const versionList = await getTemplateVersions(slug);
      setVersions(versionList);
    } catch (error) {
      console.error('Error fetching versions:', error);
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

  const handleRestore = async () => {
    if (!selectedVersion) return;

    setRestoring(true);
    try {
      const success = await rollbackToVersion(slug, selectedVersion.version);
      if (success) {
        // Refresh the page to show restored version
        window.location.reload();
      } else {
        alert('Failed to restore version. Please try again.');
      }
    } catch (error) {
      console.error('Error restoring version:', error);
      alert('Error restoring version. Please try again.');
    }
    setRestoring(false);
  };

  const compareVersions = (version: any, previousVersion: any) => {
    const changes: string[] = [];

    if (!previousVersion) {
      return ['Initial version'];
    }

    // Compare each field
    ['custom_images', 'custom_text', 'custom_colors', 'custom_styles', 'custom_buttons'].forEach(field => {
      const current = version[field] || {};
      const previous = previousVersion[field] || {};

      // Check for additions or modifications
      Object.keys(current).forEach(key => {
        if (!previous[key] || previous[key] !== current[key]) {
          const fieldName = field.replace('custom_', '').replace('_', ' ');
          changes.push(`${fieldName}: ${key.replace(/_/g, ' ')}`);
        }
      });

      // Check for deletions
      Object.keys(previous).forEach(key => {
        if (!current[key]) {
          const fieldName = field.replace('custom_', '').replace('_', ' ');
          changes.push(`Removed ${fieldName}: ${key.replace(/_/g, ' ')}`);
        }
      });
    });

    return changes.length > 0 ? changes : ['No visible changes'];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Version History</h2>
            <p className="text-sm text-gray-500 mt-1">
              {versions.length} version{versions.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Version List */}
          <div className="w-1/2 border-r overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading versions...</div>
            ) : versions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No versions found</div>
            ) : (
              <div className="divide-y">
                {versions.map((version, index) => {
                  const previousVersion = versions[index + 1];
                  const changes = compareVersions(version, previousVersion);

                  return (
                    <div
                      key={`${version.business_slug}-${version.version}`}
                      onClick={() => setSelectedVersion(version)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedVersion?.version === version.version ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">
                            Version {version.version}
                          </div>
                          {version.is_current && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(version.created_at)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        {version.change_summary || changes.slice(0, 2).join(', ')}
                        {changes.length > 2 && ` +${changes.length - 2} more`}
                      </div>
                      {version.parent_version && (
                        <div className="text-xs text-gray-400 mt-1">
                          Based on v{version.parent_version}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Version Details */}
          <div className="w-1/2 p-4 overflow-y-auto">
            {selectedVersion ? (
              <>
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Version {selectedVersion.version} Details</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Created: {new Date(selectedVersion.created_at).toLocaleString()}</div>
                    {selectedVersion.parent_version && (
                      <div>Based on: Version {selectedVersion.parent_version}</div>
                    )}
                    {selectedVersion.is_published && (
                      <div className="text-green-600">Published</div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-sm mb-2">Summary</h4>
                  <p className="text-sm text-gray-600">
                    {selectedVersion.change_summary || 'No summary provided'}
                  </p>
                </div>

                {/* Simplified preview */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <a
                      href={`/plumbing3/${selectedVersion.business_slug}?version=${selectedVersion.version}`}
                      target="_blank"
                      className="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Preview This Version
                    </a>
                  </div>

                  <div className="text-sm text-gray-600">
                    <div>Customizations in this version:</div>
                    <ul className="mt-1 text-xs space-y-1">
                      {Object.keys(selectedVersion.custom_text || {}).length > 0 && (
                        <li>• Text fields: {Object.keys(selectedVersion.custom_text || {}).length}</li>
                      )}
                      {Object.keys(selectedVersion.custom_colors || {}).length > 0 && (
                        <li>• Colors: {Object.keys(selectedVersion.custom_colors || {}).length}</li>
                      )}
                      {Object.keys(selectedVersion.custom_images || {}).length > 0 && (
                        <li>• Images: {Object.keys(selectedVersion.custom_images || {}).length}</li>
                      )}
                      {Object.keys(selectedVersion.custom_styles || {}).length > 0 && (
                        <li>• Styles: {Object.keys(selectedVersion.custom_styles || {}).length}</li>
                      )}
                      {Object.keys(selectedVersion.custom_buttons || {}).length > 0 && (
                        <li>• Buttons: {Object.keys(selectedVersion.custom_buttons || {}).length}</li>
                      )}
                    </ul>
                  </div>
                </div>

                {!selectedVersion.is_current && (
                  <button
                    onClick={handleRestore}
                    disabled={restoring}
                    className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {restoring ? 'Restoring...' : 'Restore This Version'}
                  </button>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500">
                Select a version to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}