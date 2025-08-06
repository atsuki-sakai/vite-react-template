import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, FileText, Trash2, Edit, Hash, Clock, Eye, PlusCircle, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { useDifyApi } from "../../shared/hooks/useDifyApi";
import { DifySegment, CreateSegmentRequest } from "../../shared/schemas";
import { FEATURE_FLAGS, PREMIUM_FEATURE_MESSAGES } from "../../shared/constants";
import SegmentEditDialog from './SegmentEditDialog';
import { formatDate } from "../../shared/utils";

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

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSegmentEditDialogOpen, setIsSegmentEditDialogOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<DifySegment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const segmentsPerPage = 20;
  
  // Feature flag for premium features
  const isPremiumFeaturesEnabled = FEATURE_FLAGS.ENABLE_DIFY_PREMIUM_FEATURES;

  const { data: dataset } = useDataset(datasetId!);
  const { data: document, isLoading: isDocumentLoading } = useDocumentDetails(datasetId!, documentId!, 'all');
  const { data: segments, isLoading: areSegmentsLoading, refetch: refetchSegments } = useDocumentSegments(datasetId!, documentId!, currentPage, segmentsPerPage);

  console.log("dataset", dataset);
  console.log("document", document);
  console.log("segments", segments);

  const deleteDocumentMutation = deleteDocument;
  const createSegmentMutation = createDocumentSegments;
  const deleteSegmentMutation = deleteDocumentSegment;

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (segments && segments.length === segmentsPerPage) {
      setCurrentPage(currentPage + 1);
    }
  };

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

    // Check if premium features are disabled
    if (!isPremiumFeaturesEnabled) {
      alert(PREMIUM_FEATURE_MESSAGES.SEGMENT_EDIT_DISABLED);
      return;
    }

    try {
      console.log('[DocumentDetail] handleSaveSegment - Starting segment save operation:', {
        isEditing: !!selectedSegment,
        segmentId: selectedSegment?.id,
        datasetId,
        documentId,
        segmentData: data
      });

      if (selectedSegment) {
        // Dify API does not support updating segments directly.
        // The workaround is to delete the existing segment and create a new one.
        console.log('[DocumentDetail] handleSaveSegment - Deleting existing segment:', selectedSegment.id);
        await deleteSegmentMutation.mutateAsync({ datasetId, documentId, segmentId: selectedSegment.id });
        console.log('[DocumentDetail] handleSaveSegment - Successfully deleted segment');
      }

      console.log('[DocumentDetail] handleSaveSegment - Creating new segment');
      await createSegmentMutation.mutateAsync({ datasetId, documentId, request: data });
      console.log('[DocumentDetail] handleSaveSegment - Successfully created segment');

      // Refresh segments list and close dialog
      refetchSegments();
      setIsSegmentEditDialogOpen(false);
      setSelectedSegment(null);

      console.log('[DocumentDetail] handleSaveSegment - Operation completed successfully');
    } catch (error) {
      console.error('[DocumentDetail] handleSaveSegment - Error during segment save operation:', error);
      
      // Check if this is a 403 forbidden error (premium feature required)
      if (error && typeof error === 'object' && 'message' in error && 
          typeof error.message === 'string' && error.message.includes('403')) {
        alert(PREMIUM_FEATURE_MESSAGES.SEGMENT_EDIT_DISABLED);
      } else {
        alert(`Failed to ${selectedSegment ? 'update' : 'create'} segment. Please try again.`);
      }
      
      // Refresh segments to ensure UI is consistent with backend state
      refetchSegments();
    }
  };

  const handleDeleteSegment = async (segmentId: string) => {
    if (!datasetId || !documentId) return;
    
    // Check if premium features are disabled
    if (!isPremiumFeaturesEnabled) {
      alert(PREMIUM_FEATURE_MESSAGES.SEGMENT_DELETE_DISABLED);
      return;
    }

    try {
      await deleteSegmentMutation.mutateAsync({ datasetId, documentId, segmentId });
      refetchSegments();
    } catch (error) {
      console.error('[DocumentDetail] handleDeleteSegment - Error:', error);
      // Check if this is a 403 forbidden error (premium feature required)
      if (error && typeof error === 'object' && 'message' in error && 
          typeof error.message === 'string' && error.message.includes('403')) {
        alert(PREMIUM_FEATURE_MESSAGES.SEGMENT_DELETE_DISABLED);
      } else {
        alert('Failed to delete segment. Please try again.');
      }
    }
  };

  if (isDocumentLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">ドキュメントを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">ドキュメントが見つかりません</h3>
          <p className="mt-1 text-sm text-gray-500">
            要求されたドキュメントが見つかりませんでした。
          </p>
          <Button
            onClick={() => navigate(`/datasets/${datasetId}`)}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            データセットに戻る
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
                <span>{dataset?.name || 'データセット'}</span>
                <span>/</span>
                <span>ドキュメント</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{document.name}</h1>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDeleteDocument}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Document Statistics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">ドキュメント情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div>
              <span className="font-medium text-gray-700">文字数:</span>
              <p className="text-2xl font-bold text-blue-600">{dataset?.word_count || 0}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">トークン:</span>
              <p className="text-2xl font-bold text-green-600">{(document.tokens || 0).toLocaleString()}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">セグメント数:</span>
              <p className="text-2xl font-bold text-purple-600">{segments?.length || 0}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">インデックス状況:</span>
              <div className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  document.indexing_status === 'completed' ? 'bg-green-100 text-green-800' :
                  document.indexing_status === 'processing' || document.indexing_status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {document.indexing_status === 'completed' ? '完了' : document.indexing_status === 'processing' || document.indexing_status === 'waiting' ? '処理中' : 'エラー'}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="font-medium text-gray-700">作成日:</span>
                <p className="text-sm text-gray-600">{formatDate(document.created_at)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">最終更新:</span>
                <p className="text-sm text-gray-600">{formatDate(document.updated_at ?? null)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Document Segments */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">ドキュメントセグメント</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button 
                      onClick={() => handleOpenSegmentDialog()} 
                      disabled={!isPremiumFeaturesEnabled}
                      className={!isPremiumFeaturesEnabled ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      {!isPremiumFeaturesEnabled && <Lock className="w-4 h-4 mr-2" />}
                      <PlusCircle className="w-4 h-4 mr-2" />
                      セグメントを追加
                    </Button>
                  </div>
                </TooltipTrigger>
                {!isPremiumFeaturesEnabled && (
                  <TooltipContent>
                    <p>{PREMIUM_FEATURE_MESSAGES.SEGMENT_CREATE_DISABLED}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Premium Features Notice */}
          {!isPremiumFeaturesEnabled && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <Lock className="w-5 h-5 text-amber-600 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-amber-800">有料プラン限定機能</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    セグメントの編集・追加・削除機能をご利用いただくには、有料プランが必要です。
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {areSegmentsLoading ? (
            <div className="text-sm text-gray-500">セグメントを読み込み中...</div>
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
                        <span className="text-sm font-medium text-gray-600">セグメント {segment.position}</span>
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
                          <span className="text-xs text-gray-500">{segment.hit_count} ヒット</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleOpenSegmentDialog(segment)}
                                disabled={!isPremiumFeaturesEnabled}
                                className={!isPremiumFeaturesEnabled ? "opacity-50 cursor-not-allowed" : ""}
                              >
                                {!isPremiumFeaturesEnabled ? <Lock className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                              </Button>
                            </div>
                          </TooltipTrigger>
                          {!isPremiumFeaturesEnabled && (
                            <TooltipContent>
                              <p>{PREMIUM_FEATURE_MESSAGES.SEGMENT_EDIT_DISABLED}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteSegment(segment.id)}
                                disabled={!isPremiumFeaturesEnabled}
                                className={!isPremiumFeaturesEnabled ? "opacity-50 cursor-not-allowed" : ""}
                              >
                                {!isPremiumFeaturesEnabled ? <Lock className="w-4 h-4" /> : <Trash2 className="w-4 h-4 text-red-500" />}
                              </Button>
                            </div>
                          </TooltipTrigger>
                          {!isPremiumFeaturesEnabled && (
                            <TooltipContent>
                              <p>{PREMIUM_FEATURE_MESSAGES.SEGMENT_DELETE_DISABLED}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
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
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">回答</span>
                      <div className="bg-blue-50 rounded-lg p-3 mt-1">
                        <p className="text-sm text-blue-900 leading-relaxed">
                          {segment.answer}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {segment.keywords && segment.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs font-medium text-gray-600 mr-2">キーワード:</span>
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
              <h3 className="mt-2 text-lg font-medium text-gray-900">セグメントが見つかりません</h3>
              <p className="mt-1 text-sm text-gray-500">
                このドキュメントはまだセグメント化されていないか、セグメントが処理中です。
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {segments && segments.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                ページ {currentPage} （{segments.length}件のセグメントを表示）
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  前のページ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!segments || segments.length < segmentsPerPage}
                  className="flex items-center"
                >
                  次のページ
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ドキュメントを削除</DialogTitle>
              <DialogDescription>
                本当に"{document.name}"を削除しますか？この操作は元に戻すことができず、データセットからドキュメントが完全に削除されます。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteDocument}
                disabled={deleteDocumentMutation.isPending}
              >
                {deleteDocumentMutation.isPending ? '削除中...' : 'ドキュメントを削除'}
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
