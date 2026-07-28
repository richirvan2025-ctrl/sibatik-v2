"use client";

import { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowRight,
  Headphones,
  Lock,
  Mail,
  ShieldCheck,
  TicketCheck,
} from "lucide-react";

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

const benefits = [
  { icon: TicketCheck, title: "Pantau setiap permintaan", description: "Status, prioritas, dan riwayat tiket tersimpan rapi." },
  { icon: ShieldCheck, title: "Akses sesuai peran", description: "Tampilan dan aksi disesuaikan untuk setiap pengguna." },
  { icon: Headphones, title: "Dukungan terkoordinasi", description: "Terhubung langsung dengan tim layanan kampus." },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Email atau password salah");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-[#F3F6FB] lg:grid-cols-[1.06fr_.94fr]">
      <section className="hidden min-h-screen flex-col justify-between bg-[#0B1D3A] p-10 text-white lg:flex xl:p-14">
        <div className="flex items-center gap-3.5">
          <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.2)]">
            <Image src="/logo.png" alt="Logo IDB Bali" width={43} height={43} className="h-11 w-11 object-contain" priority />
          </div>
          <div>
            <p className="text-xl font-bold tracking-[-0.02em]">IDB BALI</p>
            <p className="mt-0.5 text-xs font-medium tracking-wide text-[#AFC0D6]">Institut Desain & Bisnis Bali</p>
          </div>
        </div>

        <div className="max-w-xl py-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#8B6DF0]/35 bg-[#7047EB]/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#D7CDFF]">
            <Headphones className="h-3.5 w-3.5" />
            Pusat layanan kampus
          </span>
          <h1 className="mt-6 text-[44px] font-bold leading-[1.08] tracking-[-0.045em] xl:text-[52px]">
            Bantuan kampus,
            <br />lebih cepat dan jelas.
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-7 text-[#B8C7DA]">
            Laporkan kendala, ikuti progres, dan temukan solusi mandiri melalui satu layanan terpadu IDB Bali.
          </p>

          <div className="mt-9 grid gap-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="flex items-center gap-4 rounded-[14px] border border-white/10 bg-white/[0.055] p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7047EB] text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{benefit.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-[#9EB0C7]">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-[#7589A5]">© {new Date().getFullYear()} Institut Desain & Bisnis Bali</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-[470px]">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white shadow-sm ring-1 ring-[#DCE4EF]">
              <Image src="/logo.png" alt="Logo IDB Bali" width={34} height={34} className="h-8 w-8 object-contain" priority />
            </div>
            <div>
              <p className="font-bold text-[#15213C]">IDB BALI</p>
              <p className="text-xs text-[#71809A]">SIBATIK Support</p>
            </div>
          </div>

          <div className="mb-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7047EB]">Selamat datang kembali</p>
            <h2 className="mt-2 text-[32px] font-bold tracking-[-0.035em] text-[#101A36]">Masuk ke SIBATIK</h2>
            <p className="mt-2 text-sm leading-6 text-[#6E7B92]">Gunakan akun IDB Bali Anda untuk melanjutkan ke pusat layanan.</p>
          </div>

          <div className="rounded-[18px] border border-[#DCE4EF] bg-white p-5 shadow-[0_12px_38px_rgba(29,43,76,0.08)] sm:p-7">
            {error && (
              <Alert variant="destructive" className="mb-5 rounded-xl border-red-200 bg-red-50 text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold text-[#26334D]">Email IDB Bali</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C8AA2]" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="nama@idbbali.ac.id"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 bg-[#F8FAFD] pl-10 text-base focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-bold text-[#26334D]">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C8AA2]" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Masukkan password Anda"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 bg-[#F8FAFD] pl-10 text-base focus:bg-white"
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="h-12 w-full text-base">
                {isLoading ? (
                  <span className="flex items-center gap-2.5"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Memproses...</span>
                ) : (
                  <span className="flex items-center gap-2">Masuk <ArrowRight className="h-4.5 w-4.5" /></span>
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E1E6EF]" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#929DB0]">atau</span></div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => signIn("microsoft-entra-id", { callbackUrl: "/dashboard" })}
              className="h-12 w-full text-sm"
            >
              <MicrosoftIcon className="mr-1 h-5 w-5" />
              Masuk dengan Microsoft 365
            </Button>
          </div>

          <p className="mt-5 text-center text-xs leading-5 text-[#8290A6]">Butuh bantuan akses? Hubungi tim Sistem Informasi & IT Support.</p>
        </div>
      </section>
    </main>
  );
}
