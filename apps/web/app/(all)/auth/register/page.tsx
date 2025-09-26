"use client";

import { useState } from "react";
import { Button, Input } from "@plane/ui";
import RoleSelection from "./role-selection";

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "",
  });

  const handleRoleSelection = (role: string) => {
    setFormData({ ...formData, role });
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else {
      // Handle registration submission
      console.log("Registering user with data:", formData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-custom-background-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="bg-custom-background-90 rounded-lg p-8">
          {step === 1 ? (
            <RoleSelection
              selectedRole={formData.role}
              onRoleChange={handleRoleSelection}
              onNext={handleNext}
            />
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-custom-text-100">
                  Create Your Account
                </h2>
                <p className="text-custom-text-300 mt-2">
                  Complete your registration as a {formData.role}
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="Enter your first name"
                  />
                  <Input
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>

                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email"
                />

                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Create a password"
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  placeholder="Confirm your password"
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1"
                >
                  Register
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
