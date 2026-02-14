import { createFileRoute } from "@tanstack/react-router";
import { convertCoins } from "../../server/user";

export const Route = createFileRoute("/api/user/convert-coins")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const { walletAddress, amount } = body;

          if (!walletAddress || !amount) {
            return Response.json(
              { success: false, error: "Missing required fields" },
              { status: 400 },
            );
          }

          const result = await convertCoins({
            data: {
              walletAddress,
              amount: Number(amount),
            },
          });

          if (!result.success) {
            return Response.json(result, { status: 400 });
          }

          return Response.json(result);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error("Convert coins API error:", error);
          return Response.json(
            { success: false, error: errorMessage },
            { status: 500 },
          );
        }
      },
    },
  },
});
