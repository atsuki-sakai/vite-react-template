import { useState } from "react";

import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, FileText, Trash2, Plus, Upload, ChevronDown, Settings, RefreshCcw } from "lucide-react";
import { DifyDocument } from "../../shared/schemas";
import { useDifyApi } from "../../shared/hooks/useDifyApi";
import { toast } from "sonner";
import { defaultProcessRule } from "../../services/constant";

export default function DatasetDetail() {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const { useDataset, useDocuments } = useDifyApi();

  const { data: dataset, isLoading: loadingDataset, refetch: refetchDataset } = useDataset(datasetId!);
  const { data: documents, isLoading: loadingDocuments, refetch: refetchDocuments } = useDocuments(dataset?.id ?? "");

  const [selectedDocument, setSelectedDocument] = useState<DifyDocument | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddDocumentDialogOpen, setIsAddDocumentDialogOpen] = useState(false);
  const [documentType, setDocumentType] = useState<'text' | 'file'>('text');
  const [documentName, setDocumentName] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Process rule states
  const [removeExtraSpaces, setRemoveExtraSpaces] = useState(true);
  const [removeUrlsEmails, setRemoveUrlsEmails] = useState(false);

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
      toast.success("データセットを削除しました");
    } catch (error) {
      console.error("Error deleting dataset:", error);
      toast.error("データセットの削除に失敗しました");
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
      toast.error('ドキュメント名を入力してください');
      return;
    }

    if (documentType === 'text' && !documentText.trim()) {
      toast.error('ドキュメントのテキストを入力してください');
      return;
    }

    if (documentType === 'file' && !selectedFile) {
      toast.error('ファイルを選択してください');
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
            indexing_technique: 'high_quality',
            doc_form: 'text_model',
            doc_language: 'Japanese',
            process_rule: defaultProcessRule(removeExtraSpaces, removeUrlsEmails)
          })
        });
      } else {
        const formData = new FormData();
        // Add the file under 'file' key as expected by Dify API
        formData.append('file', selectedFile!);
        
        const configData = {
          indexing_technique: 'high_quality',
          doc_form: 'text_model',
          doc_language: 'Japanese',
          process_rule: defaultProcessRule(removeExtraSpaces, removeUrlsEmails)
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
          throw new Error('サーバーからの空のレスポンス');
        }
        
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        toast.error('サーバーから無効なレスポンスが返されました。もう一度お試しください。');
        return;
      }
      
      if (!response.ok) {
        console.error("HTTP error:", response.status, response.statusText);
        console.error("API error response:", data);
        toast.error(`ドキュメントの作成に失敗しました: HTTP ${response.status} - ${data?.error || data?.message || '不明なエラー'}`);
      } else if (data.error) {
        console.error("Failed to create document:", data.error);
        toast.error(`ドキュメントの作成に失敗しました: ${data.error}`);
      } else {
        console.log("Document created:", data);
        setIsAddDocumentDialogOpen(false);
        refetchDocuments(); // Refresh the documents list
        refetchDataset(); // Refresh dataset info to update document count
      }
    } catch (error) {
      console.error("Error creating document:", error);
      toast.error('ドキュメントの作成中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsCreatingDocument(false);
    }
  };

  if (!dataset) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">データセットが見つかりません</h3>
          <p className="mt-1 text-sm text-gray-500">
            リクエストされたデータセットが見つかりませんでした。
          </p>
          <Button
            onClick={() => navigate('/')}
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
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDeleteDataset}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Dataset Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">データセット情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="font-medium text-gray-700">ドキュメント数:</span>
              <p className="text-2xl font-bold text-blue-600">{dataset.document_count}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">総単語数:</span>
              <p className="text-2xl font-bold text-green-600">{(dataset.word_count || 0).toLocaleString()}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">権限:</span>
              <p className="text-lg font-medium text-gray-900">{dataset.permission}</p>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">ドキュメント</h2>
            <div className="flex space-x-2">
              <Button
                onClick={() => {
                  refetchDocuments();
                  refetchDataset();
                  toast.success("ドキュメントを再読み込みしました");
                }}
                disabled={loadingDocuments || loadingDataset}
                variant="outline"
              >
                <RefreshCcw className={`w-4 h-4 mr-2 ${loadingDocuments || loadingDataset ? "animate-spin" : ""}`} />
                {loadingDocuments || loadingDataset ? "読み込み中..." : "再読み込み"}
              </Button>
              <Button 
                className="flex items-center space-x-2"
                onClick={handleAddDocument}
              >
                <Plus className="w-4 h-4" />
                <span>ドキュメント追加</span>
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
                          <span className="font-medium">文字数:</span> {dataset.word_count}
                        </div>
                        <div>
                          <span className="font-medium">トークン数:</span> {(doc.tokens || 0).toLocaleString()}
                        </div>
                        
                        <div>
                          <span className="font-medium">インデックス作成:</span>
                          <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                            doc.indexing_status === 'completed' ? 'bg-green-100 text-green-800' :
                            doc.indexing_status === 'processing' || doc.indexing_status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {doc.indexing_status === 'completed' ? '完了' :
                             doc.indexing_status === 'processing' ? '処理中' :
                             doc.indexing_status === 'waiting' ? '待機中' :
                             doc.indexing_status}
                          </span>
                        </div>
                      </div>
                    </div>
                   
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">ドキュメントが見つかりません</h3>
              <p className="mt-1 text-sm text-gray-500">
                このデータセットにドキュメントを追加して開始してください。
              </p>
            </div>
          )}
        </div>

        {/* Document Detail Section */}
        {selectedDocument && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">ドキュメント内容: {selectedDocument.name}</h2>
              <Button
                variant="outline"
                onClick={() => setSelectedDocument(null)}
              >
                閉じる
              </Button>
            </div>

            {loadingDocuments ? (
              <div className="text-center py-12">
                <p>ドキュメント内容を読み込み中...</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <span className="font-medium text-gray-700">文字数:</span>
                    <p className="text-lg font-semibold text-blue-600">{(selectedDocument.character_count || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">トークン数:</span>
                    <p className="text-lg font-semibold text-green-600">{(selectedDocument.tokens || 0).toLocaleString()}</p>
                  </div>
                </div>

                {selectedDocument.name ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">内容:</h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                        {selectedDocument.name}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">このドキュメントにはコンテンツがありません。</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Add Document Dialog */}
        <Dialog open={isAddDocumentDialogOpen} onOpenChange={setIsAddDocumentDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新しいドキュメントを追加</DialogTitle>
              <DialogDescription>
                "{dataset.name}"にテキストを入力またはファイルをアップロードして新しいドキュメントを追加します。
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
                  <span>テキスト</span>
                </Button>
                <Button
                  variant={documentType === 'file' ? 'default' : 'outline'}
                  onClick={() => setDocumentType('file')}
                  className="flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>ファイルアップロード</span>
                </Button>
              </div>

              {/* Document Name Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">ドキュメント名</label>
                <Input
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="ドキュメント名を入力"
                  className="w-full"
                />
              </div>

              {/* Text Input */}
              {documentType === 'text' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">テキスト内容</label>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">セグメントの区切り文字は<strong className="text-blue-500">***</strong>です。</p>
                    <Button variant="outline" size="sm" onClick={() => setDocumentText(documentText + '\n***')} className="mt-2">セグメントの区切り文字を追加</Button>
                  </div>
                  <Textarea
                    value={documentText}
                    onChange={(e) => setDocumentText(e.target.value)}
                    placeholder="ドキュメントのテキスト内容を入力..."
                    rows={8}
                    className="w-full"
                  />
                </div>
              )}

              {/* File Upload */}
              {documentType === 'file' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">ファイル</label>
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full"
                    accept=".txt,.md,.pdf,.doc,.docx"
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-500">
                      選択済み: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              )}

            
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">詳細設定</label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                      className="text-xs"
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      {showAdvancedSettings ? '設定を隠す' : '詳細設定を表示'}
                      <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>

                  {showAdvancedSettings && (
                    <div className="space-y-6 p-4 border rounded-lg bg-gray-50">
                      {/* Process Rules */}
                      <div className="space-y-4">
                        <h4 className="font-medium">処理ルール</h4>

                          <div className="space-y-4 p-3 border rounded-md bg-white">
                            <div className="space-y-3">
                              <h5 className="font-medium text-sm">前処理ルール</h5>
                              
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="remove-extra-spaces"
                                  checked={removeExtraSpaces}
                                  onCheckedChange={setRemoveExtraSpaces}
                                />
                                <Label htmlFor="remove-extra-spaces" className="text-sm">余分なスペースを削除</Label>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="remove-urls-emails"
                                  checked={removeUrlsEmails}
                                  onCheckedChange={setRemoveUrlsEmails}
                                />
                                <Label htmlFor="remove-urls-emails" className="text-sm">URL・メールアドレスを削除</Label>
                              </div>
                            </div>

                          </div>
                        
                      </div>

                     
                    </div>
                  )}
                </div>
       
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDocumentDialogOpen(false)}
                disabled={isCreatingDocument}
              >
                キャンセル
              </Button>
              <Button
                onClick={createDocument}
                disabled={isCreatingDocument}
              >
                {isCreatingDocument ? "作成中..." : "ドキュメント作成"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>データセットを削除</DialogTitle>
              <DialogDescription>
                "{dataset.name}"を削除してもよろしいですか？この操作は元に戻すことができず、このデータセット内のすべてのドキュメントとセグメントが完全に削除されます。
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
                onClick={confirmDeleteDataset}
              >
                データセット削除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}