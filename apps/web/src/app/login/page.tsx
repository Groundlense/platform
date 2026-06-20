import LoginLeftPanel from "@/components/login/LoginLeftPanel";
import LoginForm from "@/components/login/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GroundLense — Login",
  description: "Sign in to the GroundLense geotech boring management platform.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; email?: string; register?: string }>;
}) {
  const { redirect, email, register } = await searchParams;

  return (
    <div className="flex flex-row !min-h-screen">
      <LoginLeftPanel />
      <LoginForm redirectTo={redirect} initialEmail={email} initialRegister={register === "true"} />
    </div>
  );
}
