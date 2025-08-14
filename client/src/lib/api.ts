import { type MediaSearchParams, type ApiOption } from "@shared/schema";

const getBaseURL = () => {
  if (typeof window !== 'undefined' && window.electronAPI) {
    console.log('Using Electron server address:', window.electronAPI.serverAddress);
    return window.electronAPI.serverAddress;
  }
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  console.log('Using default server address:', baseUrl);
  return baseUrl;
};

export const API_BASE_URL = getBaseURL();

async function apiRequest<T>(
  method: string,
  url: string,
  data?: unknown
): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  console.log(`[API Request] ${method} ${fullUrl}`, data);

  try {
    const response = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API Error] ${response.status} ${errorText}`);
      throw new Error(`API Error: ${response.status} ${errorText}`);
    }

    const responseData = await response.json();
    console.log(`[API Response] ${method} ${fullUrl}`, responseData);
    return responseData as T;

  } catch (error) {
    console.error(`[API Fetch Error] ${method} ${fullUrl}`, error);
    throw error;
  }
}

// Media Items
export const getMediaItems = (params: MediaSearchParams) => {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.type) query.set('type', params.type);
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.tags) params.tags.forEach(tag => query.append('tags', tag));

  return apiRequest<any>('GET', `/api/media?${query.toString()}`);
};

export const getMediaItem = (id: string) => apiRequest<any>('GET', `/api/media/${id}`);
export const createMediaItems = (urls: string[]) => apiRequest<any>('POST', '/api/media', { urls });
export const refreshMetadata = (id: string) => apiRequest<any>('POST', `/api/media/${id}/refresh`);

// Tags
export const getTags = () => apiRequest<any[]>('GET', '/api/tags');
export const createTag = (name: string, color: string) => apiRequest<any>('POST', '/api/tags', { name, color });
export const deleteTag = (id: string) => apiRequest<any>('DELETE', `/api/tags/${id}`);
export const addTagToMediaItem = (mediaItemId: string, tagId: string) => apiRequest<any>('POST', `/api/media/${mediaItemId}/tags/${tagId}`);
export const removeTagFromMediaItem = (mediaItemId: string, tagId: string) => apiRequest<any>('DELETE', `/api/media/${mediaItemId}/tags/${tagId}`);

// Categories
export const getCategories = () => apiRequest<any[]>('GET', '/api/categories');
export const createCategory = (name: string) => apiRequest<any>('POST', '/api/categories', { name });
export const deleteCategory = (id: string) => apiRequest<any>('DELETE', `/api/categories/${id}`);
export const addCategoryToMediaItem = (mediaItemId: string, categoryId: string) => apiRequest<any>('POST', `/api/media/${mediaItemId}/categories/${categoryId}`);
export const removeCategoryFromMediaItem = (mediaItemId: string, categoryId: string) => apiRequest<any>('DELETE', `/api/media/${mediaItemId}/categories/${categoryId}`);

// API Options
export const getApiOptions = () => apiRequest<ApiOption[]>('GET', '/api/api-options');
export const createApiOption = (option: Omit<ApiOption, 'id'>) => apiRequest<ApiOption>('POST', '/api/api-options', option);
export const updateApiOption = (id: string, updates: Partial<ApiOption>) => apiRequest<ApiOption>('PUT', `/api/api-options/${id}`, updates);
export const deleteApiOption = (id: string) => apiRequest<{ success: boolean }>('DELETE', `/api/api-options/${id}`);

// Media Items - Missing functions
export const updateMediaItem = (id: string, updates: Partial<any>) => apiRequest<any>('PUT', `/api/media/${id}`, updates);
export const deleteMediaItem = (id: string) => apiRequest<{ success: boolean }>('DELETE', `/api/media/${id}`);
export const getDownloadUrl = (id: string, apiId?: string) => {
  const query = apiId ? `?apiId=${apiId}` : '';
  return apiRequest<{ source: string; downloadUrl: string; expiresAt: string; proxy?: string }>('GET', `/api/media/${id}/download${query}`);
};

export const checkAndFetchMetadata = (id: string) => apiRequest<{ success: boolean; mediaItem: any; action: string }>('POST', `/api/media/${id}/metadata`);

export async function getCategories(): Promise<any[]> {
  try {
    const response = await fetch('/api/categories');
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    return response.json();
  } catch (error) {
    console.error('Get categories error:', error);
    return [];
  }
}

export async function createCategory(name: string) {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error('Failed to create category');
  }
  return response.json();
}

export async function deleteCategory(id: string) {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete category');
  }
  return response.json();
}

export async function getTags(): Promise<any[]> {
  try {
    const response = await fetch('/api/tags');
    if (!response.ok) {
      throw new Error('Failed to fetch tags');
    }
    return response.json();
  } catch (error) {
    console.error('Get tags error:', error);
    return [];
  }
}

export async function createTag(name: string, color?: string) {
  const response = await fetch('/api/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color: color || 'blue' }),
  });
  if (!response.ok) {
    throw new Error('Failed to create tag');
  }
  return response.json();
}

export async function deleteTag(id: string) {
  const response = await fetch(`/api/tags/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete tag');
  }
  return response.json();
}