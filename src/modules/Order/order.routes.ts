import { Router } from "express";
import { OrderController } from "./order.controller";
import { upload } from "@/utils/multer";

export function setupOrderRoutes(controller: OrderController): Router {
  const router = Router();

  router.post("/checkout", upload.array("images", 10), controller.checkout);
  router.post("/webhook", controller.webhook);

  // CRUD Routes
  router.get("/", controller.getAll);
  router.get("/:id", controller.getSingle);
  router.patch("/:id", controller.update);
  router.delete("/:id", controller.delete);

  return router;
}
