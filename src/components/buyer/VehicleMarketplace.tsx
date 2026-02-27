/**
 * AUTOMALL - Vehicle Marketplace Component
 * Browse and book viewing appointments for available vehicles
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { getAvailableVehicles } from '@/lib/api';
import { Search, MapPin, Gauge, Fuel, AlertCircle } from 'lucide-react';

interface Vehicle {
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
  Plate_Number?: string;
}

interface VehicleMarketplaceProps {
  userId: number;
  onVehicleSelect: (vehicle: Vehicle) => void;
}

export function VehicleMarketplace({
  userId,
  onVehicleSelect,
}: VehicleMarketplaceProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await getAvailableVehicles({
        page,
        limit: 12,
        search: searchQuery || undefined,
        min_price: minPrice || undefined,
        max_price: maxPrice || undefined,
      });
      if (data.success) {
        setVehicles(data.data.vehicles as Vehicle[]);
        setTotalPages(data.data.total_pages);
        setError(null);
      } else {
        setError(data.error || 'Failed to load vehicles');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [page, searchQuery, minPrice, maxPrice]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  if (loading && vehicles.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-12">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          Browse Available Vehicles
        </h2>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search make/model (e.g., Mitsubishi Montero)..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Min Price (₱)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Max Price (₱)
              </label>
              <Input
                type="number"
                placeholder="10000000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            <Search className="mr-2 h-4 w-4" />
            Search Vehicles
          </Button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900">Error</p>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Vehicles Grid */}
      {vehicles.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-lg font-medium text-gray-900">No vehicles found</p>
          <p className="text-sm text-gray-600">
            Try adjusting your search criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Card
              key={vehicle.Vehicle_ID}
              className="overflow-hidden transition-all hover:shadow-lg"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {vehicle.Make_Model_Year}
                      </CardTitle>
                      {vehicle.Plate_Number && (
                        <p className="text-[11px] text-slate-500 tracking-widest mt-0.5">
                          Plate: {vehicle.Plate_Number}
                        </p>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <MapPin className="h-3 w-3" />
                      Slot {vehicle.Slot_ID ?? 'N/A'}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{vehicle.Color}</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Price */}
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-xs font-medium text-blue-600">ASKING PRICE</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatPrice(vehicle.Asking_Price)}
                  </p>
                </div>

                {/* Vehicle Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-600">MILEAGE</p>
                      <p className="font-semibold text-gray-900">
                        {vehicle.Mileage.toLocaleString()} km
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-600">FUEL</p>
                      <p className="font-semibold text-gray-900">
                        {vehicle.Fuel_Type}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700">
                  {vehicle.Description || 'No description available'}
                </p>

                {/* Seller Info */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-600">SELLER</p>
                  <p className="font-semibold text-gray-900">
                    {vehicle.Seller_First_Name} {vehicle.Seller_Last_Name}
                  </p>
                  <p className="text-xs text-gray-600">{vehicle.Seller_Phone}</p>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => onVehicleSelect(vehicle)}
                  className="w-full"
                >
                  Schedule Viewing
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                onClick={() => setPage(p)}
                className="min-w-[2.5rem]"
              >
                {p}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
