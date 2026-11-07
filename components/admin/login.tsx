"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { refreshSession } from "@/lib/api/admin";
import { api } from "@/lib/api/client";
import { adminSchema } from "@/lib/api/contracts";
import { loginFormSchema } from "@/lib/schemas/forms";
export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
  });
  useEffect(() => {
    void refreshSession()
      .then(() => {
        router.replace("/admin");
        router.refresh();
      })
      .catch(() => {});
  }, [router]);
  async function submit(values: z.infer<typeof loginFormSchema>) {
    setError("");
    try {
      await api("admin/auth/login", z.object({ user: adminSchema }), {
        method: "POST",
        body: JSON.stringify(values),
      });
      router.replace("/admin");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
    }
  }
  return (
    <form className="guest-form" onSubmit={handleSubmit(submit)} noValidate>
      {error && (
        <div className="form-alert" role="alert">
          {error}
        </div>
      )}
      <div className="field">
        <label htmlFor="admin-email">Email address</label>
        <input
          id="admin-email"
          type="email"
          autoComplete="username"
          {...register("email")}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <span className="form-error">{errors.email.message}</span>
        )}
      </div>
      <div className="field">
        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <span className="form-error">{errors.password.message}</span>
        )}
      </div>
      <button className="button button-primary" disabled={isSubmitting}>
        {isSubmitting ? (
          <LoaderCircle size={18} className="spin" />
        ) : (
          <>
            Sign in to workspace <ArrowRight size={17} />
          </>
        )}
      </button>
    </form>
  );
}
