import { Page, expect, Locator } from "@playwright/test";

export class SalesPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private async clickToMagicDeliveryButton() {
    const deliveryButton = this.page.locator('button[name="action_view_delivery"]');
    await deliveryButton.waitFor({ state: 'visible' });
    await deliveryButton.click();
  }

  private async assertConfirmedButtonStatus(buttonContentText: string) {
    const buttonStatus = this.page.locator('.o_statusbar_status .o_arrow_button_current', {
      hasText: buttonContentText
    });
    await buttonStatus.waitFor({ state: 'visible' });
    await expect(buttonStatus).toHaveCSS("background-color", "rgb(36, 55, 66)");
  }

  async navigateToSalesModule() {
    await this.page.locator('button[title="Home Menu"]').click();
    await this.page
      .locator(
        'span.dropdown-item.o_app[data-menu-xmlid="sale.sale_menu_root"]'
      )
      .click();
    await this.page.waitForTimeout(2000); 
  }

  async createNewQuotationAndGenerateInvoice(customerName: string, productName: string, quantity: number) {
    // Clicking to new button
    await this.page.getByRole("button", { name: "New" }).click();
    await this.page.waitForTimeout(2000);

    // Fill customer field
    const customerField = this.page.locator("#partner_id");
    await customerField.click();
    await customerField.fill(customerName);
    await this.page.keyboard.press("Enter");

    await this.page.waitForTimeout(500);

    // Fill Warehouse field
    const warehouseField = this.page.locator("#warehouse_id");
    await warehouseField.click();
    await warehouseField.fill("WH");
    await this.page.keyboard.press("Enter");

    await this.page.waitForTimeout(500);

    // Fill Expiration Date
    const expirationDateField = this.page.locator("#validity_date");
    await expirationDateField.click();
    await expirationDateField.fill("101030");
    await this.page.keyboard.press("Tab");

    await this.page.waitForTimeout(500);

    // Select Unit Pricing
    await this.page.locator("select#units_pricing").selectOption({label: "Pricelist Price"});

    await this.page.waitForTimeout(1000);

    // Select payment term
    const paymentTerm = this.page.locator("#payment_term_id");
    await paymentTerm.click();
    await this.page.waitForTimeout(1000);
    await this.page.keyboard.press("Enter");

    // Start Adding Product
    await this.page.getByRole("button", {name: "Add a product"}).click();
    const productInput = this.page.locator(
      'td[name="product_id"] input.o-autocomplete--input'
    );
    await productInput.fill(productName);
    await this.page.keyboard.press("Tab");
    await this.page.waitForTimeout(1000);

    // Select Lot source
    const lotInput = this.page.locator(
      'td[name="lot_id"] input.o-autocomplete--input'
    );
    await lotInput.click();
    await this.page.waitForTimeout(500);
    await this.page.keyboard.press("Enter");
    await this.page.waitForTimeout(500);
    await this.page.keyboard.press("Tab");
    await this.page.waitForTimeout(500);

    // Adding Quantity
    const quantityInput = this.page.locator(
      'td[name="product_uom_qty"] input.o_input'
    );
    await quantityInput.fill(quantity.toString());
    await this.page.keyboard.press("Tab");
    await this.page.waitForTimeout(500);

    // Confirm
    const confirmButton = this.page.locator('button[name="action_confirm"]');
    await confirmButton.waitFor({ state: "visible" });
    await confirmButton.click();

    await this.page.waitForTimeout(3000);

    // Locate the active status button
    this.assertConfirmedButtonStatus("Sales Order");

    await this.page.waitForTimeout(1000);

    await this.clickToMagicDeliveryButton();

    await this.page.waitForTimeout(3000);

    // Locate the active status button
    this.assertConfirmedButtonStatus("Ready");

    await this.page.waitForTimeout(1000);

    // Validate
    const validateButton = this.page.locator('button[name="button_validate"]');
    await validateButton.waitFor({ state: "visible" });
    await validateButton.click();

    const modal = this.page.locator('.modal-content:has-text("Immediate Transfer?")');
    await expect(modal).toBeVisible();

    // Locate and click the "Apply" button inside that modal
    const applyButton = modal.locator('button[name="process"]');
    await expect(applyButton).toBeVisible();
    await applyButton.click();

    await this.page.waitForTimeout(3000);

    // Locate the active status button
    this.assertConfirmedButtonStatus("Done");

    await this.page.waitForTimeout(1000);

    // Step back to SO
    const quotationsBreadcrumb = this.page.locator(".breadcrumb a", { hasText: /^S0/i });
    await quotationsBreadcrumb.click();

    await this.page.waitForTimeout(2000);

    // Start to generate invoice from S0
    const createInvoiceButton = this.page.locator("#create_invoice");
    await expect(createInvoiceButton).toBeVisible();
    await createInvoiceButton.click();

    await this.page.waitForTimeout(1000);

    // Wait for the modal to appear with the title "Create invoices"
    const createInvoicemodal = this.page.locator('.modal-content:has-text("Create invoices")');
    await expect(createInvoicemodal).toBeVisible();

    // Assert modal header is correct (optional, for clarity)
    await expect(createInvoicemodal.locator('.modal-title')).toHaveText(/Create invoices/i);

    // Locate the "Create Invoice" button (the secondary button, not "Create and View")
    const createInvoiceBtn = createInvoicemodal.locator('button#create_invoice');

    // Wait for it to be visible and click
    await expect(createInvoiceBtn).toBeVisible();
    await createInvoiceBtn.click();

    await this.page.waitForTimeout(3000);

    // Go to invoices page
    const InvoicesButton = this.page.locator('button[name="action_view_invoice"]');
    await InvoicesButton.waitFor({ state: 'visible' });
    await InvoicesButton.click();

    await this.page.waitForTimeout(3000);

    // Locate the active status button
    this.assertConfirmedButtonStatus("Draft");

    await this.page.waitForTimeout(1000);

    // Locate and click the "CONFIRM" button inside
    const invoiceConfirmButton = this.page.locator('button[name="action_post"]');
    await invoiceConfirmButton.waitFor({ state: "visible" });
    await invoiceConfirmButton.click();
    
    await this.page.waitForTimeout(3000);

    // Locate the active status button
    this.assertConfirmedButtonStatus("Posted");

    await this.page.waitForTimeout(1000);

    await quotationsBreadcrumb.click();
    await this.page.waitForTimeout(2000);
  }

  async returnFromDelivery() {
    const deliveryButton = this.page.locator('button[name="action_view_delivery"]');
    await deliveryButton.waitFor({ state: 'visible' });
    await deliveryButton.click();

    await this.page.waitForTimeout(2000);

    // click to return button
    await this.page.getByRole("button", {name: "Return"}).click();

    const returnmodal = this.page.locator('.modal-content:has-text("Reverse Transfer")');
    await expect(returnmodal).toBeVisible();
    await expect(returnmodal.locator('.modal-title')).toHaveText(/Reverse Transfer/i);
    const returnBtn = returnmodal.getByRole("button", {name: "Return"});
    await expect(returnBtn).toBeVisible();
    await returnBtn.click();

    await this.page.waitForTimeout(3000);

    // Assert ready status
    await this.assertConfirmedButtonStatus("Ready");

    // click to validate button
    const validateButton = this.page.locator('button[name="button_validate"]');
    await validateButton.waitFor({ state: 'visible' });
    await validateButton.click();

    await this.page.waitForTimeout(2000);

    const transferemodal = this.page.locator('.modal-content:has-text("Immediate Transfer?")');
    await expect(transferemodal).toBeVisible();
    await expect(transferemodal.locator('.modal-title')).toHaveText(/Immediate Transfer/i);
    const applyBtn = transferemodal.getByRole("button", {name: "Apply"});
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();

    await this.page.waitForTimeout(2000);

    this.assertConfirmedButtonStatus("Done");

    // Step back to SO
    const quotationsBreadcrumb = this.page.locator(".breadcrumb a", { hasText: /^S0/i });
    await quotationsBreadcrumb.click();

    const deliveryCount = this.page.locator(
      'button[name="action_view_delivery"] div[name="delivery_count"] .o_stat_value'
    );
    await expect(deliveryCount).toHaveText("2");
    await this.page.waitForTimeout(2000);

    // Go to invoices page
    const InvoicesButton = this.page.locator('button[name="action_view_invoice"]');
    await InvoicesButton.waitFor({ state: 'visible' });
    await InvoicesButton.click();

    await this.page.waitForTimeout(2000);

    const creditNoteButton = this.page.locator('button[name="action_reverse"]');
    await creditNoteButton.waitFor({ state: 'visible' });
    await creditNoteButton.click();

  }
}