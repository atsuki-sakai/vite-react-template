import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatHistory } from '../../shared/hooks/useChatHistory';
import { useDifyApi } from '../../shared/hooks/useDifyApi';
import { chatService } from '../../services/ChatService';
import { ChatMessage } from '../../shared/schemas';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { Loader2, MessageSquare, User, Calendar, Image, RefreshCcw, ArrowLeft, Edit2, Check, X, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

const ChatHistory: React.FC = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [conversationId, setConversationId] = useState('');
  const [userId, setUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMessages, setSelectedMessages] = useState<Set<number>>(new Set());
  const [editingMessage, setEditingMessage] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [selectedDatasetId, setSelectedDatasetId] = useState('');

  const { useKnowledgeList, createDocumentByText } = useDifyApi();
  const { data: datasets, isLoading: isDatasetsLoading } = useKnowledgeList(1, 100);

  const { data, isLoading, error, refetch } = useChatHistory({
    limit,
    offset: currentPage * limit,
    conversation_id: conversationId || undefined,
    user_id: userId || undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  });

  useEffect(() => {
    setSelectedMessages(new Set());
  }, [currentPage, limit, conversationId, userId, startDate, endDate]);

  console.log(data);

  const handleNextPage = () => {
    if (data?.data && (currentPage + 1) * limit < data.data.total) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const resetFilters = () => {
    setConversationId('');
    setUserId('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(0);
  };

  const toggleMessageSelection = useCallback((messageId: number) => {
    setSelectedMessages(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(messageId)) {
        newSelected.delete(messageId);
      } else {
        newSelected.add(messageId);
      }
      return newSelected;
    });
  }, []);

  const toggleAllMessages = useCallback(() => {
    if (!data?.data?.messages) return;
    
    const allCurrentMessageIds = data.data.messages.map(msg => msg.id);
    const allSelected = allCurrentMessageIds.every(id => selectedMessages.has(id));
    
    setSelectedMessages(allSelected ? new Set() : new Set(allCurrentMessageIds));
  }, [data?.data?.messages, selectedMessages]);

  const startEditing = (messageId: number, currentContent: string) => {
    setEditingMessage(messageId);
    setEditContent(currentContent);
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const saveEdit = useCallback(async (messageId: number) => {
    try {
      await chatService.updateChatMessage(messageId, editContent);
      toast.success('AI応答を更新しました');
      setEditingMessage(null);
      setEditContent('');
      refetch();
    } catch {
      toast.error('更新に失敗しました');
    }
  }, [editContent, refetch]);

  const deleteSelectedMessages = useCallback(async () => {
    if (selectedMessages.size === 0) return;
    
    try {
      await chatService.deleteChatMessages(Array.from(selectedMessages));
      toast.success(`${selectedMessages.size}件のメッセージを削除しました`);
      setSelectedMessages(new Set());
      refetch();
    } catch {
      toast.error('削除に失敗しました');
    }
  }, [selectedMessages, refetch]);

  const addSelectedMessagesToDataset = useCallback(async () => {
    if (selectedMessages.size === 0 || !selectedDatasetId) return;
    
    try {
      const selectedMessagesData = data?.data?.messages.filter(msg => selectedMessages.has(msg.id)) || [];
      
      if (selectedMessagesData.length === 0) {
        toast.error('選択されたメッセージが見つかりません');
        return;
      }

      const chatContent = selectedMessagesData
        .map(msg => {
          const parts = [];
          if (msg.message_content) {
            parts.push(`【ユーザーメッセージ】\n${msg.message_content}`);
          }
          if (msg.dify_response) {
            parts.push(`【AI応答】\n${msg.dify_response}`);
          }
          return parts.join('\n\n');
        })
        .join('\n\n***\n\n');

      const documentName = `チャット履歴_${new Date().toISOString().split('T')[0]}_${selectedMessages.size}件`;
      
      await createDocumentByText.mutateAsync({
        datasetId: selectedDatasetId,
        request: {
          name: documentName.trim(),
          text: chatContent.trim(),
          indexing_technique: 'high_quality' as const,
          doc_form: 'text_model' as const,
          doc_language: 'Japanese',
          process_rule: {
            mode: 'custom' as const,
            rules: {
              pre_processing_rules: [
                { id: 'remove_extra_spaces', enabled: true },
                { id: 'remove_urls_emails', enabled: true }
              ],
              segmentation: {
                separator: '***' as const,
                max_tokens: 1000,
                chunk_overlap: 50
              }
            }
          }
        }
      });

      toast.success(`${selectedMessages.size}件のチャットをデータセットに追加しました`);
      setSelectedMessages(new Set());
      setSelectedDatasetId('');
    } catch (error) {
      console.error('データセット追加エラー:', error);
      toast.error('データセットへの追加に失敗しました');
    }
  }, [selectedMessages, selectedDatasetId, data?.data?.messages, createDocumentByText]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMessageTypeColor = (messageType: string) => {
    switch (messageType) {
      case 'text':
        return 'bg-blue-100 text-blue-800';
      case 'image':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>エラーが発生しました: {error.message}</p>
              <Button onClick={() => refetch()} className="mt-4">
                再試行
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-start gap-2">
       
        <Button variant="outline" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
          <span>戻る</span>
        </Button>
        <Button size="sm" onClick={() => refetch()}>
          <RefreshCcw className="w-4 h-4" />
          <span>更新</span>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            チャット履歴
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* フィルター */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">会話ID</label>
              <Input
                placeholder="会話IDでフィルター"
                value={conversationId}
                onChange={(e) => {
                  setConversationId(e.target.value);
                  setCurrentPage(0);
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ユーザーID</label>
              <Input
                placeholder="ユーザーIDでフィルター"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  setCurrentPage(0);
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">開始日</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(0);
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">終了日</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(0);
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">表示件数</label>
              <Select value={limit.toString()} onValueChange={(value) => {
                setLimit(parseInt(value));
                setCurrentPage(0);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10件</SelectItem>
                  <SelectItem value="20">20件</SelectItem>
                  <SelectItem value="50">50件</SelectItem>
                  <SelectItem value="100">100件</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={resetFilters} variant="outline" className="w-full">
                フィルターをリセット
              </Button>
            </div>
          </div>

          {/* データ読み込み中 */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">読み込み中...</span>
            </div>
          )}

          {/* メッセージ一覧 */}
          {data?.data && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">
                  {data.data.total}件中 {data.data.offset + 1}-{Math.min(data.data.offset + data.data.limit, data.data.total)}件を表示
                  {selectedMessages.size > 0 && (
                    <span className="ml-2 text-blue-600">
                      ({selectedMessages.size}件選択中)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={data.data.messages.length > 0 && data.data.messages.every(msg => selectedMessages.has(msg.id))}
                    onCheckedChange={toggleAllMessages}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600 mr-4">全選択</span>
                  {selectedMessages.size > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={deleteSelectedMessages}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        選択項目を削除
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* データセット追加フォーム */}
              {selectedMessages.size > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">
                          選択したチャット({selectedMessages.size}件)をデータセットに追加
                        </label>
                        <Select value={selectedDatasetId} onValueChange={setSelectedDatasetId}>
                          <SelectTrigger>
                            <SelectValue placeholder="データセットを選択してください" />
                          </SelectTrigger>
                          <SelectContent>
                            {isDatasetsLoading ? (
                              <SelectItem value="loading" disabled>
                                読み込み中...
                              </SelectItem>
                            ) : (
                              datasets?.map((dataset) => (
                                <SelectItem key={dataset.id} value={dataset.id}>
                                  {dataset.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={addSelectedMessagesToDataset}
                        disabled={!selectedDatasetId || createDocumentByText.isPending}
                        variant="default"
                      >
                        {createDocumentByText.isPending ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-1" />
                        )}
                        データセットに追加
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3">
                {data.data.messages.map((message: ChatMessage) => (
                  <Card key={message.id} className={`border ${selectedMessages.has(message.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedMessages.has(message.id)}
                          onCheckedChange={() => toggleMessageSelection(message.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              ID: {message.id}
                            </Badge>
                            <Badge className={`text-xs ${getMessageTypeColor(message.message_type)}`}>
                              {message.message_type}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <User className="h-3 w-3" />
                              {message.user_id}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <MessageSquare className="h-3 w-3" />
                              {message.conversation_id}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(message.created_at)}
                            </div>
                          </div>

                          {message.message_content && (
                            <div className="bg-gray-50 p-3 rounded-md">
                              <p className="text-sm whitespace-pre-wrap">
                                {message.message_content}
                              </p>
                            </div>
                          )}

                          {message.image_url && (
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                              <Image className="h-4 w-4" />
                              <a 
                                href={message.image_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                画像を表示
                              </a>
                            </div>
                          )}

                          {message.dify_response && (
                            <div className="bg-blue-50 p-3 rounded-md border-l-4 border-blue-500">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-blue-900">AI応答:</p>
                                {editingMessage !== message.id && (
                                  <Button
                                    onClick={() => startEditing(message.id, message.dify_response || '')}
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              {editingMessage === message.id ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="min-h-[100px] text-sm"
                                    placeholder="AI応答を編集..."
                                  />
                                  <div className="flex items-center gap-2">
                                    <Button
                                      onClick={() => saveEdit(message.id)}
                                      variant="default"
                                      size="sm"
                                    >
                                      <Check className="h-3 w-3 mr-1" />
                                      保存
                                    </Button>
                                    <Button
                                      onClick={cancelEditing}
                                      variant="outline"
                                      size="sm"
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      キャンセル
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-blue-800 whitespace-pre-wrap">
                                  {message.dify_response}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* ページネーション */}
              <div className="flex items-center justify-between pt-4">
                <Button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  variant="outline"
                >
                  前のページ
                </Button>
                <span className="text-sm text-gray-600">
                  ページ {currentPage + 1} / {Math.ceil(data.data.total / limit)}
                </span>
                <Button
                  onClick={handleNextPage}
                  disabled={(currentPage + 1) * limit >= data.data.total}
                  variant="outline"
                >
                  次のページ
                </Button>
              </div>
            </>
          )}

          {/* データなし */}
          {data?.data && data.data.messages.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>該当するメッセージが見つかりませんでした。</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatHistory;