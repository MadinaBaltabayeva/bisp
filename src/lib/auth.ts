import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      bio: {
        type: "string",
        required: false,
        defaultValue: "",
      },
      location: {
        type: "string",
        required: false,
        defaultValue: "",
      },
      averageRating: {
        type: "number",
        required: false,
        defaultValue: 0,
        input: false,
      },
      reviewCount: {
        type: "number",
        required: false,
        defaultValue: 0,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  plugins: [
    admin(),
    nextCookies(),
  ],
});
