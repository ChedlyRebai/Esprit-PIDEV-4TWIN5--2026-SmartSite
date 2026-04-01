import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupText,
} from "@/components/ui/input-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import * as z from "zod";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreateTaskPayload,
  Task,
  TaskStage,
  TaskStatusEnum,
  UpdateTaskPayload,
  User,
} from "@/app/types";
import useTaskModal from "@/app/hooks/use-task-modal";
import {
  createTask,
  getTaskById,
  updateTask,
} from "@/app/action/planing.action";
import { getAllUsers, getUsersBySite } from "@/app/action/user.action";
import { data, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllTaskStages } from "@/app/action/taskStage.action";
import {
  getAllTaskStagesByMilestoneId,
  getTaskByTeamid,
} from "@/app/action/task.actions";
import { PlusIcon } from "lucide-react";
import useTaskStageModal from "@/app/hooks/use-task-stage-modal";
import { getMilestoneById } from "@/app/action/milestone.action";
import { getAllTeams, Team } from "@/app/action/team.action";
import axios from "axios";

const todayAtMidnight = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const formSchema = z
  .object({
    id: z.string().optional(),
    title: z
      .string()
      .min(3, "Task title must be at least 3 characters.")
      .max(120, "Task title must be at most 120 characters."),
    description: z
      .string()
      .max(500, "Description must be at most 500 characters.")
      .optional(),
    status: z.string().optional(),
    assignedTeams: z.array(z.string()).optional(),
    startDate: z.date(),
    endDate: z.date(),
  })
  .superRefine((data, ctx) => {
    const today = todayAtMidnight();
    if (data.startDate < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date cannot be in the past.",
        path: ["startDate"],
      });
    }

    if (data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be after or equal to start date.",
        path: ["endDate"],
      });
    }
  });

