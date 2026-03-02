export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'https://sommelai-app-a743d57328f0.herokuapp.com';

export const apiUrl = (path: string) =>
  `${API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;

