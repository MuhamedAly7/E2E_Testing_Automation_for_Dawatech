import { Page, expect, Locator, BrowserContext } from "@playwright/test";

export class POSPage {
  private page: Page;
  private context: BrowserContext;
  constructor(page: Page, context: BrowserContext) {
    this.context = context;
    this.page = page;
  }

  async navigateToPOS() {
    await this.page.locator('button[title="Home Menu"]').click();
    await this.page
      .locator(
        'span.dropdown-item.o_app[data-menu-xmlid="point_of_sale.menu_point_root"]'
      )
      .click();
  }

  async navigateToDiscountAndLoyalty() {
    await this.page.waitForTimeout(1000);
    // Step 1: Click the Products dropdown button
    const productsDropdownButton = this.page.locator(
      'button.dropdown-toggle[title="Products"]'
    );
    await expect(productsDropdownButton).toBeVisible();
    await productsDropdownButton.click();

    await this.page.waitForTimeout(1000);

    // Step 2: Click the "Products" item in the dropdown list
    const dropdownDiscountLink = this.page.locator("a.dropdown-item", {
      hasText: "Discount & Loyalty",
    });
    await expect(dropdownDiscountLink).toBeVisible();
    await dropdownDiscountLink.click();

    // Step 3: Verify that the Products page is loaded
    const breadcrumb = this.page.locator(
      "div.o_cp_top_left >> span.text-truncate"
    );
    await expect(breadcrumb).toHaveText("Discount & Loyalty");
  }

  async waitForPOSPage() {
    await this.page.waitForSelector(
      "ol.breadcrumb li span:text('Point of Sale')"
    );
  }

  async handleSessionOpening() {
    try {
      const openSessionButtonsContainer = this.page.locator(
        ".col-6.o_kanban_primary_left"
      );
      await openSessionButtonsContainer.waitFor({ state: "visible" });
      await this.page.waitForTimeout(500);

      const childContainer = await openSessionButtonsContainer
        .locator("*")
        .count();
      if (childContainer === 0) {
        console.log(
          "Container is empty → handle POS session closing differently"
        );
        await this.page.locator("button.o_kanban_manage_toggle_button").click();
        await this.page.getByRole("menuitem", { name: "Sessions" }).click();
        await this.page
          .locator("table.o_list_table tbody tr.o_data_row")
          .first()
          .click();
        await this.page
          .locator('button:has-text("Close Session & Post Entries")')
          .click();
        await this.page
          .locator('.modal-content button:has-text("Close Session")')
          .click();
        await this.page.getByRole("link", { name: "Point of Sale" }).click();
      }
    } catch (e) {
      console.log("Container has elements → continue normal flow");
    }

    const openSessionButton = this.page
      .getByRole("button", { name: "New Session" })
      .or(this.page.getByRole("button", { name: "Continue selling" }))
      .or(this.page.getByRole("button", { name: "Open Session" }));

    await openSessionButton.waitFor({ state: "visible" });
    await openSessionButton.click();

    await this.page.waitForSelector(".login-overlay", { state: "visible" });

    const cashierBtn = this.page.getByRole("button", {
      name: "Select Cashier",
    });
    if (await cashierBtn.isVisible().catch(() => false)) {
      await cashierBtn.click();
      const selectingCashierPopup = this.page.locator(".popup-selection");
      await expect(selectingCashierPopup).toBeVisible();
      await selectingCashierPopup.getByText("Mohamed Hassan").click();
    }

    try {
      const openingCashControlPopupButton = await this.page.waitForSelector(
        ".popup.opening-cash-control >> text=Open session",
        { timeout: 3000 }
      );
      await openingCashControlPopupButton.click();
    } catch (e) {
      console.log("Popup did not appear, continue test...");
    }
  }

  async addProduct(productName: string) {
    await this.page
      .locator("article.product", {
        has: this.page.locator(".product-name", { hasText: productName }),
      })
      .click({ position: { x: 2, y: 0 } });
  }

