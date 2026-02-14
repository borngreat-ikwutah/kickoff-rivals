import { createFileRoute } from "@tanstack/react-router";
import { verifyCoupon } from "../../server/coupons";

export const Route = createFileRoute("/api/coupons/verify")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const { code, walletAddress } = body;

          if (!code || !walletAddress) {
            return Response.json(
              { success: false, error: "Missing required fields" },
              { status: 400 },
            );
          }

          const result = await verifyCoupon({
            data: {
              code,
              walletAddress,
            },
          });

          return Response.json(result);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error("Coupon verify API error:", error);
          return Response.json(
            { success: false, error: errorMessage },
            { status: 500 },
          );
        }
      },
    },
  },
});
