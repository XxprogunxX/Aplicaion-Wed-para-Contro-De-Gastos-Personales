// Tipos para el modelo de datos

export interface Usuario {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface Gasto {
  id: string;
  userId: string;
  descripcion: string;
  monto: number;
  categoria: string;
  fecha: string;
  createdAt: string;
  updatedAt: string;
}

export interface GastoInput {
  descripcion: string;
  monto: number;
  categoria: string;
  fecha?: string;
  metodoPago?: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  color: string;
  icono: string;
  esGlobal: boolean;
}

export interface Presupuesto {
  id: string;
  userId: string;
  categoria: string;
  monto: number;
  periodo: 'mensual' | 'anual';
  mes: number;
  anio: number;
  gastado: number;
}

export interface ReporteMensual {
  mes: number;
  anio: number;
  totalGastado: number;
  gastosPorCategoria: {
    [categoria: string]: number;
  };
  gastos: Gasto[];
}

export interface AuthResponse {
  success: boolean;
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
