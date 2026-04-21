import useTaskDetailsModal from "@/app/hooks/use-task-details-modal";
import React from "react";
import Modal from "./Modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { deleteTask } from "@/app/action/planing.action";
import useTaskModal from "@/app/hooks/use-task-modal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getAllTaskStagesByMilestoneId } from "@/app/action/task.actions";
import { getAllTeams, Team } from "@/app/action/team.action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const TaskDetailModal = () => {
  const queryClient = useQueryClient();
  const { id, onClose, isOpen, task, setTask } = useTaskDetailsModal();
  const {
    setId: setEditTaskId,
    onOpen: onOpenEditModal,
    setType,
    setMilestoneid,
  } = useTaskModal();

  const { data: taskStages = [] } = useQuery({
    queryKey: ["taskStagesForDetails", task?.milestoneId],
    queryFn: () => getAllTaskStagesByMilestoneId(task?.milestoneId),
    enabled: isOpen && !!task?.milestoneId,
  });

  const { data: teamsResponse } = useQuery({
    queryKey: ["teamsForDetails"],
    queryFn: getAllTeams,
    enabled: isOpen,
  });

  const teams = teamsResponse?.data ?? [];

  const statusLabel = (() => {
    const statusValue = task?.status;

    if (!statusValue) {
      return "N/A";
    }

    if (statusValue && typeof statusValue === "object") {
      const statusObject = statusValue as { name?: string };
      if (statusObject.name) {
        return statusObject.name;
      }
    }

    const taskStatusId = String(statusValue);
    const matchingStage = taskStages.find(
      (stage: { _id?: string; name?: string }) => stage._id === taskStatusId,
    );

    return matchingStage?.name || taskStatusId;
  })();

  const assignedTeamLabels = (task?.assignedTeams ?? []).map((teamId) => {
    const matchingTeam = teams.find((team: Team) => team._id === teamId);
    return matchingTeam?.name || teamId;
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["getTaskSTagesByMilestoneId"],
      });
      toast.success("Task deleted successfully");
      setTask(undefined);
      onClose();
    },
    onError: () => {
      toast.error("Failed to delete task");
    },
  });

  const handleUpdate = () => {
    if (!task?._id) {
      return;
    }

    if (task.milestoneId) {
      setMilestoneid(task.milestoneId);
    }
    setEditTaskId(task._id);
    setType("edit");
    onClose();
    onOpenEditModal();
  };

  const handleDelete = () => {
    if (!task?._id) {
      return;
    }
    deleteMutation.mutate(task._id);
  };

  return (
    <Modal
      title={`Task Details`}
      description="View and manage this task"
      isOpen={isOpen}
      onChange={onClose}
    >
      <div className="space-y-4">
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
          <p>
            <strong>Title:</strong> {task?.title || "N/A"}
          </p>
          <p>
            <strong>Description:</strong> {task?.description || "N/A"}
          </p>
          <p>
            <strong>Status:</strong> {statusLabel}
          </p>
          <p>
            <strong>Priority:</strong>{" "}
            <Badge variant="outline">{task?.priority || "MEDIUM"}</Badge>
          </p>
          <p>
            <strong>Start Date:</strong>{" "}
            {task?.startDate
              ? new Date(task.startDate).toLocaleDateString()
              : "N/A"}
          </p>
          <p>
            <strong>End Date:</strong>{" "}
            {task?.endDate
              ? new Date(task.endDate).toLocaleDateString()
              : "N/A"}
          </p>

          {assignedTeamLabels.length > 0 && (
            <div>
              <strong>Assigned Teams:</strong>
              <ul className="mt-1 list-disc list-inside text-sm text-slate-700">
                {assignedTeamLabels.map((team, index) => (
                  <li key={index}>{team}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleUpdate}>
            Update
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The task will be permanently
                  removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleDelete}
                >
                  Confirm Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailModal;
