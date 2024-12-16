import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

export async function ReturnValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  next();
}

export async function requiresAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user && req.user.IS_ADMIN == "Y") return next();

  res.status(403).send("Unauthorized - You must be an Admin to access this resource.");
  return false;
}
