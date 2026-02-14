import { createFileRoute } from "@tanstack/react-router";
import { updateMatchResult } from "../../server/matches";

export const Route = createFileRoute("/api/matches/update-result")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const { matchId, homeScore, awayScore, events, status } = body;

          if (!matchId || homeScore === undefined || awayScore === undefined) {
            return Response.json(
              { success: false, error: "Missing required fields" },
              { status: 400 },
            );
          }

          const result = await updateMatchResult({
            data: {
              matchId,
              homeScore: Number(homeScore),
              awayScore: Number(awayScore),
              events: events || [],
              status: status || "finished",
            },
          });

          return Response.json(result);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error("Update match result API error:", error);
          return Response.json(
            { success: false, error: errorMessage },
            { status: 500 },
          );
        }
      },
    },
  },
});
