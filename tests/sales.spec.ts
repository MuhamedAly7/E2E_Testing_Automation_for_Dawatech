import { test, expect, BrowserContext, Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { OrdersPage } from "../pages/OrdersPage";
import { POSPage } from "../pages/POSPage";
import { InventoryPage } from "../pages/Inventory";
import dotenv from "dotenv";
import { SalesPage } from "../pages/SalesPage";

dotenv.config();

let context: BrowserContext;
let page: Page;
let loginPage: LoginPage;
let posPage: POSPage;
let ordersPage: OrdersPage;
let inventoryPage: InventoryPage;
let salesPage: SalesPage;

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
  salesPage = new SalesPage(page);

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

test("SAL-001: - Create quotation \n - Convert quotation to Sales Order \n - Deliver products \n - Generate invoice from SO", async () => {
    const initialQuantity = 20;
    await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
    await inventoryPage.createNewProduct(process.env.PRODUCT_NAME as string, 100.0, initialQuantity);

    await salesPage.navigateToSalesModule();
    await salesPage.createNewQuotationAndGenerateInvoice(process.env.USERNAME_CUSTOMERNAME_CASHIERNAME as string, process.env.PRODUCT_NAME as string, 1.0);

    await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
});
test("SAL-002: - Credit note from vendor bill \n - Create return from delivery \n - Cancel delivery or issue reverse transfer \n - Create credit note from invoice \n - Partial refund", async () => {
  const initialQuantity = 20;
  await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
  await inventoryPage.createNewProduct(process.env.PRODUCT_NAME as string, 100.0, initialQuantity);

  await salesPage.navigateToSalesModule();
  await salesPage.createNewQuotationAndGenerateInvoice(process.env.USERNAME_CUSTOMERNAME_CASHIERNAME as string, process.env.PRODUCT_NAME as string, 1.0);

  await salesPage.returnFromDelivery();
  await salesPage.createCreditNote();

  await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
});