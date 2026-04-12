"use client";

import { useState } from "react";
import { verifyPin, setPin, hasPin } from "@/lib/storage";

interface PinLockProps {
  onUnlock: () => void;
}

export default function PinLock({ onUnlock }: PinLockProps) {
  const [pin, setPinValue] = useState("");
  const [error, setError] = useState("");
  const [isSetup, setIsSetup] = useState(!hasPin());
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (isSetup) {
      if (step === "enter") {
        if (pin.length < 4) {
          setError("Le code doit contenir au moins 4 caracteres");
          return;
        }
        setStep("confirm");
        return;
      }
      if (confirmPin !== pin) {
        setError("Les codes ne correspondent pas");
        setConfirmPin("");
        return;
      }
      await setPin(pin);
      onUnlock();
    } else {
      const valid = await verifyPin(pin);
      if (valid) {
        onUnlock();
      } else {
        setError("Code incorrect");
        setPinValue("");
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            Fitness Dashboard
          </h1>
          <p className="text-[#9ca3af] text-sm">
            {isSetup
              ? step === "enter"
                ? "Cree ton code d'acces"
                : "Confirme ton code"
              : "Entre ton code pour acceder au dashboard"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={step === "confirm" ? confirmPin : pin}
            onChange={(e) =>
              step === "confirm"
                ? setConfirmPin(e.target.value)
                : setPinValue(e.target.value)
            }
            placeholder={isSetup ? "Code (min 4 caracteres)" : "Code d'acces"}
            className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-3 text-white text-center text-2xl tracking-[0.5em] placeholder:text-sm placeholder:tracking-normal focus:border-[#818cf8] outline-none mb-4"
          />

          {error && (
            <p className="text-[#f87171] text-sm text-center mb-4">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-[#818cf8] text-white font-semibold py-3 rounded-lg hover:brightness-110 transition"
          >
            {isSetup ? (step === "enter" ? "Suivant" : "Creer") : "Entrer"}
          </button>

          {isSetup && (
            <button
              type="button"
              onClick={onUnlock}
              className="w-full mt-3 text-[#9ca3af] text-sm hover:text-white transition"
            >
              Passer (sans code)
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
