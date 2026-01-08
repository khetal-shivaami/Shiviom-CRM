import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CustomerStatusFormProps {
  formData: {
    status: 'active' | 'inactive' | 'pending';
    process: 'prospect' | 'demo' | 'poc' | 'negotiating' | 'lost' | 'won' | 'deployment';
    caseType: string;
  };
  onChange: (field: string, value: string) => void;
}

const CustomerStatusForm = ({ formData, onChange }: CustomerStatusFormProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value) => onChange('status', value)}>
          <SelectTrigger id="status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="process">Process Stage</Label>
        <Select value={formData.process} onValueChange={(value) => onChange('process', value)}>
          <SelectTrigger id="process"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="prospect">Prospect</SelectItem>
            <SelectItem value="demo">Demo</SelectItem>
            <SelectItem value="poc">Poc</SelectItem>
            <SelectItem value="negotiating">Negotiating</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="deployment">Deployment</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="case-type">Case Type</Label>
        <Select value={formData.caseType} onValueChange={(value) => onChange('caseType', value)}>
          <SelectTrigger id="case-type"><SelectValue placeholder="Select case type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="new_case">New Case</SelectItem>
            <SelectItem value="renewal_case">Renewal Case</SelectItem>
            <SelectItem value="upgrade_case">Upgrade Case</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
    </div>
  );
};

export default CustomerStatusForm;