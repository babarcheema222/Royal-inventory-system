import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import inventoryRouter from "./inventory";
import transactionsRouter from "./transactions";
import reportsRouter from "./reports";
import usersRouter from "./users";
import suppliersRouter from "./suppliers";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(inventoryRouter);
router.use(transactionsRouter);
router.use(reportsRouter);
router.use(usersRouter);
router.use(suppliersRouter);

export default router;
