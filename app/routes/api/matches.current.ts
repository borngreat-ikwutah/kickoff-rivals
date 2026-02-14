import { createFileRoute } from "@tanstack/react-router";
import { getCurrentMatches } from "../../server/matches";

export const Route = createFileRoute("/api/matches/current")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const leagueId = url.searchParams.get("leagueId") || undefined;

        try {
          const result = await getCurrentMatches({
            data: {
              leagueId,
            },
          });

          return Response.json(result);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error("Matches API error:", error);
          return Response.json(
            { success: false, error: errorMessage, matches: [] },
            { status: 500 },
          );
        }
      },
    },
  },
});
