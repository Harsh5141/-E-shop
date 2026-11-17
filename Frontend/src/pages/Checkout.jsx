import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/currency';

const paymentOptions = {
  razorpay: {
    label: 'Pay with Razorpay',
    value: 'Razorpay',
  },
  cod: {
    label: 'Cash on Delivery',
    value: 'Cash on Delivery',
  },
  qr: {
    label: 'UPI QR Code',
    value: 'UPI QR',
  },
};

function Checkout() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [shippingAddress, setShippingAddress] = useState(user?.address || '');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(paymentOptions.razorpay.value);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await api.get('/cart');
        setCart(response.data);
      } catch (error) {
        toast.error(error.response?.data || 'Unable to load cart.');
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  const items = cart?.items || [];
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items]
  );
  const upiId = import.meta.env.VITE_UPI_ID || 'harshpatel5141@okaxis';
  const upiName = import.meta.env.VITE_UPI_NAME || 'Harsh Patel';
  const upiPaymentLink = useMemo(() => {
    const params = new URLSearchParams({
      pa: upiId,
      pn: upiName,
      am: total.toFixed(2),
      cu: 'INR',
      tn: 'E-Commerce Order Payment',
    });

    return `upi://pay?${params.toString()}`;
  }, [total, upiId, upiName]);
  const qrCodeUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiPaymentLink)}`;
  }, [upiPaymentLink]);

  const validateCheckout = () => {
    const trimmedAddress = shippingAddress.trim();

    if (!trimmedAddress) {
      toast.error('Please enter your shipping address.');
      return null;
    }

    if (!items.length) {
      toast.error('Your cart is empty.');
      return null;
    }

    return trimmedAddress;
  };

  const placeOfflineOrder = async (selectedMethod) => {
    const trimmedAddress = validateCheckout();
    if (!trimmedAddress) {
      return;
    }

    setPaying(true);

    try {
      await api.post('/orders', {
        shippingAddress: trimmedAddress,
        paymentMethod: selectedMethod,
      });

      updateUser?.({ address: trimmedAddress });
      toast.success('Order placed successfully.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data || 'Unable to place order.');
    } finally {
      setPaying(false);
    }
  };

  const handlePayment = async () => {
    const trimmedAddress = validateCheckout();
    if (!trimmedAddress) {
      return;
    }

    if (paymentMethod === paymentOptions.cod.value) {
      await placeOfflineOrder(paymentOptions.cod.value);
      return;
    }

    if (paymentMethod === paymentOptions.qr.value) {
      await placeOfflineOrder(paymentOptions.qr.value);
      return;
    }

    if (!window.Razorpay) {
      toast.error('Razorpay checkout is not loaded. Check index.html.');
      return;
    }

    setPaying(true);

    try {
      const orderResponse = await api.post('/orders/razorpay/create-order');
      const razorpayOrder = orderResponse.data;

      const options = {
        key: razorpayOrder.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'My E-Commerce',
        description: 'Order Payment',
        order_id: razorpayOrder.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: '',
        },
        notes: {
          shippingAddress: trimmedAddress,
        },
        theme: {
          color: '#4f46e5',
        },
        handler: async (response) => {
          try {
            await api.post('/orders/razorpay/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              shippingAddress: trimmedAddress,
            });

            updateUser?.({ address: trimmedAddress });
            toast.success('Payment successful. Order placed.');
            navigate('/dashboard');
          } catch (error) {
            toast.error(error.response?.data || 'Payment verification failed.');
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        toast.error(response.error?.description || 'Payment failed.');
        setPaying(false);
      });
      razorpay.open();
    } catch (error) {
      toast.error(error.response?.data || 'Unable to start payment.');
      setPaying(false);
    }
  };

  if (loading) {
    return <div className="p-20 text-center animate-pulse">Loading Checkout...</div>;
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-gray-100 bg-white p-10 text-center shadow-sm">
        <h2 className="mb-3 text-2xl font-bold text-gray-900">Checkout</h2>
        <p className="mb-6 text-gray-500">Your cart is empty.</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
      <div className="md:col-span-2">
        <h2 className="mb-6 text-3xl font-extrabold text-gray-900">Checkout</h2>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <label htmlFor="shippingAddress" className="mb-2 block font-semibold text-gray-900">
            Shipping Address
          </label>
          <textarea
            id="shippingAddress"
            value={shippingAddress}
            onChange={(event) => setShippingAddress(event.target.value)}
            rows={5}
            className="w-full rounded-lg border border-gray-200 p-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            placeholder="House number, street, city, state, PIN code"
          />
        </div>

        <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-900">Choose Payment Method</h3>
          <div className="grid gap-3 md:grid-cols-3">
            {Object.values(paymentOptions).map((option) => {
              const isActive = paymentMethod === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPaymentMethod(option.value)}
                  className={`rounded-xl border px-4 py-4 text-left transition ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">{option.label}</div>
                </button>
              );
            })}
          </div>

          {paymentMethod === paymentOptions.cod.value && (
            <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              Pay in cash when your order is delivered. Please keep the exact amount ready when possible.
            </div>
          )}

          {paymentMethod === paymentOptions.qr.value && (
            <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
                <img
                  src={qrCodeUrl}
                  alt="UPI payment QR code"
                  className="h-48 w-48 rounded-2xl border border-gray-200 bg-white p-3"
                />
                <div className="text-sm text-gray-700">
                  <h4 className="text-base font-bold text-gray-900">Scan to Pay</h4>
                  <p className="mt-2">Use any UPI app to scan this QR code and pay {formatINR(total)}.</p>
                  <p className="mt-2"><span className="font-semibold">UPI ID:</span> {upiId}</p>
                  <p><span className="font-semibold">Merchant:</span> {upiName}</p>
                  <a
                    href={upiPaymentLink}
                    className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Open UPI App
                  </a>
                  <p className="mt-3 text-xs text-gray-500">
                    After completing payment, click the button below to place the order.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <aside className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-xl font-bold text-gray-900">Order Summary</h3>

        <div className="mb-6 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 text-sm text-gray-600">
              <span>
                {item.product?.name} x {item.quantity}
              </span>
              <span className="font-semibold text-gray-900">
                {formatINR(item.product.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="mb-6 border-t border-gray-100 pt-4">
          <div className="flex justify-between text-lg font-bold text-gray-900">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePayment}
          disabled={paying}
          className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {paying
            ? paymentMethod === paymentOptions.razorpay.value
              ? 'Opening Razorpay...'
              : 'Placing order...'
            : paymentMethod === paymentOptions.cod.value
              ? 'Place Cash on Delivery Order'
              : paymentMethod === paymentOptions.qr.value
                ? 'I Have Paid, Place Order'
                : 'Pay with Razorpay'}
        </button>
      </aside>
    </div>
  );
}

export default Checkout;