const TaskForms = ({ type }: { type: "edit" | "add" }) => {
  const queryClient = useQueryClient();
  // const milestoneId = "69bc78a30912805125e58f72";
  const { id: taskId, onClose, onTaskChange, milestoneId } = useTaskModal();
  console.log(
    "Milestone ID in TaskForms component:bbbbbbbbbbbbbbbbbbbbbbb",
    milestoneId,
  );
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  console.log("milestone from task form", milestoneId);
  const [openStartDate, setOpenStartDate] = useState(false);
  const [openEndDate, setOpenEndDate] = useState(false);
  console.log("milestone id from TAskForm", milestoneId);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: undefined,
      title: "",
      description: "",
      status: undefined,
      assignedTeams: [],
      startDate: new Date(),
      endDate: new Date(),
    },
  });

  const mutation = useMutation({
    mutationFn: (task: CreateTaskPayload | UpdateTaskPayload) => {
      if (type === "add") {
        console.log("Creating task with data:", task);
        return createTask(task, milestoneId, task.status as string);
      }

      if (type === "edit" && taskId) {
        return updateTask(taskId as string, task);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["getTaskSTagesByMilestoneId", milestoneId],
      });
      toast.success("Task created successfully");
      onClose();
    },
    onError: () => {
      toast.error("Failed to create task , please try again");
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) =>
    mutation.mutate(data);

  const loadTaskData = async () => {
    if (type !== "edit" || !taskId) {
      return;
    }

    try {
      const res = await getTaskById(String(taskId));
      if (res.status === 200) {
        form.reset({
          id: res.data._id,
          title: res.data.title ?? "",
          description: res.data.description ?? "",
          status: res.data.status ?? TaskStatusEnum.BACKLOG,
          assignedTeams: Array.isArray(res.data.assignedTeams)
            ? res.data.assignedTeams
            : [],
          startDate: res.data.startDate
            ? new Date(res.data.startDate)
            : new Date(),
          endDate: res.data.endDate ? new Date(res.data.endDate) : new Date(),
        });
        console.log("Loaded task data for editing:", res.data);
      }
    } catch {
      toast.error("Failed to load task data. Please try again.");
    }
  };

  useEffect(() => {
    //loadUsers();
    console.log("Task ID from params:sssssssssssssssssssssssssss", taskId);
    loadTaskData();
  }, [type, taskId]);
  // useEffect(() => {
  //   console.log("Milestone ID in TaskForms:", milestoneId);
  //   loadUsers();
  // }, []);

  const { data: taskStages } = useQuery({
    queryKey: ["getAllTaskStages"],
    queryFn: () => getAllTaskStagesByMilestoneId(milestoneId),
  });
  const {
    onOpen: onOpenTaskStageModal,
    setMilestoneid: setTaskstageMilestoneId,
  } = useTaskStageModal();
  // console.log("milestoneeeeeeeeeeeeeeeeeeeeeeeeeeeeee",milestoneId)
  const { data: teams, isLoading: LODINGuSER } = useQuery({
    queryKey: ["projectUsers", milestoneId],
    enabled: !!milestoneId,
    queryFn: async () => {
      try {
        if (!milestoneId) return [];
        const milestone = await getMilestoneById(milestoneId);
        const siteId = milestone?.projectId;
        const site=milestone?.projectId;
        const {data:siteData}= await axios.get(`http://localhost:3001/api/gestion-sites/${site}/teams`)
        
        console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", milestone);
        console.log("Site ID derived from milestone:", siteId,siteData);
        if (!siteId) {
          console.warn("No siteId on milestone; falling back to all users");
          const all = await getAllUsers();
          return Array.isArray(all?.data) ? all.data : [];
        }

        const response = await getAllTeams();
        console.log("Response from getUsersBySite in TaskForms:", response);
        console.log(
          "Milestone data in TaskForms:::::::::::::::::::::::::::::",
          response,
        );

        if (response?.status === 200 && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      } catch (error) {
        console.error("Error loading project users", error);
        toast.error("Failed to load users for this project.");
        return [];
      }
    },
  });
  console.log("Teams loaded for TaskForms:................;", teams);
  console.log("Task stages loaded for TaskForms:.................", taskStages);

  return (
    <>
      {taskId}
      <form id="form-rhf-TaskForms" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Controller
            name="title"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-rhf-TaskForms-title">
                  Task Title
                </FieldLabel>
                <Input
                  {...field}
                  id="form-rhf-TaskForms-title"
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter task title"
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-rhf-TaskForms-description">
                  Description
                </FieldLabel>
                <InputGroup>
                  <InputGroupTextarea
                    {...field}
                    id="form-rhf-TaskForms-description"
                    placeholder="Enter task description"
                    rows={6}
                    className="min-h-24 resize-none"
                    aria-invalid={fieldState.invalid}
                  />
                  <InputGroupAddon align="block-end">
                    <InputGroupText className="tabular-nums">
                      {(field.value ?? "").length}/500 characters
                    </InputGroupText>
                  </InputGroupAddon>
                </InputGroup>

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="assignedTeams"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Assigned team</FieldLabel>
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
                  {teams && !LODINGuSER && teams.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No teams available.
                    </p>
                  ) : (
                    teams &&
                    !LODINGuSER &&
                    teams.map((team: Team) => {
                      const teamId = team._id;
                      const label = team.name;
                      const isChecked = (field.value ?? []).includes(teamId);
                      // team.members && team.members.length > 0 && teams.members.map((member) => {
                      //   console.log("Team member in TaskForms:", member);
                      // });
                      return (
                        <div className="flex items-center gap-2" key={teamId}>
                          <Checkbox
                            checked={isChecked}
                            id={`task-team-${teamId}`}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([
                                  ...(field.value ?? []),
                                  teamId,
                                ]);
                                return;
                              }

                              field.onChange(
                                (field.value ?? []).filter(
                                  (id) => id !== teamId,
                                ),
                              );
                            }}
                          />
                          <label
                            className="cursor-pointer text-sm"
                            htmlFor={`task-team-${teamId}`}
                          >
                            {label}
                          </label>
                        </div>
                      );
                    })
                  )}
                </div>
              </Field>
            )}
          />

          <Controller
            name="status"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-rhf-TaskForms-status">
                  Status
                </FieldLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger
                    className="w-full"
                    id="form-rhf-TaskForms-status"
                  >
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* {Object.values(TaskStatusEnum).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))} */}

                    {taskStages &&
                      taskStages.length > 0 &&
                      taskStages.map((taskStage: TaskStage) => (
                        <SelectItem key={taskStage._id} value={taskStage._id}>
                          {taskStage.name}
                        </SelectItem>
                      ))}

                    <Button
                      variant="secondary"
                      className="w-full cursor-pointer"
                      onClick={() => {
                        setTaskstageMilestoneId(milestoneId);
                        onOpenTaskStageModal();
                      }}
                    >
                      <PlusIcon /> Add new stage
                    </Button>
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="startDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="task-start-date">Start date</FieldLabel>
                <Popover
                  open={openStartDate}
                  onOpenChange={setOpenStartDate}
                  modal={false}
                >
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline">
                      {field.value?.toLocaleDateString() || "Select date"}
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-auto p-0 z-50 pointer-events-auto">
                    <Calendar
                      disabled={(date) => date < todayAtMidnight()}
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        if (!date) return;
                        field.onChange(date);
                        setOpenStartDate(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="endDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="task-end-date">End date</FieldLabel>

                <Popover
                  open={openEndDate}
                  onOpenChange={setOpenEndDate}
                  modal={false}
                >
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="ml-auto">
                      {field.value?.toLocaleDateString() || "Select date"}
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-auto p-0 z-50 pointer-events-auto">
                    <Calendar
                      disabled={(date) => date < form.watch("startDate")}
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        if (!date) return;
                        field.onChange(date);
                        setOpenEndDate(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </form>

      <Field className="justify-end" orientation="horizontal">
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Reset
        </Button>
        <Button type="submit" form="form-rhf-TaskForms">
          Submit
        </Button>
      </Field>
    </>
  );
};

export default TaskForms;
