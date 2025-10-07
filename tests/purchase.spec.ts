import { test, expect, BrowserContext, Page } from "@playwright/test";
import dotenv from "dotenv";
dotenv.config();

let context: BrowserContext;
let page: Page;

function tomorrowDay(): string {
  const now = new Date();
  now.setDate(now.getDate() + 1); // add 1 day

  const pad = (n: number) => String(n).padStart(2, "0");

  const month = pad(now.getMonth() + 1); // months are 0-based
  const day = pad(now.getDate());
  const year = now.getFullYear();

  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
}

// Run once before all tests
test.beforeEach(async ({ browser }) => {
  context = await browser.newContext({
    recordVideo: {
      dir: "Videos/",
      size: { width: 800, height: 600 },
    },
  });

  page = await context.newPage();
  await page.goto(`${process.env.BASE_URL}/web/login?debug=1`);

  // Login
  await page.locator("#login").fill(process.env.EMAIL as string);
  await page.locator("#password").fill(process.env.PASSWORD as string);
  await page.getByRole("button", { name: "Log in" }).click();

  // Wait until user avatar is visible (ensures login is successful)
  await page.waitForSelector('button:has(img[alt="User"])', {
    state: "visible",
  });
});

// Run once after all tests
test.afterAll(async () => {
  await page.close();
  await context.close();
});

test("PUR-001 Create RFQ with vendor", async () => {
  // Go to Purchase
  await page
    .locator('a[data-menu-xmlid="purchase.menu_purchase_root"]')
    .click();

  // assert page title for RFQ
  await expect(
    page.locator(
      "div.o_cp_top_left ol.breadcrumb li.breadcrumb-item.active span.text-truncate"
    )
  ).toHaveText("Requests for Quotation");

  // Click on New button
  await page.getByRole("button", { name: "New" }).click();

  // Select Vendor
  const fullText = await page.locator("span.oe_topbar_name").innerText();
  const vendorName = fullText.replace(/\(.*?\)/, "").trim();
  const vendorInput = await page.locator("#partner_id");
  await vendorInput.fill(vendorName);

  // Confirm selection
  await page.keyboard.press("Enter");

  // fill expected Arrival date
  const expectedArrival = tomorrowDay();
  await page.fill("#date_planned", expectedArrival);
  await page.keyboard.press("Enter");

  // Add a product
  await page.getByRole("button", { name: "Add a product" }).click();

  // Fill product field
  const productInput = page.locator(
    'td[name="product_id"] input.o-autocomplete--input'
  );
  await productInput.fill("Scan Product");
  await page.keyboard.press("Tab");

  // Fill Expiration Date
  const expirationDateInput = page.locator(
    'td[name="expiration_date"] input.o_datepicker_input'
  );
  await expirationDateInput.fill("010128");
  await page.keyboard.press("Tab");

  // Fill quantity
  const quantityInput = page.locator('td[name="product_qty"] input');
  await quantityInput.fill("5");
  await page.keyboard.press("Tab");

  // Fill sales price
  const salePriceInput = page.locator('td[name="sale_price"] input');
  await salePriceInput.fill("20");
  await page.keyboard.press("Tab");

  // Fill unit price
  const unitPriceInput = page.locator('td[name="price_unit"] input');
  await unitPriceInput.fill("20");
  await page.keyboard.press("Tab");

  // Cloud save
  await page.getByRole("button", { name: "Save manually" }).click();

  // Assert RFQ state
  const rfqName = page.locator('div.o_field_char[name="name"] > span');
  await expect(rfqName).toHaveText(/^P0/);

  // Confirm RFQ order
  await page.locator("#draft_confirm").click();

  const purchaseOrderStage = page.locator(
    'div.o_statusbar_status button.o_arrow_button_current[data-value="purchase"]'
  );
  await expect(purchaseOrderStage).toHaveCSS(
    "background-color",
    "rgb(36, 55, 66)"
  );

  // Click to recieve products
  await page.getByRole("button", { name: "Receive Products" }).click();

  // Get Demand Quantity
  const demandQtyText = await page
    .locator('td[name="product_uom_qty"]')
    .innerText();
  const demandQty = demandQtyText.trim();

  // report Done Quantities
  const qtyDoneCell = page.locator('td[name="quantity_done"]');
  await qtyDoneCell.click();

  // Now fill the input that appears inside the same cell
  const qtyDoneInput = qtyDoneCell.locator("input");
  await qtyDoneInput.fill(demandQty);
  await page.keyboard.press("Tab");

  // Click to validate
  await page.getByRole("button", { name: "Validate" }).click();

  // Assert that the picking is done
  const doneStage = page.locator(
    'button.o_arrow_button_current[data-value="done"]'
  );
  await expect(doneStage).toHaveCSS("background-color", "rgb(36, 55, 66)");

  // Go back to RFQ
  const rfqBreadcrumb = page.locator(".breadcrumb-item.o_back_button a", {
    hasText: /^P0/,
  });
  await rfqBreadcrumb.click();

  // Create vendor bill
  await page.getByRole("button", { name: "Create Bill" }).click();

  // Confirm bill
  await page.getByRole("button", { name: "Confirm" }).click();

  // Register Payment
  await page.getByRole("button", { name: "Register Payment" }).click();
  const journalInput = page.locator("#journal_id.o-autocomplete--input");
  await journalInput.fill("Cash");
  await page.keyboard.press("Enter");
  const createPaymentBtn = page.getByRole("button", { name: "Create Payment" });
  await createPaymentBtn.click();

  // Assert that the bill is paid
  const postedButton = page.locator(
    "button.o_arrow_button_current.o_arrow_button.disabled.text-uppercase[aria-current='step'][data-value='posted']"
  );
  await expect(postedButton).toHaveCSS("background-color", "rgb(36, 55, 66)");

  const paidRibbon = page.locator(
    "div.ribbon.ribbon-top-right span.bg-success"
  );
  await expect(paidRibbon).toHaveText("Paid");
  await expect(paidRibbon).toHaveClass(/bg-success/);

  // Go back to RFQ
  rfqBreadcrumb.click();

  // Assert the button exists
  const vendorBillsButton = page.locator(
    "button[name='action_view_invoice'] div[name='invoice_count']"
  );
  await expect(vendorBillsButton).toBeVisible();
  await expect(vendorBillsButton.locator("span.o_stat_value")).toHaveText("1");
  await expect(vendorBillsButton.locator("span.o_stat_text")).toHaveText(
    "Vendor Bills"
  );

  // Try to cancel the RFQ
  await page.getByRole("button", { name: "Cancel" }).click();
  const modal = page.locator("div.modal-content");
  await expect(modal).toBeVisible();
  await expect(modal.locator("header.modal-header span")).toHaveText(
    "dawatech"
  );

  await expect(
    modal.locator("main.modal-body div.o_dialog_warning p")
  ).toHaveText(
    /Unable to cancel purchase order P0\d+ as some receptions have already been done./
  );

  await expect(
    modal.locator("footer.modal-footer button.btn-primary")
  ).toHaveText("Ok");

  // Click OK to close the modal
  await modal.locator("footer.modal-footer button.btn-primary").click();
});
