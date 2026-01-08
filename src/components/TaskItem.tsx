import { Task } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TaskItemProps {
  task: Task;
}

const priorityVariant: { [key: string]: 'default' | 'secondary' | 'destructive' } = {
  low: 'default',
  medium: 'secondary',
  high: 'destructive',
  urgent: 'destructive',
};

const TaskItem = ({ task }: TaskItemProps) => {
  const dueDate = task.due_date ? new Date(task.due_date) : null;

  return (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{task.title}</span>
        {dueDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Due {formatDistanceToNow(dueDate, { addSuffix: true })}</span>
          </div>
        )}
      </div>
      <Badge variant={priorityVariant[task.priority] || 'default'} className="capitalize">
        {task.priority}
      </Badge>
    </div>
  );
};

export default TaskItem;