"use client";

import {
  createRazorpayOrderAction,
  verifyRazorpayPaymentAction,
} from "@/app/actions/projects";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

/** Loads checkout.js once and caches the promise. */
let scriptPromise: Promise<boolean> | null = null;
function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => {
      scriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export interface CheckoutCallbacks {
  /** Signature verified server-side; project unlocked. */
  onSuccess: () => void;
  /** Order creation, checkout, or verification failed. */
  onError: (message: string) => void;
  /** User closed the checkout without paying. */
  onDismiss?: () => void;
}

/**
 * Full checkout flow for project borings:
 * order (server-priced) → Razorpay modal → server-side signature verification.
 */
export async function startRazorpayCheckout(
  projectId: string,
  boringsPurchased: number,
  projectName: string,
  cb: CheckoutCallbacks
) {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    cb.onError("Could not load Razorpay checkout. Check your connection and try again.");
    return;
  }

  const res = await createRazorpayOrderAction(projectId, boringsPurchased);
  if ("error" in res && res.error) {
    cb.onError(res.error);
    return;
  }
  if (!("order" in res) || !res.order) {
    cb.onError("Failed to create payment order.");
    return;
  }
  const { paymentId, orderId, amount, currency, keyId } = res.order;

  const rzp = new window.Razorpay({
    key: keyId,
    amount,
    currency,
    name: "GroundLense",
    description: `${boringsPurchased} boring${boringsPurchased === 1 ? "" : "s"} · ${projectName}`,
    order_id: orderId,
    theme: { color: "#D85A30" },
    modal: {
      ondismiss: () => cb.onDismiss?.(),
    },
    handler: async (response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) => {
      const verify = await verifyRazorpayPaymentAction(
        paymentId,
        response.razorpay_payment_id,
        response.razorpay_signature
      );
      if ("error" in verify && verify.error) {
        cb.onError(verify.error);
      } else {
        cb.onSuccess();
      }
    },
  });

  rzp.on("payment.failed", (response: any) => {
    cb.onError(response?.error?.description || "Payment failed. You have not been charged.");
  });

  rzp.open();
}
