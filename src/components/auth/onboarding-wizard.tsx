"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardingSchema, type OnboardingFormValues } from "@/lib/validations/user";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { data: session } = authClient.useSession();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: session?.user?.name || "",
      location: "",
    },
  });

  const handleNext = async () => {
    // Validate step 1 field
    const nameValid = await form.trigger("name");
    if (!nameValid) return;
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleFinish = async (values: OnboardingFormValues) => {
    setIsLoading(true);
    try {
      // Update user name if changed
      await authClient.updateUser({
        name: values.name,
      });

      // Update location via Better Auth (additional field defined in auth config)
      await authClient.updateUser({
        location: values.location,
      });

      router.refresh();
      onComplete();
    } catch {
      form.setError("root", {
        message: "Failed to save profile. You can update this later in settings.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFinish)} className="space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2">
          <div
            className={`h-2 w-16 rounded-full transition-colors ${
              step >= 1 ? "bg-primary-600" : "bg-gray-200"
            }`}
          />
          <div
            className={`h-2 w-16 rounded-full transition-colors ${
              step >= 2 ? "bg-primary-600" : "bg-gray-200"
            }`}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Step {step} of 2
        </p>

        {form.formState.errors.root && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}

        {/* Step 1: Display name */}
        {step === 1 && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What should we call you?</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your display name"
                    autoComplete="name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Where are you located?</FormLabel>
                <FormControl>
                  <Input
                    placeholder="City or region (e.g., San Francisco, CA)"
                    autoComplete="address-level2"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {step === 2 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="flex-1"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
          )}
          {step === 1 ? (
            <Button type="button" onClick={handleNext} className="w-full">
              Next
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Finish
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
