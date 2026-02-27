import React, { useEffect, useMemo, useState } from 'react';
import { ListingCard } from './ListingCard';
import { VehicleDetailModal } from './VehicleDetailModal';
import { Search, ArrowDownWideNarrow } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAvailableVehicles, getVehicleImages, resolveBackendUploadUrl } from '../../lib/api';

interface MarketVehicle {
  Vehicle_ID: number;
  Make_Model_Year: string;
  Asking_Price: number;
  Mileage: number;
  Fuel_Type: string;
  Color: string;
  Description: string;
  Seller_First_Name: string;
  Seller_Last_Name: string;
  Seller_Phone: string;
  Slot_ID: number | null;
  Created_At: string;
}

export function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'newest'>('newest');
  const [selectedVehicle, setSelectedVehicle] = useState<MarketVehicle | null>(null);
  const [vehicles, setVehicles] = useState<MarketVehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicleImages, setVehicleImages] = useState<Record<number, string | null>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [fuelType, setFuelType] = useState<string>('');
  const [minMileage, setMinMileage] = useState('');
  const [maxMileage, setMaxMileage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAvailableVehicles({
          page: 1,
          limit: 48,
          search: searchTerm || undefined,
          min_price: minPrice || undefined,
          max_price: maxPrice || undefined,
          fuel_type: fuelType || undefined,
          min_mileage: minMileage || undefined,
          max_mileage: maxMileage || undefined,
        });
        if (data.success && data.data?.vehicles) {
          setVehicles(data.data.vehicles as MarketVehicle[]);
        } else {
          setError(data.error || 'Failed to load vehicles');
          setVehicles([]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load vehicles'
        );
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [searchTerm, minPrice, maxPrice, fuelType, minMileage, maxMileage]);

  // Load a primary photo for each marketplace card (if available)
  useEffect(() => {
    const loadImages = async () => {
      const ids = vehicles
        .map(car => Number(car.Vehicle_ID))
        .filter(id => Number.isFinite(id) && id > 0);

      const missing = ids.filter(id => vehicleImages[id] === undefined);
      if (missing.length === 0) return;

      await Promise.all(
        missing.map(async id => {
          try {
            const data = await getVehicleImages(id);
            const firstRel =
              data?.success && data.data?.images && data.data.images.length
                ? data.data.images[0].url
                : null;
            const resolved = firstRel ? resolveBackendUploadUrl(firstRel) : null;
            setVehicleImages(prev => ({ ...prev, [id]: resolved }));
          } catch {
            setVehicleImages(prev => ({ ...prev, [id]: null }));
          }
        })
      );
    };

    if (vehicles.length > 0) {
      loadImages();
    }
  }, [vehicles, vehicleImages]);

  const filteredCars = useMemo(() => {
    const sorted = [...vehicles];
    sorted.sort((a, b) => {
      if (sortBy === 'price_asc') return a.Asking_Price - b.Asking_Price;
      if (sortBy === 'price_desc') return b.Asking_Price - a.Asking_Price;
      // newest by Created_At
      return new Date(b.Created_At).getTime() - new Date(a.Created_At).getTime();
    });
    return sorted;
  }, [vehicles, sortBy]);

  return (
    <div className="space-y-8 relative">
      <AnimatePresence>
        {selectedVehicle && (
          <VehicleDetailModal 
            vehicle={selectedVehicle} 
            onClose={() => setSelectedVehicle(null)} 
          />
        )}
      </AnimatePresence>

      {/* Hero / Stats Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-slate-900/90 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=2000" 
          alt="Showroom" 
          className="w-full h-48 object-cover opacity-50"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-center items-center text-center p-6 space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Premium Proxy Showroom
          </h1>
          <p className="text-slate-300 max-w-xl mx-auto text-lg">
            Buy and sell verified vehicles securely through our managed physical lot.
          </p>
        </div>
      </motion.div>

      {/* Filters & Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-20 z-30">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by make or model..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
           {/* Sort & Advanced Filters */}
           <div className="flex flex-wrap gap-3 w-full md:w-auto items-center justify-end">
             <div className="relative">
              <select 
                aria-label="Sort vehicles"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
              <ArrowDownWideNarrow className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            </div>
            <button
              type="button"
              onClick={() => setShowAdvanced(prev => !prev)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              {showAdvanced ? 'Hide advanced filters' : 'Advanced filters'}
            </button>
          </div>
        </div>

        {showAdvanced && (
          <div className="mt-4 border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Min Price (₱)</label>
              <input
                type="number"
                min={0}
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Max Price (₱)</label>
              <input
                type="number"
                min={0}
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Any"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Fuel Type</label>
              <select
                value={fuelType}
                onChange={e => setFuelType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Any</option>
                <option value="Gasoline">Gasoline</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Electric">Electric</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Mileage (km)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  value={minMileage}
                  onChange={e => setMinMileage(e.target.value)}
                  className="w-1/2 rounded-lg border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Min"
                />
                <input
                  type="number"
                  min={0}
                  value={maxMileage}
                  onChange={e => setMaxMileage(e.target.value)}
                  className="w-1/2 rounded-lg border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Max"
                />
              </div>
            </div>

            {(minPrice || maxPrice || fuelType || minMileage || maxMileage) && (
              <div className="md:col-span-3 lg:col-span-4 flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs text-slate-500 mr-2">Active filters:</span>
                {minPrice && (
                  <span className="px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-700">Min ₱{Number(minPrice).toLocaleString()}</span>
                )}
                {maxPrice && (
                  <span className="px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-700">Max ₱{Number(maxPrice).toLocaleString()}</span>
                )}
                {fuelType && (
                  <span className="px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-700">Fuel: {fuelType}</span>
                )}
                {minMileage && (
                  <span className="px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-700">Min {Number(minMileage).toLocaleString()} km</span>
                )}
                {maxMileage && (
                  <span className="px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-700">Max {Number(maxMileage).toLocaleString()} km</span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice('');
                    setMaxPrice('');
                    setFuelType('');
                    setMinMileage('');
                    setMaxMileage('');
                  }}
                  className="ml-auto text-xs font-medium text-blue-600 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      {error && (
        <div className="text-center py-20 bg-red-50 rounded-xl border border-red-200">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {loading && !error && (
        <div className="text-center py-20 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-slate-500 text-lg">Loading vehicles...</p>
        </div>
      )}

      {!loading && !error && filteredCars.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCars.map(car => (
            <motion.div
              key={car.Vehicle_ID}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <ListingCard
                car={car}
                imageUrl={vehicleImages[car.Vehicle_ID] ?? undefined}
                onClick={() => setSelectedVehicle(car)}
              />
            </motion.div>
          ))}
        </div>
      ) : (!loading && !error) ? (
        <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <p className="text-slate-500 text-lg">No vehicles found matching your criteria.</p>
          <button 
            onClick={() => {
              setSearchTerm('');
              setMinPrice('');
              setMaxPrice('');
              setFuelType('');
              setMinMileage('');
              setMaxMileage('');
            }}
            className="mt-4 text-blue-600 font-medium hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : null}
    </div>
  );
}
