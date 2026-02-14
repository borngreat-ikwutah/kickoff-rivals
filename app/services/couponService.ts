const API_URL = import.meta.env.VITE_API_URL || "";

export interface CouponVerifyResponse {
  success: boolean;
  type?: "coins" | "theme";
  value?: number | string;
  message?: string;
  error?: string;
}

/**
 * Verify and redeem a coupon code server-side
 * Server validates all logic to prevent cheating
 */
export const verifyCoupon = async (
  code: string,
  walletAddress: string,
): Promise<CouponVerifyResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/coupons/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, walletAddress }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Code verification failed",
      };
    }

    return data;
  } catch (error: any) {
    console.error("Coupon verification error:", error);
    return {
      success: false,
      error: "Connection failed",
    };
  }
};

/**
 * Check if user already used a coupon (for UX)
 */
export const checkCouponUsage = async (
  code: string,
  walletAddress: string,
): Promise<boolean> => {
  try {
    const response = await fetch(
      `${API_URL}/api/coupons/check?code=${code}&walletAddress=${walletAddress}`,
    );
    const data = await response.json();
    return data.used || false;
  } catch (error) {
    return false;
  }
};
