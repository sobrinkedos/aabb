export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  status?: string;
  join_date?: string;
  membership_type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  rg?: string;
  birth_date?: string;
  gender?: string;
  avatar_url?: string;
  customer_type: 'member' | 'non_member';
  membership_type?: 'monthly' | 'annual' | 'lifetime';
  membership_status?: 'active' | 'inactive' | 'suspended' | 'pending';
  membership_number?: string;
  join_date?: string;
  status: 'active' | 'inactive' | 'suspended';
  credit_limit?: number;
  current_balance?: number;
  preferred_payment_method?: string;
  marketing_consent?: boolean;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  address_type: 'home' | 'work' | 'billing' | 'shipping' | 'other';
  street: string;
  number?: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  country?: string;
  is_primary?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CustomerDependent {
  id: string;
  customer_id: string;
  name: string;
  relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  birth_date?: string;
  gender?: string;
  cpf?: string;
  rg?: string;
  status: 'active' | 'inactive';
  can_make_purchases?: boolean;
  credit_limit?: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface CustomerMembershipHistory {
  id: string;
  customer_id: string;
  action: 'created' | 'upgraded' | 'downgraded' | 'suspended' | 'reactivated' | 'cancelled';
  previous_membership_type?: string;
  new_membership_type?: string;
  previous_status?: string;
  new_status?: string;
  reason?: string;
  processed_by?: string;
  created_at: string;
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
  itemType: 'prepared' | 'direct';
  directInventoryItemId?: string;
  inventoryItem?: InventoryItem; // Para joins quando é item direto
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



// Bar Customer types
export interface BarCustomer {
  id: string;
  phone: string; // Identificação principal
  name: string;
  email?: string;
  cpf?: string;
  birth_date?: string;
  gender?: string;
  preferred_table?: string;
  dietary_restrictions?: string;
  favorite_items?: string[]; // IDs dos itens favoritos
  credit_limit: number;
  current_balance: number;
  status: 'active' | 'inactive' | 'blocked';
  is_vip: boolean;
  loyalty_points: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  last_visit?: string;
}

export interface BarCustomerVisit {
  id: string;
  customer_id: string;
  visit_date: string;
  table_number?: string;
  total_spent: number;
  items_ordered?: any[]; // Array de itens pedidos
  payment_method?: string;
  notes?: string;
  created_at: string;
}

export interface BarEmployee {
  id: string;
  employee_id: string;
  bar_role: 'atendente' | 'garcom' | 'cozinheiro' | 'barman' | 'gerente';
  shift_preference?: 'manha' | 'tarde' | 'noite' | 'qualquer';
  specialties?: string[];
  commission_rate: number;
  status: 'active' | 'inactive';
  start_date: string;
  end_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relação com a tabela employees
  employee?: {
    id: string;
    name: string;
    cpf?: string;
    email?: string;
    phone?: string;
    hire_date?: string;
    status?: string;
  };
}

export interface Employee {
  id: string;
  profile_id: string;
  employee_number: string;
  core_area: 'administrative' | 'sports' | 'food_beverage' | 'maintenance' | 'security' | 'health' | 'events';
  department_id?: string;
  position_id?: string;
  admission_date: string;
  termination_date?: string;
  salary?: number;
  is_active?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  manager_id?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Position {
  id: string;
  name: string;
  description?: string;
  department_id?: string;
  min_salary?: number;
  max_salary?: number;
  requirements?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeShift {
  id: string;
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeSchedule {
  id: string;
  employee_id: string;
  shift_id: string;
  start_date: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeePositionHistory {
  id: string;
  employee_id: string;
  position_id: string;
  start_date: string;
  end_date?: string;
  reason?: string;
  created_at?: string;
}
