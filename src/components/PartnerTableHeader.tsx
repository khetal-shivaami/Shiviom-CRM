
import { Button } from '@/components/ui/button';
import { Users, Download } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import BulkImportDialog from './BulkImportDialog';
import { Partner } from '../types';

interface PartnerTableHeaderProps {
  filteredCount: number;
  totalCount: number;
  selectedCount: number;
  onBulkImport?: (partners: Partner[]) => void;
  onMapCustomers: () => void;
  onBulkAction: (action: string) => void;
  onBulkExport: () => void;
}

const PartnerTableHeader = ({ 
  filteredCount, 
  totalCount, 
  selectedCount, 
  onBulkImport, 
  onMapCustomers,
  onBulkAction,
  onBulkExport
}: PartnerTableHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">
        Partners ({filteredCount} of {totalCount})
      </h3>
      <div className="flex items-center gap-2">
        <Button onClick={onMapCustomers} variant="outline" size="sm">
          <Users size={16} className="mr-2" /> Map Customer
        </Button>
        {onBulkImport && (
          <BulkImportDialog
            type="partners"
            onImport={onBulkImport}
          />
        )}
        
        {selectedCount > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Bulk Actions ({selectedCount})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onBulkAction('activate')}>
                Set Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkAction('deactivate')}>
                Set Inactive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onBulkExport}>
                <Download className="mr-2 h-4 w-4" />
                Export Selected
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onBulkAction('delete')} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                Delete Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

export default PartnerTableHeader;
