import { useState, useEffect } from 'react';


export default function StudyMaterials({ courseId }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const endpoint = courseId 
          ? `/api/student/course/${courseId}`
          : '/api/student/materials/all';
        
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error('Failed to fetch materials');
        }

        const data = await response.json();
        setMaterials(data.data);
      } catch (err) {
        setError(err.message);
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [courseId]);
 
  const handleDownload = async (materialId, fileName) => {
    if (!materialId) return console.error('Missing material ID for download');

    console.log(`Attempting to download: ${fileName} (ID: ${materialId})`);

    try {
      const downloadUrl = `/api/student/download/${materialId}`;
      window.open(downloadUrl, '_blank');
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download the file. Please try again later.');
    }
  };
  

  console.log('Render - loading:', loading, 'error:', error, 'materials count:', materials.length);

  if (loading) {
    console.log('Rendering loading state');
    return <div className="p-4 text-center">Loading materials...</div>;
  }

  if (error) {
    console.log('Rendering error state:', error);
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 space-y-4">
      
      
      {materials.length === 0 ? (
        <p className="text-gray-500">No study materials available yet</p>
      ) : (
        <div className="space-y-3">
          {materials.map(material => (
            <div key={material._id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-lg">{material.title}</h3>
                  {material.module && (
                    <p className="text-sm text-gray-600 mt-1">Module: {material.module}</p>
                  )}
                  {material.description && (
                    <p className="text-gray-700 mt-2">{material.description}</p>
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    <span>{material.originalName}</span>
                    <span className="mx-2">•</span>
                    <span>{(material.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(material._id, material.originalName)}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  aria-label={`Download ${material.title}`}
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}