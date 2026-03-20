import { fetchSites } from "@/app/action/site.action";

import { useQuery } from "@tanstack/react-query";

import {
  Warehouse,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";

import type { Milestone, Site } from "../../types";

import "leaflet/dist/leaflet.css";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { getMilestonesByProjectId } from "@/app/action/planing.action";

const ProjectMilestone = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  const {projectId}=useParams()
  const { data, isPending, isLoading, isError } = useQuery({
    queryKey: ["siteMilestoneData"],
    queryFn: async () => {
      const response = await getMilestonesByProjectId(projectId);
      setMilestones(response.data);
      console.log(response.data);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planing</h1>
          <p className="text-gray-500 mt-1">
            Manage site relationships and orders
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Planing Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {milestones.map((milestone) => (
              <div key={milestone._id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{milestone.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{milestone.description}</p>
                    <p className="text-sm text-gray-600 mt-2">
                      {milestone.startDate?.toLocaleDateString()} • {milestone.endDate?.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button  size="sm" variant="outline">
                     <Link to={`/project-milestone/${milestone._id}`} >Milestones</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectMilestone;
