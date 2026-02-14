import { createFileRoute } from "@tanstack/react-router";
import { placeAccumulatorBet } from "../../server/matches";

export const Route = createFileRoute("/api/minigame/bet-accumulator")({
    server: {
        handlers: {
            POST: async ({ request }: { request: Request }) => {
                try {
                    const body = await request.json();
                    const { walletAddress, selections, stake, totalOdds, accumulatorId } =
                        body;

                    const missingFields = [];
                    if (!walletAddress) missingFields.push("walletAddress");
                    if (!selections || !selections.length) missingFields.push("selections");
                    if (!stake) missingFields.push("stake");
                    if (!totalOdds) missingFields.push("totalOdds");
                    if (!accumulatorId) missingFields.push("accumulatorId");

                    if (missingFields.length > 0) {
                        console.warn("Accumulator Bet validation failed:", { walletAddress, selections, stake, totalOdds, accumulatorId });
                        return Response.json(
                            { success: false, error: `Missing required fields: ${missingFields.join(", ")}` },
                            { status: 400 },
                        );
                    }

                    const result = await placeAccumulatorBet({
                        data: {
                            walletAddress,
                            selections,
                            stake: Number(stake),
                            totalOdds: Number(totalOdds),
                            accumulatorId,
                        },
                    });

                    return Response.json(result);
                } catch (error: unknown) {
                    const errorMessage =
                        error instanceof Error ? error.message : "Unknown error";
                    console.error("Accumulator Bet API error:", error);
                    return Response.json(
                        { success: false, error: errorMessage },
                        { status: 500 },
                    );
                }
            },
        },
    },
});
