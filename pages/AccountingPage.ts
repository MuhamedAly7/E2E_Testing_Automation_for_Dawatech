import { Page, expect, Locator } from "@playwright/test";

export class AccountingPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private async assertConfirmedButtonStatus(buttonContentText: string) {
    const buttonStatus = this.page.locator('.o_statusbar_status .o_arrow_button_current', {
      hasText: buttonContentText
    });
    await this.page.waitForTimeout(2000);
    await buttonStatus.waitFor({ state: 'visible' });
    await expect(buttonStatus).toHaveCSS("background-color", "rgb(36, 55, 66)");
  }

  async navigateToAccounting() {
    await this.page.locator('button[title="Home Menu"]').click();
    await this.page
      .locator(
        'span.dropdown-item.o_app[data-menu-xmlid="account.menu_finance"]'
      )
      .click();
    await this.page.waitForTimeout(2000); 
  }

  async navigateToAccountingInvoices() {
    // Click the Customers dropdown button
    const customersDropdownButton = this.page.locator(
      'button.dropdown-toggle[title="Customers"]'
    );
    await expect(customersDropdownButton).toBeVisible();
    await customersDropdownButton.click();

    await this.page.waitForTimeout(1000);

    const dropdownInvoicesLink = this.page.locator("a.dropdown-item", {
      hasText: "Invoices",
    });
    await expect(dropdownInvoicesLink).toBeVisible();
    await dropdownInvoicesLink.click();

    await this.page.waitForTimeout(2000);
  }

  async navigateToAccountingVendorBills() {
    // Click the Customers dropdown button
    const vendorsDropdownButton = this.page.locator(
      'button.dropdown-toggle[title="Vendors"]'
    );
    await expect(vendorsDropdownButton).toBeVisible();
    await vendorsDropdownButton.click();

    await this.page.waitForTimeout(1000);

    const dropdownBillsLink = this.page.locator("a.dropdown-item", {
      hasText: "Bills",
    });
    await expect(dropdownBillsLink).toBeVisible();
    await dropdownBillsLink.click();

    await this.page.waitForTimeout(2000);
  }

  async createNewVendorBill(productName: string, customerName: string) {
    await this.page.getByRole("button", { name: "New" }).click();
    await this.page.waitForTimeout(2000);

    // Fill customer field
    const customerField = this.page.locator("#partner_id");
    await customerField.click();
    await customerField.fill(customerName);
    await this.page.keyboard.press("Enter");

    await this.page.waitForTimeout(1000);

    // Start Adding Product
    await this.page.getByRole("button", {name: "Add a line"}).click();
    const productInput = this.page.locator(
      'td[name="product_id"] input.o-autocomplete--input'
    );
    await productInput.fill(productName);
    await this.page.keyboard.press("Tab");
    await this.page.waitForTimeout(1000);

    await this.page.locator('button[name="action_post"]').click();

    await this.page.waitForTimeout(2000);

    this.assertConfirmedButtonStatus("Posted");

    const ribbon = this.page.locator('.ribbon.ribbon-top-right span.bg-success');
    await expect(ribbon).toHaveText('Paid');

    await this.page.waitForTimeout(3000);
  }

  async createNewCustomerInvoiceAndRegisterPayment(productName: string, customerName: string) {
    await this.page.getByRole("button", { name: "New" }).click();

    await this.page.waitForTimeout(2000);

    // Fill customer field
    const customerField = this.page.locator("#partner_id");
    await customerField.click();
    await customerField.fill(customerName);
    await this.page.keyboard.press("Enter");

    await this.page.waitForTimeout(1000);

    // Start Adding Product
    await this.page.getByRole("button", {name: "Add a line"}).click();
    const productInput = this.page.locator(
      'td[name="product_id"] input.o-autocomplete--input'
    );
    await productInput.fill(productName);
    await this.page.keyboard.press("Tab");
    await this.page.waitForTimeout(1000);

    await this.page.locator('button[name="action_post"]').click();

    await this.page.waitForTimeout(2000);

    this.assertConfirmedButtonStatus("Posted");
    
    const registerPaymant = this.page.locator("#account_invoice_payment_btn");
    await expect(registerPaymant).toBeVisible();
    await registerPaymant.click();
    
    await this.page.waitForTimeout(2000);

    // expect a popup with "Register Payment" heading
    const registerPaymentmodal = this.page.locator('.modal-content:has-text("Register Payment")');
    await expect(registerPaymentmodal).toBeVisible();

    // Assert modal header is correct (optional, for clarity)
    await expect(registerPaymentmodal.locator('.modal-title')).toHaveText(/Register Payment/i);

    const createPaymentBtn = registerPaymentmodal.getByRole("button", {name: "Create Payment"});
    await expect(createPaymentBtn).toBeVisible();
    await createPaymentBtn.click();

    await this.page.waitForTimeout(2000);

    const ribbon = this.page.locator('.ribbon.ribbon-top-right span.bg-success');
    await expect(ribbon).toHaveText('Paid');

    await this.page.waitForTimeout(2000);
  }

  async vendorRefund() {
    // Start create credit note
    const creditNoteButton = this.page.locator('button[name="action_reverse"]');
    await creditNoteButton.waitFor({ state: 'visible' });
    await creditNoteButton.click();

    // expect a popup with "Credit Note" heading
    const addCreditNotemodal = this.page.locator('.modal-content:has-text("Credit Note")');
    await expect(addCreditNotemodal).toBeVisible();

    // Assert modal header is correct (optional, for clarity)
    await expect(addCreditNotemodal.locator('.modal-title')).toHaveText(/Credit Note/i);

    const reasonField = this.page.locator("#reason");
    await expect(reasonField).toBeVisible();
    await reasonField.fill("Automation Test");

    const applyBtn = addCreditNotemodal.getByRole("button", {name: "Reverse"});
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();

    await this.page.waitForTimeout(3000);

    await this.assertConfirmedButtonStatus("Draft");

    await this.page.getByRole('tab', { name: 'Other Info' }).click();

    await this.page.waitForTimeout(1000);

    // Fill customer field
    const customerField = this.page.locator("#warehouse_id");
    await customerField.click();
    await customerField.fill("WH");
    await this.page.keyboard.press("Enter");

    // Locate and click the "CONFIRM" button inside
    const creditNoteConfirmButton = this.page.locator('button[name="action_post"]');
    await creditNoteConfirmButton.waitFor({ state: "visible" });
    await creditNoteConfirmButton.click();

    const confirmModal = this.page.locator('.modal-content:has-text("Are you sure that you want to create stock moves with this Invoice.")');
    await expect(confirmModal).toBeVisible();

    // Click the OK button inside the modal
    await confirmModal.getByRole('button', { name: 'Ok' }).click();

    await this.page.waitForTimeout(2000);
    
    await this.assertConfirmedButtonStatus("Posted");
    
    const ribbon = this.page.locator('.ribbon.ribbon-top-right span.bg-success');
    await expect(ribbon).toHaveText('Paid');

    await this.page.waitForTimeout(2000);
  }

  async createCreditNoteAndRegisterPayment() {
    // Start create credit note
    const creditNoteButton = this.page.locator('button[name="action_reverse"]');
    await creditNoteButton.waitFor({ state: 'visible' });
    await creditNoteButton.click();

    // expect a popup with "Credit Note" heading
    const addCreditNotemodal = this.page.locator('.modal-content:has-text("Credit Note")');
    await expect(addCreditNotemodal).toBeVisible();

    // Assert modal header is correct (optional, for clarity)
    await expect(addCreditNotemodal.locator('.modal-title')).toHaveText(/Credit Note/i);

    const reasonField = this.page.locator("#reason");
    await expect(reasonField).toBeVisible();
    await reasonField.fill("Automation Test");

    const applyBtn = addCreditNotemodal.getByRole("button", {name: "Reverse"});
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();

    await this.page.waitForTimeout(2000);

    await this.assertConfirmedButtonStatus("Draft");

    await this.page.getByRole('tab', { name: 'Other Info' }).click();

    await this.page.waitForTimeout(1000);

    // Fill customer field
    const customerField = this.page.locator("#warehouse_id");
    await customerField.click();
    await customerField.fill("WH");
    await this.page.keyboard.press("Enter");

    await this.page.waitForTimeout(1000);

    // Locate and click the "CONFIRM" button inside
    const creditNoteConfirmButton = this.page.locator('button[name="action_post"]');
    await creditNoteConfirmButton.waitFor({ state: "visible" });
    await creditNoteConfirmButton.click();

    const confirmModal = this.page.locator('.modal-content:has-text("Are you sure that you want to create stock moves with this Invoice.")');
    await expect(confirmModal).toBeVisible();

    // Click the OK button inside the modal
    await confirmModal.getByRole('button', { name: 'Ok' }).click();

    await this.page.waitForTimeout(2000);

    this.assertConfirmedButtonStatus("Posted");

    const registerPaymant = this.page.locator("#account_invoice_payment_btn");
    await expect(registerPaymant).toBeVisible();
    await registerPaymant.click();
    
    await this.page.waitForTimeout(2000);

    // expect a popup with "Register Payment" heading
    const registerPaymentmodal = this.page.locator('.modal-content:has-text("Register Payment")');
    await expect(registerPaymentmodal).toBeVisible();

    // Assert modal header is correct (optional, for clarity)
    await expect(registerPaymentmodal.locator('.modal-title')).toHaveText(/Register Payment/i);

    const createPaymentBtn = registerPaymentmodal.getByRole("button", {name: "Create Payment"});
    await expect(createPaymentBtn).toBeVisible();
    await createPaymentBtn.click();

    await this.page.waitForTimeout(2000);

    const ribbon = this.page.locator('.ribbon.ribbon-top-right span.bg-success');
    await expect(ribbon).toHaveText('Paid');

    await this.page.waitForTimeout(2000);
  }

  async cancelPostedInvoice() {
    await this.page.getByRole('button', { name: 'Reset to Draft' }).click();
    this.page.waitForTimeout(3000);
    await this.assertConfirmedButtonStatus("Draft")
    
    // Locate and click the "CONFIRM" button inside
    const cancelPostedInvoiceConfirmButton = this.page.locator('button[name="action_post"]');
    await cancelPostedInvoiceConfirmButton.waitFor({ state: "visible" });
    await cancelPostedInvoiceConfirmButton.click();

    await this.page.waitForTimeout(1000);

    const confirmModal = this.page.locator('.modal-content:has-text("Are you sure that you want to create stock moves with this Invoice.")');
    await expect(confirmModal).toBeVisible();

    // Click the OK button inside the modal
    await confirmModal.getByRole('button', { name: 'Ok' }).click();

    await this.page.waitForTimeout(2000);

    await this.assertConfirmedButtonStatus("Posted");

    const registerPaymant = this.page.locator("#account_invoice_payment_btn");
    await expect(registerPaymant).toBeVisible();
    await registerPaymant.click();

    await this.page.waitForTimeout(2000);

    // expect a popup with "Register Payment" heading
    const registerPaymentmodal = this.page.locator('.modal-content:has-text("Register Payment")');
    await expect(registerPaymentmodal).toBeVisible();

    // Assert modal header is correct (optional, for clarity)
    await expect(registerPaymentmodal.locator('.modal-title')).toHaveText(/Register Payment/i);

    const createPaymentBtn = registerPaymentmodal.getByRole("button", {name: "Create Payment"});
    await expect(createPaymentBtn).toBeVisible();
    await createPaymentBtn.click();

    const ribbon = this.page.locator('.ribbon.ribbon-top-right span.bg-success');
    await expect(ribbon).toHaveText('Paid');

    await this.page.waitForTimeout(2000);
  }
}