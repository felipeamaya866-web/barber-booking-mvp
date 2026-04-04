"use client"

import { signIn } from "next-auth/react"

export default function LoginPage() {
  return (
    <div className="flex h-screen items-center justify-center">
      <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="rounded bg-black px-6 py-3 text-white"
      >
        Iniciar sesión con Google
      </button>
    </div>
  )
}
