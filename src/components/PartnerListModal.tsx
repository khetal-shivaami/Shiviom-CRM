import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Partner } from '@/types';
import { Card, CardContent } from './ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface PartnerListModalProps {
  isOpen: boolean;
  onClose: () => void;
  partners: Partner[];
  stage: string;
}

const PartnerListModal = ({ isOpen, onClose, partners, stage }: PartnerListModalProps) => {
  const [openItemId, setOpenItemId] = useState<string | number | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="capitalize">{stage} Partners</DialogTitle>
          <DialogDescription>
            Here are all the partners currently in the "{stage}" stage.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
          {partners.length > 0 ? (
            partners.map((partner, index) => {
              const key = partner.portal_reseller_id || index;
              return (
                <Collapsible
                  key={key}
                  open={openItemId === key}
                  onOpenChange={() => setOpenItemId(openItemId === key ? null : key)}
                >
                  <CollapsibleTrigger asChild>
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardContent className="p-3">
                        <p className="text-sm font-semibold">
                          ID: {partner.portal_reseller_id || 'N/A'}
                        </p>
                        <p className="text-sm font-medium truncate" title={partner.name}>
                          {partner.name || 'No Name Provided'}
                        </p>
                      </CardContent>
                    </Card>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 mt-2 border rounded-md bg-muted/20 text-xs">
                      <h4 className="font-bold mb-2 text-sm">Partner Details</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="font-semibold">Onboarding Stage:</div>
                        <div>{partner.onboarding_stage || 'N/A'}</div>
                        <div className="font-semibold">Agreement Signed:</div>
                        <div>{['agreement', 'kyc', 'portal-activation', 'onboarded'].includes(partner.onboarding_stage) ? 'Yes' : 'No'}</div>
                        <div className="font-semibold">KYC Status:</div>
                        <div>{['kyc', 'portal-activation', 'onboarded'].includes(partner.onboarding_stage) ? 'Verified' : (partner.kyc_status || 'N/A')}</div>
                        {/* <div className="font-semibold">Created At:</div>
                        <div>{new Date(partner.created_at).toLocaleDateString()}</div> */}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              No partners found in this stage.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerListModal;
