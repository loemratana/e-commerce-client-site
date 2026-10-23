import { describe, it } from "node:test";
import assert from "node:assert";
import React from "react";
import { Drawer } from "@base-ui/react/drawer";

describe("Base UI Drawer Component Integration", () => {
  it("exports all expected Base UI drawer primitives", () => {
    assert.strictEqual(typeof Drawer.Root, "function");
    assert.strictEqual(typeof Drawer.Trigger, "object");
    assert.strictEqual(typeof Drawer.Portal, "object");
    assert.strictEqual(typeof Drawer.Backdrop, "object");
    assert.strictEqual(typeof Drawer.Popup, "object");
    assert.strictEqual(typeof Drawer.Content, "object");
    assert.strictEqual(typeof Drawer.Close, "object");
    assert.strictEqual(typeof Drawer.Title, "object");
    assert.strictEqual(typeof Drawer.Description, "object");
    assert.strictEqual(typeof Drawer.Handle, "function");
  });

  it("creates React elements with custom configuration", () => {
    const element = React.createElement(
      Drawer.Root,
      { open: true, swipeDirection: "right" },
      React.createElement(
        Drawer.Portal,
        null,
        React.createElement(Drawer.Popup, { "data-slot": "drawer-popup" })
      )
    );
    assert.ok(element);
    assert.strictEqual(element.props.swipeDirection, "right");
    assert.strictEqual(element.props.open, true);
  });
});
