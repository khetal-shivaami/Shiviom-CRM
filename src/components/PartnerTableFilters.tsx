import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Filter } from 'lucide-react';

export const identityOptions = [
  { value: 'web-app-developer', label: 'Web/App Developer' },
  { value: 'system-integrator', label: 'System Integrator' },
  { value: 'managed-service-provider', label: 'Managed Service Provider' },
  { value: 'digital-marketer', label: 'Digital Marketer' },
  { value: 'cyber-security', label: 'Cyber Security' },
  { value: 'cloud-hosting', label: 'Cloud Hosting' },
  { value: 'web-hosting', label: 'Web Hosting' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'cloud-service-provider', label: 'Cloud Service Provider' },
  { value: 'microsoft-partner', label: 'Microsoft Partner' },
  { value: 'aws-partner', label: 'AWS Partner' },
  { value: 'it-consulting', label: 'IT Consulting' },
  { value: 'freelance', label: 'Freelance' },
];

export const paymentTermOptions = [
    { value: 'net-15', label: 'Net 15' },
    { value: 'net-30', label: 'Net 30' },
    { value: 'net-45', label: 'Net 45' },
    { value: 'net-60', label: 'Net 60' },
    { value: 'net-90', label: 'Net 90' },
    { value: 'annual-in-advance', label: 'Annual in Advance' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'half-yearly', label: 'Half Yearly' },
];

export const partnerTagOptions = [
  { value: 'asirt', label: 'ASIRT' }, { value: 'isoda', label: 'ISODA' }, { value: 'iamcp', label: 'IAMCP' }, { value: 'bni', label: 'BNI' },
  { value: 'microsoft-direct-reseller', label: 'Microsoft Direct reseller' }, { value: 'google-direct-reseller', label: 'Google Direct reseller' },
  { value: 'demanding', label: 'Demanding' }, { value: 'badwords', label: 'Badwords' }, { value: 'smb', label: 'SMB' },
  { value: 'mid-market', label: 'Mid-market' }, { value: 'enterprise', label: 'Enterprise' }, { value: 'gov-business', label: 'GOV Business' },
  { value: 'office-in-usa', label: 'Office in USA' }, { value: 'office-in-europe', label: 'Office in Europe' }, { value: 'office-in-aus', label: 'Office in AUS' },
  { value: 'office-in-south-asia', label: 'Office in South Asia' }, { value: 'office-in-africa', label: 'Office in Africa' }, { value: 'office-in-dubai', label: 'Office in Dubai' },
];

export const partnerTypeOptions = [
    { value: 'silver', label: 'Silver' },
    { value: 'gold', label: 'Gold' },
];

export const partnerProgramOptions = [
    { value: 'Referal Partner', label: 'Referral Partner' },
    { value: 'Commited Partner', label: 'Committed Partner' },
];

export const sourceOfPartnerOptions = [
  { value: 'webinar', label: 'Webinar' }, { value: 'event', label: 'Event' }, { value: 'referral', label: 'Referral' },
  { value: 'inbound', label: 'Inbound' }, { value: 'outbound', label: 'Outbound' }, { value: 'whatsapp-campaign', label: 'Whatsapp Campaign' },
  { value: 'email-campaign', label: 'Email Campaign' }, { value: 'shivaami', label: 'Shivaami' }, { value: 'axima', label: 'Axima' },
  { value: 'management', label: 'Management' },
];

export const zoneOptions = [
    { value: 'north', label: 'North' },
    { value: 'east', label: 'East' },
    { value: 'west', label: 'West' },
    { value: 'south', label: 'South' },
];

export const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

interface PartnerTableFiltersProps {
  filters: Record<string, string[]>;
  onFilterChange: (filters: Record<string, string[]>) => void;
  stateOptions: { value: string, label: string }[];
  cityOptions: { value: string, label: string }[];
}

const PartnerTableFilters = ({ filters, onFilterChange, stateOptions, cityOptions }: PartnerTableFiltersProps) => {

  const filteredCityOptions = useMemo(() => {
    if (!filters.state || filters.state.length === 0) {
      return cityOptions; // Show all cities if no state is selected
    }
    // This logic assumes city names are unique or you have a way to map them to states.
    // A more robust solution would involve having state information alongside city data.
    // For now, we'll filter based on what's available.
    return cityOptions; // This part needs backend support to be truly effective.
  }, [cityOptions, filters.state]);

  const handleCheckedChange = (filterKey: string, value: string) => {
    const newFilters = {
      ...filters,
      [filterKey]: (filters[filterKey] || []).includes(value)
        ? (filters[filterKey] || []).filter(v => v !== value)
        : [...(filters[filterKey] || []), value],
    };

    onFilterChange(newFilters);
  };

  const renderFilterSubMenu = (title: string, filterKey: string, options: { value: string, label: string }[]) => (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{title}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
        <DropdownMenuLabel>{title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map(option => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={(filters[filterKey] || []).includes(option.value)}
            onCheckedChange={() => handleCheckedChange(filterKey, option.value)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter size={16} className="mr-2" />
          Filters
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Filter Partners</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {renderFilterSubMenu('Status', 'status', statusOptions)}
        {renderFilterSubMenu('Identity', 'identity', identityOptions)}
        {renderFilterSubMenu('Payment Terms', 'paymentTerms', paymentTermOptions)}
        {renderFilterSubMenu('Partner Tags', 'partnerTags', partnerTagOptions)}
        {renderFilterSubMenu('Partner Type', 'partnerType', partnerTypeOptions)}
        {renderFilterSubMenu('Source of Partner', 'source', sourceOfPartnerOptions)}
        {renderFilterSubMenu('Zone', 'zone', zoneOptions)}
        {renderFilterSubMenu('Partner Program', 'partnerProgram', partnerProgramOptions)}
        {stateOptions.length > 0 && renderFilterSubMenu('State', 'state', stateOptions)}
        {cityOptions.length > 0 && renderFilterSubMenu('City', 'city', filteredCityOptions)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PartnerTableFilters;
