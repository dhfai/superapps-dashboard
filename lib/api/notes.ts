// Notes API Service
import { tokenService } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface Note {
  id: number;
  user_id: number;
  title: string;
  content: string;
  tags: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteData {
  title: string;
  content: string;
  tags?: string;
  is_favorite?: boolean;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  tags?: string;
  is_favorite?: boolean;
}

export interface NotesListResponse {
  notes: Note[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export interface GetNotesParams {
  search?: string;
  tags?: string;
  is_favorite?: boolean;
  page?: number;
  page_size?: number;
  sort_by?: 'created_at' | 'updated_at' | 'title';
  sort_order?: 'asc' | 'desc';
}

// Helper function untuk handle fetch dengan auth
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = tokenService.getToken();

  if (!token) {
    return {
      success: false,
      message: 'Authentication required',
      error: 'No token found',
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'An error occurred',
        error: data.error,
      };
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Notes Service
export const notesService = {
  // Create a new note
  async createNote(data: CreateNoteData): Promise<ApiResponse<Note>> {
    return fetchWithAuth('/api/v1/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get all notes with filters and pagination
  async getNotes(params?: GetNotesParams): Promise<ApiResponse<NotesListResponse>> {
    const queryParams = new URLSearchParams();

    if (params?.search) queryParams.append('search', params.search);
    if (params?.tags) queryParams.append('tags', params.tags);
    if (params?.is_favorite !== undefined) queryParams.append('is_favorite', String(params.is_favorite));
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.page_size) queryParams.append('page_size', String(params.page_size));
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/notes${queryString ? `?${queryString}` : ''}`;

    return fetchWithAuth(endpoint, { method: 'GET' });
  },

  // Get a single note by ID
  async getNoteById(id: number): Promise<ApiResponse<Note>> {
    return fetchWithAuth(`/api/v1/notes/${id}`, { method: 'GET' });
  },

  // Update a note
  async updateNote(id: number, data: UpdateNoteData): Promise<ApiResponse<Note>> {
    return fetchWithAuth(`/api/v1/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Soft delete a note
  async deleteNote(id: number): Promise<ApiResponse> {
    return fetchWithAuth(`/api/v1/notes/${id}`, { method: 'DELETE' });
  },

  // Hard delete a note (permanent)
  async hardDeleteNote(id: number): Promise<ApiResponse> {
    return fetchWithAuth(`/api/v1/notes/${id}/hard-delete`, { method: 'DELETE' });
  },

  // Toggle favorite status
  async toggleFavorite(id: number): Promise<ApiResponse<Note>> {
    return fetchWithAuth(`/api/v1/notes/${id}/favorite`, { method: 'PATCH' });
  },

  // Get favorite notes
  async getFavoriteNotes(page: number = 1, page_size: number = 10): Promise<ApiResponse<NotesListResponse>> {
    return fetchWithAuth(`/api/v1/notes/favorites?page=${page}&page_size=${page_size}`, {
      method: 'GET',
    });
  },

  // Search notes
  async searchNotes(query: string, page: number = 1, page_size: number = 10): Promise<ApiResponse<NotesListResponse>> {
    return fetchWithAuth(`/api/v1/notes/search?q=${encodeURIComponent(query)}&page=${page}&page_size=${page_size}`, {
      method: 'GET',
    });
  },

  // Get notes by tags
  async getNotesByTags(tags: string, page: number = 1, page_size: number = 10): Promise<ApiResponse<NotesListResponse>> {
    return fetchWithAuth(`/api/v1/notes/tags?tags=${encodeURIComponent(tags)}&page=${page}&page_size=${page_size}`, {
      method: 'GET',
    });
  },

  // Get notes count
  async getNotesCount(): Promise<ApiResponse<{ count: number }>> {
    return fetchWithAuth('/api/v1/notes/count', { method: 'GET' });
  },
};
