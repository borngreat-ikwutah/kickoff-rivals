import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ConnectWallet } from "../components/ConnectWallet";
import { useGame } from "../contexts/GameContext";

export const Route = createFileRoute("/connect")({
  component: ConnectRoute,
});

function ConnectRoute() {
  const navigate = useNavigate();
  const { handleWalletConnected } = useGame();

  return (
    <ConnectWallet
      onConnected={(address: string) => {
        handleWalletConnected(address);
        navigate({ to: "/sign" });
      }}
    />
  );
}
