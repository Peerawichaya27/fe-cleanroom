import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth/server";
import { LoginForm } from "@/components/admin/login";
export const metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};
export default async function Login() {
  if (await currentAdmin()) redirect("/admin");
  return (
    <main id="main" className="login-page">
      <Link className="brand" href="/">
        <Image
          src="/ptc-logo.svg"
          style={{ height: "auto" }}
          width={92}
          height={65}
          alt="PTC"
        />
        <span>
          PEETOP<span>Corporation Co., Ltd.</span>
        </span>
      </Link>
      <section className="login-card">
        <div className="eyebrow">Peetop workspace</div>
        <h1>Admin sign in</h1>
        <p className="muted">
          Sign in to manage your catalog and customer requests.
        </p>
        <LoginForm />
        <p className="login-note">
          For authorized administrators only. Contact your super admin if you
          need access.
        </p>
      </section>
      <Link className="text-link" href="/">
        ← Back to the website
      </Link>
    </main>
  );
}
