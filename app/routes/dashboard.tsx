import {
  json,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import prisma from "../db.server";
import { getSession } from "~/utils/session.server";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const tenantId = session.get("tenantId");
  if (!tenantId) return redirect("/auth/login");

  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  const dateFilter =
    startDate && endDate
      ? {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }
      : {};

  const products = await prisma.product.findMany({ where: { tenantId } });
  const customers = await prisma.customer.findMany({ where: { tenantId } });
  const orders = await prisma.order.findMany({
    where: {
      tenantId,
      ...dateFilter,
    },
  });

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);

  const spendByCustomer: Record<string, number> = {};
  const revenueByDate: Record<string, number> = {};

  for (const order of orders) {
    spendByCustomer[order.customerEmail] =
      (spendByCustomer[order.customerEmail] ?? 0) + order.totalPrice;

    const date = new Date(order.createdAt).toISOString().split("T")[0];
    revenueByDate[date] = (revenueByDate[date] ?? 0) + order.totalPrice;
  }

  const topCustomers = Object.entries(spendByCustomer)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([email, total]) => ({ email, total }));

  const chartData = Object.entries(revenueByDate)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, total]) => ({ date, total }));

  return json({
    products,
    customers,
    orders,
    totalRevenue,
    topCustomers,
    chartData,
    startDate,
    endDate,
  });
};

export default function Dashboard() {
  const {
    products,
    customers,
    orders,
    totalRevenue,
    topCustomers,
    chartData,
    startDate,
    endDate,
  } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Revenue Over Time" },
    },
  };

  const chartLabels = chartData.map((d) => d.date);
  const chartValues = chartData.map((d) => d.total);

  const chartDataset = {
    labels: chartLabels,
    datasets: [
      {
        label: "Revenue (₹)",
        data: chartValues,
        borderColor: "rgba(75,192,192,1)",
        backgroundColor: "rgba(75,192,192,0.2)",
      },
    ],
  };

  return (
    <div>
      <h1>📊 Dashboard</h1>

      <form method="get" style={{ marginBottom: "1rem" }}>
        <label>
          Start Date:
          <input
            type="date"
            name="startDate"
            defaultValue={searchParams.get("startDate") ?? ""}
          />
        </label>
        <label style={{ marginLeft: "1rem" }}>
          End Date:
          <input
            type="date"
            name="endDate"
            defaultValue={searchParams.get("endDate") ?? ""}
          />
        </label>
        <button type="submit" style={{ marginLeft: "1rem" }}>
          Filter
        </button>
      </form>

      {startDate && endDate && (
        <p>
          Showing data from <strong>{startDate}</strong> to{" "}
          <strong>{endDate}</strong>
        </p>
      )}

      <h2>💰 Total Revenue: ₹{totalRevenue.toFixed(2)}</h2>

      <div style={{ maxWidth: "700px", marginBottom: "2rem" }}>
        <Line options={chartOptions} data={chartDataset} />
      </div>

      <h3>🏆 Top 5 Customers by Spend</h3>
      <ul>
        {topCustomers.map((c, i) => (
          <li key={i}>
            {c.email} — ₹{c.total.toFixed(2)}
          </li>
        ))}
      </ul>

      <h3>📦 Products</h3>
      <ul>
        {products.map((p) => (
          <li key={p.id}>
            {p.title} — ₹{p.price}
          </li>
        ))}
      </ul>

      <h3>👥 Customers</h3>
      <ul>
        {customers.map((c) => (
          <li key={c.id}>
            {c.firstName} {c.lastName}
          </li>
        ))}
      </ul>

      <h3>🧾 Orders</h3>
      <ul>
        {orders.map((o) => (
          <li key={o.id}>
            {o.customerEmail} — ₹{o.totalPrice}
          </li>
        ))}
      </ul>
    </div>
  );
}
