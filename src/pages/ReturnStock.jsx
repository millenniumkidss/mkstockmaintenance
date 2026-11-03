import { useEffect, useMemo, useState } from "react";
import "./ReturnStock.css";
import {
  getItems,
  saveItems,
  getMovements,
  saveMovements,
} from "../utils/stockStorage";

const BRANCHES = [
  "Khamla",
  "Narendra Nagar",
  "Nandanvan",
  "Medical",
  "Manewada",
];

const BRANCH_STOCK_KEY = "mk_branch_stock";
const RETURNS_KEY = "mk_stock_returns";

function readStorage(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ReturnStock() {
  const [items, setItems] = useState([]);
  const [branchStock, setBranchStock] = useState([]);
  const [returns, setReturns] = useState([]);
  const [branch, setBranch] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [returnDate, setReturnDate] = useState(getToday());
  const [returnedBy, setReturnedBy] = useState("");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  function loadData() {
    setItems(getItems());
    setBranchStock(readStorage(BRANCH_STOCK_KEY));
    setReturns(readStorage(RETURNS_KEY));
  }

  useEffect(() => {
    loadData();
  }, []);

  const availableItems = useMemo(() => {
    return branchStock.filter(
      (stock) => stock.branch === branch && Number(stock.quantity) > 0,
    );
  }, [branchStock, branch]);

  const selectedStock = availableItems.find(
    (stock) => String(stock.itemId) === String(itemId),
  );

  const availableQuantity = Number(selectedStock?.quantity) || 0;

  const filteredReturns = returns.filter((record) => {
    const searchText = search.toLowerCase();
    return (
      String(record.itemName || "")
        .toLowerCase()
        .includes(searchText) ||
      String(record.branch || "")
        .toLowerCase()
        .includes(searchText) ||
      String(record.returnedBy || "")
        .toLowerCase()
        .includes(searchText)
    );
  });

  function handleBranchChange(value) {
    setBranch(value);
    setItemId("");
    setQuantity("");
    setMessage("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const returnQty = Number(quantity);

    if (!branch || !itemId) {
      setMessage("Please select a branch and an item.");
      return;
    }

    if (!Number.isFinite(returnQty) || returnQty <= 0) {
      setMessage("Enter a valid return quantity greater than zero.");
      return;
    }

    const currentBranchStock = readStorage(BRANCH_STOCK_KEY);
    const branchIndex = currentBranchStock.findIndex(
      (stock) =>
        stock.branch === branch && String(stock.itemId) === String(itemId),
    );

    if (branchIndex === -1) {
      setMessage("This item was not found in the selected branch.");
      loadData();
      return;
    }

    const currentBranchQuantity =
      Number(currentBranchStock[branchIndex].quantity) || 0;

    if (returnQty > currentBranchQuantity) {
      setMessage(
        `Only ${currentBranchQuantity} ${currentBranchStock[branchIndex].unit || "units"} are available to return.`,
      );
      return;
    }

    const currentItems = getItems();
    const centralItemIndex = currentItems.findIndex(
      (item) => String(item.id) === String(itemId),
    );

    if (centralItemIndex === -1) {
      setMessage("This item was not found in central stock.");
      return;
    }

    const stockRecord = currentBranchStock[branchIndex];
    const item = currentItems[centralItemIndex];

    currentBranchStock[branchIndex] = {
      ...stockRecord,
      quantity: currentBranchQuantity - returnQty,
    };

    currentItems[centralItemIndex] = {
      ...item,
      quantity: (Number(item.quantity) || 0) + returnQty,
    };

    const newReturn = {
      id: createId(),
      date: returnDate || getToday(),
      branch,
      itemId: item.id,
      itemName: item.name,
      unit: item.unit || "Units",
      quantity: returnQty,
      returnedBy: returnedBy.trim(),
      note: note.trim(),
    };

    const currentReturns = readStorage(RETURNS_KEY);
    const currentMovements = getMovements();

    // Save both updated stock balances.
    localStorage.setItem(BRANCH_STOCK_KEY, JSON.stringify(currentBranchStock));
    saveItems(currentItems);

    // Save the return history.
    const updatedReturns = [newReturn, ...currentReturns];
    localStorage.setItem(RETURNS_KEY, JSON.stringify(updatedReturns));

    // Record the transaction in stock movements.
    saveMovements([
      {
        id: createId(),
        date: newReturn.date,
        type: "Returned",
        branch,
        itemId: item.id,
        itemName: item.name,
        unit: item.unit || "Units",
        quantity: returnQty,
        note: note.trim(),
      },
      ...currentMovements,
    ]);

    setQuantity("");
    setReturnedBy("");
    setNote("");
    setMessage(
      "Stock returned successfully. Central and branch stock updated.",
    );
    loadData();
  }

  function printReturns() {
    window.print();
  }

  return (
    <div className="return-stock-page">
      <div className="return-stock-heading">
        <div>
          <h1>Return Stock</h1>
          <p>Receive unused materials back from your branches.</p>
        </div>

        <button
          type="button"
          className="return-print-btn"
          onClick={printReturns}
        >
          Print Return History
        </button>
      </div>

      <div className="return-stock-summary">
        <div className="return-summary-card">
          <span>Total Return Entries</span>
          <strong>{returns.length}</strong>
        </div>

        <div className="return-summary-card">
          <span>Items Available for Return</span>
          <strong>
            {branchStock.filter((stock) => Number(stock.quantity) > 0).length}
          </strong>
        </div>

        <div className="return-summary-card">
          <span>Total Units Returned</span>
          <strong>
            {returns.reduce(
              (total, record) => total + (Number(record.quantity) || 0),
              0,
            )}
          </strong>
        </div>
      </div>

      <section className="return-form-card">
        <div className="return-section-title">
          <h2>Record a Stock Return</h2>
          <p>Select the branch and item being returned.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="return-form-grid">
            <div className="return-field">
              <label htmlFor="returnDate">Return Date *</label>
              <input
                id="returnDate"
                type="date"
                value={returnDate}
                onChange={(event) => setReturnDate(event.target.value)}
                required
              />
            </div>

            <div className="return-field">
              <label htmlFor="returnBranch">Branch *</label>
              <select
                id="returnBranch"
                value={branch}
                onChange={(event) => handleBranchChange(event.target.value)}
                required
              >
                <option value="">Select branch</option>
                {BRANCHES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="return-field">
              <label htmlFor="returnItem">Item *</label>
              <select
                id="returnItem"
                value={itemId}
                onChange={(event) => {
                  setItemId(event.target.value);
                  setQuantity("");
                  setMessage("");
                }}
                required
                disabled={!branch || availableItems.length === 0}
              >
                <option value="">
                  {!branch
                    ? "Select a branch first"
                    : availableItems.length === 0
                      ? "No stock available"
                      : "Select item"}
                </option>

                {availableItems.map((stock) => (
                  <option
                    key={`${stock.branch}-${stock.itemId}`}
                    value={stock.itemId}
                  >
                    {stock.itemName}
                  </option>
                ))}
              </select>
            </div>

            <div className="return-field">
              <label htmlFor="availableQuantity">Available in Branch</label>
              <input
                id="availableQuantity"
                type="text"
                value={
                  selectedStock
                    ? `${availableQuantity} ${selectedStock.unit || "Units"}`
                    : "—"
                }
                readOnly
              />
            </div>

            <div className="return-field">
              <label htmlFor="returnQuantity">Return Quantity *</label>
              <input
                id="returnQuantity"
                type="number"
                min="0.01"
                step="any"
                max={availableQuantity || undefined}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="Enter quantity"
                required
              />
            </div>

            <div className="return-field">
              <label htmlFor="returnedBy">Returned By</label>
              <input
                id="returnedBy"
                type="text"
                value={returnedBy}
                onChange={(event) => setReturnedBy(event.target.value)}
                placeholder="Teacher or staff name"
              />
            </div>

            <div className="return-field return-field-full">
              <label htmlFor="returnNote">Remarks</label>
              <textarea
                id="returnNote"
                rows="3"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional reason or remarks"
              />
            </div>
          </div>

          {message && (
            <div
              className={`return-message ${
                message.includes("successfully") ? "success" : "error"
              }`}
              role="status"
            >
              {message}
            </div>
          )}

          <div className="return-form-actions">
            <button type="submit" className="return-submit-btn">
              Confirm Return
            </button>
          </div>
        </form>
      </section>

      <section className="return-history-card">
        <div className="return-history-heading">
          <div>
            <h2>Return History</h2>
            <p>Previously recorded stock returns.</p>
          </div>

          <input
            type="search"
            className="return-search"
            placeholder="Search item, branch or staff..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="return-table-wrapper">
          <table className="return-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Branch</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Returned By</th>
                <th>Remarks</th>
              </tr>
            </thead>

            <tbody>
              {filteredReturns.length > 0 ? (
                filteredReturns.map((record) => (
                  <tr key={record.id}>
                    <td>{record.date}</td>
                    <td>{record.branch}</td>
                    <td>{record.itemName}</td>
                    <td>
                      <span className="return-quantity-badge">
                        +{record.quantity} {record.unit}
                      </span>
                    </td>
                    <td>{record.returnedBy || "—"}</td>
                    <td>{record.note || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="return-empty">
                    No return records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
