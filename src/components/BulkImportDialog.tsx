
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, FileText, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Customer, Partner, Product, User } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from './ui/scroll-area';

interface BulkImportDialogProps {
  type: 'customers' | 'partners' | 'products' | 'users';
  onImport: (data: any[]) => void;
  trigger?: React.ReactNode;
}

const BulkImportDialog = ({ type, onImport, trigger }: BulkImportDialogProps) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [open, setOpen] = useState(false);

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
        name: 'Alex Johnson',
        email: 'alex@partner.com',
        phone: '+1-555-0127',
        company: 'Partner Corp',
        specialization: 'Cloud Services',
        identity: 'system-integrator,web-app-developer',
        status: 'active',
        agreementSigned: 'true',
        productTypes: 'Cloud,Security',
        paymentTerms: 'net-30',
        zone: 'west'
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah@webdev.com',
        phone: '+1-555-0128',
        company: 'WebDev Solutions',
        specialization: 'Digital Marketing',
        identity: 'digital-marketer',
        status: 'active',
        agreementSigned: 'false',
        productTypes: 'Marketing,Analytics',
        paymentTerms: 'net-60',
        zone: 'south',
        partner_tag: 'bni'
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

    setIsProcessing(true);
    try {
      const text = await uploadedFile.text();
      const data = processCSV(text);
      setPreviewData(data);
      setStep(2);
    } catch (error) {
      console.error('Preview error:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to process file for preview']);
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
    if (previewData.length === 0) return;

    setIsProcessing(true);
    setErrors([]);

    try {
      const finalData = finalizeData(previewData);
      console.log(`Importing ${finalData.length} ${type} records:`, finalData);
      
      onImport(finalData);
      setSuccess(true);
      await logCrmAction("Bulk Import", `Imported ${finalData.length} records into ${type}.`);
      
      setTimeout(() => {
        resetState();
        setOpen(false);
      }, 2000);
      
    } catch (error) {
      console.error('Import error:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to process file']);
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
    setStep(1);
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
          <Button variant="outline" size="sm">
            <Upload size={16} className="mr-2" />
            Bulk Upload
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Bulk Import {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
        </DialogHeader>
        
        {step === 1 && (
          <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-medium">Step 1: Download Sample File</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Download the sample CSV file to see the required format
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

          <div>
            <Label className="text-sm font-medium">Step 2: Upload Your Data</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Upload your CSV file with the same format as the sample
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

          {errors.length > 0 && (
            <Alert variant="destructive">
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
              Review the data below. If it looks correct, click "Confirm Import".
            </p>
            <ScrollArea className="h-72 w-full rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-muted">
                  <TableRow>
                    {headers.map(header => <TableHead key={header}>{header}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {headers.map(header => <TableCell key={`${rowIndex}-${header}`}>{row[header]}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {success && (
              <Alert>
                <CheckCircle size={16} />
                <AlertDescription>
                  Data imported successfully! This dialog will close shortly.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(1)} disabled={isProcessing}>
                <ArrowLeft size={16} className="mr-2" /> Back to Upload
              </Button>
              <Button onClick={handleConfirmImport} disabled={isProcessing || success}>
                {isProcessing ? 'Importing...' : `Confirm Import (${previewData.length} records)`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportDialog;
