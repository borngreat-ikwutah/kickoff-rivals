import { createFileRoute } from "@tanstack/react-router";
import { getLeagueStandings } from "../../server/matches";

export const Route = createFileRoute("/api/leagues/standings")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const seasonIdParam = url.searchParams.get("seasonId");
        const seasonId = seasonIdParam
          ? parseInt(seasonIdParam, 10)
          : undefined;

        try {
          const result = await getLeagueStandings({
            data: {
              seasonId,
            },
          });

          return Response.json(result);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error("Standings API error:", error);
          return Response.json(
            { success: false, error: errorMessage, standings: [] },
            { status: 500 },
          );
        }
      },
    },
  },
});
