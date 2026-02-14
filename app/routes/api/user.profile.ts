import { createFileRoute } from "@tanstack/react-router";
import { getUserProfile } from "../../server/user";

export const Route = createFileRoute("/api/user/profile")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const walletAddress = url.searchParams.get("walletAddress");
        const username = url.searchParams.get("username") || undefined;
        const leagueId = url.searchParams.get("leagueId") || undefined;
        const teamId = url.searchParams.get("teamId") || undefined;

        if (!walletAddress) {
          return Response.json(
            { success: false, error: "Missing walletAddress" },
            { status: 400 },
          );
        }

        try {
          const result = await getUserProfile({
            data: {
              walletAddress,
              username,
              leagueId,
              teamId,
            },
          });

          return Response.json(result);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error("Profile API error:", error);
          return Response.json(
            { success: false, error: errorMessage },
            { status: 500 },
          );
        }
      },
    },
  },
});
