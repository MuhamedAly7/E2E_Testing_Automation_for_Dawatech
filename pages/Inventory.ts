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
    // Click the Products dropdown button
    const productsDropdownButton = this.page.locator(
      'button.dropdown-toggle[title="Products"]'
    );
    await expect(productsDropdownButton).toBeVisible();
    await productsDropdownButton.click();

    await this.page.waitForTimeout(1000);

    // Click the "Products" item in the dropdown list
    const dropdownProductLink = this.page.locator("a.dropdown-item", {
      hasText: "Products",
    });
    await expect(dropdownProductLink).toBeVisible();
    await dropdownProductLink.click();

    // Verify that the Products page is loaded
    const breadcrumb = this.page.locator(
      "div.o_cp_top_left >> span.text-truncate"
    );
    await expect(breadcrumb).toHaveText("Products");
  }

  async navigateToInternalTransfereInventory() {
    await this.page.waitForTimeout(1000);
    // Click the Products dropdown button
    const operationsDropdownButton = this.page.locator(
      'button.dropdown-toggle[title="Operations"]'
    );
    await expect(operationsDropdownButton).toBeVisible();
    await operationsDropdownButton.click();

    await this.page.waitForTimeout(1000);

    // Click the "Products" item in the dropdown list
    const dropdownInternalTransfereLink = this.page.locator("a.dropdown-item", {
      hasText: "Internal Transfers",
    });
    await expect(dropdownInternalTransfereLink).toBeVisible();
    await dropdownInternalTransfereLink.click();

    // Verify that the Products page is loaded
    const breadcrumb = this.page.locator(
      "div.o_cp_top_left >> span.text-truncate"
    );
    await expect(breadcrumb).toHaveText("Internal Transfers");
  }

  async createNewInternalTransfere(
    contact: string,
    productName: string,
    expirationDate: string,
    demand: number
  ) {
    // Clicking to new button
    await this.page.getByRole("button", { name: "New" }).click();
    await this.page.waitForTimeout(2000);

    // Fill contact field
    await this.page.locator("#partner_id").fill(contact);
    await this.page.keyboard.press("Enter");

    // fill source location
    await this.page.locator("#location_id").fill("WH");
    await this.page.keyboard.press("Enter");

    // fill dest location
    await this.page.locator("#location_dest_id").fill("WH");
    await this.page.keyboard.press("Enter");

    // Add new line
    await this.page.getByRole("button", { name: "Add a line" }).click();
    const productInput = this.page.locator(
      'td[name="product_id"] input.o-autocomplete--input'
    );

    await productInput.fill(productName);
    await this.page.keyboard.press("Tab");
    await this.page.waitForTimeout(500);

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

    // Add expiration date
    const expirationDateInput = this.page.locator(
      'td[name="expiration_date"] input.o_datepicker_input'
    );
    await expirationDateInput.fill(expirationDate);
    await this.page.keyboard.press("Tab");
    await this.page.waitForTimeout(500);

    // Add demand
    const demandInput = this.page.locator(
      'td[name="product_uom_qty"] input.o_input'
    );
    await demandInput.fill(demand.toString());
    await this.page.keyboard.press("Tab");
    await this.page.waitForTimeout(500);

    // Get On hand quantity
    const onHandInput = this.page.locator('td[name="onhand_qty"] span');
    const quantity = await onHandInput.textContent();

    const HandQuantity = parseFloat(quantity as string);

    // Assert the quantity must greater than demand
    expect(HandQuantity).toBeGreaterThanOrEqual(demand);

    // Click "MARK AS TO DO" Button
    await this.page.getByRole("button", { name: "Mark as Todo" }).click();
    await this.page.waitForTimeout(1000);

    //  Wait for the modal popup to appear
    const modal = this.page.locator(".modal-content");
    await expect(modal).toBeVisible();

    // Assert the warning message inside the popup
    await expect(modal).toContainText(
      "Source Location and Destination Location can't be the same."
    );

    // SClick the "Ok" button inside the modal
    await modal.locator('button:has-text("Ok")').click();
    await this.page.waitForTimeout(1000);

    // fill dest location
    await this.page.locator("#location_dest_id").fill("WH2");
    await this.page.keyboard.press("Enter");

    await this.page.waitForTimeout(2000);

    // Click "MARK AS TO DO" Button again after change dest Warehouse
    await this.page.getByRole("button", { name: "Mark as Todo" }).click();
    await this.page.waitForTimeout(2000);

    // Assert on status should be "WAITING" and have specific background color
    // Locate the "Ready" button in the status bar
    const readyStatusButton = this.page.locator(
      '.o_statusbar_status button.o_arrow_button_current[aria-checked="true"]'
    );
    // Wait until it is visible
    await readyStatusButton.waitFor({ state: "visible" });
    await expect(readyStatusButton).toHaveCSS(
      "background-color",
      "rgb(36, 55, 66)"
    );
    await this.page.waitForTimeout(500);

    // Validate
    const validateButton = this.page.locator('button[name="button_validate"]');
    await validateButton.waitFor({ state: "visible" });
    await validateButton.click();

    // Handle modal and click to apply button
    const modalApply = this.page.locator(".modal-dialog.modal-lg");
    await expect(modal).toBeVisible();

    // Assert modal title text (optional but good practice)
    const modalTitle = modalApply.locator(".modal-title");
    await expect(modalTitle).toHaveText("Immediate Transfer?");

    // Locate the Apply button inside modal
    const applyButton = modalApply.locator('button[name="process"]');

    // Wait for it and click
    await applyButton.waitFor({ state: "visible" });
    await applyButton.click();

    await this.page.waitForTimeout(2000);

    // Assert done status
    const doneStatus = this.page.locator(
      '.o_statusbar_status .o_arrow_button_current[data-value="done"]'
    );
    // Ensure the status is visible
    await expect(doneStatus).toBeVisible();
    await expect(doneStatus).toHaveCSS("background-color", "rgb(36, 55, 66)");
  }

  async AssertOnStokeQuantities(productName: string) {
    await this.page.waitForTimeout(2000);
    // Navigate to products in inventory
    this.navigateToInventory();
    this.navigateToProductsInventory();

    // Navigate to or product card and go inside product
    const productCard = this.page.locator(".oe_kanban_card", {
      hasText: productName,
    });
    await productCard.waitFor({ state: "visible", timeout: 2000 });
    await productCard.click();

    // wait for product details
    await this.page.waitForTimeout(2000);

    // click to on-hand button
    const onHandButton = this.page.locator('button[name="action_open_quants"]');
    await onHandButton.waitFor({ state: "visible" });
    await onHandButton.click();
    await this.page.waitForTimeout(2000);

    // Find all rows
    const rows = await this.page.locator("table.o_list_table tbody tr");
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const location = await row.locator('td[name="location_id"]').innerText();
      const quantityText = await row.locator('td[name="quantity"]').innerText();

      // Remove whitespace and parse quantity
      const quantity = parseFloat(quantityText.trim());

      if (location === "WH/Stock") {
        expect(quantity).toBe(19);
      }

      if (location === "WH2/Stock") {
        expect(quantity).toBe(1);
      }
    }
  }

  async createNewProduct(
    productName: string,
    price: number,
    onHandQuantity: number
  ) {
    // Clicking to new button
    await this.page.getByRole("button", { name: "New" }).click();

    // locate product name field and fill it with productName
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
    await this.page.waitForTimeout(1000);
    // await this.page.keyboard.press("ArrowDown"); // select first option
    await this.page.keyboard.press("Enter");

    // Fill Expiration Date
    const expiryDateInput = this.page.locator(
      'tr.o_data_row.o_selected_row td[name="expiration_date"] input.o_input'
    );
    await expiryDateInput.waitFor({ state: "visible" });
    await expiryDateInput.fill("101028");
    await this.page.keyboard.press("Tab");

    // Fill Counted Quantity
    const countedQuantityInput = this.page.locator(
      'tr.o_data_row.o_selected_row td[name="inventory_quantity"] input.o_input'
    );
    await countedQuantityInput.waitFor({ state: "visible" });
    await countedQuantityInput.fill("20");

    // Click Apply button
    const applyBtn = this.page.locator('button[name="action_apply_inventory"]');
    await applyBtn.waitFor({ state: "visible" });
    await applyBtn.click();

    await this.page.waitForTimeout(5000);

    // Navigate back to “Products” via breadcrumb
    const productsBreadcrumb = this.page
      .locator(".breadcrumb a", { hasText: "Products" })
      .first();
    await productsBreadcrumb.waitFor({ state: "visible" });
    await productsBreadcrumb.click();

    // Assert the created product exists
    const productCard = this.page.locator(".oe_kanban_card", {
      hasText: productName,
    });
    await productCard.waitFor({ state: "visible" });

    // Validate On Hand and Price info
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

  async createNewProductWithBarCode(
    productName: string,
    productPrice: number,
    onHandQuantity: number,
    barCode: string
  ) {
    // Clicking to new button
    await this.page.getByRole("button", { name: "New" }).click();

    // locate product name field and fill it with productName
    const nameInput = this.page.locator("input#name");
    await nameInput.waitFor({ state: "visible" });
    await nameInput.fill(productName);

    // Locate product type selection and select storable product
    await this.page
      .locator("select#detailed_type")
      .selectOption({ label: "Storable Product" });
    // Add the sales price of the product
    await this.page.locator("#list_price").fill(productPrice.toString());

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

    // Fill barcode (Here we may handle if the barcode not valid)
    await this.page.getByRole("tab", { name: "General Information" }).click();
    await this.page.locator("#barcode").fill(barCode);

    // Cloud save
    await this.page.getByRole("button", { name: "Save manually" }).click();
    await this.page.waitForTimeout(2000);

    // Click on the “On Hand” button
    const onHandButton = this.page.locator('button[name="action_open_quants"]');
    await onHandButton.waitFor({ state: "visible" });
    await onHandButton.click();

    // Click “New” in the Quant list view
    const newQuantBtn = this.page.locator(
      "button.btn.btn-primary.o_list_button_add"
    );
    await newQuantBtn.waitFor({ state: "visible" });
    await newQuantBtn.click();

    // Select first location (click dropdown + press Enter)
    const locationInput = this.page
      .locator(
        'tr.o_data_row.o_selected_row td[name="location_id"] input.o_input'
      )
      .first();
    await locationInput.waitFor({ state: "visible" });
    await locationInput.click();
    await this.page.keyboard.press("ArrowDown"); // select first option
    await this.page.keyboard.press("Enter");

    // Fill Expiration Date
    const expiryDateInput = this.page.locator(
      'tr.o_data_row.o_selected_row td[name="expiration_date"] input.o_input'
    );
    await expiryDateInput.waitFor({ state: "visible" });
    await expiryDateInput.fill("101028");
    await this.page.keyboard.press("Tab");

    // Fill Counted Quantity
    const countedQuantityInput = this.page.locator(
      'tr.o_data_row.o_selected_row td[name="inventory_quantity"] input.o_input'
    );
    await countedQuantityInput.waitFor({ state: "visible" });
    await countedQuantityInput.fill("20");

    // Click Apply button
    const applyBtn = this.page.locator('button[name="action_apply_inventory"]');
    await applyBtn.waitFor({ state: "visible" });
    await applyBtn.click();

    await this.page.waitForTimeout(5000);

    // Navigate back to “Products” via breadcrumb
    const productsBreadcrumb = this.page
      .locator(".breadcrumb a", { hasText: "Products" })
      .first();
    await productsBreadcrumb.waitFor({ state: "visible" });
    await productsBreadcrumb.click();

    // Assert the created product exists
    const productCard = this.page.locator(".oe_kanban_card", {
      hasText: productName,
    });
    await productCard.waitFor({ state: "visible" });

    // Validate On Hand and Price info
    const priceText = await productCard
      .locator('[name="list_price"]')
      .innerText();
    const onHandText = await productCard
      .locator('div:has-text("On hand")')
      .first()
      .innerText();

    // Optionally, you can assert programmatically
    expect(priceText).toContain(productPrice.toString());
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
      // Locate the "On hand" element within the product card
      const onHandLocator = productCard
        .locator("text=On hand:")
        .locator("xpath=..");

      // Get the text content
      const onHandText = await onHandLocator.textContent();

      // Extract the quantity using a regex
      const match = onHandText?.match(/On hand:\s*([\d.,]+)/);
      const onHandQuantity = match
        ? parseFloat(match[1].replace(",", ""))
        : null;
      await productCard.click();

      if (onHandQuantity === 0) {
        // Click the Action dropdown button
        await this.page
          .locator("button.dropdown-toggle.btn.btn-light", {
            hasText: "Action",
          })
          .click();

        // Wait for the dropdown menu to appear and click “Archive”
        const archiveOption = this.page.locator(
          ".o-dropdown--menu .dropdown-item.o_menu_item",
          { hasText: "Archive" }
        );
        await archiveOption.waitFor({ state: "visible", timeout: 5000 });
        await archiveOption.click();

        // Wait for the confirmation popup and click the "Archive" button inside it
        const confirmArchiveButton = this.page.locator(
          ".modal-content .modal-footer button.btn.btn-primary",
          { hasText: "Archive" }
        );
        await confirmArchiveButton.waitFor({ state: "visible", timeout: 5000 });
        await confirmArchiveButton.click();

        // Expect the “Archived” ribbon to appear on the page
        const archivedRibbon = this.page.locator(
          ".ribbon.ribbon-top-right span",
          {
            hasText: "Archived",
          }
        );
        await expect(archivedRibbon).toBeVisible({ timeout: 5000 });
        await this.navigateToInventory();
        await this.navigateToProductsInventory();
        return;
      }

      // click to on-hand button
      const onHandButton = this.page.locator(
        'button[name="action_open_quants"]'
      );
      await onHandButton.waitFor({ state: "visible" });
      await onHandButton.click();

      // locate counted quantity and set it to zero
      await this.page.waitForSelector("table.o_list_table tbody tr");
      // const firstRow = this.page.locator("table.o_list_table tbody tr").first();
      // Locate all rows
      const rowCount = await this.page
        .locator("table.o_list_table tbody tr.o_data_row")
        .count();

      for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        const row = this.page.locator("table.o_list_table tbody tr").first();

        // Click the row to select it
        await row.click();

        // Locate the counted quantity input inside the selected row
        const countedQuantityInput = this.page.locator(
          'tr.o_data_row.o_selected_row td[name="inventory_quantity"] input.o_input'
        );

        // Wait for input and fill it
        await countedQuantityInput.waitFor({ state: "visible" });
        await countedQuantityInput.fill("0");
        await this.page.keyboard.press("Tab");

        // Wait a little (optional, to stabilize UI)
        await this.page.waitForTimeout(300);

        // Click the "Apply" button
        const applyBtn = this.page.locator(
          'button[name="action_apply_inventory"]'
        );
        await applyBtn.waitFor({ state: "visible" });
        await applyBtn.click();

        // Wait for apply to complete — use waitForSelector or similar to wait for UI update
        await this.page.waitForTimeout(1000); // or better: wait for a specific change
      }

      const productsBreadcrumb = this.page
        .locator(".breadcrumb a", { hasText: productName })
        .first();
      await productsBreadcrumb.waitFor({ state: "visible" });
      await productsBreadcrumb.click();

      // Click the Action dropdown button
      await this.page
        .locator("button.dropdown-toggle.btn.btn-light", { hasText: "Action" })
        .click();

      // Wait for the dropdown menu to appear and click “Archive”
      const archiveOption = this.page.locator(
        ".o-dropdown--menu .dropdown-item.o_menu_item",
        { hasText: "Archive" }
      );
      await archiveOption.waitFor({ state: "visible", timeout: 5000 });
      await archiveOption.click();

      // Wait for the confirmation popup and click the "Archive" button inside it
      const confirmArchiveButton = this.page.locator(
        ".modal-content .modal-footer button.btn.btn-primary",
        { hasText: "Archive" }
      );
      await confirmArchiveButton.waitFor({ state: "visible", timeout: 5000 });
      await confirmArchiveButton.click();

      // Expect the “Archived” ribbon to appear on the page
      const archivedRibbon = this.page.locator(
        ".ribbon.ribbon-top-right span",
        {
          hasText: "Archived",
        }
      );
      await expect(archivedRibbon).toBeVisible({ timeout: 5000 });
      await this.navigateToInventory();
      await this.navigateToProductsInventory();
    } catch (e) {
      return;
    }
  }
}
