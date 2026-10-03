import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { generateOpenApiDocument } from "../docs/openapi";

export const docsRouter = Router();

// Generated once at startup — the API surface doesn't change at runtime.
const openApiDocument = generateOpenApiDocument();

docsRouter.get("/openapi.json", (_req, res) => {
  res.json(openApiDocument);
});
docsRouter.use(
  "/",
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, { customSiteTitle: "Peculiar API Docs" }),
);
