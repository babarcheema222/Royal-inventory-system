import fs from "fs";
import yaml from "js-yaml";
import path from "path";

const openapiPath = path.join(process.cwd(), "lib", "api-spec", "openapi.yaml");
const doc = yaml.load(fs.readFileSync(openapiPath, "utf8"));

// 1. Update Subcategory
doc.components.schemas.Subcategory.properties.currentStock.type = "number";
doc.components.schemas.Subcategory.properties.lowStockThreshold = { type: "number" };
doc.components.schemas.Subcategory.properties.costPerUnit = { type: "number" };
doc.components.schemas.Subcategory.required.push("lowStockThreshold", "costPerUnit");

// 2. Update CreateSubcategoryRequest
// Assuming we don't strictly require these in create request since they have defaults

// 3. Update InventoryItem
doc.components.schemas.InventoryItem.properties.currentStock.type = "number";
doc.components.schemas.InventoryItem.properties.lowStockThreshold = { type: "number" };
doc.components.schemas.InventoryItem.properties.costPerUnit = { type: "number" };

// 4. Update Transaction
doc.components.schemas.Transaction.properties.quantity.type = "number";
doc.components.schemas.Transaction.properties.supplierId = { type: ["integer", "null"] };

doc.components.schemas.TransactionDetail.properties.quantity.type = "number";
doc.components.schemas.TransactionDetail.properties.supplierId = { type: ["integer", "null"] };
doc.components.schemas.TransactionDetail.properties.supplierName = { type: ["string", "null"] };

doc.components.schemas.CreateTransactionRequest.properties.quantity.type = "number";
doc.components.schemas.CreateTransactionRequest.properties.supplierId = { type: ["integer", "null"] };

// 5. Add Suppliers, Menu items, and Recipe Ingredients schemas
Object.assign(doc.components.schemas, {
  Supplier: {
    type: "object",
    properties: {
      id: { type: "integer" },
      name: { type: "string" },
      contactInfo: { type: ["string", "null"] },
      createdAt: { type: "string", format: "date-time" }
    },
    required: ["id", "name", "createdAt"]
  },
  CreateSupplierRequest: {
    type: "object",
    properties: {
      name: { type: "string" },
      contactInfo: { type: ["string", "null"] }
    },
    required: ["name"]
  },
  MenuItem: {
    type: "object",
    properties: {
      id: { type: "integer" },
      name: { type: "string" },
      price: { type: "number" },
      createdAt: { type: "string", format: "date-time" }
    },
    required: ["id", "name", "price", "createdAt"]
  },
// Add Recipe requirement logic...
});

// 6. Add tags
if (!doc.tags.find(t => t.name === "suppliers")) {
  doc.tags.push({ name: "suppliers", description: "Supplier management" });
}

// 7. Add paths
doc.paths["/suppliers"] = {
  get: {
    operationId: "listSuppliers",
    tags: ["suppliers"],
    summary: "List all suppliers",
    security: [{ bearerAuth: [] }],
    responses: {
      "200": {
        description: "Suppliers list",
        content: {
          "application/json": {
            schema: { type: "array", items: { $ref: "#/components/schemas/Supplier" } }
          }
        }
      }
    }
  },
  post: {
    operationId: "createSupplier",
    tags: ["suppliers"],
    summary: "Create a supplier",
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/CreateSupplierRequest" }
        }
      }
    },
    responses: {
      "201": {
        description: "Created",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Supplier" } } }
      }
    }
  }
};

fs.writeFileSync(openapiPath, yaml.dump(doc, { noRefs: true }));
console.log("YAML updated successfully");
