import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { WelcomeScreen } from "../components/WelcomeScreen";
import { useGame } from "../contexts/GameContext";

export const Route = createFileRoute("/welcome")({
  component: WelcomeRoute,
});

function WelcomeRoute() {
  const navigate = useNavigate();
  const { userStats, isNewUser, handleProceedFromWelcome } = useGame();

  return (
    <WelcomeScreen
      username={userStats.username}
      isNew={isNewUser}
      onProceed={() => {
        handleProceedFromWelcome();
        navigate({ to: "/dashboard" });
      }}
    />
  );
}
