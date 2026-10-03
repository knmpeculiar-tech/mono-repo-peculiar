import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./registry";
// Side-effect imports: these populate the registry when loaded. Order
// doesn't matter (paths.ts also imports schemas.ts directly), but both are
// listed here so this file is a complete, obvious entry point.
import "./schemas";
import "./paths";

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Peculiar API",
      version: "1.0.0",
      description:
        "REST API for the Peculiar storefront and admin dashboard. Cart state lives " +
        "entirely in the frontend (localStorage) — there is no cart endpoint.",
    },
    servers: [{ url: "/api", description: "Relative to wherever this API is hosted" }],
  });
}
