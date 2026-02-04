"use server";

import { prisma } from "@rallly/database";
import { cookies } from "next/headers";
import z from "zod";
import {
  actionClient,
  createRateLimitMiddleware,
} from "@/lib/safe-action/server";

export type VerificationType = "sign-in" | "email-verification";

export async function setVerificationEmail(
  email: string,
  type: VerificationType = "sign-in",
) {
  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NEXT_PUBLIC_BASE_URL?.startsWith("https://"),
    sameSite: "lax" as const,
    maxAge: 15 * 60,
  };

  cookieStore.set("verification-email", email, cookieOptions);
  cookieStore.set("verification-type", type, cookieOptions);
}

export async function getVerificationType(): Promise<VerificationType> {
  const cookieStore = await cookies();
  const type = cookieStore.get("verification-type")?.value;
  return type === "email-verification" ? "email-verification" : "sign-in";
}

export const getLoginMethodAction = actionClient
  .metadata({ actionName: "get_login_method" })
  .inputSchema(z.object({ email: z.email() }))
  .use(createRateLimitMiddleware(100, "1m"))
  .action(async ({ parsedInput: { email } }) => {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        emailVerified: true,
        accounts: {
          select: {
            provider: true,
          },
        },
      },
    });

    if (
      user?.emailVerified &&
      user?.accounts.some((account) => account.provider === "credential")
    ) {
      return { method: "credential" as const };
    }

    return { method: "email" as const };
  });
