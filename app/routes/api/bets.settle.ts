import { createFileRoute } from "@tanstack/react-router";
import { settleBets } from "../../server/matches";

export const Route = createFileRoute("/api/bets/settle")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const { matchId, homeScore, awayScore } = body;

          if (!matchId || homeScore === undefined || awayScore === undefined) {
            return Response.json(
              { success: false, error: "Missing required fields" },
              { status: 400 },
            );
          }

          const result = await settleBets({
            data: {
              matchId,
              homeScore: Number(homeScore),
              awayScore: Number(awayScore),
            },
          });

          return Response.json(result);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error("Settle bets API error:", error);
          return Response.json(
            { success: false, error: errorMessage },
            { status: 500 },
          );
        }
      },
    },
  },
});
