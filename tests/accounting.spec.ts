import { test, expect, BrowserContext, Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { OrdersPage } from "../pages/OrdersPage";
import { POSPage } from "../pages/POSPage";
import { InventoryPage } from "../pages/Inventory";
import dotenv from "dotenv";
import { SalesPage } from "../pages/SalesPage";
import { AccountingPage } from "../pages/AccountingPage";

dotenv.config();

let context: BrowserContext;
let page: Page;
let loginPage: LoginPage;
let posPage: POSPage;
let ordersPage: OrdersPage;
let inventoryPage: InventoryPage;
let salesPage: SalesPage;
let accountingPage: AccountingPage;

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
  accountingPage = new AccountingPage(page);

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

test("ACC-001: - Create customer invoice \n - Register payment \n - Customer refund", async () => {
    // Create new product
    const initialQuantity = 20;
    await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
    await inventoryPage.createNewProduct(
        process.env.PRODUCT_NAME as string,
        100.0,
        initialQuantity
    );

    await accountingPage.navigateToAccounting();
    await accountingPage.navigateToAccountingInvoices();
    await accountingPage.createNewCustomerInvoiceAndRegisterPayment(process.env.PRODUCT_NAME as string, process.env.USERNAME_CUSTOMERNAME_CASHIERNAME as string);
    await accountingPage.createCreditNoteAndRegisterPayment();

    await accountingPage.cancelPostedInvoice(); // Need more debugging

    // Archive the product
    await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
});

test("ACC-002: - Create vendor bill \n - Vendor refund", async () => {
    // Create new product
    const initialQuantity = 20;
    await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
    await inventoryPage.createNewProduct(
        process.env.PRODUCT_NAME as string,
        100.0,
        initialQuantity
    );

    await accountingPage.navigateToAccounting();
    await accountingPage.navigateToAccountingVendorBills();

    await accountingPage.createNewVendorBill(process.env.PRODUCT_NAME as string, process.env.USERNAME_CUSTOMERNAME_CASHIERNAME as string);
    await accountingPage.vendorRefund();

    // Archive the product
    await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
});