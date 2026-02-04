import express, { Request, Response, NextFunction } from "express";
const router = express.Router();

/* GET users listing. */
interface UsersRequest extends Request {}
interface UsersResponse extends Response {}
interface UsersNextFunction extends NextFunction {}

router.get(
  "/",
  function (req: UsersRequest, res: UsersResponse, next: UsersNextFunction) {
    res.send("respond with a resource");
  },
);

export default router;
