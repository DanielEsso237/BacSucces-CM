import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
})

export interface Document {
  id: number
  title: string
  description: string | null
  subject: string
  level: string
  doc_type: string
  author_id: number
  created_at: string
  author: {
    id: number
    full_name: string
    email: string
    role: string
    status: string
    created_at: string
  }
}

export interface Filters {
  subjects: string[]
  levels: string[]
  doc_types: string[]
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export async function getFilters(): Promise<Filters> {
  const r = await api.get<Filters>('/documents/filters')
  return r.data
}

export async function getDocuments(token: string, params?: {
  subject?: string
  level?: string
  doc_type?: string
}): Promise<Document[]> {
  const r = await api.get<Document[]>('/documents/', {
    headers: authHeader(token),
    params,
  })
  return r.data
}

export async function uploadDocument(token: string, formData: FormData): Promise<Document> {
  const r = await api.post<Document>('/documents/', formData, {
    headers: {
      ...authHeader(token),
      'Content-Type': 'multipart/form-data',
    },
  })
  return r.data
}