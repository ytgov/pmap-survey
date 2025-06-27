import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { UserStatus } from "../data/models";

export async function ReturnValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  next();
}

export async function requiresAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user && req.user.IS_ADMIN == "Y" && req.user.STATUS == UserStatus.ACTIVE) return next();

  res.status(403).send("Unauthorized - You must be an Admin to access this resource.");
  return false;
}

export function requireAdminOrOwner(req: Request, res: Response, next: NextFunction) {
  if (req.user.STATUS != UserStatus.ACTIVE) return res.status(403).send("You aren't active");

  if (req.user.IS_ADMIN == "Y") return next();
  if (req.user.ROLE == "Owner") return next();

  if (req.user.surveys.length == 0) return res.status(403).send("You aren't an admin or owner");
  
  next();
}
