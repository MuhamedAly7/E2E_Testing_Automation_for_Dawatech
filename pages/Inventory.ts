import { Page, expect, Locator } from "@playwright/test";

export class InventoryPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateToInventory() {
    await this.page.locator('button[title="Home Menu"]').click();
    await this.page
      .locator(
        'span.dropdown-item.o_app[data-menu-xmlid="stock.menu_stock_root"]'
      )
      .click();
  }

  async navigateToProductsInventory() {
    await this.page.waitForTimeout(1000);
    // Step 1: Click the Products dropdown button
    const productsDropdownButton = this.page.locator(
      'button.dropdown-toggle[title="Products"]'
    );
    await expect(productsDropdownButton).toBeVisible();
    await productsDropdownButton.click();

    await this.page.waitForTimeout(1000);

    // Step 2: Click the "Products" item in the dropdown list
    const dropdownProductLink = this.page.locator("a.dropdown-item", {
      hasText: "Products",
    });
    await expect(dropdownProductLink).toBeVisible();
    await dropdownProductLink.click();

    // Step 3: Verify that the Products page is loaded
    const breadcrumb = this.page.locator(
      "div.o_cp_top_left >> span.text-truncate"
    );
    await expect(breadcrumb).toHaveText("Products");
  }

  async createNewProduct(
    productName: string,
    price: number,
    onHandQuantity: number
  ) {
    // Clicking to new button
    await this.page.getByRole("button", { name: "New" }).click();

    // locate product name field and fill it with "auto product"
    const nameInput = this.page.locator("input#name");
    await nameInput.waitFor({ state: "visible" });
    await nameInput.fill(productName);

    // Locate product type selection and select storable product
    await this.page
      .locator("select#detailed_type")
      .selectOption({ label: "Storable Product" });
    // Add the sales price of the product
    await this.page.locator("#list_price").fill(price.toString());

    await this.page.getByRole("tab", { name: "Sales" }).click();

    // check available in POS
    const posCheckbox = this.page.locator("#available_in_pos");
    await posCheckbox.waitFor({ state: "visible" });
    try {
      await posCheckbox.isChecked();
      console.log("available in POS is already checked");
    } catch (e) {
      console.log("check in available on POS");
      await posCheckbox.check();
    }

    // Cloud save
    await this.page.getByRole("button", { name: "Save manually" }).click();

    // Step 1 — Click on the “On Hand” button
    const onHandButton = this.page.locator('button[name="action_open_quants"]');
    await onHandButton.waitFor({ state: "visible" });
    await onHandButton.click();

    // Step 2 — Click “New” in the Quant list view
    const newQuantBtn = this.page.locator(
      "button.btn.btn-primary.o_list_button_add"
    );
    await newQuantBtn.waitFor({ state: "visible" });
    await newQuantBtn.click();

    // Step 3 — Select first location (click dropdown + press Enter)
    const locationInput = this.page
      .locator(
        'tr.o_data_row.o_selected_row td[name="location_id"] input.o_input'
      )
      .first();
    await locationInput.waitFor({ state: "visible" });
    await locationInput.click();
    await this.page.keyboard.press("ArrowDown"); // select first option
    await this.page.keyboard.press("Enter");

    // Step 4 — Fill Expiration Date
    const expiryDateInput = this.page.locator(
      'tr.o_data_row.o_selected_row td[name="expiration_date"] input.o_input'
    );
    await expiryDateInput.waitFor({ state: "visible" });
    await expiryDateInput.fill("101028");
    await this.page.keyboard.press("Tab");

    // Step 5 — Fill Counted Quantity
    const countedQuantityInput = this.page.locator(
      'tr.o_data_row.o_selected_row td[name="inventory_quantity"] input.o_input'
    );
    await countedQuantityInput.waitFor({ state: "visible" });
    await countedQuantityInput.fill("20");

    // Step 6 — Click Apply button
    const applyBtn = this.page.locator('button[name="action_apply_inventory"]');
    await applyBtn.waitFor({ state: "visible" });
    await applyBtn.click();

    await this.page.waitForTimeout(5000);

    // Step 7 — Navigate back to “Products” via breadcrumb
    const productsBreadcrumb = this.page
      .locator(".breadcrumb a", { hasText: "Products" })
      .first();
    await productsBreadcrumb.waitFor({ state: "visible" });
    await productsBreadcrumb.click();

    // Step 8 — Assert the created product exists
    const productCard = this.page.locator(".oe_kanban_card", {
      hasText: productName,
    });
    await productCard.waitFor({ state: "visible" });

    // Step 9 — Validate On Hand and Price info
    const priceText = await productCard
      .locator('[name="list_price"]')
      .innerText();
    const onHandText = await productCard
      .locator('div:has-text("On hand")')
      .first()
      .innerText();

    // Optionally, you can assert programmatically
    expect(priceText).toContain(price.toString());
    expect(onHandText).toContain(onHandQuantity.toString());
  }

  async archiveProduct(productName: string) {
    // Go  to inventory module
    await this.navigateToInventory();
    await this.navigateToProductsInventory();

    // find our product card
    try {
      const productCard = this.page.locator(".oe_kanban_card", {
        hasText: productName,
      });
      await productCard.waitFor({ state: "visible", timeout: 2000 });
      await productCard.click();
    } catch (e) {
      return;
    }

    // click to on-hand button
    const onHandButton = this.page.locator('button[name="action_open_quants"]');
    await onHandButton.waitFor({ state: "visible" });
    await onHandButton.click();

    // locate counted quantity and set it to zero
    await this.page.waitForSelector("table.o_list_table tbody tr");
    const firstRow = this.page.locator("table.o_list_table tbody tr").first();
    await firstRow.click();
    const countedQuantityInput = this.page.locator(
      'tr.o_data_row.o_selected_row td[name="inventory_quantity"] input.o_input'
    );
    await countedQuantityInput.click();
    await countedQuantityInput.waitFor({ state: "visible" });
    await countedQuantityInput.fill("0");
    await this.page.keyboard.press("Enter");

    // click apply button
    const applyBtn = this.page.locator('button[name="action_apply_inventory"]');
    await applyBtn.waitFor({ state: "visible" });
    await applyBtn.click();

    const productsBreadcrumb = this.page
      .locator(".breadcrumb a", { hasText: productName })
      .first();
    await productsBreadcrumb.waitFor({ state: "visible" });
    await productsBreadcrumb.click();

    // 1️⃣ Click the Action dropdown button
    await this.page
      .locator("button.dropdown-toggle.btn.btn-light", { hasText: "Action" })
      .click();

    // 2️⃣ Wait for the dropdown menu to appear and click “Archive”
    const archiveOption = this.page.locator(
      ".o-dropdown--menu .dropdown-item.o_menu_item",
      { hasText: "Archive" }
    );
    await archiveOption.waitFor({ state: "visible", timeout: 5000 });
    await archiveOption.click();

    // 3️⃣ Wait for the confirmation popup and click the "Archive" button inside it
    const confirmArchiveButton = this.page.locator(
      ".modal-content .modal-footer button.btn.btn-primary",
      { hasText: "Archive" }
    );
    await confirmArchiveButton.waitFor({ state: "visible", timeout: 5000 });
    await confirmArchiveButton.click();

    // 4️⃣ Expect the “Archived” ribbon to appear on the page
    const archivedRibbon = this.page.locator(".ribbon.ribbon-top-right span", {
      hasText: "Archived",
    });
    await expect(archivedRibbon).toBeVisible({ timeout: 5000 });
    await this.navigateToInventory();
    await this.navigateToProductsInventory();
  }
}
