import { useState, useEffect } from 'react';
import api from '../config/api';
import ProductCard from '../components/ProductCard';
import ProductFilters from '../components/ProductFilters';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatINR } from '../utils/currency';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [availableMinPrice, setAvailableMinPrice] = useState(0);
  const [availableMaxPrice, setAvailableMaxPrice] = useState(100000);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'newest',
  });
  const pageSize = 16;

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/categories');
        setCategoriesList(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        setCategoriesList([]);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = { page, pageSize, sortBy: filters.sortBy };
        if (filters.search) params.search = filters.search;
        if (filters.category) params.categoryId = filters.category;
        if (filters.minPrice !== '') params.minPrice = filters.minPrice;
        if (filters.maxPrice !== '') params.maxPrice = filters.maxPrice;

        const res = await api.get('/products', { params });
        const productData = res.data.products || (Array.isArray(res.data) ? res.data : []);
        const total = Number(res.data.total ?? 0);

        setProducts(productData);
        setTotalProducts(total);
        setAvailableMinPrice(Number(res.data.minAvailablePrice ?? 0));
        setAvailableMaxPrice(Number(res.data.maxAvailablePrice ?? 100000));
        setTotalPages(Math.max(1, Math.ceil(total / pageSize)));
      } catch (error) {
        console.error('Error fetching products', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => fetchProducts(), 300);
    return () => clearTimeout(timeoutId);
  }, [filters, page]);

  useEffect(() => {
    setPage(1);
  }, [filters.category, filters.search, filters.minPrice, filters.maxPrice, filters.sortBy]);

  const handleFilterChange = (key, value) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      search: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'newest',
    });
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Discover Premium Products</h1>
        <p className="text-lg text-gray-600">Explore our curated collection of high-quality items designed just for you.</p>
      </div>

      <div className="mb-10 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:bg-white"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">
              {totalProducts} products
            </div>
            <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">
              Price window: {formatINR(availableMinPrice)} - {formatINR(availableMaxPrice)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <ProductFilters
          categories={categoriesList}
          filters={filters}
          availableMinPrice={availableMinPrice}
          availableMaxPrice={availableMaxPrice}
          onFilterChange={handleFilterChange}
          onReset={resetFilters}
        />

        <div>
          {loading ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                <div key={i} className="bg-white border border-gray-100 h-[400px] rounded-2xl animate-pulse flex flex-col">
                  <div className="h-[250px] bg-gray-200 rounded-t-2xl"></div>
                  <div className="p-5 flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[2rem] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">Filtered Products</h2>
                  <p className="text-sm text-slate-500">
                    Showing page {page} of {totalPages} with live search, price range, and sorting.
                  </p>
                </div>
                <div className="rounded-2xl bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-800">
                  {formatINR(Number(filters.minPrice || availableMinPrice))} - {formatINR(Number(filters.maxPrice || availableMaxPrice))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3 mb-10">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 bg-white py-3 px-6 rounded-xl border border-gray-100 shadow-sm inline-flex mx-auto w-fit">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 text-gray-700 transition"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="font-semibold text-gray-700">Page {page} of {totalPages}</span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 text-gray-700 transition"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm mt-8">
              <div className="text-gray-400 mb-4 flex justify-center"><Search size={48} /></div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No products found</h3>
              <p className="text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
