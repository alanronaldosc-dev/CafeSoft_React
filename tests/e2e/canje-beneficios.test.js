import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { after, before, test } from "node:test";
import process from "node:process";
import { Builder, By, until } from "selenium-webdriver";

const appUrl = process.env.APP_BASE_URL || "http://localhost:5173";
const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;
const requestedCustomerName = process.env.TEST_CLIENT_NAME;
const requestedProductName = process.env.TEST_PRODUCT_NAME;
const evidenceDirectory = process.env.EVIDENCE_DIR || "tests/evidence";

let driver;

before(async () => {
  assert.ok(email, "Configura TEST_EMAIL con un usuario autorizado de pruebas.");
  assert.ok(password, "Configura TEST_PASSWORD con la contraseña de pruebas.");
  driver = await new Builder().forBrowser("chrome").build();
  driver.manage().setTimeouts({ implicit: 0, pageLoad: 30000, script: 10000 });
});

after(async () => {
  if (driver) {
    await driver.quit();
  }
});

// HU-023: flujo E2E de cotización, pago y saldo reflejado en la ficha.
test("canjea puntos, recalcula el total y actualiza el saldo del cliente", async () => {
  await driver.get(appUrl);
  await driver.findElement(By.css('input[type="email"]')).sendKeys(email);
  await driver.findElement(By.css('input[type="password"]')).sendKeys(password);
  await driver.findElement(By.css('button[type="submit"]')).click();

  const menuCarrito = await driver.wait(
    until.elementLocated(By.css('[data-testid="menu-carrito"]')),
    15000
  );
  await driver.wait(until.elementIsVisible(menuCarrito), 10000);
  await menuCarrito.click();

  const productCards = await driver.wait(
    async () => {
      const cards = await driver.findElements(
        By.css('[data-testid="producto-card"]')
      );
      return cards.length > 0 ? cards : null;
    },
    15000
  );
  let productCard;
  for (const card of productCards) {
    const name = await card.getText();
    if (!requestedProductName || name.includes(requestedProductName)) {
      productCard = card;
      break;
    }
  }
  assert.ok(
    productCard,
    requestedProductName
      ? `No se encontró el producto de prueba: ${requestedProductName}`
      : "No hay productos disponibles para la prueba."
  );
  await productCard.click();

  const clientSelect = await driver.wait(
    until.elementLocated(By.css('[data-testid="cliente-fidelizacion"]')),
    10000
  );
  await driver.wait(async () => {
    const options = await clientSelect.findElements(By.css("option"));
    return options.length > 1;
  }, 10000);

  const options = await clientSelect.findElements(By.css("option"));
  let clientOption;
  for (const option of options.slice(1)) {
    const name = (await option.getText()).split(" — ")[0];
    const balance = Number(await option.getAttribute("data-saldo-puntos"));
    if (
      Number.isFinite(balance) &&
      balance > 0 &&
      (!requestedCustomerName || name === requestedCustomerName)
    ) {
      clientOption = option;
      break;
    }
  }
  assert.ok(
    clientOption,
    requestedCustomerName
      ? `No se encontró un cliente activo con puntos: ${requestedCustomerName}`
      : "No se encontró un cliente activo con puntos disponibles."
  );

  const clientName = (await clientOption.getText()).split(" — ")[0];
  const clientId = await clientOption.getAttribute("value");
  const initialBalance = Number(
    await clientOption.getAttribute("data-saldo-puntos")
  );
  await clientOption.click();
  await saveEvidence("01-cliente-seleccionado.png");

  const totalBeforeDiscount = Number(
    await driver.findElement(By.css('[data-testid="total-venta"]')).getText()
  );
  const pointsInput = await driver.findElement(
    By.css('[data-testid="puntos-a-canjear"]')
  );
  await pointsInput.sendKeys("100");
  await driver.findElement(By.css('[data-testid="aplicar-canje"]')).click();

  const appliedRedemption = await driver.wait(
    until.elementLocated(By.css('[data-testid="canje-aplicado"]')),
    15000
  );
  const totalAfterDiscount = Number(
    await driver.findElement(By.css('[data-testid="total-venta"]')).getText()
  );
  assert.ok(
    Number.isFinite(totalAfterDiscount),
    "El total recalculado debe ser un importe válido."
  );
  assert.match(await appliedRedemption.getText(), /Descuento aplicado:/);
  assert.match(
    await appliedRedemption.getText(),
    /Descuento aplicado: \$20\.00 por 100 puntos/
  );
  assert.ok(
    totalAfterDiscount >= 0 && totalAfterDiscount < totalBeforeDiscount,
    "El total en pantalla debe reflejar un descuento sin volverse negativo."
  );
  await saveEvidence("02-descuento-y-total-recalculado.png");

  await driver.findElement(By.css('input[placeholder="Ej. Uriel"]')).sendKeys(
    `Prueba ${clientName}`
  );
  await driver.findElement(By.css('[data-testid="metodo-pago"]')).sendKeys("Tarjeta");
  await driver.findElement(By.css('[data-testid="cobrar-venta"]')).click();

  await driver.wait(
    until.elementLocated(By.css('[data-testid="saldo-puntos-restante"]')),
    15000
  );
  await saveEvidence("03-venta-y-saldo-restante.png");
  const remainingBalance = Number(
    await driver.findElement(By.css('[data-testid="saldo-puntos-restante"]')).getText()
      .then((text) => text.match(/\d+/)?.[0])
  );
  assert.ok(
    Number.isFinite(remainingBalance) && remainingBalance < initialBalance,
    "El saldo restante debe reflejar los puntos consumidos en la venta."
  );

  await driver.findElement(By.css('[data-testid="menu-clientes"]')).click();
  const clientSearch = await driver.findElement(
    By.css('[data-testid="buscar-clientes"]')
  );
  await clientSearch.sendKeys(clientName);
  const clientCard = await driver.wait(
    until.elementLocated(
      By.css(`[data-testid="ficha-cliente"][data-cliente-id="${clientId}"]`)
    ),
    15000
  );
  const displayedBalance = Number(
    await clientCard
      .findElement(By.css('[data-testid="saldo-puntos-ficha"]'))
      .getText()
      .then((text) => text.match(/\d+/)?.[0])
  );
  assert.equal(
    displayedBalance,
    remainingBalance,
    "La ficha debe mostrar el saldo de puntos devuelto por la API."
  );
  await saveEvidence("04-saldo-actualizado-en-ficha.png");
});

async function saveEvidence(fileName) {
  await mkdir(evidenceDirectory, { recursive: true });
  const screenshot = await driver.takeScreenshot();
  await writeFile(path.join(evidenceDirectory, fileName), screenshot, "base64");
}
