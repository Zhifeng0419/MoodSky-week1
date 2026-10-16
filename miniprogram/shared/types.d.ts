export type WeatherCode = 'SUNNY' | 'PARTLY_CLOUDY' | 'CLOUDY' | 'RAINY' | 'STORMY';
export type BusinessDate = string;
export interface RequestEnvelope {
  apiVersion: '1';
  requestId: string;
  action: string;
  payload: Record<string, unknown>;
}
export type ApiResult<T> =
  | { apiVersion: '1'; requestId: string; ok: true; data: T }
  | { apiVersion: '1'; requestId: string; ok: false; error: { code: string; message: string } };
export interface JournalInput {
  date: BusinessDate;
  weather: WeatherCode;
  tags?: string[];
  text?: string;
  expectedVersion: number;
}
export interface JournalEntry extends Required<Omit<JournalInput, 'expectedVersion'>> {
  id: string;
  ownerId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}
export interface Account {
  id: string;
  status: 'active' | 'disabled';
}
export interface TrustedActor {
  accountId: string;
  roles: string[];
}
