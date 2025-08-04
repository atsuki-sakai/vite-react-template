import React, { useState } from 'react';
import { useChatHistory } from '../../shared/hooks/useChatHistory';
import { ChatMessage } from '../../shared/schemas';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, MessageSquare, User, Calendar, Image } from 'lucide-react';

const ChatHistory: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [limit, setLimit] = useState(50);
  const [conversationId, setConversationId] = useState('');
  const [userId, setUserId] = useState('');

  const { data, isLoading, error, refetch } = useChatHistory({
    limit,
    offset: currentPage * limit,
    conversation_id: conversationId || undefined,
    user_id: userId || undefined,
  });

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
    setCurrentPage(0);
  };

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            チャット履歴
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* フィルター */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <SelectItem value="25">25件</SelectItem>
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
              <div className="text-sm text-gray-600 mb-4">
                {data.data.total}件中 {data.data.offset + 1}-{Math.min(data.data.offset + data.data.limit, data.data.total)}件を表示
              </div>

              <div className="space-y-3">
                {data.data.messages.map((message: ChatMessage) => (
                  <Card key={message.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
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
                              <p className="text-sm font-medium text-blue-900 mb-1">AI応答:</p>
                              <p className="text-sm text-blue-800 whitespace-pre-wrap">
                                {message.dify_response}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-gray-500 flex items-center gap-1 ml-4">
                          <Calendar className="h-3 w-3" />
                          {formatDate(message.created_at)}
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