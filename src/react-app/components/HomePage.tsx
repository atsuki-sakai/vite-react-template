import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Database, Plus, Trash2, MoreVertical, Copy, ExternalLink, FileText, Type as Letters, Calendar, Clock, RefreshCw, MessageSquare
} from "lucide-react";
import { DifyDataset } from "../../shared/schemas";
import { toast } from "sonner";
import { formatDate } from "../../shared/utils";
import { useDifyApi } from "../../shared/hooks/useDifyApi";

  export default function HomePage() {
    const navigate = useNavigate();
    const { useKnowledgeList } = useDifyApi();
    const { data: knowledge, isLoading: loadingKnowledge, refetch: refetchKnowledge } = useKnowledgeList();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState("");
  const [newDatasetDescription, setNewDatasetDescription] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [datasetToDelete, setDatasetToDelete] = useState<DifyDataset | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");


  const resetCreateForm = () => {
    setNewDatasetName("");
    setNewDatasetDescription("");
    setCreateError(null);
  };

  const createDataset = async () => {
    if (!newDatasetName.trim()) return;
    setCreateLoading(true);
    setCreateError(null);
    try {
      const response = await fetch("/api/datasets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDatasetName,
          description: newDatasetDescription,
          permission: "only_me",
        }),
      });
      const data = await response.json();
      if (data.error) {
        setCreateError(data.error);
        toast.error("作成に失敗しました", {
          description: data.error,
        });
      } else {
        toast.success("データセットを作成しました", {
          description: newDatasetName,
        });
        setIsCreateDialogOpen(false);
        resetCreateForm();
        refetchKnowledge();
        // 必要なら作成直後に詳細へ遷移する
        // navigate(`/datasets/${data.id}`);
      }
    } catch {
      setCreateError("作成中にエラーが発生しました。");
      toast.error("ネットワークエラー", {
        description: "データセットを作成できませんでした。",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteDataset = (dataset: DifyDataset) => {
    setDatasetToDelete(dataset);
    setDeleteConfirmText("");
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteDataset = async () => {
    if (!datasetToDelete) return;
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/datasets/${datasetToDelete.id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.error) {
        toast.error("削除に失敗しました", {
          description: data.error,
        });
      } else {
        toast.success("データセットを削除しました", {
          description: datasetToDelete.name,
        });
        refetchKnowledge();
      }
    } catch {
      toast.error("ネットワークエラー", {
        description: "データセットを削除できませんでした。",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDatasetToDelete(null);
      setDeleteLoading(false);
      setDeleteConfirmText("");
    }
  };

  const isDeleteConfirmOk = useMemo(() => {
    if (!datasetToDelete) return false;
    return deleteConfirmText.trim() === datasetToDelete.name.trim();
  }, [deleteConfirmText, datasetToDelete]);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-screen-2xl">
      <div className="flex flex-col space-y-8">
        {/* Header */}
        <div className="text-center py-6">
         
          <div className="mt-6">
            <Button
              onClick={() => navigate('/chat-history')}
            
              className="flex items-center space-x-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>チャット履歴を表示</span>
            </Button>
          </div>
        </div>


        {/* Content */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-3xl font-semibold tracking-tight">学習データセット</h2>
            <div className="flex space-x-2">
              <Button
                onClick={async () => {
                  try {
                    await refetchKnowledge();
                    toast.success('データセットリストを更新しました');
                  } catch (error) {
                    console.error('Failed to refresh knowledge list:', error);
                    toast.error('更新に失敗しました');
                  }
                }}
                disabled={loadingKnowledge}
                variant="outline"
                className="flex items-center space-x-2"
                aria-label="Refresh datasets"
              >
                <RefreshCw className={`w-4 h-4 ${loadingKnowledge ? "animate-spin" : ""}`} />
                <span>{loadingKnowledge ? "読み込み中..." : "更新"}</span>
              </Button>

              {/* Create dataset */}
              <Dialog open={isCreateDialogOpen} onOpenChange={(v) => {
                setIsCreateDialogOpen(v);
                if (!v) resetCreateForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>データセット作成</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>新しいデータセットを作成</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="dataset-name" className="block text-sm font-medium mb-2">
                        データセット名
                      </label>
                      <Input
                        id="dataset-name"
                        placeholder="データセット名を入力"
                        value={newDatasetName}
                        onChange={(e) => setNewDatasetName(e.target.value)}
                        aria-invalid={!!createError}
                      />
                    </div>
                    <div>
                      <label htmlFor="dataset-description" className="block text-sm font-medium mb-2">
                        説明
                      </label>
                      <Textarea
                        id="dataset-description"
                        placeholder="データセットの説明を入力"
                        value={newDatasetDescription}
                        onChange={(e) => setNewDatasetDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    {createError && (
                      <p className="text-sm text-red-600">{createError}</p>
                    )}
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsCreateDialogOpen(false);
                          resetCreateForm();
                        }}
                      >
                        キャンセル
                      </Button>
                      <Button
                        onClick={createDataset}
                        disabled={!newDatasetName.trim() || createLoading}
                      >
                        {createLoading ? "作成中..." : "データセット作成"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Delete Confirmation Dialog */}
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>データセットの削除</DialogTitle>
                    <DialogDescription>
                      以下のデータセットを削除します。この操作は取り消せません。
                      <br />
                      <span className="font-medium text-gray-900">
                        {datasetToDelete?.name}
                      </span>
                      <br />
                      確認のため、データセット名を入力してください。
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input
                      placeholder="確認のためデータセット名を入力"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      aria-label="Confirm dataset name"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDeleteDialogOpen(false);
                        setDatasetToDelete(null);
                        setDeleteConfirmText("");
                      }}
                    >
                      キャンセル
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={confirmDeleteDataset}
                      disabled={!isDeleteConfirmOk || deleteLoading}
                    >
                      {deleteLoading ? "削除中..." : "データセット削除"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Grid */}
          {loadingKnowledge ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 flex flex-col">
                  <div className="p-6 flex-grow">
                    <div className="flex justify-between items-start mb-3">
                      <Skeleton className="h-6 w-3/5" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-5/6 mb-4" />
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-full col-span-2" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 rounded-b-lg mt-auto">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : knowledge && knowledge.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {knowledge.map((dataset) => (
                <div
                  key={dataset.id}
                  className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-300 flex flex-col"
                >
                  <div
                    className="p-6 cursor-pointer flex-grow"
                    onClick={() => navigate(`/datasets/${dataset.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") navigate(`/datasets/${dataset.id}`);
                    }}
                    tabIndex={0}
                    aria-label={`Open details for ${dataset.name}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 truncate pr-2 flex items-center">
                        <Database className="w-5 h-5 mr-2 text-indigo-600 flex-shrink-0" />
                        <span className="truncate">{dataset.name}</span>
                      </h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Open dataset actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => navigate(`/datasets/${dataset.id}`)}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            詳細を開く
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async () => {
                              await navigator.clipboard.writeText(dataset.id);
                              toast.success("Dataset ID copied to clipboard");
                            }}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            IDをコピー
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDeleteDataset(dataset)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            削除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 h-10 line-clamp-2">{dataset.description || "説明が提供されていません。"}</p>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-gray-700 mb-4">
                      <div className="flex items-center space-x-2" title="Document Count">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span>{dataset.document_count ?? 0} ドキュメント</span>
                      </div>
                      <div className="flex items-center space-x-2" title="Word Count">
                        <Letters className="w-4 h-4 text-gray-500" />
                        <span>{(dataset.word_count ?? 0).toLocaleString()} ワード</span>
                      </div>
                      
                      
                    
                    </div>
                  </div>

                  <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 rounded-b-lg mt-auto">
                    <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-2" title={`Created at: ${formatDate(dataset.created_at)}`}>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(dataset.created_at)}</span>
                      </div>
                      <div className="flex items-center space-x-2" title={`Last updated: ${formatDate(dataset.updated_at ?? 0)}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDate(dataset.updated_at ?? 0)}</span>
                      </div>
                      
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 col-span-full">
              <Database className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">データセットが見つかりません</h3>
              <p className="mt-1 text-sm text-gray-500">
                データセットを更新するか、新しいものを作成して始めましょう。
              </p>
              <div className="mt-6">
                <Button onClick={() => setIsCreateDialogOpen(true)} className="inline-flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  データセット作成
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
