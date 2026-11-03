import React, { useEffect, useMemo, useState } from "react";
import "./Dashboard.css";

const BRANCHES = [
  "Khamla",
  "Narendra Nagar",
  "Nandanvan",
  "Medical",
  "Manewada",
];

const STOCK_ITEMS_KEY = "mk_stock_items";
const STOCK_MOVEMENTS_KEY = "mk_stock_movements";
const STOCK_PURCHASES_KEY = "mk_stock_purchases";
const BRANCH_STOCK_KEY = "mk_branch_stock";

function readStorage(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function getItemId(value) {
  return String(value ?? "");
}

function getMovementDate(record) {
  return (
    record.date ||
    record.createdAt ||
    record.timestamp ||
    record.transactionDate ||
    record.created_date ||
    ""
  );
}

function formatRelativeDate(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const movementDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const difference =
    (today.getTime() - movementDay.getTime()) / (1000 * 60 * 60 * 24);

  if (difference === 0) return "Today";
  if (difference === 1) return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function Dashboard() {
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [branchStock, setBranchStock] = useState([]);

  function loadDashboardData() {
    setItems(readStorage(STOCK_ITEMS_KEY));
    setMovements(readStorage(STOCK_MOVEMENTS_KEY));
    setPurchases(readStorage(STOCK_PURCHASES_KEY));
    setBranchStock(readStorage(BRANCH_STOCK_KEY));
  }

  useEffect(() => {
    loadDashboardData();

    function handleStockUpdate() {
      loadDashboardData();
    }

    function handleStorageChange(event) {
      if (
        event.key === null ||
        [
          STOCK_ITEMS_KEY,
          STOCK_MOVEMENTS_KEY,
          STOCK_PURCHASES_KEY,
          BRANCH_STOCK_KEY,
        ].includes(event.key)
      ) {
        loadDashboardData();
      }
    }

    window.addEventListener("stockUpdated", handleStockUpdate);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", loadDashboardData);

    return () => {
      window.removeEventListener("stockUpdated", handleStockUpdate);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", loadDashboardData);
    };
  }, []);

  // --------------------------------------------------
  // TOTAL ITEMS
  // --------------------------------------------------

  const totalItems = items.length;

  // --------------------------------------------------
  // TOTAL CENTRAL STOCK
  // --------------------------------------------------

  const totalStock = useMemo(() => {
    return items.reduce(
      (total, item) => total + (Number(item.quantity) || 0),
      0,
    );
  }, [items]);

  // --------------------------------------------------
  // LOW STOCK
  // --------------------------------------------------

  const lowStockItems = useMemo(() => {
    return items
      .filter((item) => {
        const quantity = Number(item.quantity) || 0;
        const minimumStock = Number(item.minimumStock) || 0;

        return minimumStock > 0 && quantity < minimumStock;
      })
      .sort((a, b) => (Number(a.quantity) || 0) - (Number(b.quantity) || 0));
  }, [items]);

  // --------------------------------------------------
  // BRANCH STOCK
  // --------------------------------------------------

  const branchSummary = useMemo(() => {
    return BRANCHES.map((branch) => {
      const records = branchStock.filter((record) => record.branch === branch);

      const totalQuantity = records.reduce(
        (total, record) => total + (Number(record.quantity) || 0),
        0,
      );

      return {
        branch,
        totalQuantity,
      };
    });
  }, [branchStock]);

  // --------------------------------------------------
  // RECENT MOVEMENTS
  // --------------------------------------------------

  const recentMovements = useMemo(() => {
    const itemMap = new Map(items.map((item) => [getItemId(item.id), item]));

    const movementRows = movements.map((movement, index) => {
      const item = itemMap.get(
        getItemId(movement.itemId ?? movement.stockItemId ?? movement.id),
      );

      const quantity = Number(
        movement.quantity ?? movement.qty ?? movement.change ?? 0,
      );

      const rawType = String(
        movement.type ??
          movement.transactionType ??
          movement.action ??
          "Movement",
      );

      const typeLower = rawType.toLowerCase();

      let type = "Movement";
      let icon = "↔";
      let iconClass = "purchase";
      let quantityClass = quantity >= 0 ? "positive" : "negative";

      if (
        typeLower.includes("purchase") ||
        typeLower.includes("add") ||
        typeLower.includes("received")
      ) {
        type = "Purchase";
        icon = "↓";
        iconClass = "purchase";
        quantityClass = "positive";
      } else if (
        typeLower.includes("issue") ||
        typeLower.includes("dispatch")
      ) {
        type = "Issued";
        icon = "↑";
        iconClass = "issue";
        quantityClass = "negative";
      } else if (typeLower.includes("return")) {
        type = "Returned";
        icon = "↩";
        iconClass = "return";
        quantityClass = "positive";
      }

      const branch =
        movement.branch ||
        movement.location ||
        movement.toBranch ||
        movement.fromBranch ||
        "Central Stock";

      return {
        id: movement.id || `${type}-${index}`,
        itemName:
          item?.name || movement.itemName || movement.name || "Unknown Item",
        type,
        branch,
        quantity,
        icon,
        iconClass,
        quantityClass,
        date: getMovementDate(movement),
      };
    });

    const purchaseRows = purchases.map((purchase, index) => {
      const item = itemMap.get(
        getItemId(purchase.itemId ?? purchase.stockItemId ?? purchase.id),
      );

      const quantity = Number(purchase.quantity ?? purchase.qty ?? 0);

      return {
        id: purchase.id || `purchase-${index}`,
        itemName:
          item?.name || purchase.itemName || purchase.name || "Unknown Item",
        type: "Purchase",
        branch: "Central Stock",
        quantity,
        icon: "↓",
        iconClass: "purchase",
        quantityClass: "positive",
        date: getMovementDate(purchase),
      };
    });

    return [...movementRows, ...purchaseRows]
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime() || 0;
        const dateB = new Date(b.date).getTime() || 0;

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [items, movements, purchases]);

  // --------------------------------------------------
  // TOTAL BRANCH STOCK
  // --------------------------------------------------

  const totalBranchStock = branchSummary.reduce(
    (total, branch) => total + branch.totalQuantity,
    0,
  );

  return (
    <div className="dashboard">
      {/* PAGE HEADER */}

      <div className="dashboard-header">
        <div>
          <h1>Good Morning, Admin 👋</h1>
          <p>Here's what's happening with your Millennium Kidss stock today.</p>
        </div>

        <div className="dashboard-date">
          📅{" "}
          {new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>
      </div>

      {/* STATISTICS CARDS */}

      <div className="stats-grid">
        {/* TOTAL ITEMS */}

        <div className="stat-card">
          <div className="stat-icon green">📦</div>

          <div className="stat-content">
            <span>Total Items</span>

            <h2>{totalItems.toLocaleString("en-IN")}</h2>

            <small>Items in inventory</small>
          </div>
        </div>

        {/* TOTAL STOCK */}

        <div className="stat-card">
          <div className="stat-icon blue">📊</div>

          <div className="stat-content">
            <span>Total Stock</span>

            <h2>{totalStock.toLocaleString("en-IN")}</h2>

            <small>Available quantity</small>
          </div>
        </div>

        {/* PENDING REQUESTS */}

        <div className="stat-card">
          <div className="stat-icon orange">📝</div>

          <div className="stat-content">
            <span>Pending Requests</span>

            <h2>0</h2>

            <small>Need your attention</small>
          </div>
        </div>

        {/* LOW STOCK */}

        <div className="stat-card">
          <div className="stat-icon red">⚠️</div>

          <div className="stat-content">
            <span>Low Stock</span>

            <h2>{lowStockItems.length}</h2>

            <small>Items need restocking</small>
          </div>
        </div>
      </div>

      {/* MAIN DASHBOARD GRID */}

      <div className="dashboard-grid">
        {/* RECENT TRANSACTIONS */}

        <div className="dashboard-card transactions-card">
          <div className="card-header">
            <div>
              <h3>Recent Stock Movements</h3>
              <p>Latest inventory transactions</p>
            </div>

            <button className="view-btn">View All</button>
          </div>

          <div className="transaction-list">
            {recentMovements.length > 0 ? (
              recentMovements.map((movement) => (
                <div className="transaction-row" key={movement.id}>
                  <div className={`transaction-icon ${movement.iconClass}`}>
                    {movement.icon}
                  </div>

                  <div className="transaction-info">
                    <strong>{movement.itemName}</strong>

                    <span>
                      {movement.type} • {movement.branch}
                    </span>
                  </div>

                  <div className={`transaction-qty ${movement.quantityClass}`}>
                    {movement.quantity > 0 ? "+" : ""}
                    {movement.quantity.toLocaleString("en-IN")}
                  </div>

                  <div className="transaction-date">
                    {formatRelativeDate(movement.date)}
                  </div>
                </div>
              ))
            ) : (
              <div className="transaction-row">
                <div className="transaction-info">
                  <strong>No stock movements yet</strong>
                  <span>Purchases, issues and returns will appear here.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LOW STOCK */}

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h3>Low Stock Alert</h3>
              <p>Items that need attention</p>
            </div>

            <span className="alert-count">{lowStockItems.length}</span>
          </div>

          <div className="low-stock-list">
            {lowStockItems.length > 0 ? (
              lowStockItems.slice(0, 4).map((item) => (
                <div className="low-stock-item" key={item.id}>
                  <div className="item-info">
                    <strong>{item.name}</strong>

                    <span>{item.category}</span>
                  </div>

                  <div className="stock-level">
                    <strong>
                      {Number(item.quantity || 0).toLocaleString("en-IN")}
                    </strong>

                    <span>Left</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="low-stock-item">
                <div className="item-info">
                  <strong>All stock levels are healthy</strong>
                  <span>No items below minimum stock</span>
                </div>
              </div>
            )}
          </div>

          <button className="full-width-btn">View Low Stock Items</button>
        </div>
      </div>

      {/* BOTTOM GRID */}

      <div className="bottom-grid">
        {/* BRANCH STOCK */}

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h3>Branch Stock</h3>
              <p>Current stock by branch</p>
            </div>

            <button className="view-btn">View All</button>
          </div>

          <div className="branch-list">
            {branchSummary.map((branch) => (
              <div className="branch-row" key={branch.branch}>
                <div className="branch-name">
                  <div className="branch-icon">🏫</div>

                  <div>
                    <strong>{branch.branch}</strong>
                    <span>Branch</span>
                  </div>
                </div>

                <div className="branch-stock">
                  {branch.totalQuantity.toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PENDING REQUIREMENTS */}

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h3>Pending Requirements</h3>
              <p>Latest branch requests</p>
            </div>

            <span className="pending-badge">0 Pending</span>
          </div>

          <div className="requirement-list">
            <div className="requirement-row">
              <div className="requirement-info">
                <strong>No pending requirements</strong>

                <span>Branch requirements will appear here.</span>
              </div>
            </div>
          </div>

          <button className="full-width-btn">Manage Requirements</button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
