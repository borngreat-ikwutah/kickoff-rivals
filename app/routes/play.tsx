import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GameSelection } from "../components/GameSelection";
import { useGame } from "../contexts/GameContext";

export const Route = createFileRoute("/play")({
  component: PlayRoute,
});

function PlayRoute() {
  const navigate = useNavigate();
  const { walletState } = useGame();

  return (
    <GameSelection
      onSelectFootball={() => {
        if (walletState.isConnected && walletState.isVerified) {
          navigate({ to: "/dashboard" });
        } else {
          navigate({ to: "/entry" });
        }
      }}
    />
  );
}
