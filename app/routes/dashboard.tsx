import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import prisma from "~/utils/db.server";

export const loader: LoaderFunction = async () => {
  const products = await prisma.product.findMany();
  const customers = await prisma.customer.findMany();
  const orders = await prisma.order.findMany();
  return json({ products, customers, orders });
};

export default function Dashboard() {
  const { products, customers, orders } = useLoaderData();

  return (
    <div>
      <h1>📦 Products</h1>
      <ul>{products.map(p => <li key={p.id}>{p.title} - ₹{p.price}</li>)}</ul>

      <h1>👥 Customers</h1>
      <ul>{customers.map(c => <li key={c.id}>{c.firstName} {c.lastName}</li>)}</ul>

      <h1>🧾 Orders</h1>
      <ul>{orders.map(o => <li key={o.id}>{o.customerEmail} - ₹{o.totalPrice}</li>)}</ul>
    </div>
  );
}
