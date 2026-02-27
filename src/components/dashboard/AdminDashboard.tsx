
import React, { useEffect, useState } from 'react';
import { getAdminDashboard, getAdminReports, getPendingVehicles, approveVehicle, getAdminAccounts, createStaffAccount, updateAccountStatus, completeSale, recordWalkIn, getUserVehicles, getSellerOffers, getVehicleImages, resolveBackendUploadUrl, uploadVehicleImages, updateVehicleDetails, getSlotDetails } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion } from 'motion/react';
import { Check, X, AlertTriangle, DollarSign, User, Calendar, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';

const COLORS = ['#10B981', '#EF4444', '#E5E7EB']; // Green, Red, Grey

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'inquiries' | 'lot' | 'approvals' | 'transactions' | 'accounts'>('inquiries');
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [reportsData, setReportsData] = useState<any | null>(null);
  const [pendingVehicles, setPendingVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const isOwner = user?.role === 'Admin';

  const refreshDashboard = async () => {
    try {
      const dashboardRes = await getAdminDashboard();
      if (dashboardRes?.success) {
        setDashboardData(dashboardRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [dashboardRes, reportsRes, pendingRes] = await Promise.all([
          getAdminDashboard(),
          getAdminReports(),
          getPendingVehicles(),
        ]);

        if (dashboardRes?.success) {
          setDashboardData(dashboardRes.data);
        }
        if (reportsRes?.success) {
          setReportsData(reportsRes.data);
        }
        if (pendingRes?.success && pendingRes.data?.pending_vehicles) {
          setPendingVehicles(pendingRes.data.pending_vehicles);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load admin data'
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900">Admin Command Center</h1>
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200 overflow-x-auto">
          <button 
             onClick={() => setActiveTab('inquiries')}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'inquiries' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Inquiry Desk
          </button>
          <button 
             onClick={() => setActiveTab('analytics')}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'analytics' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Analytics
          </button>
           <button 
             onClick={() => setActiveTab('lot')}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'lot' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Lot Manager
          </button>
            <button 
               onClick={() => setActiveTab('transactions')}
               className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'transactions' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Transactions
            </button>
           <button 
             onClick={() => setActiveTab('approvals')}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'approvals' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Approvals
          </button>
          {isOwner && (
            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'accounts' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Accounts
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 min-h-[600px]">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 mb-4">
            {error}
          </div>
        )}

        {loading && !error && (
          <div className="text-center py-10 text-slate-500 text-sm">
            Loading admin data...
          </div>
        )}

        {!loading && !error && (
          <>
            {activeTab === 'inquiries' && (
              <InquiryDeskView dashboardData={dashboardData} />
            )}
            {activeTab === 'analytics' && (
              <AnalyticsView
                dashboardData={dashboardData}
                reportsData={reportsData}
              />
            )}
            {activeTab === 'lot' && <LotManagerView dashboardData={dashboardData} />}
            {activeTab === 'approvals' && (
              <ApprovalsView
                pendingVehicles={pendingVehicles}
                setPendingVehicles={setPendingVehicles}
              />
            )}
            {activeTab === 'transactions' && (
              <TransactionsView onSaleCompleted={refreshDashboard} />
            )}
            {activeTab === 'accounts' && isOwner && <AccountsView />}
          </>
        )}
      </div>
    </div>
  );
}

function InquiryDeskView({ dashboardData }: { dashboardData: any }) {
  const pendingOffers = dashboardData?.pending?.offers ?? 0;
  const pendingPayments = dashboardData?.pending?.payments ?? 0;
  const recentSales = dashboardData?.recent_sales ?? [];
  const pendingOfferBreakdown = dashboardData?.pending_offer_breakdown ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Offers Column */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
             <DollarSign className="w-5 h-5 text-orange-500" />
             New Offers
             <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">{pendingOffers}</span>
           </h3>
        </div>
        
        <div className="space-y-3 text-sm text-slate-600">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-slate-900">Pending Seller Decisions</p>
                <p className="text-slate-500 text-xs">Blind offers waiting for seller response</p>
              </div>
              <span className="text-2xl font-bold text-orange-600">{pendingOffers}</span>
            </div>

            {pendingOfferBreakdown.length > 0 ? (
              <div className="mt-3 border-t border-slate-100 pt-3 space-y-2 max-h-64 overflow-y-auto">
                {pendingOfferBreakdown.map((row: any) => (
                  <div
                    key={`${row.Seller_ID}-${row.Vehicle_ID}`}
                    className="flex items-start justify-between text-xs bg-orange-50/40 rounded-lg px-3 py-2"
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-900">
                        {row.Make_Model_Year}
                        {row.Plate_Number && (
                          <span className="ml-1 text-[10px] uppercase tracking-widest text-slate-500">• {row.Plate_Number}</span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Seller: {row.Seller_First_Name} {row.Seller_Last_Name}
                        {row.Seller_Phone && <span className="ml-1 text-slate-400">({row.Seller_Phone})</span>}
                      </p>
                    </div>
                    <span className="ml-2 text-xs font-bold text-orange-600 whitespace-nowrap">
                      {row.Pending_Offers} offer{row.Pending_Offers > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[11px] text-slate-400">No specific seller vehicles flagged yet.</p>
            )}
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">Overdue Payments</p>
              <p className="text-slate-500 text-xs">Slot rentals flagged for follow-up</p>
            </div>
            <span className="text-2xl font-bold text-red-500">{pendingPayments}</span>
          </div>
        </div>
      </div>

      {/* Viewing Requests Column */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
             <Calendar className="w-5 h-5 text-blue-500" />
             Viewing Requests
             <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{recentSales.length}</span>
           </h3>
        </div>

        <div className="space-y-3">
          {recentSales.map((sale: any) => (
            <div
              key={sale.Transaction_ID}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Txn: {sale.Transaction_ID}
                  </span>
                  <h4 className="font-bold text-slate-900">
                    ₱{Number(sale.Final_Sale_Price).toLocaleString()}
                  </h4>
                </div>
                <span className="text-[10px] px-2 py-1 rounded font-bold uppercase bg-emerald-50 text-emerald-600">
                  Completed
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-1">
                <span className="font-medium text-slate-900">
                  {sale.Make_Model_Year}
                </span>
                {sale.Plate_Number && (
                  <span className="ml-1 text-xs text-slate-500">• Plate: {sale.Plate_Number}</span>
                )}
              </p>
              <p className="text-xs text-slate-500 mb-2">
                Seller: {sale.Seller_First_Name} {sale.Seller_Last_Name}
                {sale.Buyer_First_Name && sale.Buyer_Last_Name && (
                  <span className="ml-2">Buyer: {sale.Buyer_First_Name} {sale.Buyer_Last_Name}</span>
                )}
              </p>
              <div className="flex justify-between items-center pt-3 border-top border-slate-50 text-xs text-slate-500">
                <span>{sale.Transaction_Date}</span>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>Recorded in D4_Transaction_Records</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalyticsView({
  dashboardData,
  reportsData,
}: {
  dashboardData: any;
  reportsData: any;
}) {
  const vehicleBreakdown = dashboardData?.vehicle_breakdown ?? [];
  const capacityData = vehicleBreakdown.map((row: any) => ({
    name: row.Vehicle_Status,
    value: row.count,
  }));

  const monthlyRevenue = reportsData?.monthly_revenue ?? [];
  const revenueData = monthlyRevenue
    .map((row: any) => ({
      name: row.month,
      revenue: Number(row.revenue),
      sales: Number(row.transactions),
    }))
    .reverse();

  const topSellers = reportsData?.top_sellers ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Capacity Chart */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-slate-100"
      >
        <h3 className="text-lg font-bold text-slate-900 mb-6">Showroom Capacity</h3>
        <div className="h-64 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={capacityData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {capacityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="text-center mt-[-40px]">
               <span className="block text-3xl font-bold text-slate-900">
                 {dashboardData?.stats?.slots_occupied ?? 0}/
                 {(dashboardData?.stats?.slots_occupied ?? 0) +
                   (dashboardData?.stats?.slots_available ?? 0)}
               </span>
               <span className="text-xs text-slate-500 uppercase font-medium">Occupied</span>
             </div>
          </div>
        </div>
      </motion.div>

      {/* Revenue Chart */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-slate-100"
      >
        <h3 className="text-lg font-bold text-slate-900 mb-6">Revenue vs Sales Volume</h3>
        <div className="h-64">
           <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={revenueData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₱${value}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#cbd5e1' }}
              />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Average Days on Lot */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-slate-100"
      >
        <h3 className="text-lg font-bold text-slate-900 mb-6">Avg Days on Lot (By Brand)</h3>
        <div className="h-64">
           <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { name: 'Toyota', days: 12 },
                { name: 'Honda', days: 15 },
                { name: 'Ford', days: 25 },
                { name: 'Nissan', days: 18 },
                { name: 'Suzuki', days: 8 },
              ]}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Bar dataKey="days" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Most Active Traders */}
       <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-slate-100"
      >
        <h3 className="text-lg font-bold text-slate-900 mb-6">Top Traders</h3>
        <div className="space-y-4">
           {topSellers.map((trader: any, i: number) => (
             <div key={trader.User_ID ?? i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                     {(trader.First_Name || '?').charAt(0)}
                   </div>
                   <div>
                      <p className="font-bold text-slate-900 text-sm">
                        {trader.First_Name} {trader.Last_Name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {trader.vehicles_sold} Completed Deals
                      </p>
                   </div>
                </div>
                <span className="font-bold text-emerald-600 text-sm">
                  ₱{Number(trader.total_sales).toLocaleString()}
                </span>
             </div>
           ))}
        </div>
      </motion.div>
    </div>
  );
}

function LotManagerView({ dashboardData }: { dashboardData: any }) {
  const slotsOccupied = dashboardData?.stats?.slots_occupied ?? 0;
  const slotsAvailable = dashboardData?.stats?.slots_available ?? 0;
  const totalSlots = slotsOccupied + slotsAvailable;
  const overduePayments = dashboardData?.pending?.payments ?? 0;
  const recentSales = dashboardData?.recent_sales ?? [];

  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [slotDetails, setSlotDetails] = useState<any | null>(null);
  const [slotImages, setSlotImages] = useState<any[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [slotImageIndex, setSlotImageIndex] = useState(0);
  const [showSoldModal, setShowSoldModal] = useState(false);

  const effectiveTotalSlots = totalSlots || 60;
  const overdueSlots = Math.min(overduePayments, effectiveTotalSlots);
  const occupiedSlots = Math.min(slotsOccupied, effectiveTotalSlots);

  const rentalHealthPercentage =
    totalSlots > 0 ? (slotsOccupied / Math.max(totalSlots, 1)) * 100 : 0;

  const rentalHealthWidthClass =
    rentalHealthPercentage >= 90
      ? 'w-full'
      : rentalHealthPercentage >= 75
      ? 'w-3/4'
      : rentalHealthPercentage >= 50
      ? 'w-1/2'
      : rentalHealthPercentage > 0
      ? 'w-1/4'
      : 'w-0';

  const getSlotStatus = (slotNumber: number) => {
    if (slotNumber <= overdueSlots) return 'overdue' as const;
    if (slotNumber <= occupiedSlots) return 'paid' as const;
    return 'empty' as const;
  };

  const handleSelectSlot = async (slotNumber: number) => {
    setSelectedSlot(slotNumber);
    setSlotDetails(null);
    setSlotImages([]);
    setSlotError(null);
    setShowVehicleModal(false);
    setSlotImageIndex(0);

    try {
      setSlotLoading(true);
      const res = await getSlotDetails(slotNumber);
      if (res?.success) {
        setSlotDetails(res.data);

        if (res.data?.vehicle?.Vehicle_ID) {
          try {
            const imagesRes = await getVehicleImages(res.data.vehicle.Vehicle_ID);
            if (imagesRes?.success && imagesRes.data?.images) {
              setSlotImages(imagesRes.data.images);
            }
          } catch (imgErr) {
            console.error(imgErr);
          }
        }
      } else if (res?.error) {
        setSlotError(res.error);
      }
    } catch (err) {
      setSlotError(
        err instanceof Error ? err.message : 'Failed to load slot details'
      );
    } finally {
      setSlotLoading(false);
    }
  };

  return (
     <div className="flex flex-col lg:flex-row gap-8">
       <div className="flex-1 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Lot Utilization</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Slots</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{totalSlots}</p>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
              <p className="text-xs font-semibold text-emerald-700 uppercase">Occupied</p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{slotsOccupied}</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 uppercase">Available</p>
              <p className="mt-2 text-2xl font-bold text-blue-700">{slotsAvailable}</p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
              Rental Health
            </p>
            <div className="flex items-center gap-3">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-emerald-500 rounded-full ${rentalHealthWidthClass}`}
                />
              </div>
              <span className="text-xs text-slate-500 whitespace-nowrap">
                {slotsOccupied}/{totalSlots} occupied
              </span>
            </div>
            {recentSales.length > 0 && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSoldModal(true)}
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-800 underline-offset-2 hover:underline"
                >
                  View recently sold units
                </button>
              </div>
            )}
          </div>
         </div>

         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
           <div className="flex items-center justify-between mb-4">
             <div>
               <h3 className="text-lg font-bold text-slate-900">Showroom Grid Layout</h3>
               <p className="text-xs text-slate-500 mt-1">
                 Visual snapshot of slot usage across the lot.
               </p>
             </div>
             <div className="flex items-center gap-3 text-[11px] text-slate-600">
               <div className="flex items-center gap-1">
                 <span className="inline-block h-3 w-3 rounded-sm bg-emerald-500" />
                 <span>Rent Paid</span>
               </div>
               <div className="flex items-center gap-1">
                 <span className="inline-block h-3 w-3 rounded-sm bg-red-500" />
                 <span>Overdue</span>
               </div>
               <div className="flex items-center gap-1">
                 <span className="inline-block h-3 w-3 rounded-sm bg-slate-200" />
                 <span>Empty</span>
               </div>
             </div>
           </div>

           <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 md:gap-3">
             {Array.from({ length: effectiveTotalSlots }, (_, index) => {
               const slotNumber = index + 1;
               const status = getSlotStatus(slotNumber);

               let bg = 'bg-slate-200 text-slate-700 border-slate-200';
               if (status === 'paid') bg = 'bg-emerald-500 text-white border-emerald-500';
               if (status === 'overdue') bg = 'bg-red-500 text-white border-red-500';

               return (
                 <button
                   key={slotNumber}
                   type="button"
                   onClick={() => handleSelectSlot(slotNumber)}
                   className={`flex items-center justify-center rounded-md border text-xs font-semibold h-9 sm:h-10 md:h-11 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                     bg
                   } ${
                     selectedSlot === slotNumber ? 'ring-2 ring-offset-1 ring-blue-500' : ''
                   }`}
                 >
                   {slotNumber}
                 </button>
               );
             })}
           </div>
         </div>
       </div>

       <div className="w-full lg:w-80 bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
         <div>
           <h3 className="text-lg font-bold text-slate-900 mb-2">Slot Details</h3>
           {selectedSlot ? (
             <div className="mb-4 space-y-2 text-sm text-slate-700">
               <p className="text-xs font-semibold text-slate-500 uppercase">Selected Slot</p>
               <p className="text-2xl font-bold text-slate-900">#{selectedSlot.toString().padStart(2, '0')}</p>
               <div className="flex items-center gap-2 text-xs">
                 <span className="font-semibold text-slate-500">Status:</span>
                 {(() => {
                   const status = getSlotStatus(selectedSlot);
                   if (status === 'paid') {
                     return (
                       <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                         Rent Paid
                       </span>
                     );
                   }
                   if (status === 'overdue') {
                     return (
                       <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                         Overdue
                       </span>
                     );
                   }
                   return (
                     <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                       Empty
                     </span>
                   );
                 })()}
               </div>
               <p className="text-xs text-slate-500 pt-1">
                Use this view to quickly locate which physical slot corresponds to active rentals and overdue accounts.
               </p>
              {slotLoading && (
                <p className="text-xs text-slate-500 pt-1">Loading assigned vehicle...</p>
              )}
              {slotError && (
                <p className="text-xs text-red-600 pt-1">{slotError}</p>
              )}
              {slotDetails && slotDetails.vehicle && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div className="flex items-start gap-3">
                    {slotImages.length > 0 ? (
                      <div className="h-16 w-24 rounded-md overflow-hidden bg-slate-900/5 border border-slate-200">
                        <img
                          src={resolveBackendUploadUrl(slotImages[0].url)}
                          alt={slotDetails.vehicle.Make_Model_Year}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-24 rounded-md bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                        No photo
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-semibold text-slate-900">
                        {slotDetails.vehicle.Make_Model_Year}
                      </p>
                      {slotDetails.vehicle.Plate_Number && (
                        <p className="text-[11px] text-slate-500">
                          Plate: {slotDetails.vehicle.Plate_Number}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500">
                        Status: {slotDetails.vehicle.Vehicle_Status}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-semibold">
                        ₱{Number(slotDetails.vehicle.Asking_Price).toLocaleString()}
                      </p>
                      {slotDetails.seller && (
                        <p className="text-[11px] text-slate-500">
                          Seller: {slotDetails.seller.First_Name} {slotDetails.seller.Last_Name}
                          {slotDetails.seller.Phone_Number && (
                            <span className="ml-1">({slotDetails.seller.Phone_Number})</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowVehicleModal(true)}
                    className="mt-2 inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    View car details
                  </button>
                </div>
              )}
             </div>
           ) : (
             <p className="text-sm text-slate-600 mb-4">
               Select a slot in the grid to view status details here.
             </p>
           )}

           <div className="space-y-3">
             <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
               <AlertTriangle className="w-5 h-5 text-red-500" />
               <div>
                 <p className="text-sm font-semibold text-red-700">
                   {overduePayments} overdue payments
                 </p>
                 <p className="text-xs text-red-600">
                   Coordinate with billing to follow up sellers.
                 </p>
               </div>
             </div>
             <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
               <AlertTriangle className="w-5 h-5 text-amber-500" />
               <div>
                 <p className="text-sm font-semibold text-amber-700">
                   Capacity threshold watch
                 </p>
                 <p className="text-xs text-amber-600">
                   Aim to keep at least 10% of slots available.
                 </p>
               </div>
             </div>
           </div>
         </div>
         </div>

        {showVehicleModal && slotDetails && slotDetails.vehicle && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Slot #{selectedSlot?.toString().padStart(2, '0')} • Vehicle #{slotDetails.vehicle.Vehicle_ID}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {slotDetails.vehicle.Make_Model_Year}
                    {slotDetails.vehicle.Plate_Number && (
                      <span className="ml-2 text-xs text-slate-500">• Plate: {slotDetails.vehicle.Plate_Number}</span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 min-h-[220px] flex items-center justify-center">
                    {slotImages.length > 0 ? (
                      <img
                        src={resolveBackendUploadUrl(slotImages[slotImageIndex]?.url)}
                        alt={slotDetails.vehicle.Make_Model_Year}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-xs text-slate-300 px-4 text-center">
                        No vehicle photos uploaded yet for this vehicle.
                      </div>
                    )}
                  </div>

                  {slotImages.length > 1 && (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex gap-2 overflow-x-auto pr-1">
                        {slotImages.slice(0, 6).map((img, index) => (
                          <button
                            key={img.url + index}
                            type="button"
                            onClick={() => setSlotImageIndex(index)}
                            className={`h-14 w-20 rounded-md overflow-hidden border transition-colors ${
                              index === slotImageIndex
                                ? 'border-white ring-2 ring-blue-500'
                                : 'border-slate-200 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={resolveBackendUploadUrl(img.url)}
                              alt={`Thumbnail ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-500 whitespace-nowrap">
                        Photo {slotImageIndex + 1} of {slotImages.length}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 text-sm text-slate-700">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <p className="text-xs uppercase text-slate-400">Status</p>
                      <p className="font-medium">{slotDetails.vehicle.Vehicle_Status}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400">Slot</p>
                      <p className="font-medium">#{selectedSlot?.toString().padStart(2, '0')}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400">Asking Price</p>
                      <p className="font-semibold text-emerald-700">
                        ₱{Number(slotDetails.vehicle.Asking_Price).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400">Mileage</p>
                      <p className="font-medium">
                        {slotDetails.vehicle.Mileage != null && slotDetails.vehicle.Mileage !== ''
                          ? `${slotDetails.vehicle.Mileage.toLocaleString?.() || slotDetails.vehicle.Mileage} km`
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400">Fuel Type</p>
                      <p className="font-medium">{slotDetails.vehicle.Fuel_Type || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400">Color</p>
                      <p className="font-medium">{slotDetails.vehicle.Color || '—'}</p>
                    </div>
                  </div>

                  {slotDetails.seller && (
                    <div>
                      <p className="text-xs uppercase text-slate-400">Seller Contact</p>
                      <p className="text-sm">
                        {slotDetails.seller.First_Name} {slotDetails.seller.Last_Name}
                        {slotDetails.seller.Phone_Number && (
                          <span className="block text-[11px] text-slate-500">{slotDetails.seller.Phone_Number}</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-3">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showSoldModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-900">Recently Sold Units</h2>
                <button
                  type="button"
                  onClick={() => setShowSoldModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-4">
                {recentSales.length === 0 ? (
                  <p className="text-xs text-slate-500">No completed sales recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs text-left text-slate-700">
                      <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Txn #</th>
                          <th className="px-3 py-2 font-semibold">Date</th>
                          <th className="px-3 py-2 font-semibold">Slot #</th>
                          <th className="px-3 py-2 font-semibold">Vehicle</th>
                          <th className="px-3 py-2 font-semibold">Seller</th>
                          <th className="px-3 py-2 font-semibold">Buyer</th>
                          <th className="px-3 py-2 font-semibold text-right">Final Price (₱)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSales.map((sale: any) => (
                          <tr key={sale.Transaction_ID} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="px-3 py-2 align-top">{sale.Transaction_ID}</td>
                            <td className="px-3 py-2 align-top whitespace-nowrap">{sale.Transaction_Date}</td>
                            <td className="px-3 py-2 align-top">
                              {sale.Slot_ID ? `#${String(sale.Slot_ID).padStart(2, '0')}` : '—'}
                            </td>
                            <td className="px-3 py-2 align-top">
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-900">{sale.Make_Model_Year}</span>
                                {sale.Plate_Number && (
                                  <span className="text-[11px] text-slate-500">Plate: {sale.Plate_Number}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 align-top">
                              {sale.Seller_First_Name} {sale.Seller_Last_Name}
                            </td>
                            <td className="px-3 py-2 align-top">
                              {sale.Buyer_First_Name && sale.Buyer_Last_Name
                                ? `${sale.Buyer_First_Name} ${sale.Buyer_Last_Name}`
                                : 'N/A'}
                            </td>
                            <td className="px-3 py-2 align-top text-right">
                              {Number(sale.Final_Sale_Price).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

function TransactionsView({ onSaleCompleted }: { onSaleCompleted?: () => void }) {
  const { user } = useAuth();

  const [vehicleId, setVehicleId] = useState('');
  const [buyerId, setBuyerId] = useState('');
  const [inquiryId, setInquiryId] = useState('');
  const [finalSalePrice, setFinalSalePrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');

  const [buyerSource, setBuyerSource] = useState<'online' | 'walkin'>('online');
  const [walkInBuyerName, setWalkInBuyerName] = useState('');

  const [logWalkIn, setLogWalkIn] = useState(false);
  const [visitorId, setVisitorId] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller' | 'both'>('buyer');
  const [hasTradeIn, setHasTradeIn] = useState(false);
  const [tradeInDetails, setTradeInDetails] = useState('');
  const [when, setWhen] = useState<'now' | 'custom'>('now');
  const [customDateTime, setCustomDateTime] = useState('');

  const [tradeMakeModel, setTradeMakeModel] = useState('');
  const [tradeColor, setTradeColor] = useState('');
  const [tradeMileage, setTradeMileage] = useState('');
  const [tradeFuelType, setTradeFuelType] = useState('');
  const [tradeTransmission, setTradeTransmission] = useState('');
  const [tradeDescription, setTradeDescription] = useState('');
  const [tradeImages, setTradeImages] = useState<File[]>([]);

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehiclesError, setVehiclesError] = useState<string | null>(null);

  const [vehiclePhotoUrl, setVehiclePhotoUrl] = useState<string | null>(null);
  const [vehiclePhotoLoading, setVehiclePhotoLoading] = useState(false);

  const [buyerOptions, setBuyerOptions] = useState<any[]>([]);
  const [buyersLoading, setBuyersLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [walkInSuccess, setWalkInSuccess] = useState<string | null>(null);
  const [walkInWarning, setWalkInWarning] = useState<string | null>(null);
  const [showCashReceipt, setShowCashReceipt] = useState(false);

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setVehiclesLoading(true);
        setVehiclesError(null);
        const res = await getUserVehicles({ limit: 200 });
        if (res?.success && res.data?.vehicles) {
          const filtered = res.data.vehicles.filter(
            (v: any) => v.Vehicle_Status === 'Available' || v.Vehicle_Status === 'On_Hold'
          );
          setVehicles(filtered);
        } else {
          setVehiclesError(res?.error || 'Failed to load vehicles');
        }
      } catch (err) {
        setVehiclesError(
          err instanceof Error ? err.message : 'Failed to load vehicles'
        );
      } finally {
        setVehiclesLoading(false);
      }
    };

    loadVehicles();
  }, []);

  useEffect(() => {
    if (!vehicleId) {
      setVehiclePhotoUrl(null);
      return;
    }

    const numericId = Number(vehicleId);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      setVehiclePhotoUrl(null);
      return;
    }

    let cancelled = false;

    const loadImages = async () => {
      try {
        setVehiclePhotoLoading(true);
        const res = await getVehicleImages(numericId);
        if (!cancelled && res?.success && res.data?.images?.length) {
          const first = res.data.images[0];
          setVehiclePhotoUrl(resolveBackendUploadUrl(first.url));
        } else if (!cancelled) {
          setVehiclePhotoUrl(null);
        }
      } catch {
        if (!cancelled) {
          setVehiclePhotoUrl(null);
        }
      } finally {
        if (!cancelled) {
          setVehiclePhotoLoading(false);
        }
      }
    };

    loadImages();

    return () => {
      cancelled = true;
    };
  }, [vehicleId]);

  useEffect(() => {
    if (!vehicleId) {
      setBuyerOptions([]);
      setBuyerId('');
      setInquiryId('');
      return;
    }

    const vehicle = vehicles.find((v: any) => String(v.Vehicle_ID) === vehicleId);
    if (!vehicle || !vehicle.Owner_ID) {
      setBuyerOptions([]);
      setBuyerId('');
      setInquiryId('');
      return;
    }

    let cancelled = false;

    const loadBuyers = async () => {
      try {
        setBuyersLoading(true);
        const res = await getSellerOffers(Number(vehicle.Owner_ID));
        if (!cancelled && res?.success && Array.isArray(res.data?.all_offers)) {
          const relevant = res.data.all_offers.filter(
            (offer: any) =>
              Number(offer.Target_Vehicle_ID) === Number(vehicle.Vehicle_ID) &&
              !['Rejected', 'Expired', 'Sale_Completed', 'Lost_To_Other_Buyer'].includes(
                String(offer.Inquiry_Status)
              )
          );
          setBuyerOptions(relevant);
        } else if (!cancelled) {
          setBuyerOptions([]);
        }
      } catch {
        if (!cancelled) {
          setBuyerOptions([]);
        }
      } finally {
        if (!cancelled) {
          setBuyersLoading(false);
        }
      }
    };

    loadBuyers();

    return () => {
      cancelled = true;
    };
  }, [vehicleId, vehicles]);

  const selectedVehicle = vehicles.find((v: any) => String(v.Vehicle_ID) === vehicleId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setWalkInSuccess(null);
    setWalkInWarning(null);
     setShowCashReceipt(false);

    if (!user?.user_id) {
      setError('You must be logged in as staff to use this screen.');
      return;
    }

    if (!vehicleId) {
      setError('Vehicle is required.');
      return;
    }

    const vehicle_id = Number(vehicleId);
    if (!Number.isFinite(vehicle_id) || vehicle_id <= 0) {
      setError('Vehicle ID must be a positive number.');
      return;
    }

    if (!finalSalePrice) {
      setError('Final Sale Price is required for a sale.');
      return;
    }

    if (!selectedVehicle || !selectedVehicle.Owner_ID) {
      setError('Selected vehicle is missing seller/owner information.');
      return;
    }

    if (buyerSource === 'walkin' && !walkInBuyerName.trim()) {
      setError('Buyer name is required for a walk-in buyer.');
      return;
    }

    const seller_id = Number(selectedVehicle.Owner_ID);
    const buyer_id = buyerId ? Number(buyerId) : undefined;
    const inquiry_id = inquiryId ? Number(inquiryId) : undefined;
    const final_sale_price = Number(finalSalePrice);

    if (!Number.isFinite(seller_id) || seller_id <= 0) {
      setError('Seller ID must be a positive number.');
      return;
    }
    if (!Number.isFinite(final_sale_price) || final_sale_price <= 0) {
      setError('Final sale price must be a positive number.');
      return;
    }

    let visitor_user_id: number | undefined;
    if (logWalkIn) {
      visitor_user_id = visitorId ? Number(visitorId) : undefined;
      if (visitor_user_id && (!Number.isFinite(visitor_user_id) || visitor_user_id <= 0)) {
        setError('Visitor User ID must be a positive number.');
        return;
      }

      if (hasTradeIn) {
        if (!tradeMakeModel.trim()) {
          setError('For a trade-in, unit details (Make/Model/Year) are required.');
          return;
        }
        if (!tradeImages.length) {
          setError('For a trade-in, please upload at least one photo of the traded unit.');
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      setError(null);
      setResult(null);

      const payload: any = {
        vehicle_id,
        seller_id,
        facilitated_by: user.user_id,
        final_sale_price,
        payment_method: paymentMethod || 'Cash',
      };

      if (buyerSource === 'online') {
        if (buyer_id) payload.buyer_id = buyer_id;
        if (inquiry_id) payload.inquiry_id = inquiry_id;
      }

      let finalNotes = notes.trim();
      if (buyerSource === 'walkin' && walkInBuyerName.trim()) {
        const tag = `Walk-in buyer: ${walkInBuyerName.trim()}`;
        finalNotes = finalNotes ? `${finalNotes} | ${tag}` : tag;
      }

      if (finalNotes) payload.notes = finalNotes;

      const res = await completeSale(payload);
      if (res?.success) {
        setResult(res.data);

        if (onSaleCompleted) {
          onSaleCompleted();
        }

        const methodFromResult =
          res.data?.certificate?.Payment_Method || res.data?.payment_method || paymentMethod || 'Cash';
        if (methodFromResult === 'Cash') {
          setShowCashReceipt(true);
        }

        if (logWalkIn) {
          const walkPayload: any = {
            staff_id: user.user_id,
            vehicle_id,
            role,
            has_trade_in: hasTradeIn,
          };

          if (buyer_id) {
            walkPayload.visitor_user_id = buyer_id;
          } else if (visitor_user_id) {
            walkPayload.visitor_user_id = visitor_user_id;
          }

          if (hasTradeIn) {
            // Include a summary string plus any free-text notes
            const summaryParts: string[] = [];
            if (tradeMakeModel) summaryParts.push(`Unit: ${tradeMakeModel}`);
            if (tradeColor) summaryParts.push(`Color: ${tradeColor}`);
            if (tradeMileage) summaryParts.push(`Mileage: ${tradeMileage} km`);
            if (tradeFuelType) summaryParts.push(`Fuel: ${tradeFuelType}`);
            if (tradeTransmission) summaryParts.push(`Transmission: ${tradeTransmission}`);

            const summary = summaryParts.join(' • ');
            const extra = tradeInDetails.trim();
            walkPayload.trade_in_details = [summary, extra]
              .filter(Boolean)
              .join(' | ');
          } else if (tradeInDetails.trim()) {
            walkPayload.trade_in_details = tradeInDetails.trim();
          }

          if (when === 'custom' && customDateTime) {
            walkPayload.schedule_datetime = customDateTime;
          }

          try {
            const walkRes = await recordWalkIn(walkPayload);
            if (walkRes?.success) {
              setWalkInSuccess(
                'Walk-in recorded (Appointment #' + walkRes.data.appointment_id + ').'
              );
              setVisitorId('');
              setWhen('now');
              setCustomDateTime('');
            } else {
              setWalkInWarning(walkRes?.error || 'Sale recorded, but walk-in log failed.');
            }
          } catch (err) {
            setWalkInWarning(
              err instanceof Error
                ? 'Sale recorded, but walk-in log failed: ' + err.message
                : 'Sale recorded, but walk-in log failed.'
            );
          }

          // After logging the walk-in, update vehicle details/photos to the traded unit
          if (hasTradeIn && tradeMakeModel) {
            try {
              await updateVehicleDetails({
                vehicle_id,
                make_model_year: tradeMakeModel,
                mileage: tradeMileage ? Number(tradeMileage) : undefined,
                fuel_type: tradeFuelType || undefined,
                transmission: tradeTransmission || undefined,
                color: tradeColor || undefined,
                description: tradeDescription || undefined,
              });

              if (tradeImages.length) {
                await uploadVehicleImages(vehicle_id, tradeImages);
              }
            } catch (err) {
              setWalkInWarning(prev =>
                (prev ? prev + ' ' : '') +
                (err instanceof Error
                  ? 'Trade-in details/photos update failed: ' + err.message
                  : 'Trade-in details/photos update failed.')
              );
            } finally {
              setTradeMakeModel('');
              setTradeColor('');
              setTradeMileage('');
              setTradeFuelType('');
              setTradeTransmission('');
              setTradeDescription('');
              setTradeImages([]);
              setHasTradeIn(false);
            }
          } else {
            // If no structured trade-in details, still reset toggle state
            setHasTradeIn(false);
          }
        }
      } else {
        setError(res?.error || 'Failed to complete sale');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to complete sale'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const certificate = result?.certificate;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Execute Sale & Print Certificate
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Core Process 16: finalize a transaction for a unit where both buyer
          and seller are now in the showroom, then generate a sale certificate
          you can print for hard-copy documents. Optionally also log it as a
          walk-in with trade-in details in the master calendar (Process 15).
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {error}
          </div>
        )}
        {walkInWarning && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            {walkInWarning}
          </div>
        )}
        {walkInSuccess && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            {walkInSuccess}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
        >
          <div className="md:col-span-2">
            <label className="mb-1 block font-medium text-slate-700">
              Select Vehicle
            </label>
            <select
              value={vehicleId}
              onChange={e => setVehicleId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="">Select unit for this sale</option>
              {vehicles.map((v: any) => (
                <option key={v.Vehicle_ID} value={String(v.Vehicle_ID)}>
                  #{v.Vehicle_ID} • {v.Make_Model_Year} {v.Color ? `(${v.Color})` : ''} • ₱
                  {Number(v.Asking_Price).toLocaleString()} • Seller: {v.Owner_First_Name}{' '}
                  {v.Owner_Last_Name}
                </option>
              ))}
            </select>
            {vehiclesLoading && (
              <p className="mt-1 text-xs text-slate-500">Loading vehicles...</p>
            )}
            {vehiclesError && (
              <p className="mt-1 text-xs text-red-600">{vehiclesError}</p>
            )}
            {selectedVehicle && (
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                {vehiclePhotoUrl ? (
                  <img
                    src={vehiclePhotoUrl}
                    alt={selectedVehicle.Make_Model_Year}
                    className="h-20 w-32 rounded-md object-cover border border-slate-200"
                  />
                ) : (
                  <div className="h-20 w-32 rounded-md border border-dashed border-slate-300 flex items-center justify-center text-[11px] text-slate-400 bg-white">
                    {vehiclePhotoLoading ? 'Loading photo...' : 'No photo available'}
                  </div>
                )}
                <div className="text-xs text-slate-700 space-y-1">
                  <p className="font-semibold text-slate-900">
                    {selectedVehicle.Make_Model_Year}
                  </p>
                  {selectedVehicle.Plate_Number && (
                    <p>
                      <span className="font-medium">Plate:</span> {selectedVehicle.Plate_Number}
                    </p>
                  )}
                  {selectedVehicle.Color && (
                    <p>
                      <span className="font-medium">Color:</span> {selectedVehicle.Color}
                    </p>
                  )}
                  {selectedVehicle.Fuel_Type && (
                    <p>
                      <span className="font-medium">Fuel:</span> {selectedVehicle.Fuel_Type}
                    </p>
                  )}
                  {selectedVehicle.Mileage && (
                    <p>
                      <span className="font-medium">Mileage:</span> {selectedVehicle.Mileage} km
                    </p>
                  )}
                  {selectedVehicle.Slot_ID && (
                    <p>
                      <span className="font-medium">Slot:</span> {selectedVehicle.Slot_ID}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block font-medium text-slate-700">Seller</label>
            <input
              type="text"
              value={
                selectedVehicle
                  ? `${selectedVehicle.Owner_First_Name} ${selectedVehicle.Owner_Last_Name} (User #${selectedVehicle.Owner_ID})`
                  : ''
              }
              placeholder="Auto-filled from selected vehicle"
              readOnly
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center gap-4">
            <span className="text-xs font-medium text-slate-700">Buyer Source</span>
            <label className="inline-flex items-center gap-2 text-xs text-slate-700">
              <input
                type="radio"
                name="buyer-source"
                value="online"
                checked={buyerSource === 'online'}
                onChange={() => setBuyerSource('online')}
              />
              <span>Online offer (from showroom)</span>
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-slate-700">
              <input
                type="radio"
                name="buyer-source"
                value="walkin"
                checked={buyerSource === 'walkin'}
                onChange={() => setBuyerSource('walkin')}
              />
              <span>Walk-in buyer (manual)</span>
            </label>
          </div>

          {buyerSource === 'online' ? (
            <>
              <div>
                <label className="mb-1 block font-medium text-slate-700">
                  Buyer (from online offers)
                </label>
                {buyerOptions.length > 0 ? (
                  <select
                    value={inquiryId}
                    onChange={e => {
                      const val = e.target.value;
                      setInquiryId(val);
                      const opt = buyerOptions.find(
                        (o: any) => String(o.Inquiry_ID) === val
                      );
                      if (opt) {
                        setBuyerId(String(opt.Buyer_ID));
                      } else {
                        setBuyerId('');
                      }
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select buyer linked to this unit</option>
                    {buyerOptions.map((offer: any) => (
                      <option
                        key={offer.Inquiry_ID}
                        value={String(offer.Inquiry_ID)}
                      >
                        {offer.First_Name} {offer.Last_Name} • ₱
                        {Number(offer.Offer_Amount).toLocaleString()} (Inquiry #
                        {offer.Inquiry_ID}, {offer.Inquiry_Status})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    {buyersLoading
                      ? 'Loading buyers who made offers on this unit...'
                      : 'No eligible online offers found for this vehicle. You may still complete the sale without linking a buyer.'}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">
                  Linked Inquiry (auto from buyer)
                </label>
                <input
                  type="text"
                  value={inquiryId ? `Inquiry #${inquiryId}` : ''}
                  placeholder="Will auto-fill when you choose a buyer"
                  readOnly
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                />
              </div>
            </>
          ) : (
            <div className="md:col-span-2">
              <label className="mb-1 block font-medium text-slate-700">
                Buyer (walk-in)
              </label>
              <input
                type="text"
                value={walkInBuyerName}
                onChange={e => setWalkInBuyerName(e.target.value)}
                placeholder="Full name of walk-in buyer"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                This buyer is not linked to an online inquiry. Their name will be noted on the internal record.
              </p>
            </div>
          )}
          <div>
            <label className="mb-1 block font-medium text-slate-700">
              Final Sale Price (₱)
            </label>
            <input
              type="number"
              value={finalSalePrice}
              onChange={e => setFinalSalePrice(e.target.value)}
              placeholder="e.g. 750000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block font-medium text-slate-700" htmlFor="txn-payment-method">
              Payment Method
            </label>
            <select
              id="txn-payment-method"
              aria-label="Select payment method for this sale"
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="Cash">Cash / Full Payment</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Manager's Check">Manager's Check</option>
              <option value="Financing">Financing</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block font-medium text-slate-700">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Any remarks to include on the internal record (e.g. promo applied, unit condition notes)."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2 pt-2 border-t border-dashed border-slate-200 mt-2">
            <label className="inline-flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={logWalkIn}
                onChange={e => setLogWalkIn(e.target.checked)}
              />
              <span>
                Also log this as showroom walk-in / trade-in in the master
                calendar (Process 15)
              </span>
            </label>
          </div>

          {logWalkIn && (
            <>
              <div>
                <label className="mb-1 block font-medium text-slate-700">Visitor User ID (optional)</label>
                <input
                  type="number"
                  value={visitorId}
                  onChange={e => setVisitorId(e.target.value)}
                  placeholder="Defaults to buyer when selected"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">Visitor Type</label>
                <select
                  id="walkin-role"
                  aria-label="Select visitor type for walk-in"
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="both">Buyer & Seller (swap)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">When</label>
                <div className="flex items-center gap-4 text-xs" aria-label="When did this walk-in occur?">
                  <label className="inline-flex items-center gap-1">
                    <input
                      aria-label="Log as happening now"
                      type="radio"
                      name="walkin-when"
                      value="now"
                      checked={when === 'now'}
                      onChange={() => setWhen('now')}
                    />
                    <span>Now (log as completed)</span>
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input
                      aria-label="Specify custom date and time for walk-in"
                      type="radio"
                      name="walkin-when"
                      value="custom"
                      checked={when === 'custom'}
                      onChange={() => setWhen('custom')}
                    />
                    <span>Custom date/time</span>
                  </label>
                </div>
                {when === 'custom' && (
                  <input
                    type="datetime-local"
                    aria-label="Custom date and time for walk-in"
                    value={customDateTime}
                    onChange={e => setCustomDateTime(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="mb-1 block font-medium text-slate-700">Trade-in</label>
                <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    aria-label="Visitor has a trade-in vehicle"
                    checked={hasTradeIn}
                    onChange={e => setHasTradeIn(e.target.checked)}
                  />
                  Visitor has a trade-in unit
                </label>
                {hasTradeIn && (
                  <div className="mt-2 space-y-3 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block font-medium text-slate-700 text-xs">
                          Trade-in Unit (Make / Model / Year)
                        </label>
                        <input
                          type="text"
                          value={tradeMakeModel}
                          onChange={e => setTradeMakeModel(e.target.value)}
                          placeholder="e.g. 2014 Toyota Vios 1.3E MT"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block font-medium text-slate-700 text-xs">Color</label>
                        <input
                          type="text"
                          value={tradeColor}
                          onChange={e => setTradeColor(e.target.value)}
                          placeholder="e.g. Silver"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block font-medium text-slate-700 text-xs">Mileage (km)</label>
                        <input
                          type="number"
                          min={0}
                          value={tradeMileage}
                          onChange={e => setTradeMileage(e.target.value)}
                          placeholder="e.g. 85000"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block font-medium text-slate-700 text-xs">Fuel Type</label>
                        <select
                          value={tradeFuelType}
                          onChange={e => setTradeFuelType(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Select fuel type</option>
                          <option value="Gasoline">Gasoline</option>
                          <option value="Diesel">Diesel</option>
                          <option value="Hybrid">Hybrid</option>
                          <option value="Electric">Electric</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block font-medium text-slate-700 text-xs">Transmission</label>
                        <select
                          value={tradeTransmission}
                          onChange={e => setTradeTransmission(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Select transmission</option>
                          <option value="Manual">Manual</option>
                          <option value="Automatic">Automatic</option>
                          <option value="CVT">CVT</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <label className="mb-1 block font-medium text-slate-700 text-xs">
                          Trade-in Description (for the updated post)
                        </label>
                        <textarea
                          value={tradeDescription}
                          onChange={e => setTradeDescription(e.target.value)}
                          rows={3}
                          placeholder="Key details you want to appear on the listing (condition, variants, extras)."
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block font-medium text-slate-700 text-xs">
                        Trade-in Photos (these will replace/update the listing images)
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={e => {
                          const files = Array.from(e.target.files || []);
                          setTradeImages(files as File[]);
                        }}
                        className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-slate-800"
                      />
                      {tradeImages.length > 0 && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          Selected: {tradeImages.map(f => f.name).join(', ')}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-slate-400">
                        Upload clear photos of the traded unit (front, side, interior). Max size per image follows the standard upload rules.
                      </p>
                    </div>

                    <div>
                      <label className="mb-1 block font-medium text-slate-700 text-xs">
                        Internal Notes (optional)
                      </label>
                      <textarea
                        value={tradeInDetails}
                        onChange={e => setTradeInDetails(e.target.value)}
                        rows={2}
                        placeholder="Any additional remarks for internal tracking (not required)."
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Recording sale...' : 'Complete Sale'}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Sale Certificate Preview
              </h3>
              <p className="text-xs text-slate-500">
                Transaction #{result.transaction_id} • Vehicle #{result.vehicle_id}
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Print Certificate
            </button>
          </div>

          {certificate ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
              <div className="space-y-2">
                <p className="font-semibold text-slate-900 text-sm">
                  Vehicle Details
                </p>
                <p>
                  <span className="font-medium">Unit:</span> {certificate.Make_Model_Year}
                </p>
                {certificate.Plate_Number && (
                  <p>
                    <span className="font-medium">Plate Number:</span> {certificate.Plate_Number}
                  </p>
                )}
                {certificate.Color && (
                  <p>
                    <span className="font-medium">Color:</span> {certificate.Color}
                  </p>
                )}
                {certificate.Mileage && (
                  <p>
                    <span className="font-medium">Mileage:</span> {certificate.Mileage} km
                  </p>
                )}
                {certificate.Fuel_Type && (
                  <p>
                    <span className="font-medium">Fuel:</span> {certificate.Fuel_Type}
                  </p>
                )}
                {certificate.Transmission && (
                  <p>
                    <span className="font-medium">Transmission:</span> {certificate.Transmission}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-slate-900 text-sm">
                  Parties
                </p>
                <p>
                  <span className="font-medium">Seller:</span>{' '}
                  {certificate.Seller_First_Name} {certificate.Seller_Last_Name}
                </p>
                <p>
                  <span className="font-medium">Buyer:</span>{' '}
                  {certificate.Buyer_First_Name && certificate.Buyer_Last_Name
                    ? `${certificate.Buyer_First_Name} ${certificate.Buyer_Last_Name}`
                    : 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Facilitated By:</span>{' '}
                  {certificate.Staff_First_Name} {certificate.Staff_Last_Name}
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <p className="font-semibold text-slate-900 text-sm">
                  Financials
                </p>
                <p>
                  <span className="font-medium">Final Sale Price:</span>{' '}
                  ₱{Number(result.final_sale_price).toLocaleString()}
                </p>
                <p>
                  <span className="font-medium">Payment Method:</span>{' '}
                  {certificate.Payment_Method || result.payment_method || 'Cash'}
                </p>
                <p>
                  <span className="font-medium">Transaction Date:</span>{' '}
                  {result.transaction_date}
                </p>
                {result.notes && (
                  <p>
                    <span className="font-medium">Notes:</span> {result.notes}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Sale recorded. Certificate details are not available.
            </p>
          )}
        </div>
      )}

      {showCashReceipt && certificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Cash Acknowledgement Receipt
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Transaction #{result.transaction_id} • Vehicle #{result.vehicle_id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCashReceipt(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 text-xs text-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Received From</p>
                  <p className="font-semibold text-sm">
                    {certificate.Buyer_First_Name && certificate.Buyer_Last_Name
                      ? `${certificate.Buyer_First_Name} ${certificate.Buyer_Last_Name}`
                      : '____________________________'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Date</p>
                  <p className="font-semibold text-sm">{result.transaction_date}</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                <p className="text-[11px] text-slate-600">
                  For full payment of the following motor vehicle unit:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <p>
                    <span className="font-medium">Make / Model / Year:</span>{' '}
                    {certificate.Make_Model_Year || '____________________________'}
                  </p>
                  <p>
                    <span className="font-medium">Plate No.:</span>{' '}
                    {certificate.Plate_Number || '________________'}
                  </p>
                  <p>
                    <span className="font-medium">Color:</span>{' '}
                    {certificate.Color || '________________'}
                  </p>
                  <p>
                    <span className="font-medium">Mileage:</span>{' '}
                    {certificate.Mileage ? `${certificate.Mileage} km` : '________________'}
                  </p>
                  <p>
                    <span className="font-medium">Chassis No.:</span>{' '}
                    {certificate.Chassis_Number || '________________'}
                  </p>
                  <p>
                    <span className="font-medium">Engine No.:</span>{' '}
                    {certificate.Engine_Number || '________________'}
                  </p>
                  <p>
                    <span className="font-medium">OR No.:</span>{' '}
                    {certificate.OR_Number || '________________'}
                  </p>
                  <p>
                    <span className="font-medium">CR No.:</span>{' '}
                    {certificate.CR_Number || '________________'}
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 space-y-1">
                <p>
                  <span className="font-medium">Amount Received:</span>{' '}
                  ₱{Number(result.final_sale_price).toLocaleString()}
                </p>
                <p>
                  <span className="font-medium">Payment Method:</span>{' '}
                  {certificate.Payment_Method || 'Cash / Full Payment'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="text-center">
                  <div className="h-10" />
                  <p className="mt-6 border-t border-slate-300 pt-1 text-[11px] uppercase tracking-wide">
                    Buyer Signature Over Printed Name
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-10" />
                  <p className="mt-6 border-t border-slate-300 pt-1 text-[11px] uppercase tracking-wide">
                    Seller Signature Over Printed Name
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-dashed border-slate-200 mt-2">
                <p className="text-[11px] text-slate-500">
                  Facilitated by {certificate.Staff_First_Name} {certificate.Staff_Last_Name}
                </p>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                >
                  Print Acknowledgement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ApprovalsView({
  pendingVehicles,
  setPendingVehicles,
}: {
  pendingVehicles: any[];
  setPendingVehicles: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [inspectionConfirmed, setInspectionConfirmed] = useState(false);

  const handleAction = async (vehicleId: number, action: 'approve' | 'reject') => {
    try {
      setProcessingId(vehicleId);
      setError(null);
      await approveVehicle({ vehicle_id: vehicleId, action });
      setPendingVehicles(prev =>
        prev.filter(vehicle => vehicle.Vehicle_ID !== vehicleId)
      );
      if (selectedVehicle && selectedVehicle.Vehicle_ID === vehicleId) {
        setSelectedVehicle(null);
        setSelectedImages([]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to process approval'
      );
    } finally {
      setProcessingId(null);
    }
  };
  const selectedDocUrl =
    selectedVehicle?.OR_CR_Image_URL
      ? resolveBackendUploadUrl(selectedVehicle.OR_CR_Image_URL)
      : null;

  React.useEffect(() => {
    if (!selectedVehicle) {
      setSelectedImages([]);
      setImagesError(null);
      setImagesLoading(false);
      setCurrentImageIndex(0);
      setInspectionConfirmed(false);
      return;
    }

    const loadImages = async () => {
      try {
        setImagesLoading(true);
        setImagesError(null);
        const res = await getVehicleImages(selectedVehicle.Vehicle_ID);
        if (res?.success && res.data?.images) {
          setSelectedImages(res.data.images);
          setCurrentImageIndex(0);
        } else {
          setSelectedImages([]);
          setImagesError(res?.error || 'Failed to load vehicle photos');
        }
      } catch (err) {
        setSelectedImages([]);
        setImagesError(
          err instanceof Error ? err.message : 'Failed to load vehicle photos'
        );
      } finally {
        setImagesLoading(false);
      }
    };

    loadImages();
    setInspectionConfirmed(false);
  }, [selectedVehicle?.Vehicle_ID]);

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         {error && (
           <div className="m-4 mb-0 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
             {error}
           </div>
         )}
         <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Vehicle ID</th>
              <th className="px-6 py-4">Vehicle Details</th>
              <th className="px-6 py-4">Submission Date</th>
              <th className="px-6 py-4">Owner</th>
              <th className="px-6 py-4 text-right">Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pendingVehicles.map(vehicle => (
              <tr
                key={vehicle.Vehicle_ID}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4 text-xs font-mono text-slate-400">
                  #{vehicle.Vehicle_ID}
                </td>
                <td className="px-6 py-4 font-medium text-slate-900">
                  {vehicle.Make_Model_Year}
                  {vehicle.Plate_Number && (
                    <span className="block text-xs text-slate-500">Plate: {vehicle.Plate_Number}</span>
                  )}
                </td>
                <td className="px-6 py-4">{vehicle.Created_At}</td>
                <td className="px-6 py-4">
                  {vehicle.First_Name} {vehicle.Last_Name}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => setSelectedVehicle(vehicle)}
                    className="text-slate-700 hover:text-slate-900 font-medium text-sm border border-slate-200 bg-white px-3 py-1 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  Vehicle #{selectedVehicle.Vehicle_ID}
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {selectedVehicle.Vehicle_Status || 'Pending Review'}
                  </span>
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {selectedVehicle.Make_Model_Year}
                  {selectedVehicle.Plate_Number && (
                    <span className="ml-2 text-xs text-slate-500">• Plate: {selectedVehicle.Plate_Number}</span>
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Submitted on {selectedVehicle.Created_At} by {selectedVehicle.First_Name} {selectedVehicle.Last_Name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVehicle(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 min-h-[220px] relative flex items-center justify-center">
                  {imagesLoading ? (
                    <div className="text-xs text-slate-300">Loading vehicle photos...</div>
                  ) : selectedImages.length > 0 ? (
                    <div className="w-full h-full relative flex items-center justify-center bg-black/80">
                      <img
                        src={resolveBackendUploadUrl(selectedImages[currentImageIndex]?.url)}
                        alt={`Vehicle photo ${currentImageIndex + 1}`}
                        className="h-full w-full object-cover"
                      />

                      {selectedImages.length > 1 && (
                        <div className="absolute top-3 left-4 bg-black/60 rounded-xl px-2 py-1 flex items-center gap-2">
                          <div className="flex gap-1">
                            {selectedImages.slice(0, 4).map((thumb, index) => (
                              <button
                                key={thumb.url + index}
                                type="button"
                                className={`h-8 w-8 overflow-hidden rounded border transition-colors ${
                                  index === currentImageIndex
                                    ? 'border-white'
                                    : 'border-transparent opacity-70 hover:opacity-100'
                                }`}
                                onClick={() => setCurrentImageIndex(index)}
                                aria-label={`View photo ${index + 1}`}
                              >
                                <img
                                  src={resolveBackendUploadUrl(thumb.url)}
                                  alt={`Thumbnail ${index + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="text-[10px] text-white whitespace-nowrap">
                              Photos {currentImageIndex + 1} / {selectedImages.length}
                            </span>
                            <button
                              type="button"
                              className="text-[10px] text-blue-200 hover:text-white underline-offset-2 hover:underline"
                              onClick={() => {
                                if (selectedImages.length) {
                                  setShowLightbox(true);
                                }
                              }}
                            >
                              View full photo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-300 px-4 text-center">
                      {imagesError || 'No vehicle photos uploaded yet for this vehicle.'}
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center min-h-[120px]">
                  {selectedDocUrl ? (
                    <img
                      src={selectedDocUrl}
                      alt="OR/CR document"
                      className="w-full h-full object-contain bg-slate-900/5"
                    />
                  ) : (
                    <div className="text-[11px] text-slate-500 px-4 text-center">
                      No OR/CR document uploaded yet for this vehicle.
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Use the unit photos to check condition and presentation, and the OR/CR image to verify ownership and registration details before approving.
                </p>
              </div>

              <div className="space-y-4 text-sm text-slate-700">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <p className="text-xs uppercase text-slate-400">Color</p>
                    <p className="font-medium">{selectedVehicle.Color || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-400">Transmission</p>
                    <p className="font-medium">{selectedVehicle.Transmission || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-400">Fuel Type</p>
                    <p className="font-medium">{selectedVehicle.Fuel_Type || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-400">Mileage</p>
                    <p className="font-medium">
                      {selectedVehicle.Mileage != null && selectedVehicle.Mileage !== ''
                        ? `${selectedVehicle.Mileage.toLocaleString?.() || selectedVehicle.Mileage} km`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-400">Asking Price</p>
                    <p className="font-semibold text-emerald-700">
                      {selectedVehicle.Asking_Price != null && selectedVehicle.Asking_Price !== ''
                        ? `₱${Number(selectedVehicle.Asking_Price).toLocaleString()}`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-400">Engine No.</p>
                    <p className="font-medium text-xs break-all">
                      {selectedVehicle.Engine_Number || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-400">Chassis No.</p>
                    <p className="font-medium text-xs break-all">
                      {selectedVehicle.Chassis_Number || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-400">Owner Contact</p>
                    <p className="font-medium text-xs">
                      {selectedVehicle.Phone_Number || 'No phone'}
                      {selectedVehicle.Email && (
                        <span className="block text-[11px] text-slate-500">{selectedVehicle.Email}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase text-slate-400 mb-1">Description</p>
                  <p className="text-sm whitespace-pre-line bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 max-h-40 overflow-y-auto">
                    {selectedVehicle.Description || 'No additional description provided by seller.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 mt-2 space-y-3">
                  <div className="flex items-start gap-2 text-[11px] text-slate-500">
                    <input
                      type="checkbox"
                      id="inspection-confirm-checkbox"
                      className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      checked={inspectionConfirmed}
                      onChange={e => setInspectionConfirmed(e.target.checked)}
                    />
                    <label htmlFor="inspection-confirm-checkbox" className="cursor-pointer select-none">
                      Done with inspection? I have checked the unit photos, OR/CR details, and seller information and
                      this listing is ready to be published.
                    </label>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVehicle(null)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(selectedVehicle.Vehicle_ID, 'reject')}
                    disabled={processingId === selectedVehicle.Vehicle_ID}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(selectedVehicle.Vehicle_ID, 'approve')}
                    disabled={processingId === selectedVehicle.Vehicle_ID || !inspectionConfirmed}
                    className="px-3 py-1.5 text-xs font-medium text-emerald-600 border border-emerald-200 bg-emerald-50 rounded-md hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Approve & Publish
                  </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLightbox && selectedImages.length > 0 && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex items-center justify-center">
            <img
              src={resolveBackendUploadUrl(selectedImages[currentImageIndex]?.url)}
              alt={`Full vehicle photo ${currentImageIndex + 1}`}
              className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />

            <button
              type="button"
              onClick={() => setShowLightbox(false)}
              aria-label="Close full photo view"
              className="absolute top-4 right-4 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            {selectedImages.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full"
                  onClick={() =>
                    setCurrentImageIndex(prev =>
                      prev === 0 ? selectedImages.length - 1 : prev - 1
                    )
                  }
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full"
                  onClick={() =>
                    setCurrentImageIndex(prev =>
                      prev === selectedImages.length - 1 ? 0 : prev + 1
                    )
                  }
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-200 bg-black/70 px-3 py-1 rounded-full">
              Photo {currentImageIndex + 1} of {selectedImages.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AccountsView() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState<'All' | 'Customer' | 'Staff' | 'Admin'>('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
  });

  const loadAccounts = async (role: 'All' | 'Customer' | 'Staff' | 'Admin' = roleFilter) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminAccounts({ role });
      if (res?.success && res.data?.accounts) {
        setAccounts(res.data.accounts);
      } else {
        setError(res?.error || 'Failed to load staff accounts');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load staff accounts'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts(roleFilter);
  }, [roleFilter]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;

    if (!form.first_name || !form.last_name) {
      setError('First and last name are required');
      return;
    }
    if (!form.email) {
      setError('Email is required');
      return;
    }
    if (!form.phone_number) {
      setError('Phone number is required');
      return;
    }
    if (!form.password || form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      await createStaffAccount(form);
      setForm({ first_name: '', last_name: '', email: '', phone_number: '', password: '' });
      setShowCreate(false);
      await loadAccounts('Staff');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create staff account'
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-slate-700" />
            Staff Accounts
          </h3>
          <button
            type="button"
            onClick={() => setShowCreate(prev => !prev)}
            className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            {showCreate ? 'Close' : '+ Create new staff account'}
          </button>
        </div>
        {showCreate && (
          <div className="space-y-4 animate-staff-form-enter">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                {error}
              </div>
            )}
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="mb-1 block font-medium text-slate-700">First Name</label>
                <input
                  type="text"
                  placeholder="First name"
                  title="Staff first name"
                  value={form.first_name}
                  onChange={e => handleChange('first_name', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">Last Name</label>
                <input
                  type="text"
                  placeholder="Last name"
                  title="Staff last name"
                  value={form.last_name}
                  onChange={e => handleChange('last_name', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  placeholder="staff@example.com"
                  title="Staff email address"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone_number}
                  onChange={e => handleChange('phone_number', e.target.value)}
                  placeholder="09XXXXXXXXX"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  placeholder="Temporary password"
                  title="Temporary password for staff account"
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end justify-end">
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 gap-4">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-600" />
            User Accounts
          </h3>
          <div className="flex items-center gap-3 text-xs">
            <select
              aria-label="Filter users by role"
              title="Filter user accounts by role"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as any)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Roles</option>
              <option value="Customer">Customers</option>
              <option value="Staff">Staff</option>
              <option value="Admin">Admins</option>
            </select>
            {loading && (
              <span className="text-xs text-slate-500">Refreshing...</span>
            )}
          </div>
        </div>
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Created</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {accounts.map(account => (
              <tr key={account.User_ID} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-3 font-medium text-slate-900">
                  {account.First_Name} {account.Last_Name}
                </td>
                <td className="px-6 py-3 text-xs">{account.Email}</td>
                <td className="px-6 py-3 text-xs">{account.Phone_Number}</td>
                <td className="px-6 py-3 text-xs">{account.Role}</td>
                <td className="px-6 py-3 text-xs">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                    account.Account_Status === 'Active'
                      ? 'text-emerald-700 border-emerald-200 bg-emerald-50'
                      : 'text-red-700 border-red-200 bg-red-50'
                  }`}>
                    {account.Account_Status}
                  </span>
                </td>
                <td className="px-6 py-3 text-xs text-slate-500">{account.Created_At}</td>
                <td className="px-6 py-3 text-xs text-right space-x-2">
                  {account.Role !== 'Admin' && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setError(null);
                          const nextStatus =
                            account.Account_Status === 'Active'
                              ? 'Banned'
                              : 'Active';
                          await updateAccountStatus({
                            user_id: account.User_ID,
                            status: nextStatus,
                          });
                          setAccounts(prev =>
                            prev.map(a =>
                              a.User_ID === account.User_ID
                                ? { ...a, Account_Status: nextStatus }
                                : a
                            )
                          );
                        } catch (err) {
                          setError(
                            err instanceof Error
                              ? err.message
                              : 'Failed to update account status'
                          );
                        }
                      }}
                      className={`rounded-md border px-3 py-1 text-[11px] font-medium ${
                        account.Account_Status === 'Active'
                          ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {account.Account_Status === 'Active' ? 'Ban' : 'Unban'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!accounts.length && !loading && (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-sm text-slate-500">
                  No accounts found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
