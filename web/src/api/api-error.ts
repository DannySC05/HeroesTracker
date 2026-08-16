import axios from 'axios';

interface ApiErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
  };
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'No pudimos completar la solicitud. Inténtalo nuevamente.',
): string {
  if (axios.isAxiosError<ApiErrorEnvelope>(error)) {
    if (!error.response) {
      return 'No pudimos conectar con el servidor. Verifica que la API esté disponible.';
    }

    return error.response.data?.error?.message || fallback;
  }

  return fallback;
}
