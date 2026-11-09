export interface ApiResponseFormat<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  timestamp: string;
}

export class ApiResponse {
  static ok<T>(data: T): ApiResponseFormat<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static okWithMessage<T>(message: string, data: T): ApiResponseFormat<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static error(message: string): ApiResponseFormat {
    return {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };
  }
}

