import fs from "fs";
import yaml from "js-yaml";
import path from "path";

const openapiPath = path.join(process.cwd(), "lib", "api-spec", "openapi.yaml");
const doc = yaml.load(fs.readFileSync(openapiPath, "utf8"));

// Update existing User Schema
doc.components.schemas.User.properties.email = { type: ["string", "null"] };
// Email is optional in required block but usually it's good to be present in response even if null.

// Update CreateUserRequest
doc.components.schemas.CreateUserRequest.properties.email = { type: ["string", "null"] };

// Create UpdateUserRequest (For admin to update another user)
doc.components.schemas.UpdateUserRequest = {
  type: "object",
  properties: {
    email: { type: ["string", "null"] },
    password: { type: ["string", "null"] },
    role: { type: "string", enum: ["admin", "user"] }
  }
};

// Create UpdateProfileRequest (For user self-update)
doc.components.schemas.UpdateProfileRequest = {
  type: "object",
  properties: {
    email: { type: ["string", "null"] },
    password: { type: ["string", "null"] }
  }
};

// Add Endpoints for profile
doc.paths["/auth/profile"] = {
  put: {
    operationId: "updateProfile",
    tags: ["auth"],
    summary: "Update current user profile",
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateProfileRequest" } } }
    },
    responses: {
      "200": {
        description: "Profile updated",
        content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } }
      }
    }
  }
};

// Add PUT /users/{id} for Admin
doc.paths["/users/{id}"].put = {
  operationId: "updateUser",
  tags: ["users"],
  summary: "Update a user (admin only)",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: {
    required: true,
    content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateUserRequest" } } }
  },
  responses: {
    "200": {
      description: "User updated",
      content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } }
    },
    "404": {
      description: "Not found",
      content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
    }
  }
};

fs.writeFileSync(openapiPath, yaml.dump(doc, { noRefs: true }));
console.log("YAML updated for users profile.");
