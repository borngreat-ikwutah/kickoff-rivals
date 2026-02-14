import { useState } from "react";
import { useSignMessage } from "wagmi";
import { cn } from "../lib/utils";
import { RivalsLogo } from "./RivalsLogo";
import {
  IconShield,
  IconCheck,
  IconLoader,
  IconX,
  IconChevronRight,
} from "./Icons";

interface SignMessageProps {
  address: string;
  onSigned: (signature: string, timestamp: number) => void;
  onCancel: () => void;
}

export function SignMessage({ address, onSigned, onCancel }: SignMessageProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const { signMessageAsync } = useSignMessage();

  const handleSign = async () => {
    setError(null);
    setIsSigning(true);

    const timestamp = Date.now();
    const message = `Welcome to KickOff Rivals!

By signing this message, you verify ownership of this wallet address:
${address}

Timestamp: ${timestamp}

This action is free and does not cost any gas.`;

    try {
      const signature = await signMessageAsync({ message });
      onSigned(signature, timestamp);
    } catch (err: any) {
      console.error("Signing error:", err);
      if (err.message?.includes("User rejected")) {
        setError("Signature request was rejected");
      } else {
        setError(err.message || "Failed to sign message");
      }
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6">
        <RivalsLogo size="md" variant="full" className="text-white" />
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          Cancel
        </button>
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="max-w-md w-full">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-6 rounded-full bg-primary/20 text-primary">
              <IconShield className="w-16 h-16" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center mb-2">
            Verify Your Wallet
          </h1>
          <p className="text-slate-400 text-center mb-8">
            Sign a message to prove ownership of your wallet
          </p>

          {/* Wallet Info */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Connected Wallet</span>
              <span className="text-white font-mono text-sm">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
          </div>

          {/* What you're signing */}
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 mb-6">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <IconCheck className="w-4 h-4 text-primary" />
              What you're signing
            </h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Proof that you own this wallet address
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                A timestamp for security purposes
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                This is completely free - no gas required
              </li>
            </ul>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/50 mb-6">
              <IconX className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Sign Button */}
          <button
            onClick={handleSign}
            disabled={isSigning}
            className={cn(
              "btn btn-primary w-full h-14 font-semibold text-lg",
              "disabled:opacity-70 disabled:cursor-not-allowed",
              "hover:scale-[1.02] transition-transform"
            )}
          >
            {isSigning ? (
              <>
                <IconLoader className="w-5 h-5 mr-2 animate-spin" />
                Waiting for signature...
              </>
            ) : (
              <>
                Sign Message
                <IconChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>

          {/* Security note */}
          <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700">
            <IconShield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-sm font-medium">
                Why do I need to sign?
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Signing proves you own this wallet without sharing your private
                key. This keeps your account secure and prevents unauthorized
                access.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-slate-500 text-xs">
        Your signature is never stored on our servers
      </footer>
    </div>
  );
}

export default SignMessage;
