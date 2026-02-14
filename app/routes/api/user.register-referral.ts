import { createFileRoute } from "@tanstack/react-router";
import { registerReferral } from "../../server/user";

export const Route = createFileRoute("/api/user/register-referral")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const { walletAddress, referralCode } = body;

          if (!walletAddress || !referralCode) {
            return Response.json(
              { success: false, error: "Missing required fields" },
              { status: 400 },
            );
          }

          const result = await registerReferral({
            data: {
              walletAddress,
              referralCode,
            },
          });

          if (!result.success) {
            return Response.json(result, { status: 400 });
          }

          return Response.json(result);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error("Register referral API error:", error);
          return Response.json(
            { success: false, error: errorMessage },
            { status: 500 },
          );
        }
      },
    },
  },
});
