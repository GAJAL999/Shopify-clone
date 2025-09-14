import { json } from "@remix-run/node";
import prisma from "~/utils/db.server";

export async function action({ request }) {
  const payload = await request.json();

  await prisma.product.create({
    data: {
      shopifyId: payload.id.toString(),
      title: payload.title,
      price: parseFloat(payload.variants?.[0]?.price || "0"),
    },
  });

  return json({ success: true });
}
