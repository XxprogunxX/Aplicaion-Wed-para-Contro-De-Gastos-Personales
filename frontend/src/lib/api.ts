import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { ApiError, AuthResponse, Gasto, Categoria, Presupuesto, ReporteMensual } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar token JWT si existe
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor para manejar errores
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        if (error.response) {
          const apiError: ApiError = {
            error: true,
            message: (error.response.data as any)?.message || 'Error desconocido',
            status: error.response.status,
          };
          throw apiError;
        } else if (error.request) {
          // Error de red
          throw {
            error: true,
            message: 'Error de conexión. Verifica tu conexión a internet.',
            status: 0,
          } as ApiError;
        } else {
          // Otro error
          throw {
            error: true,
            message: 'Error interno de la aplicación.',
            status: 500,
          } as ApiError;
        }
      }
    );
  }

  // API de Autenticación
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post('/api/auth/login', { email, password });
    return response.data;
  }

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post('/api/auth/register', { username, email, password });
    return response.data;
  }

  async logout(): Promise<{ success: boolean }> {
    const response = await this.client.post('/api/auth/logout');
    return response.data;
  }

  // API de Gastos
  async getGastos(): Promise<Gasto[]> {
    const response = await this.client.get('/api/gastos');
    return response.data;
  }

  async getGastoById(id: string): Promise<Gasto> {
    const response = await this.client.get(`/api/gastos/${id}`);
    return response.data;
  }

  async createGasto(gasto: Omit<Gasto, 'id' | 'createdAt' | 'updatedAt'>): Promise<Gasto> {
    const response = await this.client.post('/api/gastos', gasto);
    return response.data;
  }

  async updateGasto(id: string, gasto: Partial<Gasto>): Promise<Gasto> {
    const response = await this.client.put(`/api/gastos/${id}`, gasto);
    return response.data;
  }

  async deleteGasto(id: string): Promise<{ success: boolean }> {
    const response = await this.client.delete(`/api/gastos/${id}`);
    return response.data;
  }

  // API de Categorías
  async getCategorias(): Promise<Categoria[]> {
    const response = await this.client.get('/api/categorias');
    return response.data;
  }

  async createCategoria(categoria: Omit<Categoria, 'id'>): Promise<Categoria> {
    const response = await this.client.post('/api/categorias', categoria);
    return response.data;
  }

  // API de Presupuestos
  async getPresupuestos(): Promise<Presupuesto[]> {
    const response = await this.client.get('/api/presupuestos');
    return response.data;
  }

  async createPresupuesto(presupuesto: Omit<Presupuesto, 'id' | 'gastado'>): Promise<Presupuesto> {
    const response = await this.client.post('/api/presupuestos', presupuesto);
    return response.data;
  }

  // API de Reportes
  async getReporteMensual(mes: number, anio: number): Promise<ReporteMensual> {
    const response = await this.client.get(`/api/reportes/mensual?mes=${mes}&anio=${anio}`);
    return response.data;
  }

  async getReporteAnual(anio: number): Promise<{ anio: number; totalGastado: number; gastosPorCategoria: { [categoria: string]: number } }> {
    const response = await this.client.get(`/api/reportes/anual?anio=${anio}`);
    return response.data;
  }
}

export const api = new ApiClient();
