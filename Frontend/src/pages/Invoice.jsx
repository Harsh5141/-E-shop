import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../config/api';
import { formatINR } from '../utils/currency';

const Invoice = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await api.get(`/orders/${id}/invoice`);
        setInvoice(response.data);
      } catch (error) {
        toast.error(error.response?.data || 'Unable to load invoice.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  if (loading) {
    return <div className="p-20 text-center animate-pulse">Loading Invoice...</div>;
  }

  if (!invoice) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-gray-100 bg-white p-10 text-center shadow-sm">
        <h1 className="mb-3 text-2xl font-bold text-gray-900">Invoice not found</h1>
        <Link to="/dashboard" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <Link to="/dashboard" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Back to orders
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-indigo-700"
        >
          Print Invoice
        </button>
      </div>

      <section className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        <div className="mb-8 flex flex-col gap-6 border-b border-gray-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Invoice</h1>
            <p className="mt-2 font-mono text-sm text-gray-500">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-left text-sm text-gray-600 sm:text-right">
            <p className="font-bold text-gray-900">My E-Commerce</p>
            <p>Order #{invoice.id}</p>
            <p>{new Date(invoice.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="mb-8 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-500">Bill To</h2>
            <p className="font-bold text-gray-900">{invoice.customer?.name || 'Customer'}</p>
            <p className="text-gray-600">{invoice.customer?.email}</p>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-500">Ship To</h2>
            <p className="whitespace-pre-line text-gray-700">{invoice.shippingAddress || 'None provided'}</p>
          </div>
        </div>

        <div className="mb-8 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="py-3 pr-4 font-bold">Item</th>
                <th className="px-4 py-3 text-right font-bold">Qty</th>
                <th className="px-4 py-3 text-right font-bold">Price</th>
                <th className="py-3 pl-4 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-4 pr-4 font-semibold text-gray-900">{item.productName}</td>
                  <td className="px-4 py-4 text-right text-gray-600">{item.quantity}</td>
                  <td className="px-4 py-4 text-right text-gray-600">{formatINR(item.unitPrice)}</td>
                  <td className="py-4 pl-4 text-right font-semibold text-gray-900">{formatINR(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Payment</span>
              <span className="font-semibold text-gray-900">{invoice.paymentMethod || 'Cash on Delivery'}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Status</span>
              <span className="font-semibold text-gray-900">{invoice.status}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-3 text-xl font-extrabold text-gray-900">
              <span>Total</span>
              <span>{formatINR(invoice.total)}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Invoice;
