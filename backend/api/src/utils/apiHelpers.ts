import { Request, Response } from "express";
import mongoose from "mongoose";

// ObjectId 유효성 검사 헬퍼 함수
export const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// 공통 에러 응답 형식
export interface ApiError {
  error: string;
  details?: any;
}

// 공통 성공 응답 형식
export interface ApiSuccess<T = any> {
  success: true;
  data?: T;
  message?: string;
}

// 에러 응답 헬퍼 함수
export const sendErrorResponse = (
  res: Response, 
  statusCode: number, 
  error: string, 
  details?: any
): void => {
  const errorResponse: ApiError = { error };
  if (details) {
    errorResponse.details = details;
  }
  res.status(statusCode).json(errorResponse);
};

// 성공 응답 헬퍼 함수
export const sendSuccessResponse = <T>(
  res: Response, 
  data?: T, 
  message?: string
): void => {
  const response: ApiSuccess<T> = { success: true };
  if (data) response.data = data;
  if (message) response.message = message;
  res.json(response);
};

// ID 유효성 검사 및 에러 처리
export const validateId = (req: Request, res: Response, idParam: string = 'id'): string | null => {
  const id = req.params[idParam];
  
  if (!id) {
    sendErrorResponse(res, 400, `Missing ${idParam} parameter`);
    return null;
  }
  
  if (!isValidObjectId(id)) {
    sendErrorResponse(res, 400, `Invalid ${idParam} format`);
    return null;
  }
  
  return id;
};

// 공통 에러 핸들러 래퍼
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 로깅 헬퍼 함수
export const logError = (operation: string, error: any, context?: any): void => {
  console.error(`${operation} error:`, error);
  if (context) {
    console.error('Context:', context);
  }
};

export const logInfo = (operation: string, message: string, data?: any): void => {
  console.log(`${operation}: ${message}`);
  if (data) {
    console.log('Data:', data);
  }
};
