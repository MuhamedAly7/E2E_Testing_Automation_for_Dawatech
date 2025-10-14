import { Page, expect } from "@playwright/test";

export class PurchasePage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateToPurchase() {
    await this.page.locator('button[title="Home Menu"]').click();
    await this.page
      .locator(
        'span.dropdown-item.o_app[data-menu-xmlid="purchase.menu_purchase_root"]'
      )
      .click();
  }

  async verifyPageTitle() {
    await expect(
      this.page.locator(
        "div.o_cp_top_left ol.breadcrumb li.breadcrumb-item.active span.text-truncate"
      )
    ).toHaveText("Requests for Quotation");
  }

  async createNewRFQ() {
    await this.page.getByRole("button", { name: "New" }).click();
  }

  async getVendorName() {
    const fullText = await this.page.locator("span.oe_topbar_name").innerText();
    return fullText.replace(/\(.*?\)/, "").trim();
  }

  async selectVendor(vendorName: string) {
    const vendorInput = this.page.locator("#partner_id");
    await vendorInput.fill(vendorName);
    await this.page.keyboard.press("Enter");
  }

  async setExpectedArrivalDate(date: string) {
    await this.page.fill("#date_planned", date);
    await this.page.keyboard.press("Enter");
  }

  async addProduct(
    productName: string,
    expirationDate: string,
    quantity: number,
    salePrice: number,
    unitPrice: number
  ) {
    await this.page.getByRole("button", { name: "Add a product" }).click();
    const productInput = this.page.locator(
      'td[name="product_id"] input.o-autocomplete--input'
    );
    await productInput.fill(productName);
    await this.page.keyboard.press("Tab");

    const expirationDateInput = this.page.locator(
      'td[name="expiration_date"] input.o_datepicker_input'
    );
    await expirationDateInput.fill(expirationDate);
    await this.page.keyboard.press("Tab");

    const quantityInput = this.page.locator('td[name="product_qty"] input');
    await quantityInput.fill(quantity.toString());
    await this.page.keyboard.press("Tab");

    const salePriceInput = this.page.locator('td[name="sale_price"] input');
    await salePriceInput.fill(salePrice.toString());
    await this.page.keyboard.press("Tab");

    const unitPriceInput = this.page.locator('td[name="price_unit"] input');
    await unitPriceInput.fill(unitPrice.toString());
    await this.page.keyboard.press("Tab");
  }

  async saveRFQ() {
    await this.page.getByRole("button", { name: "Save manually" }).click();
  }

  async verifyRFQState() {
    const rfqName = this.page.locator('div.o_field_char[name="name"] > span');
    await expect(rfqName).toHaveText(/^P0/);
  }

  async confirmRFQ() {
    await this.page.locator("#draft_confirm").click();
  }

  async verifyPurchaseOrderStage() {
    const purchaseOrderStage = this.page.locator(
      'div.o_statusbar_status button.o_arrow_button_current[data-value="purchase"]'
    );
    await expect(purchaseOrderStage).toHaveCSS(
      "background-color",
      "rgb(36, 55, 66)"
    );
  }

  async receiveProducts() {
    await this.page.getByRole("button", { name: "Receive Products" }).click();
  }

  async createVendorBill() {
    await this.page.getByRole("button", { name: "Create Bill" }).click();
  }

  async verifyVendorBillsCount() {
    const vendorBillsButton = this.page.locator(
      "button[name='action_view_invoice'] div[name='invoice_count']"
    );
    await expect(vendorBillsButton).toBeVisible();
    await expect(vendorBillsButton.locator("span.o_stat_value")).toHaveText(
      "1"
    );
    await expect(vendorBillsButton.locator("span.o_stat_text")).toHaveText(
      "Vendor Bills"
    );
  }

  async cancelRFQ() {
    await this.page.getByRole("button", { name: "Cancel" }).click();
  }

  async verifyCancelError() {
    const modal = this.page.locator("div.modal-content");
    await expect(modal).toBeVisible();
    await expect(modal.locator("header.modal-header span")).toHaveText(
      "dawatech"
    );
    await expect(
      modal.locator("main.modal-body div.o_dialog_warning p")
    ).toHaveText(
      /Unable to cancel purchase order P0\d+ as some receptions have already been done./
    );
  }

  async closeCancelModal() {
    const modal = this.page.locator("div.modal-content");
    await modal.locator("footer.modal-footer button.btn-primary").click();
  }
}
