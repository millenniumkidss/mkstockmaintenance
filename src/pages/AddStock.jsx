import React, { useEffect, useState } from "react";
import {
  getItems,
  saveItems,
  getPurchases,
  savePurchases,
  getMovements,
  saveMovements,
} from "../utils/stockStorage";
import "./AddStock.css";

const CATEGORIES = ["Cleaning", "Student", "Stationery", "Office"];

const getToday = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const emptyForm = () => ({
  date: getToday(),
  category: "",
  itemName: "",
  quantity: "",
  supplier: "",
  invoice: "",
  price: "",
});

function AddStock() {
  const [items, setItems] = useState([]);
  const [purchases, setPurchaseList] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingPurchaseId, setEditingPurchaseId] = useState(null);

  function loadData() {
    setItems(getItems());
    setPurchaseList(getPurchases());
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateForm(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm());
    setEditingPurchaseId(null);
  }

  // Create or update a stock item without losing its existing details.
  function findOrCreateItem(stockItems, name, category) {
    let found = stockItems.find(
      (item) =>
        item.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        item.category === category,
    );

    if (found) {
      return { items: stockItems, item: found };
    }

    const newItem = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      name: name.trim(),
      category,
      unit: "Pieces",
      minimumStock: 0,
      quantity: 0,
    };

    return {
      items: [...stockItems, newItem],
      item: newItem,
    };
  }

  function handleSubmit(event) {
    event.preventDefault();

    const itemName = form.itemName.trim();
    const quantity = Number(form.quantity);
    const price = form.price === "" ? 0 : Number(form.price);

    if (!form.date) {
      alert("Please select the purchase date.");
      return;
    }

    if (!CATEGORIES.includes(form.category)) {
      alert("Please select a valid category.");
      return;
    }

    if (!itemName) {
      alert("Please enter the stock name.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      alert("Please enter a quantity greater than zero.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      alert("Please enter a valid price per unit.");
      return;
    }

    const currentItems = getItems();
    const currentPurchases = getPurchases();
    const currentMovements = getMovements();

    const oldPurchase =
      editingPurchaseId !== null
        ? currentPurchases.find(
            (purchase) => String(purchase.id) === String(editingPurchaseId),
          )
        : null;

    if (editingPurchaseId !== null && !oldPurchase) {
      alert("Purchase not found. Refresh the page and try again.");
      return;
    }

    let updatedItems = [...currentItems];

    // Editing: reverse the original purchase before applying the new one.
    if (oldPurchase) {
      const oldItem = updatedItems.find(
        (item) => String(item.id) === String(oldPurchase.itemId),
      );

      if (!oldItem) {
        alert("The original stock item could not be found.");
        return;
      }

      const quantityAfterReversal =
        (Number(oldItem.quantity) || 0) - Number(oldPurchase.quantity || 0);

      // Do not allow editing if the original purchased quantity has
      // already been consumed through issues or other stock movements.
      if (quantityAfterReversal < 0) {
        alert(
          "This purchase cannot be edited because some of its stock is no longer available in central inventory. Please reconcile the stock first.",
        );
        return;
      }

      updatedItems = updatedItems.map((item) =>
        String(item.id) === String(oldItem.id)
          ? { ...item, quantity: quantityAfterReversal }
          : item,
      );
    }

    // Find the item by name + category, or create it if it does not exist.
    const result = findOrCreateItem(updatedItems, itemName, form.category);

    updatedItems = result.items;
    const selectedItem = result.item;

    // Add the new purchase quantity to the selected stock item.
    updatedItems = updatedItems.map((item) =>
      String(item.id) === String(selectedItem.id)
        ? {
            ...item,
            quantity: (Number(item.quantity) || 0) + quantity,
          }
        : item,
    );

    const purchase = {
      id: oldPurchase ? oldPurchase.id : Date.now(),
      date: form.date,
      category: form.category,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      unit: selectedItem.unit || "Pieces",
      quantity,
      supplier: form.supplier.trim(),
      invoice: form.invoice.trim(),
      price,
      total: quantity * price,
    };

    const updatedPurchases = oldPurchase
      ? currentPurchases.map((entry) =>
          String(entry.id) === String(editingPurchaseId) ? purchase : entry,
        )
      : [purchase, ...currentPurchases];

    // Remove the previous movement associated with this purchase when
    // editing. Keep other purchases and all issue/return movements.
    let updatedMovements = currentMovements;

    if (oldPurchase) {
      updatedMovements = updatedMovements.filter(
        (movement) => String(movement.id) !== String(oldPurchase.movementId),
      );

      // Older records may not have movementId, so match their details.
      updatedMovements = updatedMovements.filter((movement) => {
        if (movement.type !== "Purchase") return true;

        const sameItem = String(movement.itemId) === String(oldPurchase.itemId);
        const sameDate = movement.date === oldPurchase.date;
        const sameQuantity =
          Number(movement.quantity) === Number(oldPurchase.quantity);

        const sameInvoice = oldPurchase.invoice
          ? String(movement.note || "").includes(oldPurchase.invoice)
          : String(movement.note || "") === "Stock purchase";

        return !(sameItem && sameDate && sameQuantity && sameInvoice);
      });
    }

    const movementId = Date.now() + 1;

    const movement = {
      id: movementId,
      date: form.date,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      type: "Purchase",
      quantity,
      branch: "Central Stock",
      note: form.invoice.trim()
        ? `Invoice: ${form.invoice.trim()}`
        : "Stock purchase",
    };

    purchase.movementId = movementId;
    updatedMovements = [movement, ...updatedMovements];

    try {
      saveItems(updatedItems);
      savePurchases(updatedPurchases);
      saveMovements(updatedMovements);

      setItems(updatedItems);
      setPurchaseList(updatedPurchases);
      resetForm();

      alert(
        oldPurchase
          ? "Purchase updated successfully."
          : "Purchase saved and central stock updated successfully.",
      );
    } catch (error) {
      console.error("Unable to save purchase:", error);
      alert("Unable to save the purchase. Please try again.");
      loadData();
    }
  }

  function handleEditPurchase(purchase) {
    setEditingPurchaseId(purchase.id);

    setForm({
      date: purchase.date || getToday(),
      category: purchase.category || "",
      itemName: purchase.itemName || "",
      quantity: String(purchase.quantity ?? ""),
      supplier: purchase.supplier || "",
      invoice: purchase.invoice || "",
      price:
        purchase.price === undefined || purchase.price === null
          ? ""
          : String(purchase.price),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDeletePurchase(purchase) {
    const confirmed = window.confirm(
      `Delete the purchase of "${purchase.itemName}" (${purchase.quantity} ${purchase.unit || ""})? This will reduce central stock.`,
    );

    if (!confirmed) return;

    const currentItems = getItems();
    const currentPurchases = getPurchases();
    const currentMovements = getMovements();

    const purchaseExists = currentPurchases.some(
      (entry) => String(entry.id) === String(purchase.id),
    );

    if (!purchaseExists) {
      alert("Purchase not found. Refresh the page and try again.");
      loadData();
      return;
    }

    const stockItem = currentItems.find(
      (item) => String(item.id) === String(purchase.itemId),
    );

    if (!stockItem) {
      alert("The associated stock item was not found. Nothing was deleted.");
      return;
    }

    const currentQuantity = Number(stockItem.quantity) || 0;
    const purchaseQuantity = Number(purchase.quantity) || 0;

    if (currentQuantity < purchaseQuantity) {
      alert(
        "This purchase cannot be deleted because the full quantity is no longer available in central stock. Reconcile issued or returned stock first.",
      );
      return;
    }

    const updatedItems = currentItems.map((item) =>
      String(item.id) === String(purchase.itemId)
        ? {
            ...item,
            quantity: Math.max(
              0,
              (Number(item.quantity) || 0) - purchaseQuantity,
            ),
          }
        : item,
    );

    const updatedPurchases = currentPurchases.filter(
      (entry) => String(entry.id) !== String(purchase.id),
    );

    // Prefer the exact movement ID saved on the purchase record.
    let updatedMovements;

    if (purchase.movementId) {
      updatedMovements = currentMovements.filter(
        (movement) => String(movement.id) !== String(purchase.movementId),
      );
    } else {
      // Compatibility with older purchase records.
      let matched = false;

      updatedMovements = currentMovements.filter((movement) => {
        if (matched || movement.type !== "Purchase") return true;

        const sameItem = String(movement.itemId) === String(purchase.itemId);
        const sameDate = movement.date === purchase.date;
        const sameQuantity = Number(movement.quantity) === purchaseQuantity;

        const sameInvoice = purchase.invoice
          ? String(movement.note || "").includes(purchase.invoice)
          : String(movement.note || "") === "Stock purchase";

        if (sameItem && sameDate && sameQuantity && sameInvoice) {
          matched = true;
          return false;
        }

        return true;
      });
    }

    try {
      saveItems(updatedItems);
      savePurchases(updatedPurchases);
      saveMovements(updatedMovements);

      setItems(updatedItems);
      setPurchaseList(updatedPurchases);

      if (String(editingPurchaseId) === String(purchase.id)) {
        resetForm();
      }

      alert("Purchase deleted and central stock adjusted.");
    } catch (error) {
      console.error("Unable to delete purchase:", error);
      alert("Unable to delete the purchase. Please refresh and check stock.");
      loadData();
    }
  }

  return (
    <div className="add-stock-page">
      <div className="add-stock-heading">
        <div>
          <h1>Add / Purchase Stock</h1>
          <p>Record purchases and update your central inventory.</p>
        </div>
      </div>

      <div className="add-stock-info">
        <span className="add-stock-info-icon">📦</span>
        <div>
          <strong>Central Stock Purchase</strong>
          <p>
            The purchased quantity will be added to the selected item's current
            central stock.
          </p>
        </div>
      </div>

      <div className="add-stock-card">
        <h2>
          {editingPurchaseId !== null ? "Edit Purchase" : "Purchase Details"}
        </h2>

        {items.length === 0 && editingPurchaseId === null ? (
          <div className="add-stock-empty">
            You can enter a new stock name below. It will be added to Stock
            Overview when you save the purchase.
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="add-stock-form-grid">
            <label>
              Purchase Date *
              <input
                type="date"
                value={form.date}
                onChange={(event) => updateForm("date", event.target.value)}
                required
              />
            </label>

            <label>
              Category *
              <select
                value={form.category}
                onChange={(event) => updateForm("category", event.target.value)}
                required
              >
                <option value="">Choose a category</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Stock Name *
              <input
                type="text"
                value={form.itemName}
                onChange={(event) => updateForm("itemName", event.target.value)}
                placeholder="Enter stock name"
                required
              />
            </label>

            <label>
              Quantity Purchased *
              <input
                type="number"
                min="0.01"
                step="any"
                value={form.quantity}
                onChange={(event) => updateForm("quantity", event.target.value)}
                placeholder="Enter quantity"
                required
              />
            </label>

            <label>
              Supplier Name
              <input
                type="text"
                value={form.supplier}
                onChange={(event) => updateForm("supplier", event.target.value)}
                placeholder="Optional"
              />
            </label>

            <label>
              Invoice Number
              <input
                type="text"
                value={form.invoice}
                onChange={(event) => updateForm("invoice", event.target.value)}
                placeholder="Optional"
              />
            </label>

            <label>
              Price Per Unit (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => updateForm("price", event.target.value)}
                placeholder="Optional"
              />
            </label>
          </div>

          <div className="add-stock-form-actions">
            <button
              type="button"
              className="add-stock-reset-btn"
              onClick={resetForm}
            >
              {editingPurchaseId !== null ? "Cancel Edit" : "Clear Form"}
            </button>

            <button type="submit" className="add-stock-submit-btn">
              {editingPurchaseId !== null ? "Update Purchase" : "Save Purchase"}
            </button>
          </div>
        </form>
      </div>

      <div className="add-stock-card">
        <div className="add-stock-history-heading">
          <div>
            <h2>Recent Purchases</h2>
            <p>Purchase records saved in this browser.</p>
          </div>

          <button
            type="button"
            className="add-stock-print-btn"
            onClick={() => window.print()}
          >
            🖨 Print
          </button>
        </div>

        <div className="add-stock-table-wrapper">
          <table className="add-stock-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Stock Name</th>
                <th>Quantity</th>
                <th>Supplier</th>
                <th>Invoice</th>
                <th>Total Cost</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {purchases.length > 0 ? (
                purchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td>{purchase.date}</td>
                    <td>{purchase.category || "—"}</td>
                    <td>{purchase.itemName}</td>
                    <td>
                      {purchase.quantity} {purchase.unit}
                    </td>
                    <td>{purchase.supplier || "—"}</td>
                    <td>{purchase.invoice || "—"}</td>
                    <td>
                      {Number(purchase.price) > 0
                        ? `₹${Number(purchase.total || 0).toFixed(2)}`
                        : "—"}
                    </td>
                    <td>
                      <div className="purchase-actions">
                        <button
                          type="button"
                          className="purchase-edit-btn"
                          onClick={() => handleEditPurchase(purchase)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="purchase-delete-btn"
                          onClick={() => handleDeletePurchase(purchase)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="add-stock-no-records">
                    No purchases recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AddStock;
