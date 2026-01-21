import { NextResponse } from "next/server";
import { RequestError, ValidationError } from "../http-errors";
import { ZodError } from "zod";
import logger from "../logger";

export type ResponseType = "api" | "server";

const formatResponse = (
  responseType: ResponseType,
  status: number,
  message: string,
  errors?: Record<string, string[] | undefined>
): NextResponse | { status: number; success: false; error: { message: string; details?: Record<string, string[] | undefined> } } => {
  const responseContent = {
    success: false as const,
    error: {
      message,
      details: errors,
    },
  };

  return responseType === "api" ? NextResponse.json(responseContent, { status }) : { status, ...responseContent };
};

function handleError(error: unknown, responseType: "api"): NextResponse;
function handleError(error: unknown, responseType?: "server"): { status: number; success: false; error: { message: string; details?: Record<string, string[] | undefined> } };
function handleError(error: unknown, responseType: ResponseType = "server"): NextResponse | { status: number; success: false; error: { message: string; details?: Record<string, string[] | undefined> } } {
  if (error instanceof RequestError) {
    logger.error({ err: error }, `${responseType.toUpperCase()} Error: ${error.message}`);
    return formatResponse(responseType, error.statusCode, error.message, error.errors);
  }

  if (error instanceof ZodError) {
    const validationError = new ValidationError(error.flatten().fieldErrors as Record<string, string[]>);

    logger.error({ err: error }, `Validation Error: ${validationError.message}`);

    return formatResponse(responseType, validationError.statusCode, validationError.message, validationError.errors);
  }

  if (error instanceof Error) {
    logger.error(error.message);

    return formatResponse(responseType, 500, error.message);
  }

  logger.error({ err: error }, "An unexpected error occured!");
  return formatResponse(responseType, 500, "An unexpected error occured!");
}

export default handleError;
