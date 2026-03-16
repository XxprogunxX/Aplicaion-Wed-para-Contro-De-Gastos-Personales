// Tipos para el modelo de datos

export interface Usuario {
  id: string | number;
  username: string;
  email: string;
  createdAt: string;
}

export interface Gasto {
  id: string | number;
  userId?: string | number;
  descripcion: string;
  monto: number;
  categoria: string;
  fecha?: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
}

export interface GastoInput {
  descripcion: string;
  monto: number;
  categoria: string;
  fecha?: string;
  metodoPago?: string;
}

export interface Categoria {
  id: string | number;
  nombre: string;
  color: string;
  icono: string;
  esGlobal: boolean;
}

export interface Presupuesto {
  id: string | number;
  userId?: string | number;
  categoria: string;
  monto: number;
  periodo: 'mensual' | 'anual' | string;
  mes?: number | null;
  anio: number;
  gastado?: number;
  disponible?: number;
  porcentajeUsado?: number;
  excedido?: boolean;
}

export interface ReporteMensual {
  mes: number;
  anio: number;
  totalGastado: number;
  cantidadGastos?: number;
  gastosPorCategoria: {
    [categoria: string]: number;
  };
  gastos: Gasto[];
}

export interface ReporteAnual {
  anio: number;
  totalGastado: number;
  cantidadGastos?: number;
  gastosPorCategoria: {
    [categoria: string]: number;
  };
  gastosPorMes: {
    [mes: string]: number;
  };
}

export interface ReporteCategoriaItem {
  categoria: string;
  total: number;
  cantidad: number;
  porcentaje: number;
}

export interface ReportePorCategoria {
  totalGeneral: number;
  categorias: ReporteCategoriaItem[];
}

export interface PeriodoComparativo {
  mes: number;
  anio: number;
  total: number;
}

export interface ReporteComparativo {
  periodoActual: PeriodoComparativo;
  periodoComparado: PeriodoComparativo;
  variacion: number;
  variacionPorcentual: number | null;
}

export interface ApiMessageResponse {
  error?: boolean;
  message: string;
  status?: number;
}

export interface AuthResponse {
  success?: boolean;
  token: string;
  user: Usuario;
}

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: boolean;
  message?: string;
  status?: number;
}

export interface ApiError {
  error: boolean;
  message: string;
  status: number;
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export interface ChatHistoryState {
  messages: ChatHistoryMessage[];
  pendingAction?: ChatPendingAction | null;
}

export interface ChatPendingAction {
  id: string;
  type: 'create-expense';
  descripcion: string;
  monto: number;
  categoria: string;
  fecha?: string;
  expiresAt: string;
}

export interface ChatActionResult {
  type: 'create-expense' | 'create-budget';
  status: 'confirmed' | 'cancelled';
  gastoId?: string | number;
  presupuestoId?: string | number;
}

export interface ChatbotResponse {
  reply: string;
  model: string;
  createdAt: string;
  pendingAction?: ChatPendingAction | null;
  actionResult?: ChatActionResult | null;
}
