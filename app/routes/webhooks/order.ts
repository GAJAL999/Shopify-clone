import { json } from "@remix-run/node";
import prisma from "../../db.server";

export async function action({ request }) {
  const payload = await request.json();

  await prisma.order.create({
    data: {
      shopifyId: payload.id.toString(),
      totalPrice: parseFloat(payload.total_price),
      currency: payload.currency,
      customerEmail: payload.email,
    },
  });

  return json({ success: true });
}
