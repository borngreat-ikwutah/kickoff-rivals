import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SignMessage } from "../components/SignMessage";
import { useGame } from "../contexts/GameContext";

export const Route = createFileRoute("/sign")({
  component: SignRoute,
});

function SignRoute() {
  const navigate = useNavigate();
  const { userStats, handleMessageSigned, handleLogout } = useGame();

  return (
    <SignMessage
      address={userStats.walletAddress}
      onSigned={() => {
        handleMessageSigned();
        navigate({ to: "/welcome" });
      }}
      onCancel={() => {
        handleLogout();
        navigate({ to: "/" });
      }}
    />
  );
}
