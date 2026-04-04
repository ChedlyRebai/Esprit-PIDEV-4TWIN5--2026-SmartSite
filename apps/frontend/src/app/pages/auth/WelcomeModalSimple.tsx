"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/app/store/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SmartSiteLogo } from "@/app/components/branding/SmartSiteLogo";
import {
  Building,
  Users,
  Shield,
  Settings,
  FileText,
  BarChart3,
  HardHat,
  Calculator,
  Package,
  Heart,
  UserCheck
} from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  userName: string;
}

const roleConfigs = {
  director: {
    icon: Building,
    color: "bg-blue-500",
    title: "Director",
    description: "Oversee all projects and strategic operations",
    features: [
      "View all projects overview",
      "Monitor team performance",
      "Strategic decision making",
      "Resource allocation",
      "Financial oversight",
      "Business development",
      "Client relationship management",
      "Company strategy planning"
    ]
  },
  project_manager: {
    icon: Users,
    color: "bg-green-500",
    title: "Project Manager",
    description: "Manage project execution and team coordination",
    features: [
      "Create and manage projects",
      "Assign tasks to team members",
      "Track project progress",
      "Generate reports",
      "Budget management",
      "Timeline planning",
      "Resource allocation",
      "Stakeholder communication"
    ]
  },
  site_manager: {
    icon: HardHat,
    color: "bg-orange-500",
    title: "Site Manager",
    description: "Supervise on-site construction activities",
    features: [
      "Monitor site operations",
      "Manage daily activities",
      "Ensure safety compliance",
      "Report site progress",
      "Coordinate subcontractors",
      "Inspect work quality",
      "Manage site resources",
      "Daily site reporting"
    ]
  },
  works_manager: {
    icon: Settings,
    color: "bg-purple-500",
    title: "Works Manager",
    description: "Coordinate construction works and resources",
    features: [
      "Manage work schedules",
      "Coordinate labor allocation",
      "Monitor equipment usage",
      "Quality control",
      "Resource planning",
      "Work progress tracking",
      "Team coordination",
      "Safety compliance"
    ]
  },
  accountant: {
    icon: Calculator,
    color: "bg-emerald-500",
    title: "Accountant",
    description: "Handle financial operations and budgeting",
    features: [
      "Manage project budgets",
      "Track expenses",
      "Generate financial reports",
      "Invoice management",
      "Payroll processing",
      "Tax compliance",
      "Cost analysis",
      "Financial forecasting"
    ]
  },
  procurement_manager: {
    icon: Package,
    color: "bg-amber-500",
    title: "Procurement Manager",
    description: "Manage materials and supplier relationships",
    features: [
      "Source materials",
      "Manage suppliers",
      "Track inventory",
      "Cost optimization",
      "Purchase order management",
      "Supplier evaluation",
      "Budget tracking",
      "Quality assurance"
    ]
  },
  qhse_manager: {
    icon: Shield,
    color: "bg-red-500",
    title: "QHSE Manager",
    description: "Ensure quality, health, safety, and environmental compliance",
    features: [
      "Safety inspections",
      "Quality control",
      "Environmental compliance",
      "Incident reporting",
      "Risk assessments",
      "Safety training management",
      "Audit compliance",
      "Emergency response planning"
    ]
  },
  client: {
    icon: UserCheck,
    color: "bg-indigo-500",
    title: "Client",
    description: "Monitor project progress and communicate with team",
    features: [
      "View project status",
      "Approve milestones",
      "Communication portal",
      "Document access",
      "Review deliverables",
      "Provide feedback",
      "Track budgets",
      "View project timeline"
    ]
  },
  subcontractor: {
    icon: Users,
    color: "bg-teal-500",
    title: "Subcontractor",
    description: "Execute specific project tasks and deliverables",
    features: [
      "View assigned tasks",
      "Submit progress reports",
      "Access project documents",
      "Time tracking",
      "Submit daily work logs",
      "Request materials",
      "Report site issues",
      "View project schedules"
    ]
  },
  user: {
    icon: Users,
    color: "bg-gray-500",
    title: "User",
    description: "Basic access to platform features",
    features: [
      "View dashboard",
      "Access assigned tasks",
      "Update profile",
      "Basic reporting",
      "View project progress",
      "Submit timesheets",
      "Access documents",
      "Communicate with team"
    ]
  }
};

export default function WelcomeModal({ isOpen, onClose, userRole, userName }: WelcomeModalProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const roleConfig = roleConfigs[userRole as keyof typeof roleConfigs] || roleConfigs.user;
  const RoleIcon = roleConfig.icon;

  const handleGetStarted = () => {
    onClose();
    // Navigate based on role
    if (userRole === "super_admin") {
      navigate("/super-admin-projects");
    } else if (userRole === "project_manager") {
      navigate("/project-manager-dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl transform transition-all duration-300 ease-out">
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 transform transition-transform duration-500 hover:scale-105">
              <SmartSiteLogo size="lg" />
            </div>

            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Welcome to SmartSite!
              </CardTitle>
              <CardDescription className="text-lg mt-2 text-gray-600">
                Hello <span className="font-semibold text-gray-800">{userName}</span>, we're excited to have you aboard!
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            {/* App Description */}
            <div className="text-center">
              <p className="text-gray-700 leading-relaxed">
                <span className="font-semibold">SmartSite</span> is an intelligent construction platform that streamlines project management,
                enhances collaboration, and ensures quality delivery. Built for modern construction teams who value efficiency and transparency.
              </p>
            </div>

            {/* Role Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-full ${roleConfig.color} text-white`}>
                  <RoleIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{roleConfig.title}</h3>
                  <p className="text-gray-600">{roleConfig.description}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">Your Access Includes:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {roleConfig.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 opacity-0 animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-lg p-3 shadow-sm border transform transition-transform duration-300 hover:scale-105">
                <div className="text-2xl font-bold text-blue-600">50+</div>
                <div className="text-xs text-gray-600">Projects Managed</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm border transform transition-transform duration-300 hover:scale-105">
                <div className="text-2xl font-bold text-green-600">1000+</div>
                <div className="text-xs text-gray-600">Active Users</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm border transform transition-transform duration-300 hover:scale-105">
                <div className="text-2xl font-bold text-purple-600">99.9%</div>
                <div className="text-xs text-gray-600">Uptime</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleGetStarted}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('/user-guide/' + userRole, '_blank')}
                className="px-6 py-3 rounded-lg"
              >
                View Role Guide
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateX(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out;
          }
        `
      }} />
    </div>
  );
}
