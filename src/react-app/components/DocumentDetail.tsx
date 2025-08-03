import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, FileText, Trash2, Edit, Download, Hash, Clock, Eye, PlusCircle } from "lucide-react";
import { useDifyApi } from "../../shared/hooks/useDifyApi";
import { DifySegment, CreateSegmentRequest } from "../../shared/schemas";
import SegmentEditDialog from './SegmentEditDialog';

export default function DocumentDetail() {
  const { datasetId, documentId } = useParams<{ datasetId: string; documentId: string }>();
  const navigate = useNavigate();
  const { 
    useDataset, 
    useDocumentDetails, 
    useDocumentSegments, 
    deleteDocument, 
    createDocumentSegments,
    deleteDocumentSegment
  } = useDifyApi();
  
  console.log("datasetId", datasetId);
  console.log("documentId", documentId);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSegmentEditDialogOpen, setIsSegmentEditDialogOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<DifySegment | null>(null);

  const { data: dataset } = useDataset(datasetId!);
  const { data: document, isLoading: isDocumentLoading } = useDocumentDetails(datasetId!, documentId!, 'all');
  const { data: segments, isLoading: areSegmentsLoading, refetch: refetchSegments } = useDocumentSegments(datasetId!, documentId!);

  console.log("dataset", dataset);
  console.log("document", document);
  console.log("segments", segments);

  const deleteDocumentMutation = deleteDocument;
  const createSegmentMutation = createDocumentSegments;
  const deleteSegmentMutation = deleteDocumentSegment;

  const handleDeleteDocument = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteDocument = async () => {
    if (!datasetId || !documentId) return;
    await deleteDocumentMutation.mutateAsync({ datasetId, documentId });
    navigate(`/datasets/${datasetId}`);
  };

  const handleOpenSegmentDialog = (segment: DifySegment | null = null) => {
    setSelectedSegment(segment);
    setIsSegmentEditDialogOpen(true);
  };

  const handleSaveSegment = async (data: CreateSegmentRequest) => {
    if (!datasetId || !documentId) return;

    if (selectedSegment) {
      // Dify API does not support updating segments directly.
      // The workaround is to delete the existing segment and create a new one.
      await deleteSegmentMutation.mutateAsync({ datasetId, documentId, segmentId: selectedSegment.id });
    }
    await createSegmentMutation.mutateAsync({ datasetId, documentId, request: data });
    refetchSegments();
    setIsSegmentEditDialogOpen(false);
  };

  const handleDeleteSegment = async (segmentId: string) => {
    if (!datasetId || !documentId) return;
    await deleteSegmentMutation.mutateAsync({ datasetId, documentId, segmentId });
    refetchSegments();
  };

  if (isDocumentLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Document not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The requested document could not be found.
          </p>
          <Button
            onClick={() => navigate(`/datasets/${datasetId}`)}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dataset
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
              onClick={() => navigate(`/datasets/${datasetId}`)}
              variant="outline"
              size="icon"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                <span>{dataset?.name || 'Dataset'}</span>
                <span>/</span>
                <span>Documents</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{document.name}</h1>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleDeleteDocument}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Document Statistics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Document Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div>
              <span className="font-medium text-gray-700">Characters:</span>
              <p className="text-2xl font-bold text-blue-600">{(document.character_count || 0).toLocaleString()}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Tokens:</span>
              <p className="text-2xl font-bold text-green-600">{(document.tokens || 0).toLocaleString()}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Segments:</span>
              <p className="text-2xl font-bold text-purple-600">{segments?.length || 0}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Processing Status:</span>
              <div className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  document.processing_status === 'completed' ? 'bg-green-100 text-green-800' :
                  document.processing_status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                  document.processing_status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {document.processing_status}
                </span>
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Indexing Status:</span>
              <div className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  document.indexing_status === 'completed' ? 'bg-green-100 text-green-800' :
                  document.indexing_status === 'processing' || document.indexing_status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {document.indexing_status}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <p className="text-sm text-gray-600">{new Date(document.created_at).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Updated:</span>
                <p className="text-sm text-gray-600">{new Date(document.updated_at ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Document Segments */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Document Segments</h2>
            <Button onClick={() => handleOpenSegmentDialog()}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Segment
            </Button>
          </div>
          
          {areSegmentsLoading ? (
            <div className="text-sm text-gray-500">Loading segments...</div>
          ) : segments && segments.length > 0 ? (
            <div className="space-y-4">
              {segments.map((segment) => (
                <div 
                  key={segment.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Hash className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">Segment {segment.position}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {new Date(segment.created_at * 1000).toLocaleDateString()}
                        </span>
                      </div>
                      {segment.hit_count !== undefined && (
                        <div className="flex items-center space-x-2">
                          <Eye className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500">{segment.hit_count} hits</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenSegmentDialog(segment)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteSegment(segment.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {segment.content}
                      </p>
                    </div>
                  </div>
                  
                  {segment.answer && (
                    <div className="mb-3">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Answer</span>
                      <div className="bg-blue-50 rounded-lg p-3 mt-1">
                        <p className="text-sm text-blue-900 leading-relaxed">
                          {segment.answer}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {segment.keywords && segment.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs font-medium text-gray-600 mr-2">Keywords:</span>
                      {segment.keywords.map((keyword, keywordIndex) => (
                        <span 
                          key={keywordIndex}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No segments found</h3>
              <p className="mt-1 text-sm text-gray-500">
                This document has not been segmented yet or segments are still processing.
              </p>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Document</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{document.name}"? This action cannot be undone and will permanently remove this document from the dataset.
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
                onClick={confirmDeleteDocument}
                disabled={deleteDocumentMutation.isPending}
              >
                {deleteDocumentMutation.isPending ? 'Deleting...' : 'Delete Document'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Segment Edit/Create Dialog */}
        <SegmentEditDialog 
          isOpen={isSegmentEditDialogOpen}
          onOpenChange={setIsSegmentEditDialogOpen}
          segment={selectedSegment}
          onSubmit={handleSaveSegment}
          isSubmitting={createSegmentMutation.isPending}
        />
      </div>
    </div>
  );
}
