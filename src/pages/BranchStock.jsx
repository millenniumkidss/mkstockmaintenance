import React, { useEffect, useMemo, useState } from "react";
import { getItems } from "../utils/stockStorage";
import "./BranchStock.css";

const BRANCHES = [
  "Khamla",
  "Narendra Nagar",
  "Nandanvan",
  "Medical",
  "Manewada",
];

const BRANCH_STOCK_KEY = "mk_branch_stock";

function readBranchStock() {
  try {
    const data = JSON.parse(localStorage.getItem(BRANCH_STOCK_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function BranchStock() {
  const [items, setItems] = useState([]);
  const [branchStock, setBranchStock] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [search, setSearch] = useState("");

  function loadData() {
    setItems(getItems());
    setBranchStock(readBranchStock());
  }

  useEffect(() => {
    loadData();

    // Refresh the page data when another browser tab changes stock.
    function handleStorageChange(event) {
      if (
        event.key === null ||
        event.key === BRANCH_STOCK_KEY ||
        event.key === "mk_stock_items"
      ) {
        loadData();
      }
    }

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const stockRows = useMemo(() => {
    return branchStock
      .map((record) => {
        const item = items.find(
          (entry) => String(entry.id) === String(record.itemId),
        );

        return {
          ...record,
          itemName: item?.name || record.itemName || "Unknown Item",
          unit: item?.unit || record.unit || "Pieces",
          quantity: Number(record.quantity) || 0,
        };
      })
      .filter((record) => record.quantity > 0)
      .filter(
        (record) =>
          selectedBranch === "All Branches" || record.branch === selectedBranch,
      )
      .filter((record) =>
        `${record.itemName} ${record.branch} ${record.unit}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
      .sort(
        (a, b) =>
          a.branch.localeCompare(b.branch) ||
          a.itemName.localeCompare(b.itemName),
      );
  }, [items, branchStock, selectedBranch, search]);

  const branchSummary = useMemo(() => {
    return BRANCHES.map((branch) => {
      const records = branchStock.filter((record) => record.branch === branch);

      const totalQuantity = records.reduce(
        (total, record) => total + (Number(record.quantity) || 0),
        0,
      );

      const uniqueItems = new Set(
        records
          .filter((record) => Number(record.quantity) > 0)
          .map((record) => String(record.itemId)),
      ).size;

      return { branch, totalQuantity, uniqueItems };
    });
  }, [branchStock]);

  const totalBranchQuantity = branchSummary.reduce(
    (total, branch) => total + branch.totalQuantity,
    0,
  );

  function printStock() {
    window.print();
  }

  return (
    <div className="branch-stock-page">
      <div className="branch-stock-heading">
        <div>
          <h1>Branch Stock</h1>
          <p>View available inventory across all Millennium Kidss branches.</p>
        </div>

        <button type="button" className="branch-print-btn" onClick={printStock}>
          🖨 Print Stock
        </button>
      </div>

      <div className="branch-stock-summary">
        <div className="branch-summary-card">
          <div className="branch-summary-icon">🏫</div>
          <div>
            <span>Total Branches</span>
            <strong>{BRANCHES.length}</strong>
          </div>
        </div>

        <div className="branch-summary-card">
          <div className="branch-summary-icon">📦</div>
          <div>
            <span>Units Across Branches</span>
            <strong>{totalBranchQuantity.toLocaleString("en-IN")}</strong>
          </div>
        </div>

        <div className="branch-summary-card">
          <div className="branch-summary-icon">📋</div>
          <div>
            <span>Items Currently Held</span>
            <strong>
              {
                new Set(
                  branchStock
                    .filter((record) => Number(record.quantity) > 0)
                    .map((record) => String(record.itemId)),
                ).size
              }
            </strong>
          </div>
        </div>
      </div>

      <div className="branch-stock-cards">
        {branchSummary.map((branch, index) => (
          <button
            type="button"
            className={`branch-overview-card ${
              selectedBranch === branch.branch ? "selected" : ""
            }`}
            key={branch.branch}
            onClick={() => setSelectedBranch(branch.branch)}
          >
            <div className="branch-card-top">
              <span className="branch-card-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="branch-card-icon">🏫</span>
            </div>

            <h3>{branch.branch}</h3>
            <div className="branch-card-quantity">
              {branch.totalQuantity.toLocaleString("en-IN")}
            </div>
            <p>Units in stock</p>

            <div className="branch-card-footer">
              {branch.uniqueItems} different items
              <span>View →</span>
            </div>
          </button>
        ))}
      </div>

      <div className="branch-stock-table-card">
        <div className="branch-stock-table-heading">
          <div>
            <h2>Available Branch Inventory</h2>
            <p>
              Quantities are calculated from recorded stock issues and returns.
            </p>
          </div>
        </div>

        <div className="branch-stock-filters">
          <select
            value={selectedBranch}
            onChange={(event) => setSelectedBranch(event.target.value)}
            aria-label="Filter by branch"
          >
            <option>All Branches</option>
            {BRANCHES.map((branch) => (
              <option key={branch}>{branch}</option>
            ))}
          </select>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search item or branch..."
            aria-label="Search items or branches"
          />

          <button
            type="button"
            className="branch-refresh-btn"
            onClick={loadData}
          >
            ↻ Refresh
          </button>
        </div>

        <div className="branch-stock-table-wrapper">
          <table className="branch-stock-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Branch</th>
                <th>Item Name</th>
                <th>Available Quantity</th>
                <th>Unit</th>
              </tr>
            </thead>

            <tbody>
              {stockRows.length > 0 ? (
                stockRows.map((record, index) => (
                  <tr key={`${record.branch}-${record.itemId}`}>
                    <td>{index + 1}</td>
                    <td>
                      <span className="branch-name-badge">{record.branch}</span>
                    </td>
                    <td className="branch-item-name">{record.itemName}</td>
                    <td className="branch-quantity">
                      {record.quantity.toLocaleString("en-IN")}
                    </td>
                    <td>{record.unit}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="branch-stock-empty">
                    No branch stock found. Issue stock to a branch first, or
                    change your search/filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="branch-stock-table-footer">
          Showing {stockRows.length} inventory records
        </div>
      </div>
    </div>
  );
}

export default BranchStock;
