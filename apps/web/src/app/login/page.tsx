import LandingPage from "../landing";
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
    <LandingPage
      initialAuthOpen
      redirectTo={redirect}
      initialEmail={email}
      initialSignUp={register === "true"}
    />
  );
}
