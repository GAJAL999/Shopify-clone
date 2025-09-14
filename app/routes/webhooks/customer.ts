import { json } from "@remix-run/node";
import prisma from "../../db.server";

export async function action({ request }: { request: Request }) {
  try {
    const payload = await request.json();
    const tenantId = request.headers.get("x-shopify-shop-domain") ?? "unknown";

    if (!payload?.id || !payload?.email || !payload?.first_name || !payload?.last_name) {
      console.warn("Invalid customer payload:", payload);
      return json({ error: "Missing required customer fields" }, { status: 400 });
    }

    await prisma.customer.upsert({
      where: { shopifyId: payload.id.toString() },
      update: {
        firstName: payload.first_name,
        lastName: payload.last_name,
        email: payload.email,
        tenantId,
      },
      create: {
        shopifyId: payload.id.toString(),
        firstName: payload.first_name,
        lastName: payload.last_name,
        email: payload.email,
        tenantId,
      },
    });

    return json({ success: true });
  } catch (error) {
    console.error("Customer webhook error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
