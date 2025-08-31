export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee' | 'member';
  avatar?: string;
  department?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'pending';
  joinDate: Date;
  membershipType: 'individual' | 'family' | 'vip';
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Prato Principal' | 'Petiscos' | 'Bebidas';
  image?: string;
  available: boolean;
  preparationTime?: number;
}

export interface Order {
  id: string;
  tableNumber?: string;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total: number;
  createdAt: Date;
  updatedAt: Date;
  customerId?: string;
  employeeId: string;
  notes?: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  name: string;
  categoryId?: string;
  category?: InventoryCategory; // Para joins
  currentStock: number;
  minStock: number;
  unit: 'unidades' | 'kg' | 'litros' | 'garrafas';
  lastUpdated: Date;
  supplier?: string;
  cost: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  products: string[];
}

export interface Sale {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'pix' | 'member_credit';
  timestamp: Date;
  employeeId: string;
}

export interface Module {
  id: string;
  name: string;
  icon: string;
  path: string;
  active: boolean;
  permissions: string[];
}
