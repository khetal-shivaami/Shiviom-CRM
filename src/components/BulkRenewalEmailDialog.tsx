import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, X, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Renewal, Customer, Partner, User } from '../types';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  isDefault: boolean;
}

interface BulkRenewalEmailDialogProps {
  renewals: Renewal[];
  customers: Customer[];
  partners: Partner[];
  users: User[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BulkRenewalEmailDialog = ({ 
  renewals, 
  customers, 
  partners, 
  users, 
  open, 
  onOpenChange 
}: BulkRenewalEmailDialogProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Bulk Renewal Reminder',
      subject: 'Renewal Reminders - {numberOfRenewals} Contracts (Total: {totalValue})',
      body: `Dear Team,

This is a bulk renewal notification for {numberOfRenewals} contracts with a combined value of {totalValue}.

Contract Summary:
{contractList}

Please review these renewals and take appropriate action.

Total Contract Value: {totalValue}
Upcoming Renewals: {upcomingCount}
Due Renewals: {dueCount}
Overdue Renewals: {overdueCount}

Best regards,
Renewal Management Team`,
      isDefault: true
    },
    {
      id: '2',
      name: 'Urgent Bulk Renewal',
      subject: 'URGENT: {numberOfRenewals} Renewals Require Immediate Attention',
      body: `URGENT: Multiple renewals require immediate attention.

{numberOfRenewals} contracts totaling {totalValue} need processing:

{contractList}

Please prioritize these renewals to avoid service interruptions.

Urgent regards,
Renewal Management Team`,
      isDefault: false
    }
  ]);

  const [emailData, setEmailData] = useState({
    subject: '',
    body: '',
    sendType: 'individual' // 'individual' or 'combined'
  });
  const [additionalEmails, setAdditionalEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const totalValue = renewals.reduce((sum, renewal) => sum + renewal.contractValue, 0);
  const upcomingCount = renewals.filter(r => r.status === 'upcoming').length;
  const dueCount = renewals.filter(r => r.status === 'due').length;
  const overdueCount = renewals.filter(r => r.status === 'overdue').length;

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  const getPartnerName = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    return partner ? partner.name : 'Unknown Partner';
  };

  const generateContractList = () => {
    return renewals.map(renewal => {
      const customerName = getCustomerName(renewal.customerId);
      const partnerName = getPartnerName(renewal.partnerId);
      return `- ${customerName} (${partnerName}) - ₹${renewal.contractValue.toLocaleString('en-IN')} - Due: ${renewal.renewalDate.toLocaleDateString()} - Status: ${renewal.status}`;
    }).join('\n');
  };

  const replaceBulkPlaceholders = (text: string) => {
    return text
      .replace(/{numberOfRenewals}/g, renewals.length.toString())
      .replace(/{totalValue}/g, `₹${totalValue.toLocaleString('en-IN')}`)
      .replace(/{contractList}/g, generateContractList())
      .replace(/{upcomingCount}/g, upcomingCount.toString())
      .replace(/{dueCount}/g, dueCount.toString())
      .replace(/{overdueCount}/g, overdueCount.toString());
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setEmailData({
        ...emailData,
        subject: replaceBulkPlaceholders(template.subject),
        body: replaceBulkPlaceholders(template.body)
      });
    }
  };

  useEffect(() => {
    if (open && !selectedTemplate) {
      const defaultTemplate = templates.find(t => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate.id);
        setEmailData({
          ...emailData,
          subject: replaceBulkPlaceholders(defaultTemplate.subject),
          body: replaceBulkPlaceholders(defaultTemplate.body)
        });
      }
    }
  }, [open, selectedTemplate, templates, renewals]);

  const addEmail = () => {
    if (emailInput && emailInput.includes('@') && !additionalEmails.includes(emailInput)) {
      setAdditionalEmails([...additionalEmails, emailInput]);
      setEmailInput('');
    }
  };

  const removeEmail = (email: string) => {
    setAdditionalEmails(additionalEmails.filter(e => e !== email));
  };

  const handleSendEmail = async () => {
    setIsLoading(true);
    
    try {
      if (emailData.sendType === 'individual') {
        // Send individual emails to each customer
        for (const renewal of renewals) {
          const customer = customers.find(c => c.id === renewal.customerId);
          if (customer) {
            console.log('Sending individual email to:', customer.email);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      } else {
        // Send combined email to all recipients
        const allEmails = [
          ...renewals.map(r => customers.find(c => c.id === r.customerId)?.email).filter(Boolean),
          ...additionalEmails
        ];
        console.log('Sending bulk email to:', allEmails);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      toast({
        title: "Bulk Emails Sent Successfully",
        description: `Sent ${emailData.sendType === 'individual' ? renewals.length : 1} email(s) for ${renewals.length} renewals`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send bulk emails. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedTemplate('');
    setAdditionalEmails([]);
    setEmailInput('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users size={20} />
            Send Bulk Renewal Notifications ({renewals.length} renewals)
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Renewal Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold">{renewals.length}</p>
              <p className="text-sm text-muted-foreground">Total Renewals</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{upcomingCount}</p>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{dueCount}</p>
              <p className="text-sm text-muted-foreground">Due</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
          </div>

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

          <div>
            <Label htmlFor="send-type">Email Type</Label>
            <Select value={emailData.sendType} onValueChange={(value) => setEmailData({ ...emailData, sendType: value })}>
              <SelectTrigger id="send-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual emails to each customer</SelectItem>
                <SelectItem value="combined">Single email to all recipients</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Additional Recipients</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Add additional email addresses"
                onKeyPress={(e) => e.key === 'Enter' && addEmail()}
              />
              <Button onClick={addEmail} variant="outline" size="sm">
                Add
              </Button>
            </div>
            {additionalEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {additionalEmails.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1">
                    {email}
                    <X size={12} className="cursor-pointer" onClick={() => removeEmail(email)} />
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
              {isLoading ? 'Sending...' : `Send ${emailData.sendType === 'individual' ? renewals.length : '1'} Email(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkRenewalEmailDialog;