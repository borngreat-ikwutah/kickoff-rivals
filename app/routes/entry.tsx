import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { EntryChoice } from "../components/EntryChoice";

export const Route = createFileRoute("/entry")({
  component: EntryRoute,
});

function EntryRoute() {
  const navigate = useNavigate();

  return (
    <EntryChoice
      onNewUser={() => navigate({ to: "/onboarding" })}
      onReturningUser={() => navigate({ to: "/connect" })}
    />
  );
}
