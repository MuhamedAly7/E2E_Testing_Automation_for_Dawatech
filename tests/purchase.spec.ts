import { test, expect, BrowserContext, Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { PurchasePage } from "../pages/PurchasePage";
import { ReceiptPage } from "../pages/ReceiptPage";
import { VendorBillPage } from "../pages/VendorBillPage";
import dotenv from "dotenv";
import { Utils } from "../helper/utils";

dotenv.config();

let context: BrowserContext;
let page: Page;
let loginPage: LoginPage;
let purchasePage: PurchasePage;
let receiptPage: ReceiptPage;
let vendorBillPage: VendorBillPage;

test.beforeEach(async ({ browser }) => {
  context = await browser.newContext({
    recordVideo: {
      dir: "Videos/",
      size: { width: 800, height: 600 },
    },
  });
  page = await context.newPage();
  loginPage = new LoginPage(page);
  purchasePage = new PurchasePage(page);
  receiptPage = new ReceiptPage(page);
  vendorBillPage = new VendorBillPage(page);

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

test("PUR-001: - Create RFQ with vendor \n - Confirm RFQ to Purchase Order \n - Receive products \n - Create vendor bill from PO \n - Cancel confirmed PO \n- Reverse receipt after confirmation \n - Modify received quantity", async () => {
  await purchasePage.navigateToPurchase();
  await purchasePage.verifyPageTitle();
  await purchasePage.createNewRFQ();

  const vendorName = await purchasePage.getVendorName();
  await purchasePage.selectVendor(vendorName);
  await purchasePage.setExpectedArrivalDate(Utils.tomorrowDay());

  await purchasePage.addProduct("Scan Product", "010130", 5, 20, 20);
  await purchasePage.saveRFQ();
  await purchasePage.verifyRFQState();

  await purchasePage.confirmRFQ();
  await purchasePage.verifyPurchaseOrderStage();

  await purchasePage.receiveProducts();
  const demandQty = await receiptPage.getDemandQuantity();
  await receiptPage.reportDoneQuantity(demandQty);
  await receiptPage.validateReceipt();
  await receiptPage.verifyReceiptDone();

  await receiptPage.goBackToRFQ();
  await purchasePage.createVendorBill();
  await vendorBillPage.confirmBill();
  await vendorBillPage.registerPayment("Cash");
  await vendorBillPage.verifyBillPaid();

  await vendorBillPage.goBackToRFQ();
  await purchasePage.verifyVendorBillsCount();

  await purchasePage.cancelRFQ();
  await purchasePage.verifyCancelError();
  await purchasePage.closeCancelModal();
});
