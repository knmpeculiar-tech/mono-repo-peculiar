import { extendZodWithOpenApi, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Must run before any zod schema's .openapi()/.register() is used. Safe to
// call once here even though validators are defined in other files first —
// this attaches methods to the shared ZodType prototype, so it applies
// retroactively to schemas created before or after this line.
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description:
    "Supabase-issued access token. Required for /orders (self) and every /admin/* route (admin role).",
});
