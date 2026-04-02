import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { API_ENDPOINTS } from '@/config/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Calendar as CalendarIcon, Search, Users, DollarSign, IndianRupee, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';
import LogDetailDialog from './LogDetailDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export interface LicTransaction {
  username: string;
  reseller_name: string;
  tid: number;
  status: string;
  merchant_order_id: string | null;
  paymentid: string | null;
  order_amount: string;
  order_amount2: string | null;
  paymentmode: string;
  product_info: string;
  plan_name: string | null;
  domainname: string;
  numberOfUser: string;
  transactionExecutionDate: string;
  transactionFor: string;
  zohoinvoiceid: string;
  zoho_invoice_number: string;
  invoice_type: string | null;
  createdby: string;
  createdon: string;
  createdFrom: string | null;
  updatedby: string | null;
  updatedon: string | null;
  isdeleted: number;
  customer_id: string;
  subscription_id: string;
  skuid: string;
  sync_status: string;
  sync_status2: string;
  sync_status3: string;
  sync_status4: string;
  sync_status5: string;
  cron: string | null;
  cust_id: string;
  reseller_id: string;
}

export interface ApiLogDetail {
  ID: number;
  api_name: string;
  input_parameter: string;
  datetime: string;
  flag: string;
  api_status_code: string;
  message: string;
  error: string;
  ip_address: string;
}

export interface ExternalApiLogDetail {
  id: number;
  url: string;
  request: string;
  response: string;
  ip: string;
  response_status: string;
  created_at: string;
  reseller_id: string;
  reseller_email: string;
}

export interface LoginLogDetail {
  id: number;
  email: string;
  datetime: string;
  role: string;
}

