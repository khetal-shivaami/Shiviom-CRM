import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Handshake, Users, Shield, PenTool, Trophy, KeyRound } from 'lucide-react';
import { OnboardingStage, OnboardingStageData, User } from '@/types';
import { cn } from '@/lib/utils';

interface PartnerOnboardingStageTimelineProps {
  stages: Record<OnboardingStage, OnboardingStageData>;
  currentStage: OnboardingStage;
  stageOwnerId?: string | null;
  users: User[];
}

const stageConfig = {
  'outreach': {
    title: 'Outreach',
    description: 'Initial contact and lead qualification',
    icon: Users,
    color: 'hsl(var(--primary))'
  },
  'product-overview': {
    title: 'Product Overview',
    description: 'Product demonstration and feature walkthrough',
    icon: FileText,
    color: 'hsl(var(--secondary))'
  },
  'partner-program': {
    title: 'Partner Program',
    description: 'Program details, benefits, and requirements',
    icon: Handshake,
    color: 'hsl(var(--accent))'
  },
  'portal-activation': {
    title: 'Portal Activation',
    description: 'Partner portal access and setup',
    icon: KeyRound,
    color: 'hsl(var(--info))'
  },
  'kyc': {
    title: 'KYC',
    description: 'Documentation, verification, and compliance',
    icon: Shield,
    color: 'hsl(var(--muted-foreground))'
  },
  'agreement': {
    title: 'Agreement',
    description: 'Contract negotiation and signing',
    icon: PenTool,
    color: 'hsl(var(--destructive))'
  },
  'onboarded': {
    title: 'Onboarded',
    description: 'Final setup and activation complete',
    icon: Trophy,
    color: 'hsl(var(--success))'
  }
} as const;

const stageOrder: OnboardingStage[] = ['outreach', 'product-overview', 'partner-program', 'portal-activation', 'agreement', 'kyc', 'onboarded'];

const PartnerOnboardingStageTimeline = ({ stages, currentStage, stageOwnerId, users }: PartnerOnboardingStageTimelineProps) => {
  const currentStageData = stages[currentStage];
  const currentStageConfig = stageConfig[currentStage];
  const currentStageIndex = stageOrder.indexOf(currentStage);

  const getStageOwnerName = () => {
    if (!stageOwnerId) return 'Unassigned';
    const owner = users.find(u => u.id === stageOwnerId);
    return owner ? owner.name : 'Unknown Owner';
  };

  return (
    <div className="space-y-6">
      {/* Current Stage Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Stage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-primary`}>
              <currentStageConfig.icon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{currentStageConfig.title}</h3>
            </div>
          </div>
          <div className="text-sm text-muted-foreground space-y-1 pl-2 border-l-2">
            {currentStageData.startedAt && (
              <p>Stage Started: {currentStageData.startedAt.toLocaleDateString()}</p>
            )}
            { (
              <p>Stage Owner: {getStageOwnerName()}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Flow Card */}
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start">
            {stageOrder.map((stage, index) => {
              const config = stageConfig[stage];
              const Icon = config.icon;
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;

              return (
                <React.Fragment key={stage}>
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
                        isCurrent
                          ? 'bg-primary border-primary text-primary-foreground scale-110'
                          : isCompleted
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-muted border-border text-muted-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p
                      className={cn(
                        'mt-2 text-xs font-medium w-20',
                        isCurrent ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      {config.title}
                    </p>
                  </div>
                  {index < stageOrder.length - 1 && (
                    <div
                      className={cn(
                        'mt-5 h-0.5 flex-1 transition-all duration-300',
                        isCompleted ? 'bg-primary' : 'bg-border'
                      )}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerOnboardingStageTimeline;