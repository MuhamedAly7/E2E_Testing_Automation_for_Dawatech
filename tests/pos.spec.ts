import { test, expect, BrowserContext, Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { OrdersPage } from "../pages/OrdersPage";
import { POSPage } from "../pages/POSPage";
import { InventoryPage } from "../pages/Inventory";
import dotenv from "dotenv";
import { Utils } from "../helper/utils";
dotenv.config();

let context: BrowserContext;
let page: Page;
let loginPage: LoginPage;
let posPage: POSPage;
let ordersPage: OrdersPage;
let inventoryPage: InventoryPage;

test.beforeEach(async ({ browser }) => {
  // context = await browser.newContext({
  //   recordVideo: {
  //     dir: "Videos/",
  //     size: { width: 800, height: 600 },
  //   },
  // });
  context = await browser.newContext();
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

test("POS-0001: - Load POS interface for authorized user \n - Add product to order \n - Session open/close \n - Return product from recent order \n - Refund issued via same payment method \n - Partial return/refund \n - Attempt to return product not from order \n - POS return reflected in backend order/invoice \n - POS left Panel Buttons hidden if config enabled \n - Header buttons and custom fields appear correctly \n - Closing session logs data by branch", async () => {
  // Go to the inventory module and create product (to guarantee that our product is exist)
  await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
  await inventoryPage.createNewProduct(
    process.env.PRODUCT_NAME as string,
    100.0,
    20
  );

  // Go to POS module
  await posPage.navigateToPOS();
  await posPage.handleSessionOpening();

  // Add product and handle lot popup
  await posPage.addProduct(process.env.PRODUCT_NAME as string);
  await posPage.handleLotPopup();

  // Verify product and update quantity
  await posPage.verifyProductInOrder(process.env.PRODUCT_NAME as string);
  await posPage.setQuantity("2");
  await expect(posPage.getQuantity()).toHaveText("2.000");

  // Process payment
  await posPage.initiatePayment();
  await expect(posPage.getPaymentHeader()).toHaveText("Payment");
  await posPage.selectPaymentMethod("Cash");
  await posPage.validatePayment();

  // Start new order
  await posPage.startNewOrder();

  // Process refund
  await posPage.initiateRefund();
  await posPage.selectFirstOrderRow();
  await posPage.verifyProductInOrder(/auto product/);
  await posPage.setQuantity("1");
  await posPage.initiateRefundPayment();

  // Attempt to add product during refund (should fail)
  await posPage.addProduct(process.env.PRODUCT_NAME as string);
  await posPage.handleLotPopup();
  await posPage.verifyRefundError();
  await posPage.dismissErrorPopup();

  // Complete refund
  await posPage.initiatePayment();
  await expect(posPage.getPaymentHeader()).toHaveText("Payment");
  await posPage.validatePayment();
  await posPage.startNewOrder();

  // Get receipt number and close session
  const receiptNumberPOS = await posPage.getFirstReceiptNumber();
  await posPage.closeSession();

  // Verify receipt in Orders page
  await ordersPage.navigateToOrders();
  const receiptNumber = await ordersPage.getFirstReceiptNumber();
  expect(receiptNumber).toBe(receiptNumberPOS);

  // archive the product
  await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
});

test("POS-002: - Increment/Decrement buttons function based on config \n - Draft order blocks session closure if enabled", async () => {
  // Go to the inventory module and create product (to guarantee that our product is exist)
  await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
  await inventoryPage.createNewProduct(
    process.env.PRODUCT_NAME as string,
    100.0,
    20
  );

  await posPage.navigateToPOS();
  await posPage.handleSessionOpening();

  // Add product and handle lot popup
  await posPage.addProduct(process.env.PRODUCT_NAME as string);
  await posPage.handleLotPopup();
  await posPage.verifyProductInOrder(process.env.PRODUCT_NAME as string);

  // Increment quantity
  await posPage.incrementQuantity();
  await posPage.addProduct(process.env.PRODUCT_NAME as string);
  await posPage.handleLotPopup();
  await posPage.verifyProductInOrder(process.env.PRODUCT_NAME as string);

  // Switch to ticket view and verify order rows
  await posPage.switchToTicketView();
  await expect(posPage.getOrderRows()).toHaveCount(2);

  // Decrement quantity and confirm
  await posPage.decrementQuantity();
  await posPage.confirmAction();
  await expect(posPage.getOrderRows()).toHaveCount(1);

  // Attempt to close session with draft order
  await posPage.clickCloseButton();
  await posPage.verifyDraftOrderError();
  await posPage.dismissErrorPopup();

  // Remove remaining product and close session
  await posPage.decrementQuantity();
  await posPage.confirmAction();

  await posPage.closeSession();
  await posPage.waitForPOSPage();

  // Verify Orders page navigation
  await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
});

test("POS-003: - Trigger popup for instructions from order line \n - Instructions linked to order backend", async () => {
  // Go to the inventory module and create product (to guarantee that our product is exist)
  await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
  await inventoryPage.createNewProduct(
    process.env.PRODUCT_NAME as string,
    100.0,
    20
  );

  await posPage.navigateToPOS();
  await posPage.handleSessionOpening();

  // Add product and handle lot popup
  await posPage.addProduct(process.env.PRODUCT_NAME as string);
  await posPage.handleLotPopup();
  await posPage.verifyProductInOrder(process.env.PRODUCT_NAME as string);

  // click to instruction button and handle all field
  await posPage.createInstructionNoteAndPay("test note instructions");

  // Archive the product
  await inventoryPage.navigateToInventory();
  await inventoryPage.navigateToProductsInventory();
  await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
});

test("POS-004: - Earn points based on config \n - Redeem points in order \n - Points accurately updated in backend", async () => {
  // Go to the inventory module and create product (to guarantee that our product is exist)
  await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
  await inventoryPage.createNewProduct(
    process.env.PRODUCT_NAME as string,
    100.0,
    20
  );

  // Start creating and configuraing the loyalty card
  await posPage.navigateToPOS();
  await posPage.navigateToDiscountAndLoyalty();
  await posPage.ArchiveAllPrograms();
  await posPage.createLoyalityCard(process.env.LOYALTY_CARD_NAME as string);
  await posPage.navigateToPOS();
  await posPage.handleSessionOpening();
  await posPage.selectCustomer(
    process.env.USERNAME_CUSTOMERNAME_CASHIERNAME as string
  );

  // Add product and handle lot popup
  await posPage.addProduct(process.env.PRODUCT_NAME as string);
  await posPage.handleLotPopup();
  await posPage.verifyProductInOrder(process.env.PRODUCT_NAME as string);

  await posPage.verifyEarnedPoints(
    (process.env.LOYALTY_CARD_NAME as string) + " Points"
  );

  // Make sure the reward still not fired
  await posPage.assretRewardNotFired();

  // Increase the quantity of product in order line
  await posPage.setQuantityByKeyboard(2);

  // Verify points after increasing
  await posPage.verifyEarnedPoints(
    (process.env.LOYALTY_CARD_NAME as string) + " Points"
  );

  // Make sure the reward fired after reach to configure points
  await posPage.assertRewardFired();

  // Redeem Point in orders after increasing the quantity to see the reward
  await posPage.clickToRewardButton();
  await posPage.assertDiscountHappening();

  // Process payment
  await posPage.initiatePayment();
  await expect(posPage.getPaymentHeader()).toHaveText("Payment");
  await posPage.selectPaymentMethod("Cash");
  await posPage.validatePayment();
  await posPage.startNewOrder();
  await posPage.closeSession();
  await posPage.waitForPOSPage();

  // Check backend for earned points
  await posPage.navigateToPOS();
  await posPage.navigateToDiscountAndLoyalty();
  await posPage.openProgram(process.env.LOYALTY_CARD_NAME as string);
  await posPage.openLoyaltyCardInsideProgram();

  // Archive the product
  await inventoryPage.navigateToInventory();
  await inventoryPage.navigateToProductsInventory();
  await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
});

test("POS-005: - Buy one get one program", async () => {
  // Go to the inventory module and create product (to guarantee that our product is exist)
  await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
  await inventoryPage.createNewProduct(
    process.env.PRODUCT_NAME as string,
    100.0,
    20
  );

  // Start creating and configuraing the buy one get one program
  await posPage.navigateToPOS();
  await posPage.navigateToDiscountAndLoyalty();
  await posPage.ArchiveAllPrograms();
  await posPage.createProgramBuyOneGetOne(
    process.env.LOYALTY_CARD_NAME as string
  );

  // Open POS
  await posPage.navigateToPOS();
  await posPage.handleSessionOpening();

  // Add product and handle lot popup
  await posPage.addProduct(process.env.PRODUCT_NAME as string);
  await posPage.handleLotPopup();
  await posPage.verifyProductInOrder(process.env.PRODUCT_NAME as string);

  // Make sure the reward fired after reach to configure points
  await posPage.assertRewardFired();

  // Redeem Point in orders after increasing the quantity to see the reward
  await posPage.clickToRewardButton();
  await posPage.assertGettingFreeProduct(process.env.PRODUCT_NAME as string);

  // Process payment
  await posPage.initiatePayment();
  await expect(posPage.getPaymentHeader()).toHaveText("Payment");
  await posPage.selectPaymentMethod("Cash");
  await posPage.validatePayment();
  await posPage.startNewOrder();
  await posPage.closeSession();
  await posPage.waitForPOSPage();

  // Check backend for using buy one get one program
  await posPage.navigateToPOS();
  await posPage.navigateToDiscountAndLoyalty();
  await posPage.openProgram(process.env.LOYALTY_CARD_NAME as string);
  await posPage.openLoyaltyCardInsideProgram();

  // Archive the product
  await inventoryPage.navigateToInventory();
  await inventoryPage.navigateToProductsInventory();
  await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
});

test("POS-005: - Price cut program", async () => {
  // Go to the inventory module and create product (to guarantee that our product is exist)
  await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
  await inventoryPage.createNewProduct(
    process.env.PRODUCT_NAME as string,
    100.0,
    20
  );

  // Start creating and configuraing the buy one get one program
  await posPage.navigateToPOS();
  await posPage.navigateToDiscountAndLoyalty();
  await posPage.ArchiveAllPrograms();
  await posPage.createProgramPriceCut(process.env.LOYALTY_CARD_NAME as string);

  // Open POS
  await posPage.navigateToPOS();
  await posPage.handleSessionOpening();

  // Add product and handle lot popup
  await posPage.addProduct(process.env.PRODUCT_NAME as string);
  await posPage.handleLotPopup();
  await posPage.verifyProductInOrder(process.env.PRODUCT_NAME as string);

  // Assert we have correct discount
  await posPage.assertGettingPriceCut(process.env.PRODUCT_NAME as string);

  // Process payment
  await posPage.initiatePayment();
  await expect(posPage.getPaymentHeader()).toHaveText("Payment");
  await posPage.selectPaymentMethod("Cash");
  await posPage.validatePayment();
  await posPage.startNewOrder();
  await posPage.closeSession();
  await posPage.waitForPOSPage();

  // Check backend for using buy one get one program
  await posPage.navigateToPOS();
  await posPage.navigateToDiscountAndLoyalty();
  await posPage.openProgram(process.env.LOYALTY_CARD_NAME as string);
  await posPage.openLoyaltyCardInsideProgram();

  // Archive the product
  await inventoryPage.navigateToInventory();
  await inventoryPage.navigateToProductsInventory();
  await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
});

test("POS-006: - Apply discount and taxes \n - Payment via multiple methods (employee should be allowed to have discount permission)", async () => {
  const productPrice = 100.0;
  // Go to the inventory module and create product (to guarantee that our product is exist)
  await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
  await inventoryPage.createNewProduct(
    process.env.PRODUCT_NAME as string,
    productPrice,
    20
  );

  // Archive all program to not make any conflict with pricing
  await posPage.navigateToPOS();
  await posPage.navigateToDiscountAndLoyalty();
  await posPage.ArchiveAllPrograms();

  // Open POS
  await posPage.navigateToPOS();
  await posPage.handleSessionOpening();

  // Add product and handle lot popup
  await posPage.addProduct(process.env.PRODUCT_NAME as string);
  await posPage.handleLotPopup();
  await posPage.verifyProductInOrder(process.env.PRODUCT_NAME as string);

  // Set 10% discount
  await posPage.setGlobalDiscount(10);
  await posPage.confirmDiscountedProduct();

  const priceAfterDiscount = productPrice - (productPrice * 0.1);

  // Process payment
  await posPage.initiatePayment();
  await expect(posPage.getPaymentHeader()).toHaveText("Payment");
  await posPage.selectPaymentMethodWithAmount("Cash", priceAfterDiscount / 3);
  await posPage.selectPaymentMethodWithAmount("Bank", priceAfterDiscount / 3);
  await posPage.selectCustomerFromPaymentPage(process.env.USERNAME_CUSTOMERNAME_CASHIERNAME as string);
  await posPage.selectPaymentMethodWithAmount("Customer Account", priceAfterDiscount / 3);
  await posPage.validatePayment();
  await posPage.startNewOrder();
  await posPage.closeSession();
  await posPage.waitForPOSPage();

  // Archive the product
  await inventoryPage.navigateToInventory();
  await inventoryPage.navigateToProductsInventory();
  await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
});

test("POS-007: - Valid QR scans load products \n - Invalid QR codes handled without error", async () => {
  // Go to the inventory module and create product (to guarantee that our product is exist)
  await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
  const barCode = Utils.generateBarcode();
  const wrongBarCode = barCode.slice(2);
  await inventoryPage.createNewProductWithBarCode(
    process.env.PRODUCT_NAME as string,
    100.0,
    20,
    barCode
  );

  // Archive all program to not make any conflict with pricing
  await posPage.navigateToPOS();
  await posPage.navigateToDiscountAndLoyalty();
  await posPage.ArchiveAllPrograms();

  // Open POS
  await posPage.navigateToPOS();
  await posPage.handleSessionOpening();

  // Add product buy scanning it's barcode
  await posPage.scanProduct(barCode);
  await posPage.verifyProductInOrder(process.env.PRODUCT_NAME as string);

  // Assert the wrong/invalid barcode was handled
  await posPage.handleWrongBarcode(wrongBarCode);

  // Process payment
  await posPage.initiatePayment();
  await expect(posPage.getPaymentHeader()).toHaveText("Payment");
  await posPage.selectPaymentMethod("Cash");
  await posPage.validatePayment();
  await posPage.startNewOrder();
  await posPage.closeSession();
  await posPage.waitForPOSPage();

  // Archive the product
  await inventoryPage.navigateToInventory();
  await inventoryPage.navigateToProductsInventory();
  await inventoryPage.archiveProduct(process.env.PRODUCT_NAME as string);
});
