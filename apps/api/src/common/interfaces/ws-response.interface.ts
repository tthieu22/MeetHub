export interface WsResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}

export interface WsErrorResponse {
  success: false;
  message: string;
  code: string;
}

export interface WsSuccessResponse<T = any> {
  success: true;
  data: T;
}
