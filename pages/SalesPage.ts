import { Page, expect, Locator } from "@playwright/test";

export class SalesPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateToSalesModule() {
    await this.page.locator('button[title="Home Menu"]').click();
    await this.page
      .locator(
        'span.dropdown-item.o_app[data-menu-xmlid="sale.sale_menu_root"]'
      )
      .click();
  }

  async createNewQuotation() {
    
  }
}