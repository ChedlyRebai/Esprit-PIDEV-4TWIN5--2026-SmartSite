"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
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
      "Resource allocation"
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
      "Generate reports"
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
      "Report site progress"
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
      "Quality control"
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
      "Invoice management"
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
      "Cost optimization"
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
      "Incident reporting"
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
      "Document access"
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
      "Time tracking"
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
      "Basic reporting"
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
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-2xl"
          >
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="text-center pb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mx-auto mb-4"
                >
                  <SmartSiteLogo size="lg" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Welcome to SmartSite!
                  </CardTitle>
                  <CardDescription className="text-lg mt-2 text-gray-600">
                    Hello <span className="font-semibold text-gray-800">{userName}</span>, we're excited to have you aboard!
                  </CardDescription>
                </motion.div>
              </CardHeader>

              <CardContent className="space-y-6 pb-8">
                {/* App Description */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center"
                >
                  <p className="text-gray-700 leading-relaxed">
                    <span className="font-semibold">SmartSite</span> is an intelligent construction platform that streamlines project management,
                    enhances collaboration, and ensures quality delivery. Built for modern construction teams who value efficiency and transparency.
                  </p>
                </motion.div>

                {/* Role Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100"
                >
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
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                          className="flex items-center gap-2"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Quick Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="grid grid-cols-3 gap-4 text-center"
                >
                  <div className="bg-white rounded-lg p-3 shadow-sm border">
                    <div className="text-2xl font-bold text-blue-600">50+</div>
                    <div className="text-xs text-gray-600">Projects Managed</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm border">
                    <div className="text-2xl font-bold text-green-600">1000+</div>
                    <div className="text-xs text-gray-600">Active Users</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm border">
                    <div className="text-2xl font-bold text-purple-600">99.9%</div>
                    <div className="text-xs text-gray-600">Uptime</div>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex gap-3 pt-4"
                >
                  <Button
                    onClick={handleGetStarted}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    Get Started
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open('/docs', '_blank')}
                    className="px-6 py-3 rounded-lg"
                  >
                    View Guide
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
