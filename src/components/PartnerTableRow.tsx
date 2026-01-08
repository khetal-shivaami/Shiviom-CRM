import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, XCircle, MessageSquare, Percent } from 'lucide-react';
import { Partner, User } from '../types';
import { PartnerActionsDialog } from './PartnerActionsDialog';
import { PartnerCommentsDialog } from './PartnerCommentsDialog';
import { AddPartnerDiscountDialog } from './AddPartnerDiscountDialog';

interface PartnerTableRowProps {
  partner: Partner;
  users: User[];
  visibleColumns: Record<string, boolean>;
  isSelected: boolean;
  onSelect: (partnerId: string) => void;
  onViewDetails: (partner: Partner) => void;
  onActionSuccess: () => void;
}

const PartnerTableRow = ({
  partner,
  users,
  visibleColumns,
  isSelected,
  onSelect,
  onViewDetails,
  onActionSuccess
}: PartnerTableRowProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentTermsColor = (terms: string) => {
    switch (terms) {
      case 'annual-in-advance': return 'bg-green-100 text-green-800';
      case 'monthly': return 'bg-blue-100 text-blue-800';
      case 'quarterly': return 'bg-cyan-100 text-cyan-800';
      case 'half-yearly': return 'bg-teal-100 text-teal-800';
      case 'net-15': return 'bg-lime-100 text-lime-800';
      case 'net-30': return 'bg-yellow-100 text-yellow-800';
      case 'net-45': return 'bg-amber-100 text-amber-800';
      case 'net-60': return 'bg-orange-100 text-orange-800';
      case 'net-90': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentTermsLabel = (terms: string) => {
    switch (terms) {
      case 'annual-in-advance': return 'Annual in Advance';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'half-yearly': return 'Half Yearly';
      case 'net-15': return 'Net 15';
      case 'net-30': return 'Net 30';
      case 'net-45': return 'Net 45';
      case 'net-60': return 'Net 60';
      case 'net-90': return 'Net 90';
      default: return terms.toUpperCase();
    }
  };

  const getZoneColor = (zone?: string) => {
    switch (zone) {
      case 'north': return 'bg-blue-100 text-blue-800';
      case 'east': return 'bg-green-100 text-green-800';
      case 'west': return 'bg-orange-100 text-orange-800';
      case 'south': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEmployeeName = (employeeId?: string) => {
    const employee = users.find(u => u.id === employeeId);
    return employee ? employee.name : 'Unassigned';
  };

  const getIdentityColor = (identity: string) => {
    switch (identity) {
      case 'web-app-developer': return 'bg-blue-100 text-blue-800';
      case 'system-integrator': return 'bg-green-100 text-green-800';
      case 'managed-service-provider': return 'bg-purple-100 text-purple-800';
      case 'digital-marketer': return 'bg-orange-100 text-orange-800';
      case 'cyber-security': return 'bg-red-100 text-red-800';
      case 'cloud-hosting': return 'bg-cyan-100 text-cyan-800';
      case 'web-hosting': return 'bg-indigo-100 text-indigo-800';
      case 'hardware': return 'bg-gray-100 text-gray-800';
      case 'cloud-service-provider': return 'bg-sky-100 text-sky-800';
      case 'microsoft-partner': return 'bg-blue-100 text-blue-800';
      case 'aws-partner': return 'bg-yellow-100 text-yellow-800';
      case 'it-consulting': return 'bg-emerald-100 text-emerald-800';
      case 'freelance': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIdentityLabel = (identity: string) => {
    switch (identity) {
      case 'web-app-developer': return 'Web/App Developer';
      case 'system-integrator': return 'System Integrator';
      case 'managed-service-provider': return 'MSP';
      case 'digital-marketer': return 'Digital Marketer';
      case 'cyber-security': return 'Cyber Security';
      case 'cloud-hosting': return 'Cloud Hosting';
      case 'web-hosting': return 'Web Hosting';
      case 'hardware': return 'Hardware';
      case 'cloud-service-provider': return 'Cloud Service Provider';
      case 'microsoft-partner': return 'Microsoft Partner';
      case 'aws-partner': return 'AWS Partner';
      case 'it-consulting': return 'IT Consulting';
      case 'freelance': return 'Freelance';
      default: return identity;
    }
  };

  const getPartnerProgramColor = (program?: string) => {
    switch (program) {
      case 'Referal Partner': return 'bg-cyan-100 text-cyan-800';
      case 'Commited Partner': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssignedUserNames = (userIds?: string[]) => {
    if (!userIds || userIds.length === 0) return 'Unassigned';
    return userIds
      .map(id => users.find(u => u.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const getPartnerTagLabel = (tagId: string) => {
    const labels: { [key: string]: string } = {
      'asirt': 'ASIRT', 'isoda': 'ISODA', 'iamcp': 'IAMCP', 'bni': 'BNI',
      'microsoft-direct-reseller': 'Microsoft Direct reseller',
      'google-direct-reseller': 'Google Direct reseller',
      'demanding': 'Demanding', 'badwords': 'Badwords', 'smb': 'SMB',
      'mid-market': 'Mid-market', 'enterprise': 'Enterprise',
      'gov-business': 'GOV Business', 'office-in-usa': 'Office in USA',
      'office-in-europe': 'Office in Europe', 'office-in-aus': 'Office in AUS',
      'office-in-south-asia': 'Office in South Asia',
      'office-in-africa': 'Office in Africa', 'office-in-dubai': 'Office in Dubai',
    };
    return labels[tagId] || tagId;
  };

  const getSourceOfPartnerLabel = (sourceId?: string) => {
    if (!sourceId) return 'Not Set';
    const labels: { [key: string]: string } = {
      'webinar': 'Webinar', 'event': 'Event', 'referral': 'Referral', 'inbound': 'Inbound', 'outbound': 'Outbound',
      'whatsapp-campaign': 'Whatsapp Campaign', 'email-campaign': 'Email Campaign', 'shivaami': 'Shivaami', 'axima': 'Axima', 'management': 'Management',
    };
    return labels[sourceId] || sourceId;
  };

  const getPartnerTypeColor = (type?: string) => {
    switch (type) {
      case 'gold': return 'bg-yellow-200 text-yellow-900';
      case 'silver': return 'bg-slate-200 text-slate-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stringToColor = (str: string) => {
    if (!str) {
      return 'bg-gray-100 text-gray-800';
    }
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorPalette = [
      'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800', 'bg-cyan-100 text-cyan-800', 'bg-teal-100 text-teal-800',
      'bg-lime-100 text-lime-800', 'bg-yellow-100 text-yellow-800', 'bg-amber-100 text-amber-800',
      'bg-pink-100 text-pink-800', 'bg-indigo-100 text-indigo-800', 'bg-sky-100 text-sky-800',
      'bg-emerald-100 text-emerald-800', 'bg-rose-100 text-rose-800', 'bg-fuchsia-100 text-fuchsia-800'
    ];
    const index = Math.abs(hash % colorPalette.length);
    return colorPalette[index];
  };

  return (
    <TableRow 
      className="hover:bg-muted/50 cursor-pointer transition-colors"
    >
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(partner.id)}
        />
      </TableCell>
      {visibleColumns.partnerName && <TableCell onClick={() => onViewDetails(partner)} className="font-medium">{partner.name}</TableCell>}
      {visibleColumns.company && <TableCell onClick={() => onViewDetails(partner)}>{partner.company}</TableCell>}
      {visibleColumns.email && <TableCell onClick={() => onViewDetails(partner)}>{partner.email}</TableCell>}
      {visibleColumns.contact && <TableCell onClick={() => onViewDetails(partner)}>{partner.phone || 'N/A'}</TableCell>}
      {visibleColumns.identity && <TableCell onClick={() => onViewDetails(partner)}>
        <div className="flex flex-wrap gap-1">
          {partner.identity.length > 0 ? (
            partner.identity.map(id => (
              <Badge key={id} className={getIdentityColor(id)}>{getIdentityLabel(id)}</Badge>
            ))
          ) : (
            <span className="text-muted-foreground">Not set</span>
          )}
        </div>
      </TableCell>}
      {visibleColumns.partnerProgram && <TableCell onClick={() => onViewDetails(partner)}>
        {partner.partner_program ? (
          <Badge className={getPartnerProgramColor(partner.partner_program)}>{partner.partner_program}</Badge>
        ) : (
          <span className="text-muted-foreground">Not set</span>
        )}
      </TableCell>}
      {visibleColumns.zone && <TableCell onClick={() => onViewDetails(partner)}>
        {Array.isArray(partner.zone) && partner.zone.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {partner.zone.map(z => (
              <Badge key={z} className={getZoneColor(z)}>{z.charAt(0).toUpperCase() + z.slice(1)}</Badge>
            ))}
          </div>
        ) : partner.zone && typeof partner.zone === 'string' ? ( // Fallback for single string value
          <Badge className={getZoneColor(partner.zone)}>{partner.zone.charAt(0).toUpperCase() + partner.zone.slice(1)}</Badge>
        ) : ( 
          <span className="text-muted-foreground">Not set</span>
        )}
      </TableCell>}
      {visibleColumns.agreement && <TableCell onClick={() => onViewDetails(partner)}>
        <div className="flex items-center gap-2">
          {partner.agreementSigned ? (<CheckCircle size={16} className="text-green-600" />) : (<XCircle size={16} className="text-red-600" />)}
          <span className="text-sm">{partner.agreementSigned ? 'Signed' : 'Pending'}</span>
        </div>
      </TableCell>}
      {visibleColumns.paymentTerms && <TableCell onClick={() => onViewDetails(partner)} className="capitalize">
        <Badge className={getPaymentTermsColor(partner.paymentTerms)}>{getPaymentTermsLabel(partner.paymentTerms)}</Badge>
      </TableCell>}
      {visibleColumns.productTypes && <TableCell onClick={() => onViewDetails(partner)}>
        <div className="max-w-32">
          <div className="flex flex-wrap gap-1">
            {partner.productTypes.slice(0, 2).map((type, index) => (
              <Badge key={index} variant="outline" className="text-xs">{type}</Badge>
            ))}
            {partner.productTypes.length > 2 && (
              <Badge variant="outline" className="text-xs">+{partner.productTypes.length - 2}</Badge>
            )}
          </div>
        </div>
      </TableCell>}
      {visibleColumns.assignedEmployee && <TableCell onClick={() => onViewDetails(partner)} className="max-w-32 truncate">{getEmployeeName(partner.stage_owner)}</TableCell>}
      {visibleColumns.customers && <TableCell onClick={() => onViewDetails(partner)}>{partner.customersCount}</TableCell>}
      {visibleColumns.newRevenue && <TableCell onClick={() => onViewDetails(partner)}>₹{partner.newRevenue.toLocaleString()}</TableCell>}
      {visibleColumns.renewalRevenue && <TableCell onClick={() => onViewDetails(partner)}>₹{partner.renewalRevenue.toLocaleString()}</TableCell>}
      {visibleColumns.totalRevenue && <TableCell onClick={() => onViewDetails(partner)}>₹{partner.totalValue.toLocaleString()}</TableCell>}
      {visibleColumns.partnerDiscount && <TableCell onClick={() => onViewDetails(partner)}>
        {partner.partner_discount != null ? `${partner.partner_discount}%` : <span className="text-muted-foreground">N/A</span>}
      </TableCell>}
      {visibleColumns.designation && <TableCell onClick={() => onViewDetails(partner)}>{partner.designation || 'N/A'}</TableCell>}
      {visibleColumns.status && <TableCell onClick={() => onViewDetails(partner)}>
        <Badge className={getStatusColor(partner.status)}>{partner.status}</Badge>
      </TableCell>}
      {visibleColumns.partnerTags && <TableCell onClick={() => onViewDetails(partner)}>
        <div className="flex flex-wrap gap-1 max-w-xs">
          {partner.partner_tag && partner.partner_tag.length > 0 ? (
            partner.partner_tag.map(tag => (
              <Badge key={tag} variant="outline">{getPartnerTagLabel(tag)}</Badge>
            ))
          ) : (
            <span className="text-muted-foreground">No tags</span>
          )}
        </div>
      </TableCell>}
      {visibleColumns.partnerType && <TableCell onClick={() => onViewDetails(partner)}>
        {partner.partner_type ? (
          <Badge className={getPartnerTypeColor(partner.partner_type)}>{partner.partner_type.charAt(0).toUpperCase() + partner.partner_type.slice(1)}</Badge>
        ) : (
          <span className="text-muted-foreground">Not set</span>
        )}
      </TableCell>}
      {visibleColumns.sourceOfPartner && <TableCell onClick={() => onViewDetails(partner)}>
        <span className="text-sm">
          {getSourceOfPartnerLabel(partner.source_of_partner)}
        </span>
      </TableCell>}
      {visibleColumns.city && <TableCell onClick={() => onViewDetails(partner)}>
        {partner.city ? (
          <Badge className={stringToColor(partner.city)}>{partner.city}</Badge>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )}
      </TableCell>}
      {visibleColumns.state && <TableCell onClick={() => onViewDetails(partner)}>
        {partner.state ? (
          <Badge className={stringToColor(partner.state)}>{partner.state}</Badge>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )}
      </TableCell>}
      <TableCell>
        <div onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <PartnerActionsDialog partner={partner} onSuccess={onActionSuccess} />
            <PartnerCommentsDialog
              partner={partner}
              trigger={
                <Button variant="ghost" size="icon" title="View/Add Comments"><MessageSquare className="h-4 w-4" /></Button>
              }
            />
            {/* <AddPartnerDiscountDialog partner={partner} onSuccess={onActionSuccess}>
              <Button variant="ghost" size="icon" title="Add/Edit Discount">
                <Percent className="h-4 w-4" />
              </Button>
            </AddPartnerDiscountDialog> */}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default PartnerTableRow;
         