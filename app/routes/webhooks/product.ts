import { json } from "@remix-run/node";
import prisma from "../../db.server";

export async function action({ request }: { request: Request }) {
  try {
    const payload = await request.json();
    const tenantId = request.headers.get("x-shopify-shop-domain") ?? "unknown";

    if (!payload?.id || !payload?.title || !payload?.variants?.[0]?.price) {
      console.warn("Invalid product payload:", payload);
      return json({ error: "Invalid product data" }, { status: 400 });
    }

    await prisma.product.upsert({
      where: { shopifyId: payload.id.toString() },
      update: {
        title: payload.title,
        price: parseFloat(payload.variants[0].price),
        tenantId,
      },
      create: {
        shopifyId: payload.id.toString(),
        title: payload.title,
        price: parseFloat(payload.variants[0].price),
        tenantId,
      },
    });

    return json({ success: true });
  } catch (error) {
    console.error("Product webhook error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
