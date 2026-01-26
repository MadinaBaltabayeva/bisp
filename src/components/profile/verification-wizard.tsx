"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Upload, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeVerification } from "@/features/auth/actions";

interface VerificationWizardProps {
  onComplete: () => void;
}

type Step = 1 | 2 | 3;

export function VerificationWizard({ onComplete }: VerificationWizardProps) {
  const [step, setStep] = useState<Step>(1);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (idPreview) URL.revokeObjectURL(idPreview);
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [idPreview, selfiePreview]);

  const handleIdSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (idPreview) URL.revokeObjectURL(idPreview);
      setIdFile(file);
      setIdPreview(URL.createObjectURL(file));
    },
    [idPreview]
  );

  const handleSelfieSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
    },
    [selfiePreview]
  );

  const handleStartProcessing = useCallback(() => {
    setStep(3);
    setProcessing(true);
    setError(null);

    timerRef.current = setTimeout(async () => {
      try {
        const result = await completeVerification();
        if (result.error) {
          setError(result.error);
          setProcessing(false);
        } else {
          setProcessing(false);
          setCompleted(true);
          onComplete();
        }
      } catch {
        setError("An unexpected error occurred. Please try again.");
        setProcessing(false);
      }
    }, 2500);
  }, [onComplete]);

  const handleRetry = useCallback(() => {
    setError(null);
    setProcessing(true);

    timerRef.current = setTimeout(async () => {
      try {
        const result = await completeVerification();
        if (result.error) {
          setError(result.error);
          setProcessing(false);
        } else {
          setProcessing(false);
          setCompleted(true);
          onComplete();
        }
      } catch {
        setError("An unexpected error occurred. Please try again.");
        setProcessing(false);
      }
    }, 2500);
  }, [onComplete]);

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`size-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                s < step || completed
                  ? "bg-blue-600 text-white"
                  : s === step
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {s < step || completed ? (
                <CheckCircle className="size-5" />
              ) : (
                s
              )}
            </div>
            {s < 3 && (
              <div
                className={`h-0.5 w-8 transition-colors ${
                  s < step ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload ID */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Upload Government ID</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload your government-issued photo ID
            </p>
          </div>

          <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 cursor-pointer hover:border-blue-400 transition-colors">
            {idPreview ? (
              <img
                src={idPreview}
                alt="ID preview"
                className="max-h-48 rounded-md object-contain"
              />
            ) : (
              <>
                <Upload className="size-10 text-gray-400" />
                <span className="mt-2 text-sm text-muted-foreground">
                  Click to select a photo of your ID
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleIdSelect}
            />
          </label>

          <Button
            className="w-full"
            disabled={!idFile}
            onClick={() => setStep(2)}
          >
            Continue
          </Button>
        </div>
      )}

      {/* Step 2: Upload Selfie */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Upload Selfie</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Take a selfie or upload a photo of yourself
            </p>
          </div>

          <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 cursor-pointer hover:border-blue-400 transition-colors">
            {selfiePreview ? (
              <img
                src={selfiePreview}
                alt="Selfie preview"
                className="max-h-48 rounded-md object-contain"
              />
            ) : (
              <>
                <Upload className="size-10 text-gray-400" />
                <span className="mt-2 text-sm text-muted-foreground">
                  Click to select a selfie photo
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSelfieSelect}
            />
          </label>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button
              className="flex-1"
              disabled={!selfieFile}
              onClick={handleStartProcessing}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Processing / Result */}
      {step === 3 && (
        <div className="space-y-4 text-center">
          {processing && (
            <>
              <Loader2 className="mx-auto size-12 animate-spin text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold">
                  Verifying your identity...
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  This may take a moment
                </p>
              </div>
            </>
          )}

          {completed && !processing && (
            <>
              <CheckCircle className="mx-auto size-12 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-700">
                  Verification complete!
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your identity has been verified. A badge will now appear on
                  your profile.
                </p>
              </div>
            </>
          )}

          {error && !processing && (
            <>
              <AlertCircle className="mx-auto size-12 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-700">
                  Verification failed
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              </div>
              <Button onClick={handleRetry} className="w-full">
                Retry
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
