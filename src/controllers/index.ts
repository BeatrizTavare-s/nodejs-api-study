import { CUSTOM_VALIDATION } from '@src/models/user';
import { Response } from 'express';
import { Error } from 'mongoose';

export abstract class BaseController {
  protected sendCreatedUpdateErrorResponse(
    res: Response,
    error: Error.ValidationError | Error
  ): void {
    if (error instanceof Error.ValidationError) {
      const clientErros = this.handleClientErrors(error);
      res
        .status(clientErros.code)
        .send({ code: clientErros.code, error: clientErros.error });
    } else {
      res.status(500).send({ code: 500, error: 'Internal Server Error' });
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
    return { code: 422, error: error.message };
  }
}
