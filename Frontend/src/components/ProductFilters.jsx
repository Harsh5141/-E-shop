import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { formatINR } from '../utils/currency';

const ProductFilters = ({
  categories,
  filters,
  availableMinPrice,
  availableMaxPrice,
  onFilterChange,
  onReset,
}) => {
  const sliderMin = Math.floor(availableMinPrice);
  const sliderMax = Math.ceil(Math.max(availableMaxPrice, availableMinPrice + 1));
  const selectedMin = filters.minPrice === '' ? sliderMin : Number(filters.minPrice);
  const selectedMax = filters.maxPrice === '' ? sliderMax : Number(filters.maxPrice);

  const updateMinPrice = (nextMin) => {
    const safeMin = Math.min(nextMin, selectedMax);
    onFilterChange('minPrice', String(safeMin));
  };

  const updateMaxPrice = (nextMax) => {
    const safeMax = Math.max(nextMax, selectedMin);
    onFilterChange('maxPrice', String(safeMax));
  };

  return (
    <aside className="top-24 h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:sticky">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">
            <SlidersHorizontal size={14} />
            Filters
          </div>
          <h2 className="mt-4 text-2xl font-black text-slate-950">Find your price sweet spot</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Narrow the catalog by category, price range, and sort order.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <RotateCcw size={16} />
          Reset
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Category</label>
          <select
            value={filters.category}
            onChange={(event) => onFilterChange('category', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Sort by</label>
          <select
            value={filters.sortBy}
            onChange={(event) => onFilterChange('sortBy', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white"
          >
            <option value="newest">Newest</option>
            <option value="lowToHigh">Price: Low to High</option>
            <option value="highToLow">Price: High to Low</option>
          </select>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">Selected Price Range</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">Real-time filtering</p>
            </div>
            <div className="rounded-2xl bg-slate-950 px-3 py-2 text-sm font-bold text-white">
              {formatINR(selectedMin)} - {formatINR(selectedMax)}
            </div>
          </div>

          <div className="relative mb-5 h-8">
            <div className="absolute top-1/2 h-2 w-full -translate-y-1/2 rounded-full bg-slate-200" />
            <div
              className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-slate-950 to-cyan-500"
              style={{
                left: `${((selectedMin - sliderMin) / Math.max(sliderMax - sliderMin, 1)) * 100}%`,
                right: `${100 - ((selectedMax - sliderMin) / Math.max(sliderMax - sliderMin, 1)) * 100}%`,
              }}
            />
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              value={selectedMin}
              onChange={(event) => updateMinPrice(Number(event.target.value))}
              className="pointer-events-none absolute top-1/2 h-2 w-full -translate-y-1/2 appearance-none rounded-full bg-transparent accent-slate-950 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-950 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-slate-950"
            />
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              value={selectedMax}
              onChange={(event) => updateMaxPrice(Number(event.target.value))}
              className="pointer-events-none absolute top-1/2 h-2 w-full -translate-y-1/2 appearance-none rounded-full bg-transparent accent-cyan-500 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-cyan-500"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Minimum Price
              </label>
              <input
                type="number"
                min={sliderMin}
                max={selectedMax}
                value={filters.minPrice}
                onChange={(event) => updateMinPrice(Number(event.target.value || sliderMin))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Maximum Price
              </label>
              <input
                type="number"
                min={selectedMin}
                max={sliderMax}
                value={filters.maxPrice}
                onChange={(event) => updateMaxPrice(Number(event.target.value || sliderMax))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ProductFilters;
