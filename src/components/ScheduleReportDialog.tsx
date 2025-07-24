import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Mail, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ScheduleReportDialogProps {
  reportType: string;
  reportName: string;
  children: React.ReactNode;
}

const ScheduleReportDialog = ({ reportType, reportName, children }: ScheduleReportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  
  const [formData, setFormData] = useState({
    frequency: '',
    dayOfWeek: '',
    dayOfMonth: '',
    time: '09:00',
    emailRecipients: [profile?.email || ''],
    reportFormat: 'pdf'
  });
  
  const [emailInput, setEmailInput] = useState('');

  const weekDays = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' }
  ];

  const handleAddEmail = () => {
    if (emailInput && !formData.emailRecipients.includes(emailInput)) {
      setFormData(prev => ({
        ...prev,
        emailRecipients: [...prev.emailRecipients, emailInput]
      }));
      setEmailInput('');
    }
  };

  const handleRemoveEmail = (email: string) => {
    setFormData(prev => ({
      ...prev,
      emailRecipients: prev.emailRecipients.filter(e => e !== email)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!profile?.user_id) {
        throw new Error('User not authenticated');
      }

      const scheduleData = {
        user_id: profile.user_id,
        report_type: reportType,
        report_name: reportName,
        frequency: formData.frequency,
        day_of_week: formData.frequency === 'weekly' ? parseInt(formData.dayOfWeek) : null,
        day_of_month: formData.frequency === 'monthly' ? parseInt(formData.dayOfMonth) : null,
        time: formData.time,
        email_recipients: formData.emailRecipients,
        report_format: formData.reportFormat
      };

      const { error } = await supabase
        .from('scheduled_reports')
        .insert([scheduleData]);

      if (error) throw error;

      toast({
        title: 'Report Scheduled Successfully',
        description: `${reportName} will be generated ${formData.frequency} and sent to ${formData.emailRecipients.length} recipient(s).`
      });

      setOpen(false);
      setFormData({
        frequency: '',
        dayOfWeek: '',
        dayOfMonth: '',
        time: '09:00',
        emailRecipients: [profile?.email || ''],
        reportFormat: 'pdf'
      });
    } catch (error) {
      console.error('Error scheduling report:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule report. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule Report: {reportName}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={formData.frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.frequency === 'weekly' && (
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select value={formData.dayOfWeek} onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfWeek: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {weekDays.map(day => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.frequency === 'monthly' && (
            <div className="space-y-2">
              <Label>Day of Month</Label>
              <Select value={formData.dayOfMonth} onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfMonth: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time
            </Label>
            <Input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Report Format</Label>
            <Select value={formData.reportFormat} onValueChange={(value) => setFormData(prev => ({ ...prev, reportFormat: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Recipients
            </Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEmail();
                  }
                }}
              />
              <Button type="button" onClick={handleAddEmail} variant="outline" size="sm">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.emailRecipients.map((email, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {email}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => handleRemoveEmail(email)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <strong>Schedule Preview:</strong> This report will be generated{' '}
            {formData.frequency === 'weekly' && formData.dayOfWeek && (
              <>every {weekDays.find(d => d.value === formData.dayOfWeek)?.label}</>
            )}
            {formData.frequency === 'monthly' && formData.dayOfMonth && (
              <>on the {formData.dayOfMonth}{ordinalSuffix(parseInt(formData.dayOfMonth))} of each month</>
            )}
            {formData.time && <> at {formatTime(formData.time)}</>}
            {formData.emailRecipients.length > 0 && (
              <> and sent to {formData.emailRecipients.length} recipient(s)</>
            )}
            .
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.frequency || formData.emailRecipients.length === 0}
            >
              {loading ? 'Scheduling...' : 'Schedule Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ordinalSuffix = (day: number) => {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export default ScheduleReportDialog;