import { redirect } from 'next/navigation'

  export default function LoginPage() {
    const callbackUrl = `${process.env.NEXTAUTH_URL}/sso/callback`
    redirect(`https://sinergy.idbbali.ac.id/login.php?redirect=${encodeURIComponent(callbackUrl)}`)
  }
