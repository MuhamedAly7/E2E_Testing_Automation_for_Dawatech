import { Page, expect } from "@playwright/test";

export class OrdersPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateToOrders() {
    await this.page.waitForSelector(
      "ol.breadcrumb li span:text('Point of Sale')"
    );
    await this.page.locator("button.o_kanban_manage_toggle_button").click();
    await this.page.getByRole("menuitem", { name: "Orders" }).first().click();
  }

  async waitForOrdersPage() {
    await this.page.waitForSelector("ol.breadcrumb li span:text('Orders')");
  }

  async getFirstReceiptNumber() {
    return await this.page
      .locator('tbody tr.o_data_row:first-child td[name="pos_reference"]')
      .innerText();
  }
}
