import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Management",
  description: "Manage user roles and permissions",
};

export default function UserManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
