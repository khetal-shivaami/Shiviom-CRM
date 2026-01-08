import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { OnboardingStage, Partner } from "@/types";
import { PartnerStageApprovalDialog } from "./PartnerStageApprovalDialog";
import { Edit3 } from "lucide-react";

interface PartnerStageEditFormProps {
  partner: Partner;
  onUpdate: (partner: Partner) => void;
}

const stageOptions: OnboardingStage[] = [
  'outreach',
  'product-overview', 
  'partner-program',
  'portal-activation',
  'agreement',
  'kyc',
  'onboarded'
];

const stageLabels: Record<OnboardingStage, string> = {
  'outreach': 'Outreach',
  'product-overview': 'Product Overview',
  'partner-program': 'Partner Program',
  'portal-activation': 'Portal Activation',
  'agreement': 'Agreement',
  'kyc': 'KYC',
  'onboarded': 'Onboarded',
};

export function PartnerStageEditForm({ partner, onUpdate }: PartnerStageEditFormProps) {
  const [selectedStage, setSelectedStage] = useState<OnboardingStage>(
    partner.onboarding?.currentStage || 'outreach'
  );
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [pendingStageChange, setPendingStageChange] = useState<{
    from: OnboardingStage;
    to: OnboardingStage;
  } | null>(null);
  const { toast } = useToast();

  const currentStage = partner.onboarding?.currentStage || 'outreach';

  const handleStageChange = (newStage: OnboardingStage) => {
    setSelectedStage(newStage);
    
    // Check if changing FROM "onboarded" stage (requires approval)
    if (currentStage === 'onboarded' && newStage !== 'onboarded') {
      setPendingStageChange({
        from: currentStage,
        to: newStage
      });
      setIsApprovalDialogOpen(true);
      return;
    }
    
    // For all other stage changes, apply immediately
    applyStageChange(newStage);
  };

  const applyStageChange = (newStage: OnboardingStage) => {
    // Update the partner's onboarding stage
    const updatedPartner = {
      ...partner,
      onboarding: {
        ...partner.onboarding!,
        currentStage: newStage,
        lastActivity: new Date()
      }
    };

    onUpdate(updatedPartner);
    
    toast({
      title: "Stage Updated",
      description: `Partner stage changed to ${stageLabels[newStage]}`,
    });
  };

  const handleApprovalSuccess = () => {
    toast({
      title: "Approval Request Submitted",
      description: "The stage change request has been submitted for approval.",
    });
    // Reset the selected stage back to current since change is pending approval
    setSelectedStage(currentStage);
    setPendingStageChange(null);
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedStage}
        onValueChange={handleStageChange}
      >
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {stageOptions.map((stage) => (
            <SelectItem key={stage} value={stage}>
              {stageLabels[stage]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {pendingStageChange && (
        <PartnerStageApprovalDialog
          isOpen={isApprovalDialogOpen}
          onClose={() => {
            setIsApprovalDialogOpen(false);
            setPendingStageChange(null);
            setSelectedStage(currentStage); // Reset to current stage
          }}
          partner={partner}
          fromStage={pendingStageChange.from}
          toStage={pendingStageChange.to}
          onSuccess={handleApprovalSuccess}
        />
      )}
    </div>
  );
}