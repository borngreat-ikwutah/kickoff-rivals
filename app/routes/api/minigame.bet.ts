import { createFileRoute } from "@tanstack/react-router";
import { placeBet } from "../../server/matches";

export const Route = createFileRoute("/api/minigame/bet")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const { walletAddress, matchId, selection, stake, odds, betType } =
            body;

          const missingFields = [];
          if (!walletAddress) missingFields.push("walletAddress");
          if (!matchId) missingFields.push("matchId");
          if (!selection) missingFields.push("selection");
          if (!stake) missingFields.push("stake");
          if (!odds) missingFields.push("odds");

          if (missingFields.length > 0) {
            console.warn("Bet validation failed. Received:", body);
            console.warn("Missing fields:", missingFields);
            return Response.json(
              { success: false, error: `Missing required fields: ${missingFields.join(", ")}` },
              { status: 400 },
            );
          }

          const result = await placeBet({
            data: {
              walletAddress,
              matchId,
              selection,
              stake: Number(stake),
              odds: Number(odds),
              betType: betType || "single",
            },
          });

          return Response.json(result);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error("Bet API error:", error);
          return Response.json(
            { success: false, error: errorMessage },
            { status: 500 },
          );
        }
      },
    },
  },
});
