import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Mail, Pause, Play, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface ScheduledReport {
  id: string;
  report_type: string;
  report_name: string;
  frequency: 'weekly' | 'monthly';
  day_of_week?: number;
  day_of_month?: number;
  time: string;
  email_recipients: string[];
  report_format: string;
  status: 'active' | 'paused' | 'inactive';
  next_run_date?: string;
  last_run_date?: string;
  created_at: string;
}

const ScheduledReportsManager = () => {
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { profile } = useAuth();

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchScheduledReports();
  }, [profile]);

  const fetchScheduledReports = async () => {
    if (!profile?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScheduledReports((data || []) as ScheduledReport[]);
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scheduled reports.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (error) throw error;

      setScheduledReports(prev => 
        prev.map(report => 
          report.id === reportId ? { ...report, status: newStatus as any } : report
        )
      );

      toast({
        title: 'Success',
        description: `Report ${newStatus === 'active' ? 'resumed' : 'paused'} successfully.`
      });
    } catch (error) {
      console.error('Error updating report status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update report status.',
        variant: 'destructive'
      });
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled report?')) return;

    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      setScheduledReports(prev => prev.filter(report => report.id !== reportId));

      toast({
        title: 'Success',
        description: 'Scheduled report deleted successfully.'
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete scheduled report.',
        variant: 'destructive'
      });
    }
  };

  const getScheduleDescription = (report: ScheduledReport) => {
    if (report.frequency === 'weekly' && report.day_of_week !== undefined) {
      return `Every ${weekDays[report.day_of_week]} at ${formatTime(report.time)}`;
    }
    if (report.frequency === 'monthly' && report.day_of_month) {
      return `Monthly on day ${report.day_of_month} at ${formatTime(report.time)}`;
    }
    return 'Not configured';
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'inactive': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Scheduled Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading scheduled reports...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Scheduled Reports ({scheduledReports.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {scheduledReports.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Scheduled Reports</h3>
            <p className="text-muted-foreground">
              Start by scheduling a report from the available reports above.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scheduledReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{report.report_name}</div>
                      <div className="text-sm text-muted-foreground">{report.report_type}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="w-4 h-4" />
                      {getScheduleDescription(report)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="w-4 h-4" />
                      {report.email_recipients.length} recipient(s)
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{report.report_format.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {report.next_run_date ? (
                        <>
                          {format(new Date(report.next_run_date), 'MMM dd, yyyy')}
                          <br />
                          <span className="text-muted-foreground">
                            {format(new Date(report.next_run_date), 'h:mm a')}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Not scheduled</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {report.status === 'active' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateReportStatus(report.id, 'paused')}
                          title="Pause report"
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateReportStatus(report.id, 'active')}
                          title="Resume report"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteReport(report.id)}
                        title="Delete report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ScheduledReportsManager;