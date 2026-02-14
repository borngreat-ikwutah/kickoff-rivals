import { createFileRoute } from "@tanstack/react-router";
import { claimWelcomeGift } from "../../server/user";

export const Route = createFileRoute("/api/user/claim-welcome-gift")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const { walletAddress } = body;

          if (!walletAddress) {
            return Response.json(
              { success: false, error: "Missing walletAddress" },
              { status: 400 },
            );
          }

          const result = await claimWelcomeGift({
            data: {
              walletAddress,
            },
          });

          if (!result.success) {
            return Response.json(result, { status: 429 });
          }

          return Response.json(result);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error("Claim welcome gift API error:", error);
          return Response.json(
            { success: false, error: errorMessage },
            { status: 500 },
          );
        }
      },
    },
  },
});
