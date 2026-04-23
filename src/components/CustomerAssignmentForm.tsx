import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Partner } from '../types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerAssignmentFormProps {
  formData: {
    partnerId: string;
    zone: string;
    value: string;
  };
  onChange: (field: string, value: string) => void;
}

const CustomerAssignmentForm = ({ formData, onChange }: CustomerAssignmentFormProps) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [partnerPopoverOpen, setPartnerPopoverOpen] = useState(false);
  const [partnerSearch, setPartnerSearch] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchAllPartners = async (): Promise<Partner[]> => {
      let allPartnersData: Partner[] = [];
      const CHUNK_SIZE = 1000;
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('partners')
          .select('id, name, company, onboarding_stage')
          .range(from, from + CHUNK_SIZE - 1);

        if (error) throw error;

        if (data) allPartnersData = [...allPartnersData, ...data];
        if (!data || data.length < CHUNK_SIZE) hasMore = false;
        else from += data.length;
      }
      return allPartnersData;
    };

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const partnersData = await fetchAllPartners();
        setPartners(partnersData || []);
      } catch (error: any) {
        toast({ title: 'Error fetching partners', description: error.message, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const zones = [
    { value: 'north', label: 'North' },
    { value: 'east', label: 'East' },
    { value: 'west', label: 'West' },
    { value: 'south', label: 'South' },
  ];

  const filteredPartnersForSelect = useMemo(() => {
    // Only show partners who have been fully onboarded.
    const onboardedPartners = partners.filter(p => p.onboarding_stage === 'onboarded');

    if (!partnerSearch) return onboardedPartners;
    return onboardedPartners.filter(p =>
      p.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
      (p.company && p.company.toLowerCase().includes(partnerSearch.toLowerCase()))
    );
  }, [partners, partnerSearch]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="partner">Assign Partner</Label>
        <div className="flex items-center gap-2">
          <Popover open={partnerPopoverOpen} onOpenChange={setPartnerPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={partnerPopoverOpen}
                className="w-full justify-between"
                disabled={isLoading}
              >
                {formData.partnerId
                  ? partners.find((partner) => partner.id === formData.partnerId)?.name
                  : "Select a partner"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Search partner..." onValueChange={setPartnerSearch} />
                <CommandEmpty>No partner found.</CommandEmpty>
                <CommandList className="max-h-[200px]">
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        onChange('partnerId', '');
                        setPartnerPopoverOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", !formData.partnerId ? "opacity-100" : "opacity-0")} />
                      No Partner
                    </CommandItem>
                    {filteredPartnersForSelect.map((partner) => (
                      <CommandItem
                        key={partner.id}
                        value={`${partner.name} ${partner.company}`}
                        onSelect={() => {
                          onChange('partnerId', partner.id);
                          setPartnerPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4", formData.partnerId === partner.id ? "opacity-100" : "opacity-0")}
                        />
                        <span>
                          {partner.name} - {partner.company}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {formData.partnerId && (
            <Button variant="ghost" size="icon" onClick={() => onChange('partnerId', '')} title="Clear selection">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="zone">Zone</Label>
        <Select value={formData.zone} onValueChange={(value) => onChange('zone', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Zone</SelectItem>
            {zones.map((zone) => (
              <SelectItem key={zone.value} value={zone.value}>
                {zone.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="value">Value (₹)</Label>
        <Input
          id="value"
          type="number"
          value={formData.value}
          onChange={(e) => onChange('value', e.target.value)}
          placeholder="Enter value"
        />
      </div>
    </div>
  );
};

export default CustomerAssignmentForm;
