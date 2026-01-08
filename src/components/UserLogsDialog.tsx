import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertTriangle, Globe, Calendar as CalendarIcon, X, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User } from '../types';
import { API_ENDPOINTS } from '@/config/api';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import * as XLSX from 'xlsx';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface UserLog {
  id: number;
  created_at: string;
  user_id: string;
  action_type: string;
  path: string;
  details: string;
  ip_address: string;
}

interface UserLogsDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserLogsDialog = ({ user, open, onOpenChange }: UserLogsDialogProps) => {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) {
      const fetchLogs = async () => {
        setIsLoading(true);
        try {
          const formData = new FormData();
          formData.append('user_id', user.id);

          const response = await fetch(API_ENDPOINTS.GET_USER_LEVEL_LOGS_ONCRM, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          if (result.success) {
            console.log(result.data)
            setLogs(result.data);
          } else {
            throw new Error(result.message || 'Failed to fetch logs.');
          }
        } catch (error: any) {
          toast({
            title: 'Error Fetching Logs',
            description: error.message,
            variant: 'destructive',
          });
          setLogs([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchLogs();
    }
  }, [open, user, toast]);

  const filteredLogs = useMemo(() => {
    if (!dateRange?.from) {
      return logs;
    }
    const toDate = dateRange.to ? new Date(dateRange.to) : new Date();
    // Set time to end of day for 'to' date to include all logs from that day
    toDate.setHours(23, 59, 59, 999);

    return logs.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate >= dateRange.from! && logDate <= toDate;
    });
  }, [logs, dateRange]);

  const handleExport = () => {
    if (filteredLogs.length === 0) {
      toast({
        title: 'No Logs to Export',
        description: 'There are no logs matching the current filter criteria.',
        variant: 'destructive',
      });
      return;
    }

    const dataToExport = filteredLogs.map(log => ({
      'Date': new Date(log.created_at).toLocaleString(),
      'Action Type': log.action_type,
      'Path': log.path,
      'Details': log.details,
      'IP Address': log.ip_address,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'User Logs');

    // Generate a filename and trigger download
    const userName = user.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    XLSX.writeFile(workbook, `user_logs_${userName}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Activity Logs for {user.name}</DialogTitle>
          <DialogDescription>
            Showing {filteredLogs.length} of {logs.length} activities performed by the user.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <div className="flex items-center gap-2">
            {dateRange && (
              <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)}>
                <X className="h-4 w-4 mr-1" />
                Reset Filter
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[60vh] p-1">
          <div className="pr-4 space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Loading logs...</p>
              </div>
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <Card key={log.id} className="bg-muted/50">
                  <CardContent className="p-3 text-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{log.action_type}</Badge>
                        <span className="font-medium text-muted-foreground">{log.path}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-foreground mb-2">{log.details}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><Globe size={12} /><span>IP: {log.ip_address}</span></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p>No logs found for this user.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default UserLogsDialog;