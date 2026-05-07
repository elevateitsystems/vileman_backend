import { Router } from "express";
import { OrderController } from "./order.controller";

export function setupOrderRoutes(controller: OrderController): Router {
  const router = Router();

  router.post("/checkout", controller.checkout);
  router.post("/webhook", controller.webhook);

  // CRUD Routes
  router.get("/", controller.getAll);
  router.get("/:id", controller.getSingle);
  router.patch("/:id", controller.update);
  router.delete("/:id", controller.delete);

  return router;
}
