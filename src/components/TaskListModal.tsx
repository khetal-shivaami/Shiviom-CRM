import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Task } from '@/types';
import TaskItem from './TaskItem';

interface TaskListModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  status: string;
}

const TaskListModal = ({ isOpen, onClose, tasks, status }: TaskListModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="capitalize">{status} Tasks</DialogTitle>
          <DialogDescription>
            Here are all the tasks with the status "{status}".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
          {tasks.length > 0 ? (
            tasks.map((task) => <TaskItem key={task.id} task={task} />)
          ) : (
            <p className="text-sm text-muted-foreground text-center">No tasks found with this status.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskListModal;
