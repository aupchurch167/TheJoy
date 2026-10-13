import { register } from "node:module";

// Lets node:test import the app's extensionless TypeScript paths.
register("./resolve-ts.mjs", import.meta.url);
