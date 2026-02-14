import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AllianceSetup } from "../components/AllianceSetup";
import { useGame } from "../contexts/GameContext";

export const Route = createFileRoute("/alliance")({
  component: AllianceRoute,
});

function AllianceRoute() {
  const navigate = useNavigate();
  const { setRegistrationData } = useGame();

  return (
    <AllianceSetup
      apiUrl=""
      onComplete={(data) => {
        setRegistrationData(data);
        navigate({ to: "/connect" });
      }}
    />
  );
}
