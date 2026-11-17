import assert from "node:assert/strict";
import { test } from "node:test";
import { formatMoney, locales, otherLocale } from "../lib/i18n";
import { showcaseCopy, steps } from "../lib/showcase";

test("showcase locales have matching, nonempty dictionary entries", () => {
  function leaves(value: unknown, path = ""): string[] {
    if (typeof value === "string") {
      assert.ok(value.trim(), `Empty translation at ${path}`);
      return [path];
    }
    assert.ok(value && typeof value === "object");
    return Object.entries(value).flatMap(([key, child]) => leaves(child, `${path}.${key}`)).sort();
  }
  assert.deepEqual(leaves(showcaseCopy.sq), leaves(showcaseCopy.en));
  for (const locale of locales) {
    assert.equal(otherLocale(otherLocale(locale)), locale);
    assert.equal(Object.keys(showcaseCopy[locale].steps).length, steps.length);
    for (const step of steps) assert.ok(showcaseCopy[locale].statuses[step.status]);
    assert.ok(formatMoney(65, locale));
  }
});
