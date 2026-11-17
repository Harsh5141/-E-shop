import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { formatINR } from '../../utils/currency';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#334155',
        font: {
          weight: '600',
        },
      },
    },
  },
  scales: {
    x: {
      ticks: { color: '#64748b' },
      grid: { display: false },
    },
    y: {
      ticks: { color: '#64748b' },
      grid: { color: 'rgba(148, 163, 184, 0.18)' },
    },
  },
};

const AdminAnalyticsPanel = ({ analytics }) => {
  if (!analytics) {
    return (
      <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">Analytics unavailable</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The analytics API did not return data. This usually means the backend was not restarted after the latest changes
          or the database migration has not been applied yet.
        </p>
      </section>
    );
  }

  const summaryCards = [
    { label: 'Total Users', value: analytics.summary.totalUsers },
    { label: 'Total Products', value: analytics.summary.totalProducts },
    { label: 'Total Orders', value: analytics.summary.totalOrders },
    { label: 'Total Revenue', value: formatINR(analytics.summary.totalRevenue) },
  ];

  const registrationLabels = analytics.monthlyRegistrations.map((item) => item.label);
  const salesLabels = analytics.monthlySales.map((item) => item.label);
  const growthLabels = analytics.userGrowth.map((item) => item.label);

  const monthlyRegistrationsData = {
    labels: registrationLabels,
    datasets: [
      {
        label: 'Monthly Registrations',
        data: analytics.monthlyRegistrations.map((item) => item.count),
        backgroundColor: '#0891b2',
        borderRadius: 12,
      },
    ],
  };

  const userGrowthData = {
    labels: growthLabels,
    datasets: [
      {
        label: 'User Growth',
        data: analytics.userGrowth.map((item) => item.totalUsers),
        borderColor: '#0f172a',
        backgroundColor: 'rgba(15, 23, 42, 0.12)',
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const salesRevenueData = {
    labels: salesLabels,
    datasets: [
      {
        label: 'Revenue',
        data: analytics.monthlySales.map((item) => item.revenue),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.18)',
        tension: 0.35,
        fill: true,
      },
      {
        label: 'Orders',
        data: analytics.monthlySales.map((item) => item.orders),
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20, 184, 166, 0.14)',
        tension: 0.35,
      },
    ],
  };

  const categorySalesData = {
    labels: analytics.categorySales.map((item) => item.categoryName),
    datasets: [
      {
        label: 'Category Revenue',
        data: analytics.categorySales.map((item) => item.revenue),
        backgroundColor: ['#0f172a', '#0891b2', '#14b8a6', '#2563eb', '#f97316', '#e11d48'],
      },
    ],
  };

  return (
    <section className="mb-8 space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <h3 className="mt-3 text-3xl font-black text-slate-950">{card.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950">User Growth</h2>
              <p className="text-sm text-slate-500">
                Active users: {analytics.summary.activeUsers} | Monthly signups tracked from stored registrations.
              </p>
            </div>
          </div>
          <div className="h-80">
            <Line data={userGrowthData} options={chartOptions} />
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">Monthly Registrations</h2>
          <p className="mb-6 text-sm text-slate-500">Signup volume for the last six months.</p>
          <div className="h-80">
            <Bar data={monthlyRegistrationsData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">Sales Performance</h2>
          <p className="mb-6 text-sm text-slate-500">Revenue and order flow across recent months.</p>
          <div className="h-80">
            <Line data={salesRevenueData} options={chartOptions} />
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">Category-wise Sales</h2>
          <p className="mb-6 text-sm text-slate-500">Revenue share by product category.</p>
          <div className="h-80">
            <Pie
              data={categorySalesData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: '#334155',
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-slate-950">Best Selling Products</h2>
          <p className="text-sm text-slate-500">Top products by quantity sold and generated revenue.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-5">
          {analytics.bestSellingProducts.map((product) => (
            <div key={product.productId} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">Product</p>
              <h3 className="mt-3 line-clamp-2 text-lg font-black text-slate-950">{product.name}</h3>
              <p className="mt-4 text-sm text-slate-500">Units sold</p>
              <p className="text-2xl font-black text-slate-900">{product.quantitySold}</p>
              <p className="mt-3 text-sm text-slate-500">Revenue</p>
              <p className="text-base font-bold text-cyan-700">{formatINR(product.revenue)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdminAnalyticsPanel;
