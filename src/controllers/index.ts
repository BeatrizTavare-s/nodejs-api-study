import logger from '@src/logger';
import { CUSTOM_VALIDATION } from '@src/models/user';
import ApiError, { APIError } from '@src/util/errors/api-error';
import { Response } from 'express';
import { Error } from 'mongoose';

export abstract class BaseController {
  protected sendCreatedUpdateErrorResponse(
    res: Response,
    error: Error.ValidationError | Error
  ): void {
    if (error instanceof Error.ValidationError) {
      const clientErros = this.handleClientErrors(error);
      res.status(clientErros.code).send(
        ApiError.format({
          code: clientErros.code,
          message: clientErros.error,
        })
      );
    } else {
      logger.error(error);
      res
        .status(500)
        .send(ApiError.format({ code: 500, message: 'Internal Server Error' }));
    }
  }

  private handleClientErrors(error: Error.ValidationError): {
    code: number;
    error: string;
  } {
    const duplicateKindErrors = Object.values(error.errors).filter(
      (err) => err.kind === CUSTOM_VALIDATION.DUPLICATED
    );
    if (duplicateKindErrors.length) {
      return { code: 409, error: error.message };
    }
    return { code: 400, error: error.message };
  }

  protected sendErrorResponse(res: Response, apiError: APIError): Response {
    return res.status(apiError.code).send(ApiError.format(apiError));
  }
}
