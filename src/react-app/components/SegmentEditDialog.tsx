import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DifySegment, CreateSegmentRequest } from '../../shared/schemas';

interface SegmentEditDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  segment: DifySegment | null;
  onSubmit: (data: CreateSegmentRequest) => void;
  isSubmitting: boolean;
}

export default function SegmentEditDialog({ isOpen, onOpenChange, segment, onSubmit, isSubmitting }: SegmentEditDialogProps) {
  const [content, setContent] = useState('');
  const [answer, setAnswer] = useState('');
  const [keywords, setKeywords] = useState('');

  useEffect(() => {
    if (segment) {
      setContent(segment.content);
      setAnswer(segment.answer || '');
      setKeywords(segment.keywords?.join(', ') || '');
    } else {
      setContent('');
      setAnswer('');
      setKeywords('');
    }
  }, [segment]);

  const handleSubmit = () => {
    const keywordsArray = keywords.split(',').map(k => k.trim()).filter(k => k);
    const newSegment: CreateSegmentRequest = {
      segments: [{
        content,
        answer: answer || undefined,
        keywords: keywordsArray,
      }]
    };
    onSubmit(newSegment);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{segment ? 'セグメントを編集' : 'セグメントを作成'}</DialogTitle>
          <DialogDescription>
            {segment ? 'このセグメントの詳細を編集します。' : 'このドキュメント用の新しいセグメントを作成します。'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="content">内容</label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="セグメントの内容を入力してください"
              className="h-32"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="answer">回答（任意）</label>
            <Textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Q&A用の回答を入力してください"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="keywords">キーワード（カンマ区切り）</label>
            <Input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="例：キーワード1, キーワード2"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
