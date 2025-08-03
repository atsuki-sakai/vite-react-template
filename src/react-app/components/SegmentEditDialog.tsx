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
          <DialogTitle>{segment ? 'Edit Segment' : 'Create Segment'}</DialogTitle>
          <DialogDescription>
            {segment ? 'Edit the details of this segment.' : 'Create a new segment for this document.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="content">Content</label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter segment content"
              className="h-32"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="answer">Answer (optional)</label>
            <Textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter an answer for Q&A"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="keywords">Keywords (comma-separated)</label>
            <Input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g., keyword1, keyword2"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
