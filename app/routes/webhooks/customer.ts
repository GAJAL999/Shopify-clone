import { json } from "@remix-run/node";
import prisma from "~/utils/db.server";

export async function action({ request }) {
  const payload = await request.json();

  await prisma.customer.create({
    data: {
      shopifyId: payload.id.toString(),
      firstName: payload.first_name,
      lastName: payload.last_name,
      email: payload.email,
    },
  });

  return json({ success: true });
}
