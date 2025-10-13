import { Page, expect } from "@playwright/test";

export class ReceiptPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async getDemandQuantity() {
    const demandQtyText = await this.page
      .locator('td[name="product_uom_qty"]')
      .innerText();
    return demandQtyText.trim();
  }

  async reportDoneQuantity(quantity: string) {
    const qtyDoneCell = this.page.locator('td[name="quantity_done"]');
    await qtyDoneCell.click();
    const qtyDoneInput = qtyDoneCell.locator("input");
    await qtyDoneInput.fill(quantity);
    await this.page.keyboard.press("Tab");
  }

  async validateReceipt() {
    await this.page.getByRole("button", { name: "Validate" }).click();
  }

  async verifyReceiptDone() {
    const doneStage = this.page.locator(
      'button.o_arrow_button_current[data-value="done"]'
    );
    await expect(doneStage).toHaveCSS("background-color", "rgb(36, 55, 66)");
  }

  async goBackToRFQ() {
    const rfqBreadcrumb = this.page.locator(
      ".breadcrumb-item.o_back_button a",
      { hasText: /^P0/ }
    );
    await rfqBreadcrumb.click();
  }
}
