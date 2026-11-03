import { useEffect, useMemo, useState } from "react";
import "./Requirements.css";
import { getItems } from "../utils/stockStorage";

const BRANCHES = [
  "Khamla",
  "Narendra Nagar",
  "Nandanvan",
  "Medical",
  "Manewada",
];

const REQUIREMENTS_KEY = "mk_stock_requirements";

const STATUSES = ["Pending", "Approved", "Rejected", "Fulfilled"];

function readRequirements() {
  try {
    const data = JSON.parse(localStorage.getItem(REQUIREMENTS_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

export default function Requirements() {
  const [requirements, setRequirements] = useState([]);
  const [items, setItems] = useState([]);
  const [branch, setBranch] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [neededBy, setNeededBy] = useState("");
  const [remarks, setRemarks] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");
  const [message, setMessage] = useState("");

  function loadData() {
    setRequirements(readRequirements());
    setItems(getItems());
  }

  useEffect(() => {
    loadData();

    const handleStorage = () => loadData();
    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  function saveRequirements(updated) {
    localStorage.setItem(REQUIREMENTS_KEY, JSON.stringify(updated));
    setRequirements(updated);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const requestedQty = Number(quantity);

    if (!branch || !teacherName.trim() || !itemId) {
      setMessage("Please complete the branch, teacher name, and item fields.");
      return;
    }

    if (!Number.isFinite(requestedQty) || requestedQty <= 0) {
      setMessage("Enter a valid quantity greater than zero.");
      return;
    }

    const selectedItem = items.find(
      (item) => String(item.id) === String(itemId),
    );

    if (!selectedItem) {
      setMessage("Please select a valid stock item.");
      return;
    }

    if (neededBy && neededBy < getToday()) {
      setMessage("The needed-by date cannot be in the past.");
      return;
    }

    const newRequirement = {
      id: makeId(),
      requestDate: getToday(),
      branch,
      teacherName: teacherName.trim(),
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      unit: selectedItem.unit || "Units",
      quantity: requestedQty,
      neededBy,
      remarks: remarks.trim(),
      status: "Pending",
    };

    saveRequirements([newRequirement, ...readRequirements()]);

    setTeacherName("");
    setItemId("");
    setQuantity("");
    setNeededBy("");
    setRemarks("");
    setMessage("Requirement submitted successfully.");
  }

  function updateStatus(id, status) {
    const updated = readRequirements().map((record) =>
      record.id === id ? { ...record, status, updatedAt: getToday() } : record,
    );

    saveRequirements(updated);
    setMessage(`Request status updated to ${status}.`);
  }

  function deleteRequirement(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this requirement?",
    );

    if (!confirmed) return;

    saveRequirements(readRequirements().filter((record) => record.id !== id));
    setMessage("Requirement deleted.");
  }

  const filteredRequirements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requirements.filter((record) => {
      const matchesSearch =
        !query ||
        String(record.itemName || "")
          .toLowerCase()
          .includes(query) ||
        String(record.teacherName || "")
          .toLowerCase()
          .includes(query) ||
        String(record.branch || "")
          .toLowerCase()
          .includes(query) ||
        String(record.remarks || "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" || record.status === statusFilter;

      const matchesBranch =
        branchFilter === "All" || record.branch === branchFilter;

      return matchesSearch && matchesStatus && matchesBranch;
    });
  }, [requirements, search, statusFilter, branchFilter]);

  const pendingCount = requirements.filter(
    (record) => record.status === "Pending",
  ).length;

  const approvedCount = requirements.filter(
    (record) => record.status === "Approved",
  ).length;

  const fulfilledCount = requirements.filter(
    (record) => record.status === "Fulfilled",
  ).length;

  function resetFilters() {
    setSearch("");
    setStatusFilter("All");
    setBranchFilter("All");
  }

  function printRequirements() {
    window.print();
  }

  return (
    <div className="requirements-page">
      <div className="requirements-heading">
        <div>
          <h1>Requirements Management</h1>
          <p>Manage material requests from branches and teachers.</p>
        </div>

        <button
          type="button"
          className="requirements-print-btn"
          onClick={printRequirements}
        >
          Print Requirements
        </button>
      </div>

      <div className="requirements-summary">
        <div className="requirements-summary-card">
          <span>Total Requests</span>
          <strong>{requirements.length}</strong>
        </div>
        <div className="requirements-summary-card pending">
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </div>
        <div className="requirements-summary-card approved">
          <span>Approved</span>
          <strong>{approvedCount}</strong>
        </div>
        <div className="requirements-summary-card fulfilled">
          <span>Fulfilled</span>
          <strong>{fulfilledCount}</strong>
        </div>
      </div>

      <section className="requirements-form-card">
        <div className="requirements-section-heading">
          <h2>Submit a Requirement</h2>
          <p>Enter the materials needed by a branch or teacher.</p>
        </div>

        {items.length === 0 ? (
          <div className="requirements-notice">
            No items are available. Add items in Stock Master first.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="requirements-form-grid">
              <div className="requirements-field">
                <label htmlFor="reqBranch">Branch *</label>
                <select
                  id="reqBranch"
                  value={branch}
                  onChange={(event) => setBranch(event.target.value)}
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

              <div className="requirements-field">
                <label htmlFor="reqTeacher">Teacher / Staff Name *</label>
                <input
                  id="reqTeacher"
                  value={teacherName}
                  onChange={(event) => setTeacherName(event.target.value)}
                  placeholder="Enter name"
                  required
                />
              </div>

              <div className="requirements-field">
                <label htmlFor="reqItem">Item *</label>
                <select
                  id="reqItem"
                  value={itemId}
                  onChange={(event) => setItemId(event.target.value)}
                  required
                >
                  <option value="">Select item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="requirements-field">
                <label htmlFor="reqQuantity">Required Quantity *</label>
                <input
                  id="reqQuantity"
                  type="number"
                  min="0.01"
                  step="any"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder="Enter quantity"
                  required
                />
              </div>

              <div className="requirements-field">
                <label htmlFor="reqNeededBy">Needed By</label>
                <input
                  id="reqNeededBy"
                  type="date"
                  min={getToday()}
                  value={neededBy}
                  onChange={(event) => setNeededBy(event.target.value)}
                />
              </div>

              <div className="requirements-field requirements-field-full">
                <label htmlFor="reqRemarks">Remarks</label>
                <textarea
                  id="reqRemarks"
                  rows="3"
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  placeholder="Purpose or additional details"
                />
              </div>
            </div>

            {message && (
              <div
                className={`requirements-message ${
                  message.includes("successfully") ? "success" : "error"
                }`}
                role="status"
              >
                {message}
              </div>
            )}

            <div className="requirements-form-actions">
              <button type="submit" className="requirements-submit-btn">
                Submit Requirement
              </button>
            </div>
          </form>
        )}

        {items.length === 0 && message && (
          <div className="requirements-message error" role="status">
            {message}
          </div>
        )}
      </section>

      <section className="requirements-list-card">
        <div className="requirements-list-heading">
          <div>
            <h2>All Requirements</h2>
            <p>Review requests and update their status.</p>
          </div>
        </div>

        <div className="requirements-filters">
          <input
            type="search"
            aria-label="Search requirements"
            placeholder="Search item, teacher or branch..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All Statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by branch"
            value={branchFilter}
            onChange={(event) => setBranchFilter(event.target.value)}
          >
            <option value="All">All Branches</option>
            {BRANCHES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="requirements-clear-btn"
            onClick={resetFilters}
          >
            Clear
          </button>
        </div>

        {message && (
          <div
            className={`requirements-message ${
              message.includes("successfully") || message.includes("updated")
                ? "success"
                : "error"
            }`}
            role="status"
          >
            {message}
          </div>
        )}

        <div className="requirements-table-wrapper">
          <table className="requirements-table">
            <thead>
              <tr>
                <th>Request Date</th>
                <th>Branch / Teacher</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Needed By</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRequirements.length > 0 ? (
                filteredRequirements.map((record) => (
                  <tr key={record.id}>
                    <td>{formatDate(record.requestDate)}</td>
                    <td>
                      <strong>{record.branch}</strong>
                      <span className="requirements-teacher">
                        {record.teacherName}
                      </span>
                    </td>
                    <td>{record.itemName}</td>
                    <td>
                      {record.quantity} {record.unit}
                    </td>
                    <td>{formatDate(record.neededBy)}</td>
                    <td>
                      <span
                        className={`requirements-status ${String(
                          record.status || "Pending",
                        )
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {record.status || "Pending"}
                      </span>
                    </td>
                    <td>{record.remarks || "—"}</td>
                    <td>
                      <div className="requirements-row-actions">
                        <select
                          aria-label={`Change status for ${record.itemName}`}
                          value={record.status || "Pending"}
                          onChange={(event) =>
                            updateStatus(record.id, event.target.value)
                          }
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          className="requirements-delete-btn"
                          onClick={() => deleteRequirement(record.id)}
                          title="Delete requirement"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="requirements-empty">
                    No requirements found. Submit a requirement or adjust the
                    filters.
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
