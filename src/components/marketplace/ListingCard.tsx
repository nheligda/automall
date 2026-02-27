import React from 'react';
import { BadgeCheck, Calendar, Fuel, Gauge, User } from 'lucide-react';
import { Link } from 'react-router';

interface ListingCardProps {
  car: {
    Vehicle_ID: number;
    Make_Model_Year: string;
    Asking_Price: number;
    Mileage: number;
    Fuel_Type: string;
    Color: string;
    Plate_Number?: string;
    Seller_First_Name: string;
    Seller_Last_Name: string;
    Slot_ID: number | null;
  };
  imageUrl?: string | null;
  onClick?: () => void;
}

export function ListingCard({ car, imageUrl, onClick }: ListingCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-100 overflow-hidden group cursor-pointer"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={car.Make_Model_Year}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-300 text-xs">
            Vehicle Photo
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="space-y-1">
            <h3 className="text-white text-lg font-bold truncate drop-shadow-md">
              {car.Make_Model_Year}
            </h3>
            {car.Plate_Number && (
              <p className="text-[11px] text-slate-200 tracking-widest font-medium drop-shadow-md">
                Plate: {car.Plate_Number}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
           <span className="text-2xl font-bold text-slate-900">
            ₱{car.Asking_Price.toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-500">
          <div className="flex items-center space-x-1.5">
            <Gauge className="w-4 h-4 text-slate-400" />
            <span>{car.Mileage.toLocaleString()} km</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Fuel className="w-4 h-4 text-slate-400" />
            <span>{car.Fuel_Type}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Slot {car.Slot_ID ?? 'N/A'}</span>
          </div>
           <div className="flex items-center space-x-1.5">
            <User className="w-4 h-4 text-slate-400" />
            <span>{car.Seller_First_Name} {car.Seller_Last_Name}</span>
          </div>
        </div>

        <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-2">
          <span>View Photos of this Car</span>
            <BadgeCheck className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
