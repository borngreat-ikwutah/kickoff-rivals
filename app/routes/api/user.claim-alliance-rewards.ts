import { createFileRoute } from "@tanstack/react-router";
import { claimAllianceRewards } from "../../server/user";

export const Route = createFileRoute("/api/user/claim-alliance-rewards")({
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

          const result = await claimAllianceRewards({
            data: {
              walletAddress,
            },
          });

          if (!result.success) {
            return Response.json(result, { status: 400 });
          }

          return Response.json(result);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error("Claim alliance rewards API error:", error);
          return Response.json(
            { success: false, error: errorMessage },
            { status: 500 },
          );
        }
      },
    },
  },
});
