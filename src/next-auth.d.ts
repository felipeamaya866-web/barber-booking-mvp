import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "CLIENT" | "BARBERSHOP" | "ADMIN"
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: "CLIENT" | "BARBERSHOP" | "ADMIN"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "CLIENT" | "BARBERSHOP" | "ADMIN"
  }
}
