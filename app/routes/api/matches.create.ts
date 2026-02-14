import { createFileRoute } from "@tanstack/react-router";
import { createMatches } from "../../server/matches";

export const Route = createFileRoute("/api/matches/create")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const { matches } = body;

          if (!matches || !Array.isArray(matches) || matches.length === 0) {
            return Response.json(
              { success: false, error: "Missing or invalid matches array" },
              { status: 400 },
            );
          }

          const result = await createMatches({
            data: {
              matches,
            },
          });

          return Response.json(result);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error("Create matches API error:", error);
          return Response.json(
            { success: false, error: errorMessage },
            { status: 500 },
          );
        }
      },
    },
  },
});
