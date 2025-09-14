import { json } from "@remix-run/node";
import prisma from "../../db.server";

export async function action({ request }: { request: Request }) {
  try {
    const payload = await request.json();
    const tenantId = request.headers.get("x-shopify-shop-domain") ?? "unknown";

    if (
      !payload?.id ||
      !payload?.total_price ||
      !payload?.currency ||
      !payload?.email
    ) {
      console.warn("Invalid order payload:", payload);
      return json({ error: "Missing required order fields" }, { status: 400 });
    }

    await prisma.order.upsert({
      where: { shopifyId: payload.id.toString() },
      update: {
        totalPrice: parseFloat(payload.total_price),
        currency: payload.currency,
        customerEmail: payload.email,
        tenantId,
      },
      create: {
        shopifyId: payload.id.toString(),
        totalPrice: parseFloat(payload.total_price),
        currency: payload.currency,
        customerEmail: payload.email,
        tenantId,
      },
    });

    return json({ success: true });
  } catch (error) {
    console.error("Order webhook error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
