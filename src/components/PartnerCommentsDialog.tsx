import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Loader2 } from 'lucide-react';
import { Partner, PartnerComment, User } from '../types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import { cn } from '@/lib/utils';

interface PartnerCommentsDialogProps {
  partner: Partner;
  trigger: React.ReactNode;
}

const getStageColor = (stage: string) => {
  switch (stage) {
    case 'outreach': return 'bg-blue-100 text-blue-800';
    case 'product-overview': return 'bg-purple-100 text-purple-800';
    case 'partner-program': return 'bg-green-100 text-green-800';
    case 'portal-activation': return 'bg-cyan-100 text-cyan-800';
    case 'kyc': return 'bg-yellow-100 text-yellow-800';
    case 'agreement': return 'bg-orange-100 text-orange-800';
    case 'onboarded': return 'bg-emerald-100 text-emerald-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return '1 day ago';
  if (diffInDays < 7) return `${diffInDays} days ago`;

  return date.toLocaleDateString();
};

export const PartnerCommentsDialog = ({ partner, trigger }: PartnerCommentsDialogProps) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<PartnerComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const logCrmAction = async (actiontype: string, details: string) => {
    if (!user?.id) {
        console.error("User ID not available for logging CRM action.");
        return;
    }
    try {
        const formData = new FormData();
        formData.append('userid', user.id);
        formData.append('actiontype', actiontype);
        formData.append('path', 'Partner Comments Dialog');
        formData.append('details', details);

        const response = await fetch(API_ENDPOINTS.STORE_INSERT_CRM_LOGS, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ message: `CRM log API request failed with status ${response.status}` }));
            throw new Error(errorResult.message);
        }
    } catch (error: any) {
        console.error("Error logging CRM action:", error.message);
    }
  };
  const fetchComments = async () => {
    if (!partner.portal_reseller_id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('partner_comments')
        .select('*')
        .eq('portal_reseller_id', partner.portal_reseller_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setComments((data || []).map(c => ({ ...c, created_at: new Date(c.created_at) })) as unknown as PartnerComment[]);
    } catch (error: any) {
      toast({ title: "Error fetching comments", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    setIsSubmitting(true);
    const commentToLog = newComment; // Capture comment before clearing state
    try {
      const creatorName = (profile?.first_name || profile?.last_name) ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : user.email;
      const { error } = await supabase.from('partner_comments').insert({
        partner_id: partner.id,
        portal_reseller_id: partner.portal_reseller_id,
        partner_name: partner.name,
        comment: commentToLog,
        created_by_name: creatorName,
        created_by: user.id,
      });
      if (error) throw error;
      toast({ title: "Comment Added" });
      setNewComment('');
      await fetchComments();
      const logDetails = `Added comment for partner ${partner.name} (ID: ${partner.portal_reseller_id}): "${commentToLog}"`;
      await logCrmAction("Add Partner Comment", logDetails);
    } catch (error: any) {
      toast({ title: "Error adding comment", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, partner.portal_reseller_id]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Comments for {partner.name}</DialogTitle>
          <DialogDescription>View and add general comments for this partner.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <ScrollArea className="h-64 border rounded-md p-4">
            {isLoading ? <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div> :
              comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map(comment => (
                    <div key={comment.id} className="p-3 bg-muted rounded-lg text-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{comment.created_by_name || 'User'}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.created_at)}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{comment.comment}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-center text-muted-foreground">No comments yet.</p>}
          </ScrollArea>
          <div className="space-y-2">
            <Label htmlFor="new-comment">Add a new comment</Label>
            <Textarea id="new-comment" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Type your comment here..." disabled={isSubmitting} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
          <Button onClick={handleAddComment} disabled={isSubmitting || !newComment.trim()}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : 'Add Comment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};