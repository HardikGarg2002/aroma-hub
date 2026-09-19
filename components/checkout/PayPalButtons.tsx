"use client";

import { useEffect, useRef, useState } from "react";

/** The slice of the PayPal JS SDK used here. */
interface PayPalButtonsInstance {
  render: (el: HTMLElement) => Promise<void>;
  close: () => Promise<void>;
  isEligible: () => boolean;
}
interface PayPalNamespace {
  Buttons: (options: {
    style?: Record<string, string | number>;
    onClick?: (data: unknown, actions: { resolve: () => void; reject: () => void }) => void | Promise<void>;
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onCancel?: () => void;
    onError?: (error: unknown) => void;
  }) => PayPalButtonsInstance;
}
declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

const sdkLoads = new Map<string, Promise<PayPalNamespace>>();

/** Loads the SDK once per client id + currency. */
function loadSdk(clientId: string, currency: string) {
  const src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${currency}&intent=capture&components=buttons`;
  let load = sdkLoads.get(src);
  if (!load) {
    load = new Promise<PayPalNamespace>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => (window.paypal ? resolve(window.paypal) : reject(new Error("PayPal SDK missing")));
      script.onerror = () => {
        sdkLoads.delete(src);
        reject(new Error("PayPal SDK failed to load"));
      };
      document.head.appendChild(script);
    });
    sdkLoads.set(src, load);
  }
  return load;
}

export interface PayPalHandlers {
  /** Validate the form; false stops PayPal from opening. */
  validate: () => boolean;
  /** Create the order on our server; return its PayPal id, or null to abort. */
  createOrder: () => Promise<string | null>;
  onApprove: (paypalOrderId: string) => Promise<void>;
  onCancel: () => void;
  onError: (message: string) => void;
}

/**
 * Official PayPal Smart Buttons. Handlers are read through a ref, so the
 * buttons render once and always call the latest form state.
 */
export function PayPalButtons({
  clientId,
  currency,
  disabled,
  handlers,
}: {
  clientId: string;
  currency: string;
  disabled?: boolean;
  handlers: PayPalHandlers;
}) {
  const container = useRef<HTMLDivElement>(null);
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let buttons: PayPalButtonsInstance | undefined;
    let cancelled = false;

    loadSdk(clientId, currency)
      .then((paypal) => {
        if (cancelled || !container.current) return;
        buttons = paypal.Buttons({
          style: { layout: "vertical", color: "black", shape: "rect", label: "paypal", height: 48 },
          onClick: (_data, actions) => (latest.current.validate() ? actions.resolve() : actions.reject()),
          createOrder: async () => {
            const id = await latest.current.createOrder();
            // Throwing closes the PayPal window; the form already shows why.
            if (!id) throw new Error("checkout-aborted");
            return id;
          },
          onApprove: (data) => latest.current.onApprove(data.orderID),
          onCancel: () => latest.current.onCancel(),
          onError: (error) => {
            if (error instanceof Error && error.message === "checkout-aborted") return;
            latest.current.onError("PayPal ran into a problem. You haven't been charged — please try again.");
          },
        });
        return buttons.render(container.current).then(() => !cancelled && setStatus("ready"));
      })
      .catch(() => !cancelled && setStatus("failed"));

    return () => {
      cancelled = true;
      void buttons?.close().catch(() => {});
    };
  }, [clientId, currency]);

  return (
    <div>
      {status === "loading" && <div className="h-[104px] animate-pulse bg-bone-deep" aria-label="Loading PayPal" />}
      {status === "failed" && (
        <p role="alert" className="text-sm text-red-700">
          PayPal couldn&apos;t load. Check your connection or disable any content blocker, then refresh.
        </p>
      )}
      {/* PayPal renders its own iframes here; dimmed and inert while disabled. */}
      <div
        ref={container}
        aria-disabled={disabled}
        className={disabled ? "pointer-events-none opacity-50" : undefined}
      />
    </div>
  );
}
