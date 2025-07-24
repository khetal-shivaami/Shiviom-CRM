import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Search, UserPlus, Filter, CheckCircle, Clock, AlertCircle, Eye, Users, FileText, Handshake, Shield, PenTool, Trophy, Link } from 'lucide-react';
import { Partner, User, OnboardingStage, PartnerOnboardingData } from '@/types';
import AddPartnerForm from '@/components/AddPartnerForm';
import PartnerOnboardingDetail from '@/components/PartnerOnboardingDetail';
import { PartnerStageEditForm } from '@/components/PartnerStageEditForm';
import { useTaskManager } from '@/hooks/useTaskManager';
import TaskNavigationBanner from '@/components/TaskNavigationBanner';

interface PartnerOnboardingProps {
  partners: Partner[];
  users: User[];
  onPartnerAdd?: (partner: Partner) => void;
  onNavigateToTasks?: (partnerId?: string) => void;
}

interface EnhancedPartner extends Partner {
  onboarding: PartnerOnboardingData;
}

const PartnerOnboarding = ({ partners, users, onPartnerAdd, onNavigateToTasks }: PartnerOnboardingProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [partnersData, setPartnersData] = useState<EnhancedPartner[]>([]);
  const { getOnboardingTasks } = useTaskManager();

  const stageConfig = {
    'outreach': { title: 'Outreach', icon: Users, color: 'bg-blue-500' },
    'product-overview': { title: 'Product Overview', icon: FileText, color: 'bg-purple-500' },
    'partner-program': { title: 'Partner Program', icon: Handshake, color: 'bg-green-500' },
    'kyc': { title: 'KYC', icon: Shield, color: 'bg-yellow-500' },
    'agreement': { title: 'Agreement', icon: PenTool, color: 'bg-orange-500' },
    'onboarded': { title: 'Onboarded', icon: Trophy, color: 'bg-emerald-500' }
  };

  // Generate mock onboarding data with 6-stage system
  const generateMockOnboardingData = (partner: Partner): PartnerOnboardingData => {
    const stages: OnboardingStage[] = ['outreach', 'product-overview', 'partner-program', 'kyc', 'agreement', 'onboarded'];
    const currentStageIndex = Math.floor(Math.random() * stages.length);
    const currentStage = stages[currentStageIndex];
    const progress = Math.min(90, (currentStageIndex + 1) * 16 + Math.floor(Math.random() * 20));
    
    return {
      currentStage,
      overallProgress: progress,
      completionPercentage: progress,
      startedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      expectedCompletionDate: new Date(Date.now() + Math.random() * 20 * 24 * 60 * 60 * 1000),
      lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      stages: Object.fromEntries(
        stages.map((stage, index) => [
          stage,
          {
            stage,
            status: index < currentStageIndex ? 'completed' : 
                   index === currentStageIndex ? (Math.random() > 0.3 ? 'in-progress' : 'blocked') : 'pending',
            startedAt: index <= currentStageIndex ? new Date(Date.now() - (stages.length - index) * 3 * 24 * 60 * 60 * 1000) : undefined,
            completedAt: index < currentStageIndex ? new Date(Date.now() - (stages.length - index - 1) * 3 * 24 * 60 * 60 * 1000) : undefined,
            assignedTo: ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson'][Math.floor(Math.random() * 4)],
            tasks: [
              { id: `${stage}-1`, title: `${stageConfig[stage].title} Task 1`, completed: index < currentStageIndex, required: true },
              { id: `${stage}-2`, title: `${stageConfig[stage].title} Task 2`, completed: index < currentStageIndex, required: true },
              { id: `${stage}-3`, title: `${stageConfig[stage].title} Task 3`, completed: false, required: false }
            ]
          }
        ])
      ) as Record<OnboardingStage, any>
    };
  };

  const enhancedPartners: EnhancedPartner[] = partners.map(partner => ({
    ...partner,
    onboarding: partner.onboarding || generateMockOnboardingData(partner)
  }));

  // Initialize partnersData on component mount
  useEffect(() => {
    const enhanced = partners.map(partner => ({
      ...partner,
      onboarding: partner.onboarding || generateMockOnboardingData(partner)
    }));
    setPartnersData(enhanced);
  }, [partners]);

  const handlePartnerUpdate = (updatedPartner: Partner) => {
    setPartnersData(prev => 
      prev.map(p => 
        p.id === updatedPartner.id 
          ? { ...updatedPartner, onboarding: updatedPartner.onboarding || generateMockOnboardingData(updatedPartner) }
          : p
      )
    );
  };

  const handleAddPartner = (partner: Partner) => {
    if (onPartnerAdd) {
      onPartnerAdd(partner);
    }
    setShowAddForm(false);
  };

  const getStageIcon = (stage: OnboardingStage) => {
    const config = stageConfig[stage];
    const IconComponent = config.icon;
    return <IconComponent className="h-4 w-4" />;
  };

  const getStageStatus = (partner: EnhancedPartner) => {
    const currentStageData = partner.onboarding.stages[partner.onboarding.currentStage];
    return currentStageData.status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'blocked':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const filteredPartners = partnersData.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'all' || partner.onboarding.currentStage === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  const statsData = [
    {
      title: 'Total Partners',
      value: enhancedPartners.length,
      color: 'text-blue-600',
      icon: Users
    },
    {
      title: 'Outreach',
      value: enhancedPartners.filter(p => p.onboarding.currentStage === 'outreach').length,
      color: 'text-blue-600',
      icon: Users
    },
    {
      title: 'Product Overview',
      value: enhancedPartners.filter(p => p.onboarding.currentStage === 'product-overview').length,
      color: 'text-purple-600',
      icon: FileText
    },
    {
      title: 'Partner Program',
      value: enhancedPartners.filter(p => p.onboarding.currentStage === 'partner-program').length,
      color: 'text-green-600',
      icon: Handshake
    },
    {
      title: 'KYC',
      value: enhancedPartners.filter(p => p.onboarding.currentStage === 'kyc').length,
      color: 'text-yellow-600',
      icon: Shield
    },
    {
      title: 'Agreement',
      value: enhancedPartners.filter(p => p.onboarding.currentStage === 'agreement').length,
      color: 'text-orange-600',
      icon: PenTool
    },
    {
      title: 'Onboarded',
      value: enhancedPartners.filter(p => p.onboarding.currentStage === 'onboarded').length,
      color: 'text-emerald-600',
      icon: Trophy
    }
  ];

  const avgProgress = enhancedPartners.length > 0 
    ? Math.round(enhancedPartners.reduce((sum, p) => sum + p.onboarding.overallProgress, 0) / enhancedPartners.length)
    : 0;

  if (selectedPartner) {
    return (
      <PartnerOnboardingDetail
        partner={selectedPartner}
        onBack={() => setSelectedPartner(null)}
      />
    );
  }

  if (showAddForm) {
    return (
      <div className="space-y-6">
        <AddPartnerForm 
          users={users}
          onPartnerAdd={handleAddPartner}
          onCancel={() => setShowAddForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Partner Onboarding</h2>
          <p className="text-muted-foreground">
            Track and manage partner onboarding process
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowAddForm(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Partner
          </Button>
        </div>
      </div>

      {/* Show banner for partners with onboarding tasks */}
      {filteredPartners.length > 0 && (
        <TaskNavigationBanner
          onboardingTasks={filteredPartners.flatMap(partner => getOnboardingTasks(partner.id))}
          onNavigateToTasks={() => onNavigateToTasks?.()}
          showOnPartnerOnboarding={true}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-8 gap-4">
        {statsData.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{avgProgress}%</div>
            <Progress value={avgProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search partners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="outreach">Outreach</SelectItem>
                <SelectItem value="product-overview">Product Overview</SelectItem>
                <SelectItem value="partner-program">Partner Program</SelectItem>
                <SelectItem value="kyc">KYC</SelectItem>
                <SelectItem value="agreement">Agreement</SelectItem>
                <SelectItem value="onboarded">Onboarded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead>
                <TableHead>Current Stage</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.map((partner) => {
                const currentStageData = partner.onboarding.stages[partner.onboarding.currentStage];
                const stageConfig = {
                  'outreach': { title: 'Outreach', icon: Users },
                  'product-overview': { title: 'Product Overview', icon: FileText },
                  'partner-program': { title: 'Partner Program', icon: Handshake },
                  'kyc': { title: 'KYC', icon: Shield },
                  'agreement': { title: 'Agreement', icon: PenTool },
                  'onboarded': { title: 'Onboarded', icon: Trophy }
                };
                
                return (
                  <TableRow 
                    key={partner.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedPartner(partner)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{partner.name}</div>
                        <div className="text-sm text-muted-foreground">{partner.company}</div>
                        <div className="text-xs text-muted-foreground">{partner.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStageIcon(partner.onboarding.currentStage)}
                        <div>
                          <div className="font-medium text-sm">
                            {stageConfig[partner.onboarding.currentStage].title}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusColor(currentStageData.status)} text-white border-0`}
                          >
                            {currentStageData.status.replace('-', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{partner.onboarding.overallProgress}%</div>
                        <Progress value={partner.onboarding.overallProgress} className="w-16 h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{currentStageData.assignedTo || 'Unassigned'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {partner.onboarding.lastActivity.toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-2">
                        <PartnerStageEditForm
                          partner={partner}
                          onUpdate={handlePartnerUpdate}
                        />
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            // Show onboarding tasks for this partner
                            const tasks = getOnboardingTasks(partner.id);
                            console.log(`${tasks.length} onboarding tasks for ${partner.name}`);
                          }}
                          title="View related tasks"
                        >
                          <Link className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerOnboarding;
