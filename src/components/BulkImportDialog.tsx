
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Customer, Partner, Product, User } from '../types';

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
        company: 'Partner Corp',
        specialization: 'Cloud Services',
        identity: 'system-integrator',
        status: 'active',
        agreementSigned: 'true',
        productTypes: 'Cloud,Security',
        paymentTerms: 'net-30',
        zone: 'west'
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah@webdev.com',
        company: 'WebDev Solutions',
        specialization: 'Digital Marketing',
        identity: 'web-app-developer',
        status: 'active',
        agreementSigned: 'false',
        productTypes: 'Marketing,Analytics',
        paymentTerms: 'net-60',
        zone: 'south'
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

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      const row: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        // Handle different data types based on field names
        if (header === 'value' || header === 'price' || header === 'customersCount' || header === 'totalValue') {
          row[header] = parseFloat(value) || 0;
        } else if (header === 'agreementSigned') {
          row[header] = value.toLowerCase() === 'true';
        } else if (header === 'productIds' || header === 'productTypes') {
          row[header] = value ? value.split(',').map(s => s.trim()) : [];
        } else {
          row[header] = value;
        }
      });

      // Generate IDs and timestamps
      row.id = `${type}_${Date.now()}_${i}`;
      row.createdAt = new Date();
      
      // Set defaults for specific types
      if (type === 'partners') {
        row.customersCount = 0;
        row.totalValue = 0;
        if (row.agreementSigned) {
          row.agreementDate = new Date();
        }
      } else if (type === 'products') {
        row.customersCount = 0;
      }

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
  };

  const processImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    setErrors([]);

    try {
      const text = await file.text();
      const data = processCSV(text);
      
      console.log(`Processing ${data.length} ${type} records:`, data);
      
      onImport(data);
            setSuccess(true);
              await logCrmAction("Bulk Import", `Imported ${data.length} records into ${type}.`);
      setFile(null);
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Import error:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to process file']);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Upload size={16} className="mr-2" />
            Bulk Import
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Import {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
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
              Download Sample CSV
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
            />
          </div>

          {file && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2">
                <FileText size={16} />
                <span className="text-sm">{file.name}</span>
              </div>
              <Button
                size="sm"
                onClick={processImport}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Import'}
              </Button>
            </div>
          )}

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

          {success && (
            <Alert>
              <CheckCircle size={16} />
              <AlertDescription>
                Data imported successfully!
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportDialog;
