import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AppProvider, useQuote } from "@/providers/app-provider";
const id = "00000000-0000-4000-8000-000000000001";
function Consumer() {
  const { items, ready, add, remove } = useQuote();
  return (
    <>
      <span data-testid="count">{ready ? items.length : "loading"}</span>
      <span data-testid="quantity">{items[0]?.quantity ?? 0}</span>
      <button onClick={() => add(id, 10)}>Add</button>
      <button onClick={() => remove(id)}>Remove</button>
    </>
  );
}
describe("Guest quotation selection", () => {
  it("deduplicates products, respects minimum quantity and stores no PII", async () => {
    render(
      <AppProvider>
        <Consumer />
      </AppProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("0"),
    );
    fireEvent.click(screen.getByText("Add"));
    fireEvent.click(screen.getByText("Add"));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByTestId("quantity")).toHaveTextContent("20");
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("ptc-rfq")!)).toEqual([
        { productId: id, quantity: 20 },
      ]),
    );
    fireEvent.click(screen.getByText("Remove"));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });
  it("ignores corrupted saved selections", async () => {
    localStorage.setItem("ptc-rfq", '{"email":"private@example.com"}');
    render(
      <AppProvider>
        <Consumer />
      </AppProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("0"),
    );
  });
});
