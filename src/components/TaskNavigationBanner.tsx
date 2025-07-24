import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, LinkIcon, Clock, CheckCircle } from 'lucide-react';
import { Task } from '@/types';

interface TaskNavigationBannerProps {
  partnerId?: string;
  partnerName?: string;
  onboardingTasks: Task[];
  onNavigateToTasks: () => void;
  showOnPartnerOnboarding?: boolean;
}

export const TaskNavigationBanner = ({ 
  partnerId, 
  partnerName, 
  onboardingTasks, 
  onNavigateToTasks,
  showOnPartnerOnboarding = false
}: TaskNavigationBannerProps) => {
  const pendingTasks = onboardingTasks.filter(task => task.status === 'pending').length;
  const completedTasks = onboardingTasks.filter(task => task.status === 'completed').length;
  const inProgressTasks = onboardingTasks.filter(task => task.status === 'in-progress').length;

  if (onboardingTasks.length === 0) return null;

  return (
    <Card className="mb-4 border-l-4 border-l-blue-500 bg-blue-50/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <LinkIcon className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-sm text-gray-900">
                {showOnPartnerOnboarding ? 'Related Tasks' : 'Onboarding Tasks Connected'}
              </h4>
              {partnerName && (
                <p className="text-xs text-gray-600">
                  {showOnPartnerOnboarding ? `${onboardingTasks.length} tasks for this partner` : `Tasks for ${partnerName}`}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {pendingTasks > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {pendingTasks} pending
                </Badge>
              )}
              {inProgressTasks > 0 && (
                <Badge variant="default" className="text-xs bg-blue-500">
                  {inProgressTasks} in progress
                </Badge>
              )}
              {completedTasks > 0 && (
                <Badge variant="default" className="text-xs bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {completedTasks} completed
                </Badge>
              )}
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={onNavigateToTasks}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              {showOnPartnerOnboarding ? 'View in Task Management' : 'View Onboarding Tasks'}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskNavigationBanner;