
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, FileText, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from './ui/scroll-area';
import { API_ENDPOINTS } from '@/config/api';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BulkImportDialogProps {
  type: 'customers' | 'partners' | 'products' | 'users';
  onImport: (data: any[]) => void;
  trigger?: React.ReactNode;
}

const BulkImportDialog = ({ type, onImport, trigger }: BulkImportDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [open, setOpen] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [nonDuplicates, setNonDuplicates] = useState<any[]>([]);

  // New states for preview
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview

  const sampleData = {
    customers: [
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
        company: 'Tech Corp',
        status: 'active',
        partnerId: '',
        productIds: '',
        value: 50000,
        zone: 'north'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1-555-0124',
        company: 'Digital Solutions',
        status: 'pending',
        partnerId: '',
        productIds: '',
        value: 75000,
        zone: 'east'
      }
    ],
    partners: [
      {
        'ISR Name': 'John Doe',
        'Company Name': 'Tech Innovators Inc.',
        'Domain': 'techinnovators.com',
        'Contact Number': '123-456-7890',
        'Email ID': 'contact@techinnovators.com',
        'City': 'San Francisco',
        'Type of Business': 'SaaS',
        'Contact Person Name 1': 'Alice',
        'Designation 1': 'CEO'
      },
      {
        'ISR Name': 'Jane Smith',
        'Company Name': 'Cloud Solutions Ltd.',
        'Domain': 'cloudsolutions.io',
        'Contact Number': '098-765-4321',
        'Email ID': 'sales@cloudsolutions.io',
        'City': 'New York',
        'Type of Business': 'Cloud Infrastructure',
        'Contact Person Name 1': 'David',
        'Designation 1': 'Founder'
      }
    ],
    products: [
      {
        name: 'CloudSecure Pro',
        website: 'cloudsecure.com',
        category: 'Security',
        description: 'Advanced cloud security solution',
        status: 'active',
        price: 299.99
      },
      {
        name: 'DataAnalytics Suite',
        website: 'dataanalytics.com',
        category: 'Productivity Suite',
        description: 'Complete data analytics platform',
        status: 'active',
        price: 199.99
      }
    ],
    users: [
      {
        name: 'Michael Brown',
        email: 'michael@company.com',
        phone: '+1-555-0125',
        role: 'fsr',
        department: 'Sales',
        status: 'active'
      },
      {
        name: 'Emily Davis',
        email: 'emily@company.com',
        phone: '+1-555-0126',
        role: 'bde',
        department: 'Business Development',
        status: 'active'
      }
    ]
  };

  const downloadSample = () => {
    const sample = sampleData[type];
    const headers = Object.keys(sample[0]);
    const csvContent = [
      headers.join(','),
      ...sample.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_sample.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const processCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const csvHeaders = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    setHeaders(csvHeaders);
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      const row: any = {};

      csvHeaders.forEach((header, index) => {
        const value = values[index] || '';
        row[header] = value;
      });
      data.push(row);
    }

    return data;
  };

  const logCrmAction = async (actiontype: string, details: string) => {
    if (!user?.id) {
      console.error("User ID not available for logging CRM action.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append('userid', user.id);
      formData.append('actiontype', actiontype);
      formData.append('path', 'Bulk Import Dialog');
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

  const checkForDuplicates = async (data: any[]) => {
    if (type === 'products') {
      setNonDuplicates(data);
      setDuplicates([]);
      return;
    }

    const emailColumn = type === 'partners' ? 'Email ID' : 'email';
    const dataWithEmails = data.filter(row => row[emailColumn]);
    const uploadedEmails = dataWithEmails.map(row => row[emailColumn].toLowerCase());

    if (uploadedEmails.length === 0) {
      setNonDuplicates(data);
      setDuplicates([]);
      return;
    }

    // 1. Check for duplicates within the CSV
    const emailCounts = uploadedEmails.reduce((acc, email) => {
      acc[email] = (acc[email] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const duplicatesInFile = Object.keys(emailCounts).filter(email => emailCounts[email] > 1);

    // 2. Check against the database
    let tableName: string;
    let emailFieldName: string;

    switch (type) {
      case 'customers': tableName = 'customers'; emailFieldName = 'email'; break;
      case 'partners': tableName = 'partners'; emailFieldName = 'email'; break;
      case 'users': tableName = 'users'; emailFieldName = 'email'; break;
      default: setNonDuplicates(data); setDuplicates([]); return;
    }

    const { data: existingData, error } = await supabase.from(tableName).select(emailFieldName).in(emailFieldName, uploadedEmails);

    if (error) {
      toast({ title: "Error checking for duplicates", description: error.message, variant: "destructive" });
      throw new Error("Could not verify duplicates in the database.");
    }

    const existingEmails = new Set(existingData.map((row: any) => row[emailFieldName].toLowerCase()));
    const duplicateRows: any[] = [];
    const nonDuplicateRows: any[] = [];

    data.forEach(row => {
      const email = row[emailColumn]?.toLowerCase();
      if (!email) { nonDuplicateRows.push(row); return; }
      if (existingEmails.has(email)) {
        duplicateRows.push({ ...row, _reason: 'Exists in database' });
      } else if (duplicatesInFile.includes(email)) {
        duplicateRows.push({ ...row, _reason: 'Duplicate in file' });
      } else { nonDuplicateRows.push(row); }
    });

    setDuplicates(duplicateRows);
    setNonDuplicates(nonDuplicateRows);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv')) {
      setErrors(['Please upload a CSV file']);
      return;
    }

    setFile(uploadedFile);
    setErrors([]);
    setSuccess(false);
    setDuplicates([]);
    setNonDuplicates([]);

    setIsProcessing(true);
    try {
      const text = await uploadedFile.text();
      const data = processCSV(text);
      setPreviewData(data);
      await checkForDuplicates(data);
      setStep(2);
    } catch (error) {
      console.error('File processing error:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to process file']);
    } finally {
      setIsProcessing(false);
    }
  };

  const finalizeData = (data: any[]) => {
    return data.map((row, i) => {
      const finalRow: any = {};
      for (const header in row) {
        const value = row[header];
        if (header === 'value' || header === 'price' || header === 'customersCount' || header === 'totalValue') {
          finalRow[header] = parseFloat(value) || 0;
        } else if (header === 'agreementSigned') {
          finalRow[header] = value.toLowerCase() === 'true';
        } else if (['productIds', 'productTypes', 'identity', 'zone', 'partner_tag'].includes(header)) {
          finalRow[header] = value ? value.split(';').map(s => s.trim()) : [];
        } else {
          finalRow[header] = value;
        }
      }
      finalRow.id = `${type}_${Date.now()}_${i}`;
      finalRow.createdAt = new Date();
      if (type === 'partners') {
        finalRow.customersCount = finalRow.customersCount || 0;
        finalRow.totalValue = finalRow.totalValue || 0;
        if (finalRow.agreementSigned) {
          finalRow.agreementDate = new Date();
        }
      } else if (type === 'products') {
        finalRow.customersCount = 0;
      }
      return finalRow;
    });
  };

  const handleConfirmImport = async () => {
    if (nonDuplicates.length === 0) {
      toast({
        title: "No new data to import",
        description: "All records were identified as duplicates or the file is empty.",
      });
      return;
    }

    setIsProcessing(true);
    setErrors([]);

    try {
      if (type === 'partners') {
        const importErrors: string[] = [];
        const successfullyImported = [];

        for (const row of nonDuplicates) {
          try {
            const contacts = [];
            if (row['Contact Person Name 1'] && row['Contact Person Name 1'] !== 'NA') {
              contacts.push({
                contactName: row['Contact Person Name 1'],
                contactDesignation: row['Designation 1'] !== 'NA' ? row['Designation 1'] : '',
                contactEmail: row['Email ID 1'] !== 'NA' ? row['Email ID 1'] : '',
                contactNumber: row['Contact 1'] !== 'NA' ? row['Contact 1'] : '',
                contactLinkedinURL: row['Linkdin Profile'] !== 'NA' ? row['Linkdin Profile'] : '',
              });
            }
            for (let i = 1; i <= 2; i++) {
              if (row[`POC name ${i}`] && row[`POC name ${i}`] !== 'NA') {
                contacts.push({
                  contactName: row[`POC name ${i}`],
                  contactDesignation: row[`POC Designation ${i}`] !== 'NA' ? row[`POC Designation ${i}`] : '',
                  contactEmail: row[`POC Email ID ${i}`] !== 'NA' ? row[`POC Email ID ${i}`] : '',
                  contactNumber: row[`POC Contact ${i}`] !== 'NA' ? row[`POC Contact ${i}`] : '',
                  contactLinkedinURL: row[`POC Linkedin Profile ${i}`] !== 'NA' ? row[`POC Linkedin Profile ${i}`] : '',
                });
              }
            }

            const feedback = [];
            if (row['Feedback'] && row['Feedback'] !== 'NA') {
              feedback.push({
                notes: row['Feedback'],
                status: row['Status'],
                timestamp: new Date().toISOString(),
              });
            }

            const partnerToInsert = {
              name: row['Company Name'],
              company: row['Company Name'],
              email: row['Email ID'],
              contact_number: row['Contact Number'],
              city: row['City'],
              specialization: row['Type of Business'],
              status: row['Status'] || 'active',
              contacts: contacts.length > 0 ? JSON.stringify(contacts) : null,
              feedback: feedback.length > 0 ? JSON.stringify(feedback) : null,
              onboarding_stage: 'not-contacted',
              payment_terms: 'net-30',
              assigned_manager: row['ISR Name'],
            };

            const { data: insertedPartner, error: insertError } = await supabase
              .from('partners')
              .insert(partnerToInsert)
              .select()
              .single();

            if (insertError) throw new Error(`Supabase insert failed for ${partnerToInsert.email}: ${insertError.message}`);

            const crmPayload = {
              partnername: partnerToInsert.name,
              partneremailid: partnerToInsert.email,
              partnermobilenumber: partnerToInsert.contact_number,
              partnercompanyname: partnerToInsert.company,
              customerdomain: row['Domain']
            };

            const crmResponse = await fetch(API_ENDPOINTS.INSERT_CRM_PARTNER_DETAILSWTHCUSTOMER, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(crmPayload),
            });

            const crmResult = await crmResponse.json();

            if (crmResponse.ok && crmResult.success && crmResult.data?.reseller_id) {
              await supabase
                .from('partners')
                .update({ portal_reseller_id: crmResult.data.reseller_id })
                .eq('id', insertedPartner.id);
              successfullyImported.push({ ...partnerToInsert, id: insertedPartner.id, portal_reseller_id: crmResult.data.reseller_id });
            } else {
              importErrors.push(`CRM sync failed for ${partnerToInsert.email}: ${crmResult.message || 'No reseller_id returned'}`);
              successfullyImported.push({ ...partnerToInsert, id: insertedPartner.id }); // Still counts as imported
            }
          } catch (error: any) {
            importErrors.push(error.message);
          }
        }

        if (successfullyImported.length > 0) {
          toast({ title: "Import Complete", description: `${successfullyImported.length} of ${nonDuplicates.length} new partners imported.` });
          await logCrmAction("Bulk Import", `Imported ${successfullyImported.length} records into ${type}.`);
        }

        if (importErrors.length > 0) {
          setErrors(importErrors);
          toast({ title: "Import Issues", description: `${importErrors.length} records failed to import or sync.`, variant: "destructive" });
        }

        if (successfullyImported.length > 0) {
          setSuccess(true);
          setTimeout(() => {
            resetState();
            setOpen(false);
            onImport(successfullyImported);
          }, 2000);
        }

      } else {
        const finalData = finalizeData(nonDuplicates);
        onImport(finalData);
        setSuccess(true);
        await logCrmAction("Bulk Import", `Imported ${nonDuplicates.length} records into ${type}.`);
        setTimeout(() => {
          resetState();
          setOpen(false);
          onImport(finalData);
        }, 2000);
      }
    } catch (error: any) {
      setErrors([error.message]);
      toast({ title: "Import Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setIsProcessing(false);
    setErrors([]);
    setSuccess(false);
    setPreviewData([]);
    setHeaders([]);
    setDuplicates([]);
    setNonDuplicates([]);
    setStep(1);
  };

  const handleDownloadDuplicates = () => {
    if (duplicates.length === 0) {
      toast({
        title: 'No Duplicates to Download',
        description: 'There are no duplicate records to download.',
        variant: 'destructive',
      });
      return;
    }

    const dataToExport = duplicates.map(row => {
      const { _reason, ...rest } = row;
      return { ...rest, 'Reason for Duplication': _reason };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

    // Create a Blob from the CSV string and trigger download
    const blob = new Blob(["\uFEFF" + csvOutput], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `duplicate_records_${type}_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Report Generated',
      description: 'Duplicate records report downloaded successfully as CSV.',
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetState();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" >
            <Upload size={16} className="mr-2" />
            Bulk Upload
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className={step === 2 ? "w-[90vw] max-w-[90vw] overflow-x-auto" : "max-w-4xl"}>
        <DialogHeader>
          <DialogTitle>Bulk Import {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="py-4">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Step 1: Download Sample File</Label>
                <p className="text-sm text-muted-foreground">
                  Download the sample CSV file to see the required format and structure for importing {type}.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadSample}
                  className="w-full"
                >
                  <Download size={16} className="mr-2" />
                  Download Sample CSV for {type}
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Step 2: Upload Your Data</Label>
                <p className="text-sm text-muted-foreground">
                  Upload your completed CSV file. The data will be validated before importing.
                </p>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                  disabled={isProcessing}
                />
                {isProcessing && <p className="text-sm text-muted-foreground mt-2">Processing file...</p>}
              </div>
            </div>

            {errors.length > 0 && (
              <Alert variant="destructive" className="mt-6">
                <AlertCircle size={16} />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-4">
            <h3 className="font-semibold">Step 3: Preview and Confirm</h3>
            <p className="text-sm text-muted-foreground">
              Review the data below. Duplicates are identified and will be skipped.
            </p>

            {duplicates.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-destructive">Duplicate Records ({duplicates.length}) - These will be skipped</h4>
                  <Button variant="outline" size="sm" onClick={handleDownloadDuplicates}>
                    <Download size={14} className="mr-2" /> Download Duplicates
                  </Button>
                </div>
                <ScrollArea className="h-40 w-full rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {headers.map(header => <TableHead key={header}>{header}</TableHead>)}
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {duplicates.map((row, rowIndex) => (
                        <TableRow key={rowIndex} className="bg-red-50 dark:bg-red-900/20">
                          {headers.map(header => <TableCell key={`${rowIndex}-${header}`}>{row[header]}</TableCell>)}
                          <TableCell className="font-medium">{row._reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">New Records to Import ({nonDuplicates.length})</h4>
              {nonDuplicates.length > 0 ? (
                <ScrollArea className="h-72 w-full rounded-md border overflow-x-auto">
                  <Table className="min-w-max">
                    <TableHeader className="sticky top-0 bg-muted">
                      <TableRow>
                        {headers.map(header => <TableHead key={header} className="whitespace-nowrap">{header}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nonDuplicates.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {headers.map(header => <TableCell key={`${rowIndex}-${header}`} className="whitespace-nowrap">{row[header]}</TableCell>)}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="text-center py-10 text-muted-foreground border rounded-md">
                  No new records to import.
                </div>
              )}
            </div>

            {success && (
              <Alert>
                <CheckCircle size={16} />
                <AlertDescription>
                  Data imported successfully! This dialog will close shortly.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-start gap-2">
              <Button variant="outline" onClick={() => setStep(1)} disabled={isProcessing}>
                <ArrowLeft size={16} className="mr-2" /> Back to Upload
              </Button>
              <Button onClick={handleConfirmImport} disabled={isProcessing || success || nonDuplicates.length === 0}>
                {isProcessing ? 'Importing...' : `Confirm Import (${nonDuplicates.length} records)`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportDialog;
