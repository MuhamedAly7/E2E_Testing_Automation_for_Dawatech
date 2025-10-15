import { test, expect, BrowserContext, Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { OrdersPage } from "../pages/OrdersPage";
import { POSPage } from "../pages/POSPage";
import { InventoryPage } from "../pages/Inventory";
import dotenv from "dotenv";

dotenv.config();

let context: BrowserContext;
let page: Page;
let loginPage: LoginPage;
let posPage: POSPage;
let ordersPage: OrdersPage;
let inventoryPage: InventoryPage;

test.beforeEach(async ({ browser }) => {
  context = await browser.newContext({
    recordVideo: {
      dir: "Videos/",
      size: { width: 800, height: 600 },
    },
  });
  page = await context.newPage();
  loginPage = new LoginPage(page);
  posPage = new POSPage(page, context);
  ordersPage = new OrdersPage(page);
  inventoryPage = new InventoryPage(page);

  await loginPage.goto(`${process.env.BASE_URL}/web/login?debug=1`);
  await loginPage.login(
    process.env.EMAIL as string,
    process.env.PASSWORD as string
  );
});

test.afterAll(async () => {
  await page.close();
  await context.close();
});

test("INV-001", async () => {
  // Go to the inventory module and create product (to guarantee that our product is exist)
  await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
  await inventoryPage.createNewProduct(
    process.env.PRODUCT_NAME as string,
    100.0,
    20
  );

  // Go to internal transfere page
  await inventoryPage.navigateToInventory();
  await inventoryPage.navigateToInternalTransfereInventory();

  // Make internal transfere
  await inventoryPage.createNewInternalTransfere(
    process.env.USERNAME_CUSTOMERNAME_CASHIERNAME as string,
    process.env.PRODUCT_NAME as string,
    "101030",
    1
  );

  // Make sure the transfere has been commited by validating product quantity in every store
  await inventoryPage.AssertOnStokeQuantities(
    process.env.PRODUCT_NAME as string
  );

  // Archive the product at the end
  await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
});

test("INV-002", async () => {
  // Create new product
  const initialQuantity = 20;
  await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
  await inventoryPage.createNewProduct(
    process.env.PRODUCT_NAME as string,
    100.0,
    initialQuantity
  );

  // Navigate to product in inventory module
  await inventoryPage.navigateToInventory();
  await inventoryPage.navigateToInventoryAdjustmentScreen();

  // Start creating new adjustment screen
  await inventoryPage.createNewInventoryAdjustmentScreen(process.env.PRODUCT_NAME as string, initialQuantity);

  // Validate the adjustment happened successfully and reflects to inventory
  await inventoryPage.assertOnProductInventory(process.env.PRODUCT_NAME as string, initialQuantity);

  await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
});