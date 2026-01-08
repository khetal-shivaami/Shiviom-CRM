
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Renewal, Customer, Partner, User, Product } from '../types';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS } from '@/config/api';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  isDefault: boolean;
}

interface RenewalEmailDialogProps {
  renewal: Renewal;
  customer: Customer;
  partner: Partner;
  products: Product[];
  assignedEmployee?: User;
  children: React.ReactNode;
}

const RenewalEmailDialog = ({ 
  renewal, 
  customer, 
  partner, 
  products,
  assignedEmployee, 
  children 
}: RenewalEmailDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Standard Renewal',
      subject: 'Renewal Reminder - {customerName}',
      body: `Dear {partnerName},

I hope this email finds you well.

We wanted to reach out regarding your upcoming software renewal scheduled for {renewalDate}.

Renewal Details:
- Customer Domain: {customerName}
- Partner Company: {customerCompany}
- SKU Name: {skuName}
- Renewal Price: {contractValue}
- Renewal Date: {renewalDate}
- Status: {status}

We would appreciate the opportunity to discuss your renewal and any potential upgrades or changes to your current setup.

Please let us know if you have any questions or would like to schedule a call to discuss this further.

Best regards,
{employeeName}
{employeePhone}`,
      isDefault: true
    },
    {
      id: '2',
      name: 'Urgent Renewal',
      subject: 'URGENT: Renewal Required - {customerName}',
      body: `Dear {partnerName},

This is an urgent reminder regarding your software renewal.

Your contract is due for renewal on {renewalDate}, and we need your immediate attention to avoid any service interruption.

Renewal Details:
- Customer Domain: {customerName}
- Partner Company: {customerCompany}
- SKU Name: {skuName}
- Renewal Price: {contractValue}
- Renewal Date: {renewalDate}
- Status: {status}

Please contact us immediately to process your renewal.

Urgent regards,
{employeeName}
{employeePhone}`,
      isDefault: false
    },
    {
      id: '3',
      name: 'Friendly Follow-up',
      subject: 'Just checking in - {customerName} - Renewal',
      body: `Hi {partnerName},

I hope you're doing well! Just wanted to follow up on your upcoming renewal.

We noticed your contract for {contractValue} is coming up for renewal on {renewalDate}. No rush, but we'd love to discuss how we can continue supporting {customerCompany} going forward.

If you have any questions or would like to schedule a quick chat, just let me know!

Thanks,
{employeeName}
{employeePhone}`,
      isDefault: false
    }
  ]);

  const [emailData, setEmailData] = useState({
    to: partner.email,
    cc: assignedEmployee?.email || '',
    subject: '',
    body: ''
  });
  const [additionalCCs, setAdditionalCCs] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const renewalProduct = products.find(p => p.id === renewal.productId);

  const replacePlaceholders = (text: string) => {
    return text
      .replace(/{customerName}/g, customer.domainName)
      .replace(/{customerCompany}/g, partner.company)
      .replace(/{partnerName}/g, partner.name)
      .replace(/{contractValue}/g, `₹${renewal.contractValue.toLocaleString()}`)
      .replace(/{renewalDate}/g, renewal.renewalDate.toLocaleDateString())
      .replace(/{status}/g, renewal.status)
      .replace(/{employeeName}/g,`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Your Account Manager')
      .replace(/{employeePhone}/g, profile?.phone || '')
      .replace(/{skuName}/g, renewalProduct?.name || 'Unknown Product');
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setEmailData({
        ...emailData,
        subject: replacePlaceholders(template.subject),
        body: replacePlaceholders(template.body)
      });
    }
  };

  useEffect(() => {
    // Set default template on open
    if (open && !selectedTemplate) {
      const defaultTemplate = templates.find(t => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate.id);
        setEmailData({
          to: partner.email,
          cc: user?.email || '',
          subject: replacePlaceholders(defaultTemplate.subject),
          body: replacePlaceholders(defaultTemplate.body)
        });
      }
    }
  }, [open, selectedTemplate, templates, customer, partner, assignedEmployee, renewal]);

  const addCC = () => {
    if (ccInput && ccInput.includes('@') && !additionalCCs.includes(ccInput)) {
      setAdditionalCCs([...additionalCCs, ccInput]);
      setCcInput('');
    }
  };

  const removeCC = (email: string) => {
    setAdditionalCCs(additionalCCs.filter(cc => cc !== email));
  };

  const handleSendEmail = async () => {
    setIsLoading(true);
    
    const allCcs = [emailData.cc, ...additionalCCs].filter(Boolean); // Filter out any empty strings

    try {
      const templateName = templates.find(t => t.id === selectedTemplate)?.name;
      const payload = {
        to: emailData.to,
        cc: allCcs,
        subject: emailData.subject,
        body: emailData.body,
        renewalId: renewal.id,
        templateUsed: templateName,
      };

      const response = await fetch(API_ENDPOINTS.SEND_RENEWAL_NOTIFICATION_FRMCRM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // If you use token-based auth, include the Authorization header
          // 'Authorization': `Bearer ${user?.token}`, 
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      toast({
        title: "Email Sent Successfully",
        description: `Renewal notification sent to ${partner.name}.`,
      });

      setOpen(false);
    } catch (error) {
      console.error("Failed to send email:", error);
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedTemplate('');
    setAdditionalCCs([]);
    setCcInput('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail size={20} />
            Send Renewal Notification
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="template-select">Email Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger id="template-select">
                <SelectValue placeholder="Choose an email template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      {template.name}
                      {template.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                value={emailData.to}
                onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                placeholder="customer@email.com"
              />
            </div>
            <div>
              <Label htmlFor="cc">Primary CC</Label>
              <Input
                id="cc"
                value={emailData.cc}
                onChange={(e) => setEmailData({ ...emailData, cc: e.target.value })}
                placeholder="employee@company.com"
              />
            </div>
          </div>

          <div>
            <Label>Additional CCs</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value)}
                placeholder="Add more email addresses"
                onKeyPress={(e) => e.key === 'Enter' && addCC()}
              />
              <Button onClick={addCC} variant="outline" size="sm">
                Add
              </Button>
            </div>
            {additionalCCs.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {additionalCCs.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1">
                    {email}
                    <X size={12} className="cursor-pointer" onClick={() => removeCC(email)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={emailData.subject}
              onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={emailData.body}
              onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
              rows={12}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RenewalEmailDialog;
