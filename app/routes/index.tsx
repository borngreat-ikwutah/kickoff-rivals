import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LandingPage } from "../components/LandingPage";

export const Route = createFileRoute("/")({
  component: LandingRoute,
});

function LandingRoute() {
  const navigate = useNavigate();
  return <LandingPage onEnter={() => navigate({ to: "/play" })} />;
}
