import { createFileRoute } from "@tanstack/react-router";
import { getActiveBets } from "../../server/matches";

export const Route = createFileRoute("/api/bets/active")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const walletAddress = url.searchParams.get("walletAddress");

        if (!walletAddress) {
          return Response.json(
            { success: false, error: "Missing walletAddress", bets: [] },
            { status: 400 },
          );
        }

        try {
          const result = await getActiveBets({
            data: {
              walletAddress,
            },
          });

          return Response.json(result);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error("Active bets API error:", error);
          return Response.json(
            { success: false, error: errorMessage, bets: [] },
            { status: 500 },
          );
        }
      },
    },
  },
});
