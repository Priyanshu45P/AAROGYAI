import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

type AppError = Error & { statusCode?: number };

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} was not found.`,
  });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Please check the entered information.",
      details: error.flatten(),
    });
  }

  const appError = error as AppError;

  if (appError?.statusCode) {
    return res.status(appError.statusCode).json({
      success: false,
      message: appError.message,
    });
  }

  console.error(error);
  res.status(500).json({
    success: false,
    message: "Something went wrong on the server.",
  });
}
