"use client";

import { useState } from "react";
import { Button } from "@plane/ui";
import { User, Users, Shield, UserCheck } from "lucide-react";

interface RoleSelectionProps {
  selectedRole: string;
  onRoleChange: (role: string) => void;
  onNext: () => void;
}

const RoleSelection = ({ selectedRole, onRoleChange, onNext }: RoleSelectionProps) => {
  const roles = [
    {
      id: "staff",
      name: "Staff",
      description: "Team member with access to projects and team collaboration",
      icon: User,
      color: "bg-blue-500",
    },
    {
      id: "manager",
      name: "Manager",
      description: "Team leader with user management and project oversight",
      icon: Users,
      color: "bg-green-500",
    },
    {
      id: "guest",
      name: "Guest",
      description: "Limited access for external collaborators",
      icon: UserCheck,
      color: "bg-gray-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-custom-text-100">Choose Your Role</h2>
        <p className="text-custom-text-300 mt-2">
          Select the role that best describes your position in the organization
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;

          return (
            <button
              key={role.id}
              onClick={() => onRoleChange(role.id)}
              className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                isSelected
                  ? "border-custom-primary-500 bg-custom-primary-500/10"
                  : "border-custom-border-300 hover:border-custom-border-400"
              }`}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className={`p-3 rounded-full ${role.color} text-white`}>
                  <Icon className="h-6 w-6" />
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-semibold text-custom-text-100">
                    {role.name}
                  </h3>
                  <p className="text-sm text-custom-text-300 mt-1">
                    {role.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center">
        <Button
          onClick={onNext}
          disabled={!selectedRole}
          className="px-8"
        >
          Continue Registration
        </Button>
      </div>
    </div>
  );
};

export default RoleSelection;