const Transactions: React.FC = () => {
  const { toast } = useToast();
  const [licTransactions, setLicTransactions] = useState<LicTransaction[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiLogDetail[]>([]);
  const [externalApiLogs, setExternalApiLogs] = useState<ExternalApiLogDetail[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLogDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedLogData, setSelectedLogData] = useState<LicTransaction | ApiLogDetail | ExternalApiLogDetail | LoginLogDetail | null>(null);
  const [selectedLogType, setSelectedLogType] = useState<'licTransaction' | 'apiLog' | 'externalApiLog' | 'loginLog' | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [domainSearchTerm, setDomainSearchTerm] = useState('');
  const [invoiceFilter, setInvoiceFilter] = useState('all');

  const handleRowClick = (
    logData: LicTransaction | ApiLogDetail | ExternalApiLogDetail | LoginLogDetail,
    logType: 'licTransaction' | 'apiLog' | 'externalApiLog' | 'loginLog'
  ) => {
    setSelectedLogData(logData);
    setSelectedLogType(logType);
    setIsDetailDialogOpen(true);
  };

  const RECORDS_PER_PAGE = 20;

  const fetchAllLogs = useCallback(async (isManualRefresh = false) => {
    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.GET_ALL_LOGS_DETAILS_ONCRM, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(result);

      if (result.success && result.data) {
        console.log(result.data.lic_transactions)
        setLicTransactions(result.data.lic_transactions || []);
        setApiLogs(result.data.api_log_details || []);
        setExternalApiLogs(result.data.external_api_log_details || []);
        setLoginLogs(result.data.login_log_details || []);
        if (isManualRefresh) {
          toast({
            title: "Logs Refreshed",
            description: "The latest logs have been loaded.",
          });
        }
      } else {
        toast({
          title: "Error Fetching Logs",
          description: result.message || "Failed to fetch log data.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error Fetching Logs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllLogs();
  }, [fetchAllLogs]);

  const handleGetReport = () => {
    if (filteredLicTransactions.length === 0) {
      toast({
        title: "No Data to Report",
        description: "There are no additional license transactions matching the current filters.",
        variant: "destructive",
      });
      return;
    }

    const dataToExport = filteredLicTransactions.map(transaction => ({
      "Transaction ID": transaction.tid,
      "Status": transaction.status,
      "Merchant Order ID": transaction.merchant_order_id,
      "Payment ID": transaction.paymentid,
      "Order Amount": parseFloat(transaction.order_amount).toLocaleString('en-IN'),
      "Payment Mode": transaction.paymentmode,
      "Product Info": transaction.product_info,
      "Plan Name": transaction.plan_name,
      "Domain Name": transaction.domainname,
      "Number of Users": transaction.numberOfUser,
      "Transaction Execution Date": new Date(transaction.transactionExecutionDate).toLocaleString(),
      "Transaction For": transaction.transactionFor,
      "Created On": new Date(transaction.createdon.replace(/(\d{2})-(\d{2})-(\d{4})_(\d{2})-(\d{2})-(\d{2})/, '$3-$2-$1T$4:$5:$6')).toLocaleString(),
      "Created By": transaction.username || transaction.reseller_name,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Additional_License_Report");

    XLSX.writeFile(workbook, `additional_license_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);

    toast({ title: "Report Generated", description: "Additional License Transactions report downloaded successfully as CSV." });
  };

  const handleExportAll = () => {
    if (licTransactions.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no additional license transactions to export.",
        variant: "destructive",
      });
      return;
    }

    const dataToExport = licTransactions.map(transaction => ({
      "Transaction ID": transaction.tid,
      "Status": transaction.status,
      "Merchant Order ID": transaction.merchant_order_id,
      "Payment ID": transaction.paymentid,
      "Order Amount": parseFloat(transaction.order_amount).toLocaleString('en-IN'),
      "Payment Mode": transaction.paymentmode,
      "Product Info": transaction.product_info,
      "Plan Name": transaction.plan_name,
      "Domain Name": transaction.domainname,
      "Number of Users": transaction.numberOfUser,
      "Transaction Execution Date": new Date(transaction.transactionExecutionDate).toLocaleString(),
      "Transaction For": transaction.transactionFor,
      "Created On": new Date(transaction.createdon.replace(/(\d{2})-(\d{2})-(\d{4})_(\d{2})-(\d{2})-(\d{2})/, '$3-$2-$1T$4:$5:$6')).toLocaleString(),
      "Created By": transaction.username || transaction.reseller_name,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "All_License_Transactions");

    XLSX.writeFile(workbook, `all_license_transactions_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);

    toast({ title: "Export Successful", description: "All Additional License Transactions exported successfully as CSV." });
  };

  const filteredLicTransactions = useMemo(() => {
    let transactions = licTransactions;

    if (dateRange?.from) {
      const toDate = dateRange.to ? new Date(dateRange.to) : new Date();
      toDate.setHours(23, 59, 59, 999);
      transactions = transactions.filter(log => {
        const logDate = new Date(log.createdon.replace(/(\d{2})-(\d{2})-(\d{4})_(\d{2})-(\d{2})-(\d{2})/, '$3-$2-$1T$4:$5:$6'));
        return logDate >= dateRange.from! && logDate <= toDate;
      });
    }

    if (domainSearchTerm) {
      transactions = transactions.filter(log =>
        log.domainname.toLowerCase().includes(domainSearchTerm.toLowerCase())
      );
    }

    if (invoiceFilter === 'pending') {
      transactions = transactions.filter(t => !t.zoho_invoice_number);
    }

    return transactions;
  }, [licTransactions, dateRange, domainSearchTerm, invoiceFilter]);

  const filteredApiLogs = useMemo(() => {
    if (!dateRange?.from) return apiLogs;
    const toDate = dateRange.to ? new Date(dateRange.to) : new Date();
    toDate.setHours(23, 59, 59, 999);

    return apiLogs.filter(log => {
      const logDate = new Date(log.datetime);
      return logDate >= dateRange.from! && logDate <= toDate;
    });
  }, [apiLogs, dateRange]);

  const filteredExternalApiLogs = useMemo(() => {
    if (!dateRange?.from) return externalApiLogs;
    const toDate = dateRange.to ? new Date(dateRange.to) : new Date();
    toDate.setHours(23, 59, 59, 999);

    return externalApiLogs.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate >= dateRange.from! && logDate <= toDate;
    });
  }, [externalApiLogs, dateRange]);

  const filteredLoginLogs = useMemo(() => {
    if (!dateRange?.from) return loginLogs;
    const toDate = dateRange.to ? new Date(dateRange.to) : new Date();
    toDate.setHours(23, 59, 59, 999);

    return loginLogs.filter(log => {
      const logDate = new Date(log.datetime);
      return logDate >= dateRange.from! && logDate <= toDate;
    });
  }, [loginLogs, dateRange]);

  // Pagination states for each tab
  const [licTransactionsCurrentPage, setLicTransactionsCurrentPage] = useState(1);
  const [failedLicTransactionsCurrentPage, setFailedLicTransactionsCurrentPage] = useState(1);
  const [apiLogsCurrentPage, setApiLogsCurrentPage] = useState(1);
  const [externalApiLogsCurrentPage, setExternalApiLogsCurrentPage] = useState(1);
  const [loginLogsCurrentPage, setLoginLogsCurrentPage] = useState(1);

  const successfulLicTransactions = filteredLicTransactions.filter(t => t.status !== 'FAILED');
  // Pagination calculations for Additional License
  const licTransactionsTotalPages = Math.ceil(successfulLicTransactions.length / RECORDS_PER_PAGE);
  const licTransactionsIndexOfLastRecord = licTransactionsCurrentPage * RECORDS_PER_PAGE;
  const licTransactionsIndexOfFirstRecord = licTransactionsIndexOfLastRecord - RECORDS_PER_PAGE;
  const currentLicTransactions = successfulLicTransactions.slice(licTransactionsIndexOfFirstRecord, licTransactionsIndexOfLastRecord);

  // Pagination calculations for Failed License
  const failedLicTransactions = filteredLicTransactions.filter(t => t.status === 'FAILED');
  const failedLicTransactionsTotalPages = Math.ceil(failedLicTransactions.length / RECORDS_PER_PAGE);
  const failedLicTransactionsIndexOfLastRecord = failedLicTransactionsCurrentPage * RECORDS_PER_PAGE;
  const failedLicTransactionsIndexOfFirstRecord = failedLicTransactionsIndexOfLastRecord - RECORDS_PER_PAGE;
  const currentFailedLicTransactions = failedLicTransactions.slice(failedLicTransactionsIndexOfFirstRecord, failedLicTransactionsIndexOfLastRecord);

  // Pagination calculations for API Log Details
  const apiLogsTotalPages = Math.ceil(filteredApiLogs.length / RECORDS_PER_PAGE);
  const apiLogsIndexOfLastRecord = apiLogsCurrentPage * RECORDS_PER_PAGE;
  const apiLogsIndexOfFirstRecord = apiLogsIndexOfLastRecord - RECORDS_PER_PAGE;
  const currentApiLogs = filteredApiLogs.slice(apiLogsIndexOfFirstRecord, apiLogsIndexOfLastRecord);

  // Pagination calculations for External API Log Details
  const externalApiLogsTotalPages = Math.ceil(filteredExternalApiLogs.length / RECORDS_PER_PAGE);
  const externalApiLogsIndexOfLastRecord = externalApiLogsCurrentPage * RECORDS_PER_PAGE;
  const externalApiLogsIndexOfFirstRecord = externalApiLogsIndexOfLastRecord - RECORDS_PER_PAGE;
  const currentExternalApiLogs = filteredExternalApiLogs.slice(externalApiLogsIndexOfFirstRecord, externalApiLogsIndexOfLastRecord);

  // Pagination calculations for Login Logs
  const loginLogsTotalPages = Math.ceil(filteredLoginLogs.length / RECORDS_PER_PAGE);
  const loginLogsIndexOfLastRecord = loginLogsCurrentPage * RECORDS_PER_PAGE;
  const loginLogsIndexOfFirstRecord = loginLogsIndexOfLastRecord - RECORDS_PER_PAGE;
  const currentLoginLogs = filteredLoginLogs.slice(loginLogsIndexOfFirstRecord, loginLogsIndexOfLastRecord);

  // Helper function for pagination controls
  const renderPaginationControls = (currentPage: number, totalPages: number, dataLength: number, setCurrentPage: (page: number) => void) => (
    <div className="flex items-center justify-between pt-4">
      <div className="text-sm text-muted-foreground">
        Showing <strong>{dataLength > 0 ? (currentPage - 1) * RECORDS_PER_PAGE + 1 : 0}</strong> to <strong>{Math.min(currentPage * RECORDS_PER_PAGE, dataLength)}</strong> of <strong>{dataLength}</strong> records.
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages > 0 ? totalPages : 1}</span>
        <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>
          Next
        </Button>
      </div>
    </div>
  );

  const DateRangePicker = () => (
    <div className="flex items-center gap-2">
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
        {dateRange && (
            <Button variant="ghost" onClick={() => setDateRange(undefined)}>Reset</Button>
        )}
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-md flex items-center animate-in fade-in slide-in-from-top-4 duration-500">
        <Info className="h-5 w-5 mr-3 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold">
            The data displayed on this page is from 1 December 2025 to the current date.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">View and manage various transaction and log details.</p>
        </div>
        <Button onClick={() => fetchAllLogs(true)} variant="outline" size="sm" disabled={isLoading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>
      <Tabs defaultValue="additional-license" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="additional-license">Additional License</TabsTrigger>
          <TabsTrigger value="failed-license">Failed License</TabsTrigger>
          <TabsTrigger value="api-log">API Log Details</TabsTrigger>
          <TabsTrigger value="external-api-log">External API Log Details</TabsTrigger>
          <TabsTrigger value="login-logs">Login Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="additional-license" className="space-y-4">
          <h3 className="text-xl font-semibold">Additional License Transactions</h3>
          <p className="text-muted-foreground">Details of additional license purchases and updates.</p>
          <div className="flex items-center gap-4 justify-end">
            <DateRangePicker />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by domain name..."
                value={domainSearchTerm}
                onChange={(e) => setDomainSearchTerm(e.target.value)}
                className="pl-10 w-[300px]"
              />
            </div>
            <Select value={invoiceFilter} onValueChange={setInvoiceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Invoice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Invoices</SelectItem>
                <SelectItem value="pending">Pending Invoice</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleGetReport} disabled={isLoading}>
              Get Report
            </Button>
            <Button onClick={handleExportAll} disabled={isLoading}>
              Export All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Licenses Added</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredLicTransactions.reduce((sum, t) => sum + parseInt(t.numberOfUser || '0'), 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dateRange?.from ? (
                    <>
                      For the period: {format(dateRange.from, "LLL dd, y")}
                      {dateRange.to && ` - ${format(dateRange.to, "LLL dd, y")}`}
                    </>
                  ) : (
                    "Across all filtered transactions"
                  )}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{filteredLicTransactions.reduce((sum, t) => sum + parseFloat(t.order_amount || '0'), 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dateRange?.from ? (
                    <>
                      For the period: {format(dateRange.from, "LLL dd, y")}
                      {dateRange.to && ` - ${format(dateRange.to, "LLL dd, y")}`}
                    </>
                  ) : (
                    "Total revenue from filtered transactions"
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading additional license transactions...</span>
            </div>)
          : successfulLicTransactions.length === 0 ? (<div className="text-muted-foreground py-4">No additional license transactions found.</div>) : (<>
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Licenses Added</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Number</th>
                  {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th> */}
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Mode</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction For</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                  
                  
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Name</th>
                  
                  
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentLicTransactions.map((transaction) => (
                  <tr key={transaction.tid} onClick={() => handleRowClick(transaction, 'licTransaction')} className="cursor-pointer hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.tid}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{transaction.domainname}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{parseInt(transaction.numberOfUser)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{transaction.zoho_invoice_number}</td>
                    {/* <td className="px-6 py-4 text-sm text-gray-900 max-w-xs break-words">{transaction.product_info}</td> */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{parseFloat(transaction.order_amount).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.paymentmode}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs break-words">License Addition</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs break-words">{new Date(transaction.createdon.replace(/(\d{2})-(\d{2})-(\d{4})_(\d{2})-(\d{2})-(\d{2})/, '$3-$2-$1T$4:$5:$6')).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.username || transaction.reseller_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs break-words">{transaction.skuid}</td>
                    
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>{renderPaginationControls(licTransactionsCurrentPage, licTransactionsTotalPages, successfulLicTransactions.length, setLicTransactionsCurrentPage)}</>
          )}
        </TabsContent>
        <TabsContent value="failed-license" className="space-y-4">
          <h3 className="text-xl font-semibold">Failed License Transactions</h3>
          <p className="text-muted-foreground">Records of license transactions that failed.</p>
          <DateRangePicker />
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading failed license transactions...</span>
            </div>
          ) : failedLicTransactions.length === 0 ? (<div className="text-muted-foreground py-4">No failed license transactions found.</div>) : (<>
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error Message</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentFailedLicTransactions.map((transaction) => (
                  <tr key={transaction.tid} onClick={() => handleRowClick(transaction, 'licTransaction')} className="cursor-pointer hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.tid}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.domainname}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(transaction.createdon.replace(/(\d{2})-(\d{2})-(\d{4})_(\d{2})-(\d{2})-(\d{2})/, '$3-$2-$1T$4:$5:$6')).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs break-words">{transaction.domainname}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs break-words">{new Date(transaction.createdon.replace(/(\d{2})-(\d{2})-(\d{4})_(\d{2})-(\d{2})-(\d{2})/, '$3-$2-$1T$4:$5:$6')).toLocaleString()}</td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.skuid}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{transaction.product_info}</td> {/* Assuming product_info contains error message */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>{renderPaginationControls(failedLicTransactionsCurrentPage, failedLicTransactionsTotalPages, failedLicTransactions.length, setFailedLicTransactionsCurrentPage)}</>
          )}
        </TabsContent>
        <TabsContent value="api-log" className="space-y-4">
          <h3 className="text-xl font-semibold">API Log Details</h3>
          <p className="text-muted-foreground">Logs of internal API calls and responses.</p>
          <DateRangePicker />
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading API logs...</span>
            </div>
          ) : apiLogs.length === 0 ? (<div className="text-muted-foreground py-4">No API logs found.</div>) : (<>
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datetime</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Code</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentApiLogs.map((log) => (
                  <tr key={log.ID} onClick={() => handleRowClick(log, 'apiLog')} className="cursor-pointer hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ID}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.api_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.datetime).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.api_status_code}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs break-words">{log.message}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>{renderPaginationControls(apiLogsCurrentPage, apiLogsTotalPages, filteredApiLogs.length, setApiLogsCurrentPage)}</>
          )}
        </TabsContent>
        <TabsContent value="external-api-log" className="space-y-4">
          <h3 className="text-xl font-semibold">External API Log Details</h3>
          <p className="text-muted-foreground">Logs of interactions with external APIs.</p>
          <DateRangePicker />
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading external API logs...</span>
            </div>
          ) : externalApiLogs.length === 0 ? (<div className="text-muted-foreground py-4">No external API logs found.</div>) : (<>
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reseller ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentExternalApiLogs.map((log) => (
                  <tr key={log.id} onClick={() => handleRowClick(log, 'externalApiLog')} className="cursor-pointer hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.reseller_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.response_status}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{log.request}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{log.response}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>{renderPaginationControls(externalApiLogsCurrentPage, externalApiLogsTotalPages, filteredExternalApiLogs.length, setExternalApiLogsCurrentPage)}</>
          )}
        </TabsContent>
        <TabsContent value="login-logs" className="space-y-4">
          <h3 className="text-xl font-semibold">Login Logs</h3>
          <p className="text-muted-foreground">Records of user login attempts and sessions.</p>
          <DateRangePicker />
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading login logs...</span>
            </div>
          ) : loginLogs.length === 0 ? (<div className="text-muted-foreground py-4">No login logs found.</div>) : (<>
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datetime</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentLoginLogs.map((log) => (
                  <tr key={log.id} onClick={() => handleRowClick(log, 'loginLog')} className="cursor-pointer hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.datetime).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>{renderPaginationControls(loginLogsCurrentPage, loginLogsTotalPages, filteredLoginLogs.length, setLoginLogsCurrentPage)}</>
          )}
        </TabsContent>
      </Tabs>
      <LogDetailDialog
        isOpen={isDetailDialogOpen}
        onClose={() => setIsDetailDialogOpen(false)}
        logType={selectedLogType}
        logData={selectedLogData}
      />
    </div>
  );
};
export default Transactions;