  async handleLotPopup() {
    try {
      const popupVisible = await this.page
        .locator(
          ".popup-text:has(header.title:text('Lot/Serial Number(s) Required'))"
        )
        .isVisible({ timeout: 2000 });

      if (popupVisible) {
        const lotPopup = this.page.locator(
          ".popup-text:has(header.title:text('Lot/Serial Number(s) Required'))"
        );
        await lotPopup.locator(".product_lot_line .lot__name").first().click();
        await lotPopup.locator(".footer .button.confirm").click();
        console.log("✅ Lot popup handled successfully.");
      } else {
        console.log("No lot popup detected, continuing...");
      }
    } catch (e) {
      console.log("⚠️ No lot popup detected or error occurred, continuing...");
    }
  }

  async verifyProductInOrder(productName: string | RegExp) {
    const orderLine = this.page.locator("li.orderline.selected .product-name", {
      hasText: productName,
    });
    await expect(orderLine).toBeVisible();
  }

  async setQuantity(quantity: string) {
    await this.page
      .locator(".numpad .input-button.number-char", { hasText: quantity })
      .click();
  }

  getQuantity(): Locator {
    return this.page.locator("li.orderline.selected .info-list li.info em");
  }

  async initiatePayment() {
    await this.page.locator(".actionpad .button.pay.validation").click();
  }

  getPaymentHeader(): Locator {
    return this.page.locator(".top-content-center h1");
  }

  async selectPaymentMethod(method: string) {
    await this.page
      .locator(".paymentmethods .paymentmethod .payment-name", {
        hasText: method,
      })
      .click();
  }

