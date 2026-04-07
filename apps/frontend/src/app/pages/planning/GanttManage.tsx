import { getGanttTasksByMilestoneId } from "@/app/action/task.actions";
import { Editor, Gantt, IApi, Toolbar, Willow } from "@svar-ui/react-gantt";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useParams } from "react-router";

type GanttTask = {
  id: number;
  text: string;
  start: string | Date;
  end: string | Date;
  progress: number;
  type?: string;
  open?: boolean;
  parent?: number;
};

const links: never[] = [];

const scales = [
  { unit: "month", step: 1, format: "%M %Y" },
  { unit: "week", step: 1, format: "Week %w" },
  {unit: "day", step: 1, format: "%d %M" },
  //{ unit: "day", step: 1, format: "day %w" },
];

const GanttChart = () => {
  const { milestoneId } = useParams();

  const { data } = useQuery({
    queryKey: ["ganttTasksByMilestoneId", milestoneId],
    queryFn: () => getGanttTasksByMilestoneId(milestoneId || ""),
    enabled: Boolean(milestoneId),
  });

  const tasks = useMemo(
    () =>
      ((data as GanttTask[] | undefined) || []).map((task) => ({
        ...task,
        start: new Date(task.start),
        end: new Date(task.end),
      })),
    [data],
  );

  const [api, setApi] = useState<IApi | undefined>(undefined);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Willow>
        <Toolbar api={api} />
        <Gantt tasks={tasks} links={links} scales={scales} init={setApi} />
        {api && <Editor api={api} />}
      </Willow>
    </div>
  );
};

export default GanttChart;
