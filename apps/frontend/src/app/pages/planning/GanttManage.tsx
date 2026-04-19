import { Editor, Gantt, IApi, Toolbar, Willow } from "@svar-ui/react-gantt";
import { useEffect, useState } from "react";
import { fetchGanttTasks, updateTaskDates, GanttTask } from "@/lib/planning-gantt-api";

const scales = [
  { unit: "month", step: 1, format: "%M %Y" },
  { unit: "week", step: 1, format: "Week %w" },
  { unit: "day", step: 1, format: "%d %M" },
];

const GanttChart = () => {
  const [api, setApi] = useState<IApi | undefined>(undefined);
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Par défaut, on utilise un projectId "demo" - à remplacer par le vrai ID depuis l'URL ou le contexte
  const projectId = "demo";

  // Charger les tâches depuis le backend
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        const data = await fetchGanttTasks(projectId);
        
        if (data.length === 0) {
          // Si pas de données, utiliser des données de demo
          setTasks([
            {
              id: "1",
              text: "Project Planning",
              start: new Date(2024, 0, 1),
              end: new Date(2024, 0, 10),
              progress: 100,
              type: "summary",
              open: true,
            },
            {
              id: "2",
              text: "Requirements Gathering",
              start: new Date(2024, 0, 1),
              end: new Date(2024, 0, 5),
              progress: 100,
              parent: "1",
            },
            {
              id: "3",
              text: "Design Phase",
              start: new Date(2024, 0, 6),
              end: new Date(2024, 0, 10),
              progress: 50,
              parent: "1",
            },
          ]);
          setLinks([{ id: 1, source: 2, target: 3, type: "e2s" }]);
        } else {
          setTasks(data);
        }
        setError(null);
      } catch (err) {
        console.error("Error loading Gantt tasks:", err);
        setError("Failed to load tasks. Showing demo data.");
        // Fallback to demo data
        setTasks([
          {
            id: "1",
            text: "Project Planning",
            start: new Date(2024, 0, 1),
            end: new Date(2024, 0, 10),
            progress: 100,
            type: "summary",
            open: true,
          },
          {
            id: "2",
            text: "Requirements Gathering",
            start: new Date(2024, 0, 1),
            end: new Date(2024, 0, 5),
            progress: 100,
            parent: "1",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [projectId]);

  // Gérer les changements de dates (drag & drop) - via la sauvegarde périodique
  const handleTaskUpdate = async (task: any) => {
    try {
      const start = task.start_date || task.start;
      const end = task.end_date || task.end;
      
      if (start && end) {
        await updateTaskDates(task.id, new Date(start), new Date(end));
        console.log(`Task ${task.id} dates updated`);
      }
    } catch (err) {
      console.error("Error updating task dates:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading Gantt chart...</div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", width: "100%" }}>
      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 mb-2">
          {error}
        </div>
      )}
      <Willow>
        <Toolbar api={api} />
        <Gantt 
          tasks={tasks} 
          links={links} 
          scales={scales} 
          init={setApi}
          onChange={handleTaskUpdate}
          onLinkDblClick={(link: any) => console.log("Link double-clicked:", link)}
          onTaskDblClick={(task: any) => console.log("Task double-clicked:", task)}
        />
        {api && <Editor api={api} />}
      </Willow>
    </div>
  );
};

export default GanttChart;