  async validatePayment() {
    const validateBtn = this.page.locator(".button.next.validation.highlight");
    await expect(validateBtn).toBeVisible();
    await validateBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async startNewOrder() {
    const newOrderBtn = this.page.locator(".button.next.validation.highlight", {
      hasText: "New Order",
    });
    await expect(newOrderBtn).toBeVisible();
    await newOrderBtn.click();
  }

  async initiateRefund() {
    await this.page
      .locator(".control-buttons .control-button", { hasText: "Refund" })
      .click();
  }

  async selectFirstOrderRow() {
    await this.page.locator(".order-table.left-table tbody tr").first().click();
  }

  async verifyRefundError() {
    const errorPopup = this.page.locator(".popup.popup-error");
    await expect(errorPopup).toBeVisible();
    await expect(errorPopup.locator("p.title")).toHaveText("Error");
    await expect(errorPopup.locator("p.body")).toHaveText(
      "This is refund order you can't add product."
    );
  }

  async dismissErrorPopup() {
    await this.page.locator(".popup.popup-error .button.cancel").click();
    await this.page.waitForTimeout(1000);
  }

  async initiateRefundPayment() {
    await this.page
      .locator(".pads .button.pay.validation", { hasText: /^Refund$/ })
      .click();
  }

  async getFirstReceiptNumber() {
    await this.page
      .locator(".control-buttons .control-button", { hasText: "Refund" })
      .click();
    await this.page.waitForTimeout(2000);
    return await this.page
      .locator("table.order-table tbody tr:first-child td:nth-child(2)")
      .innerText();
  }

  async clickCloseButton() {
    const closeBtn = this.page.locator(".header-button", { hasText: "Close" });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
  }

  async closeSession() {
    this.clickCloseButton();
    const closingPopup = this.page.locator(".popup.close-pos-popup");
    await expect(closingPopup).toBeVisible();

    const cashRow = closingPopup.locator("tr", { hasText: "Cash" });
    const differenceValue = await cashRow.locator("td").last().innerText();
    const numericValue = differenceValue.replace(/[^\d.-]/g, "");
    const cashInput = cashRow.locator("input.pos-input");
    await cashInput.fill(numericValue);

    const closeSessionBtn = closingPopup.locator("footer .button.highlight", {
      hasText: "Close Session",
    });
    await expect(closeSessionBtn).toBeVisible();
    await closeSessionBtn.click();
  }

  async incrementQuantity() {
    await this.page.locator("div.pos-branding .add-order-button").click();
    await this.page.waitForTimeout(1000);
  }

  async decrementQuantity() {
    await this.page.locator("div.pos-branding .remove-order-button").click();
    await this.page.waitForTimeout(1000);
  }

  async switchToTicketView() {
    await this.page.locator("div.pos-branding .ticket-button").click();
  }

  getOrderRows(): Locator {
    return this.page.locator("table.order-table tbody tr");
  }

  async verifyDraftOrderError() {
    await expect(this.page.locator(".popup-error .body")).toHaveText(
      "You can't close this session because you have draft orders"
    );
    await this.page.waitForTimeout(1000);
  }

  async confirmAction() {
    await this.page.locator(".popup.popup-confirm .button.confirm").click();
  }

  async assertOnInstructionsPage(instruction: string) {
    // Click to medicine instructions dropdown
    const menuButton = this.page.locator(
      'button[title="Medicine Instructions"]'
    );
    await menuButton.waitFor({ state: "visible" });
    await menuButton.click();

    // choose instructions options
    const instructionsOption = this.page
      .locator("div.o-dropdown--menu a.dropdown-item", {
        hasText: "Instructions",
      })
      .first();
    await instructionsOption.waitFor({ state: "visible" });
    await instructionsOption.click();
    const breadcrumb = this.page.locator("ol.breadcrumb >> text=Instructions");
    await expect(breadcrumb).toBeVisible();

    // Locate the most recent instruction and open it's details
    const lastRow = this.page
      .locator("table.o_list_table tbody tr.o_data_row")
      .last();
    await lastRow.waitFor({ state: "visible" });
    await lastRow.click();

    // Assert on Note section
    await this.page.waitForSelector('div[name="note"] span');

    // Step 6️⃣: Get the note text and assert it
    const noteText = await this.page
      .locator('div[name="note"] span')
      .innerText();
    await expect(noteText).toBe(instruction);
  }

  async createInstructionNote(instruction: string) {
    // Locate and click the pencil icon
    const pencilIcon = this.page.locator(
      'i.fa.fa-pencil.show_instructions[title="Medical Instruction"]'
    );
    await pencilIcon.click();

    // Wait for popup to appear
    const popup = this.page.locator("div.popup.instruction_popup");
    await expect(popup).toBeVisible({ timeout: 5000 });

    // Fill the "Time" input field
    const timeInput = popup.locator("input#instruction_time");
    await timeInput.fill("1");

    // Click on "English (US)" language button
    const englishButton = popup.locator(
      'span.instruction-button[data-value="en_US"]'
    );
    await englishButton.click();

    // Fill the "Quantity" input field
    const quantityInput = popup.locator("input#quantity");
    await quantityInput.fill("1");

    // Fill the "Notes/Warnings" textarea
    const notesTextarea = popup.locator("textarea#notes");
    await notesTextarea.fill(instruction);

    // Fill start and end dates
    const today = new Date();
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    await popup.locator("input#start_date").fill(formatDate(today));
    await popup.locator("input#end_date").fill(formatDate(nextDay));

    // Click to print button
    const printButton = popup.locator("div.button.confirm", {
      hasText: "Print",
    });

    // Handle the print button that open new tab
    const [newPage] = await Promise.all([
      this.context.waitForEvent("page"), // wait for new tab to open
      await printButton.click(),
    ]);

    // Wait for the new page to load (optional)
    await newPage.waitForLoadState("domcontentloaded");

    // Close the new tab
    await newPage.close();

    // Process payment
    await this.initiatePayment();
    await expect(this.getPaymentHeader()).toHaveText("Payment");
    await this.selectPaymentMethod("Cash");
    await this.validatePayment();
    await this.startNewOrder();

    await this.closeSession();
    await this.waitForPOSPage();

    await this.assertOnInstructionsPage(instruction);
  }

  async createLoyalityCard(loyaltyCardName: string) {
    // Clicking to new button
    await this.page.getByRole("button", { name: "New" }).click();

    await this.page.waitForTimeout(1000);

    // Fill the name input
    await this.page
      .locator('div[name="name"] input#name')
      .fill(loyaltyCardName);
    await this.page.waitForTimeout(1000);

    // Select "Loyalty Cards" from dropdown
    await this.page
      .locator('div[name="program_type"] select#program_type')
      .selectOption({ label: "Loyalty Cards" });
    await this.page.waitForTimeout(500);

    // Locate and click "Point of Sale" checkpoint
    await this.page.getByRole("checkbox", { name: "Point of Sale" }).click();
    await this.page.waitForTimeout(500);

    

    // Cloud save
    await this.page.getByRole("button", { name: "Save manually" }).click();
    await this.page.waitForTimeout(500);
    
  }
}
