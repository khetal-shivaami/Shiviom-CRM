import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Product } from '../types';
import { File, Trash2, Share2, PlusCircle, ArrowLeft, Search } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface KnowledgeHubDialogProps {
  product: Product | null;
  currentUserRole: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateKnowledgeBase?: (productId: string, knowledgeBase: { title: string; link: string ; knowledgebase_id: string}[]) => void;
}

interface Partner {
  id: string;
  name: string;
  email: string;
}

interface SelectedDoc {
  link: string;
  name: string;
  knowledgebase_id: string;
}

const KnowledgeHubDialog = ({
  product,
  currentUserRole,
  open,
  onOpenChange,
  onUpdateKnowledgeBase,
}: KnowledgeHubDialogProps) => {
  // For a real implementation, you would fetch and update this from your backend.
  // Here we'll simulate it with component state.
  const [knowledgeBase, setKnowledgeBase] = useState(product?.knowledgeBase || []);
  const [isLoading, setIsLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<SelectedDoc[]>([]);
  const [isSharingMode, setIsSharingMode] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isFetchingPartners, setIsFetchingPartners] = useState(false);
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
  const [sharingPartnerId, setSharingPartnerId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchKnowledgeBase = async () => {
      if (product?.portal_prod_id) {
        setIsLoading(true);
        try {
          const response = await fetch(API_ENDPOINTS.GET_KNOWLEDGEBASE_DOCS, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prod_id: product.portal_prod_id }),
          });
          if (!response.ok) {
            throw new Error('Failed to fetch knowledge base');
          }
          const result = await response.json();
          console.log(result)
          if (result.success && Array.isArray(result.data)) {
            const formattedKb = result.data.map((item: { file_name: string; fileurl: string; knowledgebase_id: string; fileurl_download: string}) => ({
              title: item.file_name,
              link: item.fileurl,
              download_link: item.fileurl_download,
              knowledgebase_id: item.knowledgebase_id,
            }));
            setKnowledgeBase(formattedKb);
          } else {
            throw new Error('Invalid data format from API');
          }
        } catch (error) {
          console.error('Fetch error:', error);
          toast({
            title: "Error",
            description: 'Could not fetch knowledge base articles.',
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (open) {
      fetchKnowledgeBase();
      setSelectedDocs([]); // Reset selection when dialog opens
      setPartnerSearchQuery(''); // Reset search query
      setIsSharingMode(false); // Reset sharing mode when dialog opens/closes
    }
  }, [open, product, toast]);

  if (!product) return null;

  const isAdmin = currentUserRole === 'admin';

  const handleAdd = async () => {
    if (newTitle && newFile) {
      setIsUploading(true);
      console.log(product)
      const formData = new FormData();
      formData.append('title', newTitle);
      formData.append('knowledge_file', newFile);      
      formData.append('portal_prod_id', product.portal_prod_id); // Assuming product.id is the portal_prod_id
      formData.append('product_name', product.name); 
      formData.append('file_name', newFile.name);

      // This is a placeholder for your actual API endpoint
      ;

      try {
        const response = await fetch(API_ENDPOINTS.PRODUCT_DOCUMENTATION_UPLOAD, {
          method: 'POST',
          body: formData,
          // Headers might be needed for auth, etc.
          // headers: { 'Authorization': 'Bearer your_token' }
        });

        if (!response.ok) {
          throw new Error('File upload failed');
        }

        const newArticle = await response.json(); // Assuming the API returns the new article { title, link }

        // const updatedKb = [...knowledgeBase, newArticle];
        // setKnowledgeBase(updatedKb);
        // onUpdateKnowledgeBase?.(product.id, updatedKb);

        setNewTitle("");
        setNewFile(null);
        toast({
          title: "Success",
          description: "File uploaded and article added successfully.",
        });
        onOpenChange(false); // Close the dialog
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload Error",
          description: 'An error occurred while uploading the file. Please try again.',
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension && allowedExtensions.includes(fileExtension)) {
        setNewFile(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select a PDF, JPG, JPEG, or PNG file.",
          variant: "destructive",
        });
        setNewFile(null);
        e.target.value = ''; // Clear the file input
      }
    } else {
      setNewFile(null);
    }
  };

  const handleDelete = async ( fileName: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.DELETE_KNOWLEDGEBASE_DOCS, {
        method: 'POST', // Or 'DELETE' if your API is configured that way
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: fileName,
          productName: product.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete the document');
      }

      const updatedKb = knowledgeBase.filter(doc => doc.knowledgebase_id !== knowledgeId);
      setKnowledgeBase(updatedKb);

      toast({
        title: "Success",
        description: "Document deleted successfully.",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: "Error", description: "Failed to delete document.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleShare = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard.",
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast({ title: "Error", description: "Failed to copy link.", variant: "destructive" });
    }
  };

  const handleDocSelectionChange = (doc: { link: string; name: string }, checked: boolean | 'indeterminate') => {
    setSelectedDocs(prevSelected => {
      if (checked) {
        return [...prevSelected, doc];
      } else {
        return prevSelected.filter(selected => selected.link !== doc.link);
      }
    });
  };

  const handleShareSelected = async () => {
    if (selectedDocs.length > 0) {
      setIsSharingMode(true);
      setIsFetchingPartners(true);
      try {
        // Fetch partners from Supabase 'partners' table
        const { data: partnersData, error } = await supabase
          .from('partners')
          .select('id, name, email');

        if (error) {
          throw error;
        }

        if (partnersData) {
          setPartners(partnersData);
        } else {
          setPartners([]);
        }
      } catch (error) {
        console.error('Fetch partners error:', error);
        toast({
          title: "Error",
          description: "Could not fetch the partner list.",
          variant: "destructive",
        });
        setIsSharingMode(false); // Go back if fetching fails
      } finally {
        setIsFetchingPartners(false);
      }
    }
  };

  const handleOpenFilePopup = (url: string, title: string) => {
    if (!url) {
      toast({
        title: "Error",
        description: "File URL is not available to open.",
        variant: "destructive",
      });
      return;
    }
    const width = 800;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    window.open(
      url,
      title,
      `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
    );
  };

  const handleShareWithPartner = async (partner: Partner) => {
    setSharingPartnerId(partner.id);
    try {
      const payload = {
        productName: product.name,
        partnerName: partner.name,
        partnerEmail: partner.email,
        documents: selectedDocs.map(doc => doc.link),

      };

      const response = await fetch(API_ENDPOINTS.SHARE_KNOWLEDGEBASE_DOCS_PARTNER_CRM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to share documents with partner');
      }

      toast({
        title: "Success!",
        description: `Documents successfully shared with ${partner.name}.`,
      });
      setIsSharingMode(false); // Return to the document list
    } catch (error) {
      console.error('Share with partner error:', error);
      toast({
        title: "Sharing Error",
        description: "An error occurred while sharing the documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSharingPartnerId(null);
    }
  };

  const filteredPartners = partners.filter(partner =>
    partner.name.toLowerCase().includes(partnerSearchQuery.toLowerCase()) ||
    partner.email.toLowerCase().includes(partnerSearchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>Knowledge Hub: {product.name}</DialogTitle>
          <DialogDescription>
            Manage and share knowledge base documents for this product.
          </DialogDescription>
        </DialogHeader>
        {isSharingMode ? (
          <div>
            <div className="flex items-center mb-4">
              <Button variant="ghost" size="sm" onClick={() => setIsSharingMode(false)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h3 className="font-semibold text-lg ml-2">Share with a Partner</h3>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search partners by name or email..."
                className="pl-8"
                value={partnerSearchQuery}
                onChange={(e) => setPartnerSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
              {isFetchingPartners ? (
                <p className="text-sm text-muted-foreground text-center">Loading partners...</p>
              ) : filteredPartners.length > 0 ? (
                filteredPartners.map((partner) => (
                  <div key={partner.id} className="flex items-center justify-between gap-2 p-2 border rounded-md">
                    <div>
                      <p className="font-medium">{partner.name}</p>
                      <p className="text-sm text-muted-foreground">{partner.email}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleShareWithPartner(partner)}
                      disabled={sharingPartnerId === partner.id}
                    >
                      {sharingPartnerId === partner.id ? 'Sharing...' : <><Share2 className="h-4 w-4 mr-2" />Share</>}
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center">No partners found matching your search.</p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center">Loading documents...</p>
              ) : knowledgeBase.length > 0 ? (
                knowledgeBase.map((kb) => (
                <div key={kb.knowledgebase_id} className="flex items-center justify-between gap-2 p-2 border rounded-md">
                  <div className="flex items-center gap-3 flex-grow">
                    <Checkbox
                      id={`kb-select-${kb.knowledgebase_id}`}
                      checked={selectedDocs.some(doc => doc.link === kb.download_link)}
                      onCheckedChange={(checked) => handleDocSelectionChange({ link: kb.download_link, name: kb.title }, checked)}
                    />
                    <File className="h-5 w-5 text-muted-foreground" />
                    <button
                      onClick={() => handleOpenFilePopup(kb.link, kb.title)}
                      className="font-medium text-blue-600 hover:underline text-left break-words"
                      aria-label={`Open file ${kb.title}`}
                      title={kb.title}
                    >
                      {kb.title}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isAdmin && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete( kb.title)}
                        disabled={deletingId === kb.knowledgebase_id}
                      >{deletingId === kb.knowledgebase_id ? 'Deleting...' : <Trash2 className="h-4 w-4" />}</Button>
                    )}
                  </div>
                </div>
              ))) : (
                <p className="text-sm text-muted-foreground text-center">No knowledge base articles found.</p>
              )}
            </div>
            {knowledgeBase.length > 0 && (
              <DialogFooter className="sm:justify-start pt-2">
                <Button onClick={handleShareSelected} disabled={selectedDocs.length === 0}><Share2 className="h-4 w-4 mr-2" />Share Selected ({selectedDocs.length})</Button>
              </DialogFooter>
            )}
            {isAdmin && (
              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 pt-4 border-t">
                <Input placeholder="Article Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="md:col-span-1" />
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="md:col-span-1" />
                <Button onClick={handleAdd} disabled={!newTitle || !newFile || isUploading}><PlusCircle className="h-4 w-4 mr-2" />{isUploading ? 'Uploading...' : 'Add Article'}</Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default KnowledgeHubDialog;