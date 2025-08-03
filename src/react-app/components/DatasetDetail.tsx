import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, FileText, Trash2, Edit, Plus, Upload } from "lucide-react";
import { DifyDocument } from "../../shared/schemas";
import { useDifyApi } from "../../shared/hooks/useDifyApi";

export default function DatasetDetail() {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const { useDataset, useDocuments } = useDifyApi();

  const { data: dataset, isLoading: loadingDataset, refetch: refetchDataset } = useDataset(datasetId ?? "");
  const { data: documents, isLoading: loadingDocuments, refetch: refetchDocuments } = useDocuments(dataset?.id ?? "");

  const [selectedDocument, setSelectedDocument] = useState<DifyDocument | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddDocumentDialogOpen, setIsAddDocumentDialogOpen] = useState(false);
  const [documentType, setDocumentType] = useState<'text' | 'file'>('text');
  const [documentName, setDocumentName] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);

  const handleDeleteDataset = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteDataset = async () => {
    if (!datasetId) return;
    
    try {
      const response = await fetch(`/api/datasets/${datasetId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.error) {
        console.error("Failed to delete dataset:", data.error);
      } else {
        console.log("Dataset deleted:", data);
        navigate('/'); // Navigate back to home page
      }
    } catch (error) {
      console.error("Error deleting dataset:", error);
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleAddDocument = () => {
    setIsAddDocumentDialogOpen(true);
    setDocumentName('');
    setDocumentText('');
    setSelectedFile(null);
    setDocumentType('text');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setDocumentName(file.name.replace(/\.[^/.]+$/, "")); // Remove file extension
    }
  };

  const createDocument = async () => {
    if (!datasetId) return;
    
    if (!documentName.trim()) {
      alert('Please enter a document name');
      return;
    }

    if (documentType === 'text' && !documentText.trim()) {
      alert('Please enter document text');
      return;
    }

    if (documentType === 'file' && !selectedFile) {
      alert('Please select a file');
      return;
    }

    setIsCreatingDocument(true);
    
    try {
      let response;
      
      if (documentType === 'text') {
        response = await fetch(`/api/datasets/${datasetId}/documents/text`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: documentName.trim(),
            text: documentText.trim(),
            indexing_technique: 'high_quality'
          })
        });
      } else {
        const formData = new FormData();
        // Add the file under 'file' key as expected by Dify API
        formData.append('file', selectedFile!);
        
        // Add configuration as JSON string under 'data' key as expected by Dify API
        const configData = {
          indexing_technique: 'high_quality',
          process_rule: {
            mode: 'automatic'
          }
        };
        formData.append('data', JSON.stringify(configData));
        
        response = await fetch(`/api/datasets/${datasetId}/documents/file`, {
          method: 'POST',
          body: formData
        });
      }

      let data;
      try {
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        if (!responseText) {
          throw new Error('Empty response from server');
        }
        
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        alert('Server returned invalid response. Please try again.');
        return;
      }
      
      if (!response.ok) {
        console.error("HTTP error:", response.status, response.statusText);
        console.error("API error response:", data);
        alert(`Failed to create document: HTTP ${response.status} - ${data?.error || data?.message || 'Unknown error'}`);
      } else if (data.error) {
        console.error("Failed to create document:", data.error);
        alert(`Failed to create document: ${data.error}`);
      } else {
        console.log("Document created:", data);
        setIsAddDocumentDialogOpen(false);
        refetchDocuments(); // Refresh the documents list
        refetchDataset(); // Refresh dataset info to update document count
      }
    } catch (error) {
      console.error("Error creating document:", error);
      alert('Error creating document. Please try again.');
    } finally {
      setIsCreatingDocument(false);
    }
  };

  if (!dataset) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Dataset not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The requested dataset could not be found.
          </p>
          <Button
            onClick={() => navigate('/')}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Datasets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="icon"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{dataset.name}</h1>
              <p className="text-gray-600">{dataset.description}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon">
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleDeleteDataset}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Dataset Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Dataset Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="font-medium text-gray-700">Documents:</span>
              <p className="text-2xl font-bold text-blue-600">{dataset.document_count}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Total Words:</span>
              <p className="text-2xl font-bold text-green-600">{(dataset.word_count || 0).toLocaleString()}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Permission:</span>
              <p className="text-lg font-medium text-gray-900">{dataset.permission}</p>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Documents</h2>
            <div className="flex space-x-2">
              <Button
                onClick={() => refetchDocuments()}
                disabled={loadingDocuments || loadingDataset}
                variant="outline"
              >
                {loadingDocuments || loadingDataset ? "Loading..." : "Refresh"}
              </Button>
              <Button 
                className="flex items-center space-x-2"
                onClick={handleAddDocument}
              >
                <Plus className="w-4 h-4" />
                <span>Add Document</span>
              </Button>
            </div>
          </div>

          {documents && documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => navigate(`/datasets/${datasetId}/documents/${doc.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{doc.name}</h3>
                      <div className="mt-2 grid grid-cols-4 gap-4 text-sm text-gray-500">
                        <div>
                          <span className="font-medium">Characters:</span> {(doc.character_count || 0).toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Tokens:</span> {(doc.tokens || 0).toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Status:</span>
                          <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                            doc.processing_status === 'completed' ? 'bg-green-100 text-green-800' :
                            doc.processing_status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            doc.processing_status === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {doc.processing_status}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Indexing:</span>
                          <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                            doc.indexing_status === 'completed' ? 'bg-green-100 text-green-800' :
                            doc.indexing_status === 'processing' || doc.indexing_status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {doc.indexing_status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add documents to this dataset to get started.
              </p>
            </div>
          )}
        </div>

        {/* Document Detail Section */}
        {selectedDocument && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Document Content: {selectedDocument.name}</h2>
              <Button
                variant="outline"
                onClick={() => setSelectedDocument(null)}
              >
                Close
              </Button>
            </div>

            {loadingDocuments ? (
              <div className="text-center py-12">
                <p>Loading document content...</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <span className="font-medium text-gray-700">Characters:</span>
                    <p className="text-lg font-semibold text-blue-600">{(selectedDocument.character_count || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Tokens:</span>
                    <p className="text-lg font-semibold text-green-600">{(selectedDocument.tokens || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                      selectedDocument.processing_status === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedDocument.processing_status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      selectedDocument.processing_status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedDocument.processing_status}
                    </span>
                  </div>
                </div>

                {selectedDocument.name ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Content:</h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                        {selectedDocument.name}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No content available for this document.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Add Document Dialog */}
        <Dialog open={isAddDocumentDialogOpen} onOpenChange={setIsAddDocumentDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Document</DialogTitle>
              <DialogDescription>
                Add a new document to "{dataset.name}" by entering text or uploading a file.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Document Type Selection */}
              <div className="flex space-x-4">
                <Button
                  variant={documentType === 'text' ? 'default' : 'outline'}
                  onClick={() => setDocumentType('text')}
                  className="flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Text</span>
                </Button>
                <Button
                  variant={documentType === 'file' ? 'default' : 'outline'}
                  onClick={() => setDocumentType('file')}
                  className="flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>File Upload</span>
                </Button>
              </div>

              {/* Document Name Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Document Name</label>
                <Input
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Enter document name"
                  className="w-full"
                />
              </div>

              {/* Text Input */}
              {documentType === 'text' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Text Content</label>
                  <Textarea
                    value={documentText}
                    onChange={(e) => setDocumentText(e.target.value)}
                    placeholder="Enter document text content..."
                    rows={8}
                    className="w-full"
                  />
                </div>
              )}

              {/* File Upload */}
              {documentType === 'file' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">File</label>
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full"
                    accept=".txt,.md,.pdf,.doc,.docx"
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-500">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDocumentDialogOpen(false)}
                disabled={isCreatingDocument}
              >
                Cancel
              </Button>
              <Button
                onClick={createDocument}
                disabled={isCreatingDocument}
              >
                {isCreatingDocument ? "Creating..." : "Create Document"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Dataset</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{dataset.name}"? This action cannot be undone and will permanently remove all documents and segments in this dataset.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteDataset}
              >
                Delete Dataset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}