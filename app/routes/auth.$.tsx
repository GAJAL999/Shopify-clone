import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getSession, commitSession } from "../utils/session.server";
import { prisma } from "../db.server"; // adjust if needed
import { generateSessionId } from "../utils/generateSessionId"; // or use uuid

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Authenticate the incoming Shopify request
  const { shop, accessToken, scope } = await authenticate.admin(request);

  // Store session in your database with tenantId
  await prisma.session.upsert({
    where: { shop },
    update: {
      accessToken,
      scope,
      tenantId: shop,
    },
    create: {
      id: generateSessionId(),
      shop,
      accessToken,
      scope,
      tenantId: shop,
    },
  });

  // Store tenantId in a cookie-based session
  const session = await getSession(request.headers.get("Cookie"));
  session.set("tenantId", shop);

  return redirect("/dashboard", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
};
