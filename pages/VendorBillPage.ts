import { Page, expect } from "@playwright/test";

export class VendorBillPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async confirmBill() {
    await this.page.getByRole("button", { name: "Confirm" }).click();
  }

  async registerPayment(journal: string) {
    await this.page.getByRole("button", { name: "Register Payment" }).click();
    const journalInput = this.page.locator("#journal_id.o-autocomplete--input");
    await journalInput.fill(journal);
    await this.page.keyboard.press("Enter");
    await this.page.getByRole("button", { name: "Create Payment" }).click();
  }

  async verifyBillPaid() {
    const postedButton = this.page.locator(
      "button.o_arrow_button_current.o_arrow_button.disabled.text-uppercase[aria-current='step'][data-value='posted']"
    );
    await expect(postedButton).toHaveCSS("background-color", "rgb(36, 55, 66)");
    const paidRibbon = this.page.locator(
      "div.ribbon.ribbon-top-right span.bg-success"
    );
    await expect(paidRibbon).toHaveText("Paid");
    await expect(paidRibbon).toHaveClass(/bg-success/);
  }

  async goBackToRFQ() {
    const rfqBreadcrumb = this.page.locator(
      ".breadcrumb-item.o_back_button a",
      { hasText: /^P0/ }
    );
    await rfqBreadcrumb.click();
  }
}
