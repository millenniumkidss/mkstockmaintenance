import { useEffect, useMemo, useState } from "react";
import "./StockHistory.css";
import { getItems, getPurchases, getMovements } from "../utils/stockStorage";

function readStorage(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeType(type) {
  const value = String(type || "").toLowerCase();

  if (value.includes("return")) return "Returned";
  if (value.includes("issue")) return "Issued";
  if (value.includes("purchas") || value.includes("add")) return "Purchase";

  return type || "Other";
}

function getTransactionDate(record) {
  return record.date || record.purchaseDate || record.returnDate || "";
}

export default function StockHistory() {
  const [movements, setMovements] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  function loadHistory() {
    setMovements(getMovements());
    setPurchases(getPurchases());
    setItems(getItems());
  }

  useEffect(() => {
    loadHistory();

    const handleStorage = () => loadHistory();
    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const transactions = useMemo(() => {
    const movementRows = movements.map((record, index) => ({
      ...record,
      id: record.id || `movement-${index}`,
      date: getTransactionDate(record),
      type: normalizeType(record.type),
      itemName:
        record.itemName ||
        items.find((item) => String(item.id) === String(record.itemId))?.name ||
        "Unknown item",
      quantity: Number(record.quantity) || 0,
      branch: record.branch || "Head Office",
      note: record.note || record.remarks || "",
    }));

    // Some older purchase records may exist without a corresponding movement.
    // Add only those purchases that are not already represented in movements.
    const purchaseRows = purchases
      .filter((purchase) => {
        const purchaseItemId = purchase.itemId ?? purchase.item?.id;
        const purchaseDate = getTransactionDate(purchase);
        const purchaseQty = Number(purchase.quantity) || 0;

        return !movements.some((movement) => {
          const movementType = normalizeType(movement.type);
          const sameItem =
            String(movement.itemId) === String(purchaseItemId) ||
            String(movement.itemName || "") ===
              String(purchase.itemName || purchase.item?.name || "");

          return (
            movementType === "Purchase" &&
            sameItem &&
            getTransactionDate(movement) === purchaseDate &&
            (Number(movement.quantity) || 0) === purchaseQty
          );
        });
      })
      .map((purchase, index) => ({
        ...purchase,
        id: purchase.id || `purchase-${index}`,
        date: getTransactionDate(purchase),
        type: "Purchase",
        itemName:
          purchase.itemName ||
          purchase.item?.name ||
          items.find((item) => String(item.id) === String(purchase.itemId))
            ?.name ||
          "Unknown item",
        quantity: Number(purchase.quantity) || 0,
        branch: "Head Office",
        note: purchase.note || purchase.supplier || purchase.invoice || "",
      }));

    return [...movementRows, ...purchaseRows].sort((a, b) => {
      const dateCompare = String(b.date || "").localeCompare(
        String(a.date || ""),
      );

      if (dateCompare !== 0) return dateCompare;
      return String(b.id).localeCompare(String(a.id));
    });
  }, [movements, purchases, items]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((record) => {
      const matchesSearch =
        !query ||
        String(record.itemName).toLowerCase().includes(query) ||
        String(record.branch).toLowerCase().includes(query) ||
        String(record.note).toLowerCase().includes(query) ||
        String(record.type).toLowerCase().includes(query);

      const matchesType = typeFilter === "All" || record.type === typeFilter;

      const matchesBranch =
        branchFilter === "All" || record.branch === branchFilter;

      const matchesFrom = !fromDate || record.date >= fromDate;
      const matchesTo = !toDate || record.date <= toDate;

      return (
        matchesSearch &&
        matchesType &&
        matchesBranch &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [transactions, search, typeFilter, branchFilter, fromDate, toDate]);

  const totalPurchases = filteredTransactions
    .filter((record) => record.type === "Purchase")
    .reduce((total, record) => total + record.quantity, 0);

  const totalIssued = filteredTransactions
    .filter((record) => record.type === "Issued")
    .reduce((total, record) => total + record.quantity, 0);

  const totalReturned = filteredTransactions
    .filter((record) => record.type === "Returned")
    .reduce((total, record) => total + record.quantity, 0);

  function resetFilters() {
    setSearch("");
    setTypeFilter("All");
    setBranchFilter("All");
    setFromDate("");
    setToDate("");
  }

  function printHistory() {
    window.print();
  }

  return (
    <div className="stock-history-page">
      <div className="stock-history-heading">
        <div>
          <h1>Stock History</h1>
          <p>Track purchases, branch issues, and stock returns.</p>
        </div>

        <div className="stock-history-heading-actions">
          <button
            type="button"
            className="history-refresh-btn"
            onClick={loadHistory}
          >
            Refresh
          </button>
          <button
            type="button"
            className="history-print-btn"
            onClick={printHistory}
          >
            Print History
          </button>
        </div>
      </div>

      <div className="history-summary-grid">
        <div className="history-summary-card">
          <span>Transactions</span>
          <strong>{filteredTransactions.length}</strong>
        </div>
        <div className="history-summary-card">
          <span>Units Purchased</span>
          <strong>{totalPurchases}</strong>
        </div>
        <div className="history-summary-card">
          <span>Units Issued</span>
          <strong>{totalIssued}</strong>
        </div>
        <div className="history-summary-card">
          <span>Units Returned</span>
          <strong>{totalReturned}</strong>
        </div>
      </div>

      <section className="history-filter-card">
        <div className="history-filter-grid">
          <div className="history-field history-search-field">
            <label htmlFor="historySearch">Search</label>
            <input
              id="historySearch"
              type="search"
              placeholder="Search item, branch, remarks..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="history-field">
            <label htmlFor="historyType">Transaction Type</label>
            <select
              id="historyType"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Purchase">Purchase</option>
              <option value="Issued">Issued</option>
              <option value="Returned">Returned</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="history-field">
            <label htmlFor="historyBranch">Location</label>
            <select
              id="historyBranch"
              value={branchFilter}
              onChange={(event) => setBranchFilter(event.target.value)}
            >
              <option value="All">All Locations</option>
              <option value="Head Office">Head Office</option>
              <option value="Khamla">Khamla</option>
              <option value="Narendra Nagar">Narendra Nagar</option>
              <option value="Nandanvan">Nandanvan</option>
              <option value="Medical">Medical</option>
              <option value="Manewada">Manewada</option>
            </select>
          </div>

          <div className="history-field">
            <label htmlFor="historyFrom">From Date</label>
            <input
              id="historyFrom"
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </div>

          <div className="history-field">
            <label htmlFor="historyTo">To Date</label>
            <input
              id="historyTo"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => setToDate(event.target.value)}
            />
          </div>

          <div className="history-filter-action">
            <button type="button" onClick={resetFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      </section>

      <section className="history-table-card">
        <div className="history-table-heading">
          <div>
            <h2>Transaction Records</h2>
            <p>{filteredTransactions.length} records match your filters.</p>
          </div>
        </div>

        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction</th>
                <th>Item</th>
                <th>Location</th>
                <th>Quantity</th>
                <th>Reference / Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((record) => (
                  <tr key={`${record.type}-${record.id}`}>
                    <td>{formatDate(record.date)}</td>
                    <td>
                      <span
                        className={`history-type-badge ${record.type
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {record.type}
                      </span>
                    </td>
                    <td>{record.itemName}</td>
                    <td>{record.branch}</td>
                    <td
                      className={`history-quantity ${record.type.toLowerCase()}`}
                    >
                      {record.type === "Issued" ? "−" : "+"}
                      {record.quantity} {record.unit || ""}
                    </td>
                    <td>{record.note || record.invoice || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="history-empty">
                    No stock transactions found. Try changing the filters or add
                    a purchase, issue, or return first.
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
