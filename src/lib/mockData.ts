
export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image: string;
  mileage: number;
  transmission: 'Automatic' | 'Manual';
  fuelType: 'Gasoline' | 'Diesel' | 'Hybrid' | 'Electric';
  status: 'Available' | 'Reserved' | 'Under Appraisal' | 'Sold';
  ownerId: string;
  slotId?: number; // 1-60
}

export interface Slot {
  id: number;
  status: 'Empty' | 'Occupied' | 'Overdue';
  carId?: string;
  paidUntil?: string;
}

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Juan Dela Cruz',
  role: 'customer',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
};

export const ADMIN_USER: User = {
  id: 'a1',
  name: 'Admin Staff',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
};

// Generate 60 slots
export const MOCK_SLOTS: Slot[] = Array.from({ length: 60 }, (_, i) => ({
  id: i + 1,
  status: i < 55 ? (Math.random() > 0.1 ? 'Occupied' : 'Overdue') : 'Empty', // 55/60 occupied mock
  carId: i < 55 ? `c${i}` : undefined,
  paidUntil: i < 55 ? '2023-12-31' : undefined,
}));

export const MOCK_CARS: Car[] = [
  {
    id: 'c1',
    make: 'Toyota',
    model: 'Vios',
    year: 2020,
    price: 650000,
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=1000',
    mileage: 15000,
    transmission: 'Automatic',
    fuelType: 'Gasoline',
    status: 'Available',
    ownerId: 'u2',
    slotId: 1,
  },
  {
    id: 'c2',
    make: 'Mitsubishi',
    model: 'Montero Sport',
    year: 2019,
    price: 1250000,
    image: 'https://images.unsplash.com/photo-1633604069359-55648c688327?auto=format&fit=crop&q=80&w=1000',
    mileage: 45000,
    transmission: 'Automatic',
    fuelType: 'Diesel',
    status: 'Reserved',
    ownerId: 'u1', // Current user selling this
    slotId: 2,
  },
  {
    id: 'c3',
    make: 'Honda',
    model: 'Civic',
    year: 2021,
    price: 1100000,
    image: 'https://images.unsplash.com/photo-1606152421811-aa9116c9258f?auto=format&fit=crop&q=80&w=1000',
    mileage: 12000,
    transmission: 'Automatic',
    fuelType: 'Gasoline',
    status: 'Available',
    ownerId: 'u3',
    slotId: 3,
  },
  {
    id: 'c4',
    make: 'Ford',
    model: 'Raptor',
    year: 2022,
    price: 2500000,
    image: 'https://images.unsplash.com/photo-1566008885218-40faf5c9a80d?auto=format&fit=crop&q=80&w=1000',
    mileage: 8000,
    transmission: 'Automatic',
    fuelType: 'Diesel',
    status: 'Available',
    ownerId: 'u4',
    slotId: 4,
  },
  {
    id: 'c5',
    make: 'Nissan',
    model: 'Navara',
    year: 2018,
    price: 950000,
    image: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&q=80&w=1000',
    mileage: 60000,
    transmission: 'Manual',
    fuelType: 'Diesel',
    status: 'Under Appraisal',
    ownerId: 'u5',
    slotId: 5,
  },
   {
    id: 'c6',
    make: 'Suzuki',
    model: 'Jimny',
    year: 2023,
    price: 1300000,
    image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=1000',
    mileage: 5000,
    transmission: 'Automatic',
    fuelType: 'Gasoline',
    status: 'Available',
    ownerId: 'u6',
    slotId: 6,
  },
  {
    id: 'c7',
    make: 'BMW',
    model: '3 Series',
    year: 2021,
    price: 3500000,
    image: 'https://images.unsplash.com/photo-1555215695-3004980adade?auto=format&fit=crop&q=80&w=1000',
    mileage: 10000,
    transmission: 'Automatic',
    fuelType: 'Gasoline',
    status: 'Available',
    ownerId: 'a1', // Admin's personal car
    slotId: 7,
  },
];

export interface Offer {
  id: string;
  carId: string;
  amount: number;
  status: 'Pending' | 'Accepted' | 'Countered' | 'Rejected';
  date: string;
  bidderName: string;
}

export interface ViewingRequest {
  id: string;
  carId: string;
  date: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  requesterName: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

export const MOCK_OFFERS: Offer[] = [
  { id: 'o1', carId: 'c2', amount: 1200000, status: 'Pending', date: '2023-10-27', bidderName: 'Michael Tan' },
  { id: 'o2', carId: 'c2', amount: 1150000, status: 'Rejected', date: '2023-10-25', bidderName: 'Sarah Lim' },
];

export const MOCK_VIEWING_REQUESTS: ViewingRequest[] = [
  { id: 'v1', carId: 'c2', date: '2023-10-30', status: 'Pending', requesterName: 'David Lee' },
  { id: 'v2', carId: 'c1', date: '2023-11-02', status: 'Confirmed', requesterName: 'Jennifer Go' },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', userId: 'u1', message: 'Staff scheduled a physical viewing for your Montero Sport on Oct 30', date: '2023-10-27', read: false, type: 'info' },
  { id: 'n2', userId: 'u1', message: 'Please bring your car for appraisal to update its condition report.', date: '2023-10-26', read: true, type: 'warning' },
];

export const MOCK_DRAFTS = [
  { id: 'd1', make: 'Hyundai', model: 'Starex', year: 2015, status: 'Pending Inspection', date: '2023-10-25' },
  { id: 'd2', make: 'Toyota', model: 'Fortuner', year: 2020, status: 'Waiting for Slot', date: '2023-10-26' },
];

export const MOCK_RESERVATIONS = [
  { id: 'r1', car: MOCK_CARS[2], date: '2023-10-24', status: 'Pending Finance' },
];
