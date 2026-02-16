"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle } from "lucide-react";

const WaitlistSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Please enter a valid email"),
});

type WaitlistInput = z.infer<typeof WaitlistSchema>;

export function WaitlistForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "already" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WaitlistInput>({
    resolver: zodResolver(WaitlistSchema),
  });

  const onSubmit = async (data: WaitlistInput) => {
    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.status === 201) {
        setStatus("success");
      } else if (response.status === 409) {
        setStatus("already");
      } else {
        setErrorMessage(result.error || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <CheckCircle className="h-10 w-10 text-green-300" />
        <p className="text-lg font-semibold text-white">You're on the list!</p>
        <p className="text-sm text-violet-200">We'll be in touch when early access is ready.</p>
      </div>
    );
  }

  if (status === "already") {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <CheckCircle className="h-10 w-10 text-violet-200" />
        <p className="text-lg font-semibold text-white">You're already on the waitlist!</p>
        <p className="text-sm text-violet-200">We'll let you know as soon as early access is available.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto w-full max-w-xl">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <input
            {...register("name")}
            placeholder="Your name"
            className="h-12 w-full rounded-lg border border-white/20 bg-white/10 px-4 text-sm text-white placeholder-violet-200 backdrop-blur-sm transition-colors focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          {errors.name && <p className="mt-1 text-xs text-red-300">{errors.name.message}</p>}
        </div>
        <div className="flex-1">
          <input
            {...register("email")}
            type="email"
            placeholder="you@company.com"
            className="h-12 w-full rounded-lg border border-white/20 bg-white/10 px-4 text-sm text-white placeholder-violet-200 backdrop-blur-sm transition-colors focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          {errors.email && <p className="mt-1 text-xs text-red-300">{errors.email.message}</p>}
        </div>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="h-12 shrink-0 rounded-lg bg-white px-6 text-sm font-semibold text-violet-700 shadow-sm transition-colors hover:bg-violet-50 disabled:opacity-70"
        >
          {status === "submitting" ? "Joining..." : "Join Waitlist"}
        </button>
      </div>
      {status === "error" && <p className="mt-3 text-center text-sm text-red-300">{errorMessage}</p>}
    </form>
  );
}
