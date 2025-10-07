import { Page, expect } from "@playwright/test";

export class LoginPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(host: string) {
    await this.page.goto(host);
  }

  async login(email: string, password: string) {
    await this.page.locator("#login").fill(email);
    await this.page.locator("#password").fill(password);
    await this.page.getByRole("button", { name: "Log in" }).click();
    await this.page.waitForSelector('button:has(img[alt="User"])', {
      state: "visible",
    });
  }
}
