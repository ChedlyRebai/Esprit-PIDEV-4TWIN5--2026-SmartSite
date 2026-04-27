import { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  Search,
  Users,
  Edit,
  Trash2,
  User,
  Building,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { mockTeamMembers } from "../../utils/mockData";
import { toast } from "sonner";
import { TeamBiDashboard } from "../../components/TeamBiDashboard";
import {
  getAllTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  addMemberToTeam,
  removeMemberFromTeam,
} from "../../action/team.action";
import { getAllUsers } from "../../action/user.action";
import { getAssignedTeamIds } from "../../action/site.action";

interface TeamData {
  _id: string;
  name: string;
  description?: string;
  members: any[];
  manager?: any;
  site?: any;
  isActive: boolean;
  teamCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UserData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: { name: string };
}

export default function Team() {
  // Allow all users to manage teams - set to true always
  const canManageTeam = true;

  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Track which teams are assigned to sites: teamId -> { siteId, siteName, status }
  const [teamSiteAssignments, setTeamSiteAssignments] = useState<
    Record<string, { siteId: string; siteName: string; status: string }>
  >({});

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Form states
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
    teamCode: "",
  });
  const [editTeam, setEditTeam] = useState<TeamData | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<TeamData | null>(null);
  const [selectedTeamView, setSelectedTeamView] = useState<TeamData | null>(
    null,
  );

  // Available users for adding members
  const [availableUsers, setAvailableUsers] = useState<UserData[]>([]);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [editMemberUserId, setEditMemberUserId] = useState("");
  const [userLoadingError, setUserLoadingError] = useState(false);

  // Statistics
  const totalTeams = teams.length;
  const activeTeams = teams.filter((t) => t.isActive).length;
  const inactiveTeams = totalTeams - activeTeams;
  const totalMembers = teams.reduce(
    (sum, team) => sum + (team.members?.length || 0),
    0,
  );

  // Fetch teams from API
  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch teams and site assignments in parallel
      const [teamsResponse, siteAssignments] = await Promise.all([
        getAllTeams(),
        getAssignedTeamIds(),
      ]);

      console.log("Teams loaded from API:", teamsResponse.data);
      console.log("Site assignments:", siteAssignments);

      setTeams(teamsResponse.data);
     // setTeamSiteAssignments(siteAssignments);
      setUseMockData(false);
    } catch (err) {
      console.error("Error loading teams, using mock data:", err);
      setError("Backend not available, using mock data");
      // Create mock teams for demo
      setTeams([
        {
          _id: "1",
          name: "Team A",
          description: "Main construction team",
          members: mockTeamMembers.slice(0, 3),
          isActive: true,
          teamCode: "TEAM-A",
        },
        {
          _id: "2",
          name: "Team B",
          description: "Maintenance team",
          members: mockTeamMembers.slice(3, 5),
          isActive: true,
          teamCode: "TEAM-B",
        },
      ]);
      setUseMockData(true);
      toast.warning("Offline mode - demo data");
    } finally {
      setLoading(false);
    }
  };

  // busyMemberIds: set of user IDs who are in a team assigned to a site
  // whose project is NOT completed/terminé
  const [busyMemberIds, setBusyMemberIds] = useState<Set<string>>(new Set());

  // Load available users when member dialog opens
  useEffect(() => {
    if (memberDialogOpen) {
      loadAvailableUsers();
      loadBusyMembers();
    }
  }, [memberDialogOpen]);

  const loadAvailableUsers = async () => {
    try {
      setUserLoadingError(false);
      const response = await getAllUsers();
      if (response?.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
        const normalizedUsers = response.data.map((user: any) => ({
          _id: String(user._id ?? user.id ?? ""),
          firstName: user.firstName || user.firstname || user.nom || "",
          lastName: user.lastName || user.lastname || user.prenom || "",
          email: user.email || "",
          role: user.role || null,
        }));
        setAvailableUsers(normalizedUsers);
        setUserLoadingError(false);
      } else {
        setUserLoadingError(true);
      }
    } catch (err) {
      console.error("Error loading users:", err);
      setUserLoadingError(true);
    }
  };

  // Build the set of "busy" member IDs:
  // A member is busy if they belong to a team assigned to a site
  // whose linked project is NOT completed/terminé
  const loadBusyMembers = async () => {
    try {
      const SITE_URL = (import.meta as any).env?.VITE_GESTION_SITE_URL ?? "http://localhost:3001/api";
      const PROJ_URL = (import.meta as any).env?.VITE_GESTION_PROJECTS_URL ?? "http://localhost:3010/api";

      // 1. Fetch all sites (with projectId + teamIds)
      const sitesRes = await axios.get(`${SITE_URL}/gestion-sites`, { params: { limit: 1000 } });
      const allSites: any[] = sitesRes.data?.data || sitesRes.data || [];

      // 2. Collect unique projectIds from sites that have teams assigned
      const projectIds = [...new Set(
        allSites
          .filter((s: any) => s.teamIds?.length > 0 || s.teams?.length > 0)
          .map((s: any) => s.projectId)
          .filter(Boolean)
      )];

      // 3. Fetch those projects to get their status
      const projectStatusMap: Record<string, string> = {};
      await Promise.all(
        projectIds.map(async (pid: string) => {
          try {
            const pRes = await axios.get(`${PROJ_URL}/projects/${pid}`);
            projectStatusMap[pid] = pRes.data?.status || "";
          } catch { /* ignore */ }
        })
      );

      const DONE_STATUSES = ["completed", "terminé", "cancelled"];

      // 4. For each site whose project is NOT done, collect all member IDs of assigned teams
      const busy = new Set<string>();
      allSites.forEach((site: any) => {
        const projStatus = projectStatusMap[site.projectId] || "";
        if (DONE_STATUSES.includes(projStatus)) return; // project done → members are free

        const teamIdsOnSite: string[] = [
          ...(site.teamIds || []).map((t: any) => String(t._id || t)),
          ...(site.teams || []).map((t: any) => String(t._id || t)),
        ];

        teamIdsOnSite.forEach((tid) => {
          const team = teams.find((t) => t._id === tid);
          team?.members?.forEach((m: any) => {
            if (m._id) busy.add(String(m._id));
          });
        });
      });

      setBusyMemberIds(busy);
    } catch (err) {
      console.error("loadBusyMembers error:", err);
      setBusyMemberIds(new Set());
    }
  };

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.teamCode?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const TEAM_PAGE_SIZE = 6;
  const [teamPage, setTeamPage] = useState(1);
  const teamTotalPages = Math.ceil(filteredTeams.length / TEAM_PAGE_SIZE);
  const paginatedTeams = filteredTeams.slice(
    (teamPage - 1) * TEAM_PAGE_SIZE,
    teamPage * TEAM_PAGE_SIZE
  );

  // Reset page when search changes
  useEffect(() => {
    setTeamPage(1);
  }, [searchTerm]);

  // Helper function to check if a team is assigned to a site
  const isTeamAssignedToSite = (teamId: string) => {
    return !!teamSiteAssignments[teamId];
  };

  // Get all member IDs from all teams (for filtering available users in new team creation)
  const getAllTeamMemberIds = () => {
    const memberIds = new Set<string>();
    teams.forEach((team) => {
      team.members?.forEach((m: any) => {
        if (m._id) memberIds.add(m._id);
      });
    });
    return memberIds;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const handleAddTeam = async () => {
    // Validation
    const trimmedName = newTeam.name.trim();
    const trimmedDescription = newTeam.description.trim();
    const trimmedCode = newTeam.teamCode.trim();

    if (!trimmedName) {
      toast.error("Team name is required");
      return;
    }

    if (trimmedName.length < 2) {
      toast.error("Team name must be at least 2 characters");
      return;
    }

    if (trimmedName.length > 50) {
      toast.error("Team name must not exceed 50 characters");
      return;
    }

    // Check for duplicate team name
    const duplicateName = teams.find(
      (t) => t.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (duplicateName) {
      toast.error("A team with this name already exists");
      return;
    }

    // Validate team code if provided
    if (trimmedCode) {
      if (trimmedCode.length > 20) {
        toast.error("Team code must not exceed 20 characters");
        return;
      }
      // Check for duplicate team code
      const duplicateCode = teams.find(
        (t) => t.teamCode?.toLowerCase() === trimmedCode.toLowerCase(),
      );
      if (duplicateCode) {
        toast.error("A team with this code already exists");
        return;
      }
    }

    try {
      if (useMockData) {
        const team: TeamData = {
          _id: String(teams.length + 1),
          name: trimmedName,
          description: trimmedDescription,
          teamCode: trimmedCode,
          members: [],
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        setTeams([...teams, team]);
        toast.success("Team added successfully!");
      } else {
        const response = await createTeam({
          name: trimmedName,
          description: trimmedDescription,
          teamCode: trimmedCode,
          isActive: true,
        });
        setTeams([...teams, response.data]);
        toast.success("Team created successfully!");
      }
      setNewTeam({ name: "", description: "", teamCode: "" });
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Error creating team:", error);
      toast.error("Error creating team");
    }
  };

  const handleEditTeam = (team: TeamData) => {
    setEditTeam(team);
    setEditMemberUserId("");
    setEditDialogOpen(true);
    loadAvailableUsers();
  };

  const handleSaveEdit = async () => {
    if (!editTeam) return;

    // Validation
    const trimmedName = editTeam.name.trim();
    const trimmedDescription = editTeam.description?.trim() || "";
    const trimmedCode = editTeam.teamCode?.trim() || "";

    if (!trimmedName) {
      toast.error("Team name is required");
      return;
    }

    if (trimmedName.length < 2) {
      toast.error("Team name must be at least 2 characters");
      return;
    }

    if (trimmedName.length > 50) {
      toast.error("Team name must not exceed 50 characters");
      return;
    }

    // Check for duplicate team name (excluding current team)
    const duplicateName = teams.find(
      (t) =>
        t._id !== editTeam._id &&
        t.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (duplicateName) {
      toast.error("A team with this name already exists");
      return;
    }

    // Validate team code if provided
    if (trimmedCode) {
      if (trimmedCode.length > 20) {
        toast.error("Team code must not exceed 20 characters");
        return;
      }
      // Check for duplicate team code (excluding current team)
      const duplicateCode = teams.find(
        (t) =>
          t._id !== editTeam._id &&
          t.teamCode?.toLowerCase() === trimmedCode.toLowerCase(),
      );
      if (duplicateCode) {
        toast.error("A team with this code already exists");
        return;
      }
    }

    try {
      if (useMockData) {
        const updatedTeam = {
          ...editTeam,
          name: trimmedName,
          description: trimmedDescription,
          teamCode: trimmedCode,
        };
        setTeams(teams.map((t) => (t._id === editTeam._id ? updatedTeam : t)));
        toast.success("Team updated successfully!");
      } else {
        const response = await updateTeam(editTeam._id, {
          name: trimmedName,
          description: trimmedDescription,
          teamCode: trimmedCode,
          isActive: editTeam.isActive,
        });
        setTeams(
          teams.map((t) => (t._id === editTeam._id ? response.data : t)),
        );
        toast.success("Team updated successfully!");
      }
      setEditDialogOpen(false);
      setEditTeam(null);
    } catch (error) {
      console.error("Error updating team:", error);
      toast.error("Error updating team");
    }
  };

  const handleDeleteTeam = (team: TeamData) => {
    setTeamToDelete(team);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!teamToDelete) return;

    try {
      if (useMockData) {
        setTeams(teams.filter((t) => t._id !== teamToDelete._id));
        toast.success("Team deleted successfully!");
      } else {
        await deleteTeam(teamToDelete._id);
        setTeams(teams.filter((t) => t._id !== teamToDelete._id));
        toast.success("Team deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting team:", error);
      toast.error("Error deleting team");
    } finally {
      setDeleteDialogOpen(false);
      setTeamToDelete(null);
    }
  };

  const handleViewTeam = (team: TeamData) => {
    setSelectedTeamView(team);
    setViewDialogOpen(true);
  };

  const handleAddMember = async () => {
    if (!selectedTeamView || !selectedUserId) {
      toast.error("Please select a member to add");
      return;
    }

    // Check if user is already a member of this team
    const isAlreadyMember = selectedTeamView.members?.some(
      (m: any) => m._id === selectedUserId,
    );
    if (isAlreadyMember) {
      toast.error("This user is already a member of the team");
      return;
    }

    // Check if user is already in a team assigned to an active site (not completed)
    const userTeamAssignment = Object.entries(teamSiteAssignments).find(
      ([teamId, assignment]) => {
        const team = teams.find(t => t._id === teamId);
        const isMemberOfTeam = team?.members?.some((m: any) => m._id === selectedUserId);
        const isSiteCompleted = assignment.status === 'completed';
        return isMemberOfTeam && !isSiteCompleted;
      }
    );
    if (userTeamAssignment) {
      const [teamId, assignment] = userTeamAssignment;
      const team = teams.find(t => t._id === teamId);
      toast.error(`Ce membre est déjà dans l'équipe "${team?.name}" assignée au site "${assignment.siteName}". Vous ne pouvez pas l'ajouter à une autre équipe.`);
      return;
    }

    try {
      if (useMockData) {
        const userToAdd = availableUsers.find((u) => u._id === selectedUserId);
        if (userToAdd) {
          const updatedTeam = {
            ...selectedTeamView,
            members: [...selectedTeamView.members, userToAdd],
          };
          setTeams(
            teams.map((t) =>
              t._id === selectedTeamView._id ? updatedTeam : t,
            ),
          );
          setSelectedTeamView(updatedTeam);
        }
        toast.success("Member added successfully!");
      } else {
        const response = await addMemberToTeam(
          selectedTeamView._id,
          selectedUserId,
        );
        setTeams(
          teams.map((t) =>
            t._id === selectedTeamView._id ? response.data : t,
          ),
        );
        setSelectedTeamView(response.data);
        toast.success("Member added successfully!");
      }
      setSelectedUserId("");
      setMemberDialogOpen(false);
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Error adding member");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedTeamView) return;

    try {
      if (useMockData) {
        const updatedTeam = {
          ...selectedTeamView,
          members: selectedTeamView.members.filter(
            (m: any) => m._id !== memberId,
          ),
        };
        setTeams(
          teams.map((t) => (t._id === selectedTeamView._id ? updatedTeam : t)),
        );
        setSelectedTeamView(updatedTeam);
        toast.success("Member removed successfully!");
      } else {
        const response = await removeMemberFromTeam(
          selectedTeamView._id,
          memberId,
        );
        setTeams(
          teams.map((t) =>
            t._id === selectedTeamView._id ? response.data : t,
          ),
        );
        setSelectedTeamView(response.data);
        toast.success("Member removed successfully!");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Error removing member");
    }
  };

  return (
    <div className="space-y-6">
      {/* BI Dashboard */}
      <TeamBiDashboard teams={teams} />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Teams
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            {filteredTeams.length} team{filteredTeams.length !== 1 ? "s" : ""} •
            <span className="ml-1">
              {teams.filter((t) => t.isActive).length} active
              {teams.filter((t) => t.isActive).length !== 1 ? "s" : ""}
            </span>
          </p>
        </div>
        {canManageTeam ? (
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg hover:shadow-xl transition-all">
                <Plus className="h-4 w-4 mr-2" />
                New Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Fill in the information below to create a new team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team Name *</Label>
                  <Input
                    id="team-name"
                    placeholder="Team A"
                    value={newTeam.name}
                    onChange={(e) =>
                      setNewTeam({ ...newTeam, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-code">Team Code</Label>
                  <Input
                    id="team-code"
                    placeholder="TEAM-A"
                    value={newTeam.teamCode}
                    onChange={(e) =>
                      setNewTeam({ ...newTeam, teamCode: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-description">Description</Label>
                  <Input
                    id="team-description"
                    placeholder="Description of the team"
                    value={newTeam.description}
                    onChange={(e) =>
                      setNewTeam({ ...newTeam, description: e.target.value })
                    }
                  />
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  onClick={handleAddTeam}
                >
                  Create Team
                </Button>
                <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-3">
                  <Building className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-700">
                    After creating your team, go to <span className="font-semibold">Sites</span> and assign this team to a site.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Button disabled className="opacity-50 cursor-not-allowed">
            <Plus className="h-4 w-4 mr-2" />
            Add Team (No Permission)
          </Button>
        )}
      </div>

      {/* Edit Team Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) { setEditMemberUserId(""); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>Update team information and members</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {/* Team Info */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="edit-team-name">Team Name *</Label>
                <Input
                  id="edit-team-name"
                  value={editTeam?.name || ""}
                  onChange={(e) =>
                    setEditTeam(
                      editTeam ? { ...editTeam, name: e.target.value } : null,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-team-code">Team Code</Label>
                <Input
                  id="edit-team-code"
                  value={editTeam?.teamCode || ""}
                  onChange={(e) =>
                    setEditTeam(
                      editTeam ? { ...editTeam, teamCode: e.target.value } : null,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-team-description">Description</Label>
                <Input
                  id="edit-team-description"
                  value={editTeam?.description || ""}
                  onChange={(e) =>
                    setEditTeam(
                      editTeam
                        ? { ...editTeam, description: e.target.value }
                        : null,
                    )
                  }
                />
              </div>
            </div>

            {/* Members Section */}
            <div className="border-t pt-4 space-y-3">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4" />
                Members ({editTeam?.members?.length || 0})
              </Label>

              {/* Current members list */}
              {editTeam?.members && editTeam.members.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {editTeam.members.map((member: any) => {
                    const firstName = member.firstName || member.firstname || "";
                    const lastName = member.lastName || member.lastname || "";
                    const fullName = `${firstName} ${lastName}`.trim() || member.email || "Unknown";
                    return (
                      <div
                        key={member._id}
                        className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                              {getInitials(fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{fullName}</p>
                            {member.email && (
                              <p className="text-xs text-gray-500">{member.email}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={async () => {
                            if (!editTeam) return;
                            try {
                              const response = await removeMemberFromTeam(editTeam._id, member._id);
                              const updated = { ...editTeam, members: response.data.members ?? editTeam.members.filter((m: any) => m._id !== member._id) };
                              setEditTeam(updated);
                              setTeams(teams.map((t) => t._id === editTeam._id ? updated : t));
                              toast.success("Member removed");
                            } catch {
                              toast.error("Error removing member");
                            }
                          }}
                          title="Remove member"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No members yet</p>
              )}

              {/* Add member */}
              <div className="flex gap-2 pt-1">
                <Select value={editMemberUserId} onValueChange={setEditMemberUserId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a member to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const filtered = availableUsers.filter((u) => {
                        // Exclude already in this team
                        if (editTeam?.members?.some((m: any) => m._id === u._id)) return false;
                        // Exclude if member belongs to a team assigned to an active (non-completed) site
                        const busyInActiveTeam = Object.entries(teamSiteAssignments).find(
                          ([teamId, assignment]) => {
                            const team = teams.find((t) => t._id === teamId);
                            const isMember = team?.members?.some((m: any) => m._id === u._id);
                            return isMember && assignment.status !== "completed";
                          }
                        );
                        return !busyInActiveTeam;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="py-4 px-2 text-sm text-gray-500 text-center">
                            No available members
                          </div>
                        );
                      }
                      return filtered.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          {user.firstName} {user.lastName}
                          {user.email ? ` (${user.email})` : ""}
                        </SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={!editMemberUserId}
                  onClick={async () => {
                    if (!editTeam || !editMemberUserId) return;
                    try {
                      const response = await addMemberToTeam(editTeam._id, editMemberUserId);
                      const updated = response.data;
                      setEditTeam(updated);
                      setTeams(teams.map((t) => t._id === editTeam._id ? updated : t));
                      setEditMemberUserId("");
                      toast.success("Member added");
                    } catch {
                      toast.error("Error adding member");
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t pt-4">
              <Button
                className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                onClick={handleSaveEdit}
              >
                Save
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the team "{teamToDelete?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={confirmDelete}
            >
              Delete
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Team Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedTeamView?.name}</DialogTitle>
            <DialogDescription>
              {selectedTeamView?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  selectedTeamView?.isActive ? "secondary" : "destructive"
                }
              >
                {selectedTeamView?.isActive ? "Active" : "Inactive"}
              </Badge>
              {selectedTeamView?.teamCode && (
                <Badge variant="outline">{selectedTeamView.teamCode}</Badge>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Members ({selectedTeamView?.members?.length || 0})
                </h4>
                {canManageTeam && (
                  <Dialog
                    open={memberDialogOpen}
                    onOpenChange={setMemberDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Member</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Scrollable user list */}
                        <div className="border rounded-xl overflow-hidden">
                          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                            {userLoadingError ? (
                              <div className="py-8 text-center">
                                <p className="text-sm text-red-500 font-medium">Failed to load users</p>
                                <button
                                  className="text-xs text-blue-500 underline mt-1"
                                  onClick={loadAvailableUsers}
                                >
                                  Retry
                                </button>
                              </div>
                            ) : availableUsers.length === 0 ? (
                              <div className="py-8 flex flex-col items-center gap-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
                                <p className="text-sm text-gray-400">Loading users...</p>
                              </div>
                            ) : (() => {
                              // Filter: exclude members already in this team
                              // AND exclude members busy on an active project (not completed/terminé)
                              const availableForSelection = availableUsers.filter((u) => {
                                if (selectedTeamView?.members?.some((m: any) => m._id === u._id)) return false;
                                if (busyMemberIds.has(u._id)) return false;
                                return true;
                              });

                              if (availableForSelection.length === 0) {
                                return (
                                  <div className="py-8 text-sm text-gray-400 text-center">
                                    No available users
                                  </div>
                                );
                              }

                              return availableForSelection.map((user) => {
                                const isSelected = selectedUserId === user._id;
                                const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
                                const roleName = user.role?.name || 'user';
                                const roleColors: Record<string, string> = {
                                  admin: 'bg-red-100 text-red-700',
                                  manager: 'bg-purple-100 text-purple-700',
                                  chef_projet: 'bg-blue-100 text-blue-700',
                                  technicien: 'bg-green-100 text-green-700',
                                  worker: 'bg-amber-100 text-amber-700',
                                  user: 'bg-gray-100 text-gray-600',
                                };
                                const roleColor = roleColors[roleName] || roleColors.user;

                                return (
                                  <div
                                    key={user._id}
                                    onClick={() => setSelectedUserId(isSelected ? '' : user._id)}
                                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                                      ${isSelected
                                        ? 'bg-blue-50 border-l-4 border-blue-500'
                                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                                      }`}
                                  >
                                    {/* Avatar */}
                                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                                      ${isSelected ? 'bg-blue-500 text-white' : 'bg-gradient-to-br from-blue-400 to-purple-500 text-white'}`}>
                                      {initials || '?'}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-gray-900 truncate">
                                        {user.firstName} {user.lastName}
                                      </p>
                                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                    </div>
                                    {/* Role badge */}
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${roleColor}`}>
                                      {roleName}
                                    </span>
                                    {/* Check */}
                                    {isSelected && (
                                      <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>

                        <Button
                          className="w-full bg-gray-900 hover:bg-gray-700 font-semibold"
                          onClick={handleAddMember}
                          disabled={!selectedUserId}
                        >
                          Add Member
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedTeamView?.members?.map((member: any) => {
                  const initials = `${member.firstName?.charAt(0) || ''}${member.lastName?.charAt(0) || ''}`.toUpperCase();
                  const roleName = member.role?.name || 'user';
                  const roleColors: Record<string, string> = {
                    admin: 'bg-red-100 text-red-700',
                    manager: 'bg-purple-100 text-purple-700',
                    chef_projet: 'bg-blue-100 text-blue-700',
                    technicien: 'bg-green-100 text-green-700',
                    worker: 'bg-amber-100 text-amber-700',
                    user: 'bg-gray-100 text-gray-600',
                  };
                  const roleColor = roleColors[roleName] || roleColors.user;
                  return (
                  <div
                    key={member._id}
                    className="flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {initials || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColor}`}>
                        {roleName}
                      </span>
                      {canManageTeam && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0"
                          onClick={() => handleRemoveMember(member._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  );
                })}
                {(!selectedTeamView?.members ||
                  selectedTeamView.members.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No members in this team
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Teams Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTeams.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No teams found</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paginatedTeams.map((team) => (
                  <Card
                    key={team._id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewTeam(team)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-green-600 text-white">
                              {getInitials(team.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {team.name}
                            </h3>
                            {team.teamCode && (
                              <p className="text-xs text-gray-500">
                                {team.teamCode}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={team.isActive ? "secondary" : "destructive"}
                        >
                          {team.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      {team.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {team.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{team.members?.length || 0} membres</span>
                        </div>
                        {isTeamAssignedToSite(team._id) && (
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            <span>
                              Site: {teamSiteAssignments[team._id].siteName}
                            </span>
                          </div>
                        )}
                      </div>

                      <div
                        className="flex gap-2 pt-4 border-t"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditTeam(team)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Modifier
                        </Button>
                        {canManageTeam && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteTeam(team)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {!loading && filteredTeams.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500">
            Showing {(teamPage - 1) * TEAM_PAGE_SIZE + 1}–{Math.min(teamPage * TEAM_PAGE_SIZE, filteredTeams.length)} of {filteredTeams.length} teams
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="sm"
              onClick={() => setTeamPage(p => Math.max(1, p - 1))}
              disabled={teamPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: teamTotalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={page === teamPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTeamPage(page)}
                className={`h-8 w-8 p-0 ${page === teamPage ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline" size="sm"
              onClick={() => setTeamPage(p => Math.min(teamTotalPages, p + 1))}
              disabled={teamPage === teamTotalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
