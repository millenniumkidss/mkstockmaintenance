import React, { useEffect, useState } from "react";
import {
  getItems,
  saveItems,
  getMovements,
  saveMovements,
} from "../utils/stockStorage";
import "./IssueStock.css";

const BRANCHES = [
  "Khamla",
  "Narendra Nagar",
  "Nandanvan",
  "Medical",
  "Manewada",
  "HCL",
  "Office",
];

const BRANCH_STOCK_KEY = "mk_branch_stock";
const ISSUE_HISTORY_KEY = "mk_stock_issues";
const DISPATCH_KEY = "mk_stock_dispatches";

function readStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function getToday() {
  return new Date().toLocaleDateString("en-CA");
}

function IssueStock() {
  const [items, setItems] = useState([]);
  const [issues, setIssues] = useState([]);
  const [branchStock, setBranchStock] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    date: getToday(),
    branch: "",
    remarks: "",
  });

  const [currentItem, setCurrentItem] = useState({
    itemName: "",
    quantity: "",
  });

  const [dispatchItems, setDispatchItems] = useState([]);

  function loadData() {
    setItems(getItems());
    setIssues(readStorage(ISSUE_HISTORY_KEY));
    setBranchStock(readStorage(BRANCH_STOCK_KEY));
    setDispatches(readStorage(DISPATCH_KEY));
  }

  useEffect(() => {
    loadData();
  }, []);

  /*
   * ADD ITEM TO CURRENT DISPATCH
   */
  function addItemToDispatch() {
    setMessage("");

    const itemName = currentItem.itemName.trim();
    const quantity = Number(currentItem.quantity);

    if (!itemName) {
      setMessage("Please enter an item name.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMessage("Please enter a valid quantity.");
      return;
    }

    const matchedItem = items.find(
      (item) => item.name.trim().toLowerCase() === itemName.toLowerCase(),
    );

    if (!matchedItem) {
      setMessage(
        `"${itemName}" is not available in Central Stock. Please add it in Stock Overview first.`,
      );
      return;
    }

    const availableQuantity = Number(matchedItem.quantity) || 0;

    /*
     * Check if same item is already added to this dispatch.
     */
    const alreadyAdded = dispatchItems.find(
      (item) => String(item.itemId) === String(matchedItem.id),
    );

    const alreadyAddedQuantity = alreadyAdded
      ? Number(alreadyAdded.quantity) || 0
      : 0;

    const totalRequested = alreadyAddedQuantity + quantity;

    if (totalRequested > availableQuantity) {
      setMessage(
        `Insufficient stock for ${matchedItem.name}. Available: ${availableQuantity} ${matchedItem.unit}.`,
      );
      return;
    }

    if (alreadyAdded) {
      setDispatchItems(
        dispatchItems.map((item) =>
          String(item.itemId) === String(matchedItem.id)
            ? {
                ...item,
                quantity: item.quantity + quantity,
              }
            : item,
        ),
      );
    } else {
      setDispatchItems([
        ...dispatchItems,
        {
          itemId: matchedItem.id,
          itemName: matchedItem.name,
          unit: matchedItem.unit,
          quantity,
        },
      ]);
    }

    setCurrentItem({
      itemName: "",
      quantity: "",
    });
  }

  /*
   * REMOVE ITEM FROM CURRENT DISPATCH
   */
  function removeDispatchItem(itemId) {
    setDispatchItems(
      dispatchItems.filter((item) => String(item.itemId) !== String(itemId)),
    );
  }

  /*
   * CHANGE QUANTITY BEFORE SAVING
   */
  function updateDispatchQuantity(itemId, value) {
    const quantity = Number(value);

    setDispatchItems(
      dispatchItems.map((item) =>
        String(item.itemId) === String(itemId)
          ? {
              ...item,
              quantity: value === "" ? "" : quantity,
            }
          : item,
      ),
    );
  }

  /*
   * SAVE COMPLETE DISPATCH
   */
  function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!form.branch) {
      setMessage("Please select a branch.");
      return;
    }

    if (dispatchItems.length === 0) {
      setMessage("Please add at least one item.");
      return;
    }

    /*
     * Re-read latest stock before saving.
     */
    const currentItems = getItems();

    /*
     * Validate every item again.
     */
    for (const dispatchItem of dispatchItems) {
      const stockItem = currentItems.find(
        (item) => String(item.id) === String(dispatchItem.itemId),
      );

      if (!stockItem) {
        setMessage(`${dispatchItem.itemName} was not found in central stock.`);
        return;
      }

      const available = Number(stockItem.quantity) || 0;
      const requested = Number(dispatchItem.quantity) || 0;

      if (requested <= 0) {
        setMessage(`Enter a valid quantity for ${dispatchItem.itemName}.`);
        return;
      }

      if (requested > available) {
        setMessage(
          `Insufficient stock for ${dispatchItem.itemName}. Available: ${available} ${stockItem.unit}.`,
        );
        return;
      }
    }

    const dispatchId = Date.now();

    /*
     * REDUCE CENTRAL STOCK
     */
    const updatedItems = currentItems.map((stockItem) => {
      const dispatchItem = dispatchItems.find(
        (item) => String(item.itemId) === String(stockItem.id),
      );

      if (!dispatchItem) {
        return stockItem;
      }

      return {
        ...stockItem,
        quantity:
          (Number(stockItem.quantity) || 0) - Number(dispatchItem.quantity),
      };
    });

    /*
     * UPDATE BRANCH STOCK
     */
    const currentBranchStock = readStorage(BRANCH_STOCK_KEY);

    let updatedBranchStock = [...currentBranchStock];

    dispatchItems.forEach((dispatchItem) => {
      const existing = updatedBranchStock.find(
        (record) =>
          record.branch === form.branch &&
          String(record.itemId) === String(dispatchItem.itemId),
      );

      if (existing) {
        updatedBranchStock = updatedBranchStock.map((record) =>
          record === existing
            ? {
                ...record,
                quantity:
                  (Number(record.quantity) || 0) +
                  Number(dispatchItem.quantity),
              }
            : record,
        );
      } else {
        updatedBranchStock.push({
          id: `${form.branch}-${dispatchItem.itemId}`,
          branch: form.branch,
          itemId: dispatchItem.itemId,
          itemName: dispatchItem.itemName,
          unit: dispatchItem.unit,
          quantity: Number(dispatchItem.quantity),
        });
      }
    });

    /*
     * CREATE ISSUE HISTORY
     */
    const newIssues = dispatchItems.map((dispatchItem, index) => ({
      id: dispatchId + index,
      dispatchId,
      date: form.date,
      branch: form.branch,
      itemId: dispatchItem.itemId,
      itemName: dispatchItem.itemName,
      unit: dispatchItem.unit,
      quantity: Number(dispatchItem.quantity),
      receiver: "",
      note: form.remarks.trim(),
    }));

    const existingIssues = readStorage(ISSUE_HISTORY_KEY);

    const updatedIssues = [...newIssues, ...existingIssues];

    /*
     * CREATE STOCK MOVEMENTS
     */
    const existingMovements = getMovements();

    const newMovements = dispatchItems.map((dispatchItem, index) => ({
      id: dispatchId + 100 + index,
      dispatchId,
      date: form.date,
      itemId: dispatchItem.itemId,
      itemName: dispatchItem.itemName,
      type: "Issued",
      quantity: Number(dispatchItem.quantity),
      branch: form.branch,
      note: form.remarks.trim(),
    }));

    const updatedMovements = [...newMovements, ...existingMovements];

    /*
     * CREATE DISPATCH DOCUMENT
     */
    const dispatchRecord = {
      id: dispatchId,
      date: form.date,
      branch: form.branch,
      remarks: form.remarks.trim(),
      items: dispatchItems.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
      })),
      totalItems: dispatchItems.length,
    };

    const updatedDispatches = [dispatchRecord, ...readStorage(DISPATCH_KEY)];

    try {
      saveItems(updatedItems);

      localStorage.setItem(
        BRANCH_STOCK_KEY,
        JSON.stringify(updatedBranchStock),
      );

      localStorage.setItem(ISSUE_HISTORY_KEY, JSON.stringify(updatedIssues));

      localStorage.setItem(DISPATCH_KEY, JSON.stringify(updatedDispatches));

      saveMovements(updatedMovements);

      setItems(updatedItems);
      setBranchStock(updatedBranchStock);
      setIssues(updatedIssues);
      setDispatches(updatedDispatches);

      /*
       * Notify Stock Overview and other pages.
       */
      window.dispatchEvent(new Event("stockUpdated"));

      /*
       * Clear form.
       */
      setForm({
        date: getToday(),
        branch: "",
        remarks: "",
      });

      setCurrentItem({
        itemName: "",
        quantity: "",
      });

      setDispatchItems([]);

      setMessage(`Stock dispatch saved successfully for ${form.branch}.`);
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to save this transaction. Please check browser storage.",
      );
    }
  }

  /*
   * CLEAR CURRENT DISPATCH
   */
  function clearForm() {
    setForm({
      date: getToday(),
      branch: "",
      remarks: "",
    });

    setCurrentItem({
      itemName: "",
      quantity: "",
    });

    setDispatchItems([]);
    setMessage("");
  }

  /*
   * PRINT DISPATCH NOTE
   */
  function printDispatch(dispatch) {
    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      alert("Please allow pop-ups to print the dispatch note.");
      return;
    }

    const itemRows = dispatch.items
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.itemName}</td>
            <td>${item.quantity}</td>
            <td>${item.unit || "Pieces"}</td>
          </tr>
        `,
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Stock Dispatch Note - ${dispatch.branch}</title>

        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #222;
          }

          .header {
            text-align: center;
            border-bottom: 2px solid #199f61;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }

          .header h1 {
            margin: 0;
            color: #199f61;
            font-size: 28px;
          }

          .header p {
            margin: 6px 0 0;
            font-size: 14px;
          }

          .details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 25px;
          }

          .detail-box {
            border: 1px solid #ddd;
            padding: 12px;
          }

          .detail-box strong {
            display: block;
            margin-bottom: 5px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }

          th,
          td {
            border: 1px solid #bbb;
            padding: 12px;
            text-align: left;
          }

          th {
            background: #f0f7f3;
          }

          .remarks {
            margin-top: 25px;
            border: 1px solid #ddd;
            padding: 15px;
            min-height: 60px;
          }

          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 80px;
            margin-top: 80px;
          }

          .signature {
            border-top: 1px solid #333;
            padding-top: 8px;
            text-align: center;
          }

          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #777;
          }

          @media print {
            body {
              padding: 20px;
            }
          }
        </style>
      </head>

      <body>

        <div class="header">
          <h1>Millennium Kidss</h1>
          <p>Stock Dispatch Note</p>
        </div>

        <div class="details">
          <div class="detail-box">
            <strong>Dispatch Date</strong>
            ${dispatch.date}
          </div>

          <div class="detail-box">
            <strong>Branch</strong>
            ${dispatch.branch}
          </div>

          <div class="detail-box">
            <strong>Dispatch No.</strong>
            MK-${dispatch.id}
          </div>

          <div class="detail-box">
            <strong>Total Items</strong>
            ${dispatch.items.length}
          </div>
        </div>

        <h3>Items Dispatched</h3>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit</th>
            </tr>
          </thead>

          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div class="remarks">
          <strong>Remarks</strong>
          <p>
            ${dispatch.remarks || "No remarks"}
          </p>
        </div>

        <div class="signatures">
          <div class="signature">
            Issued By
          </div>

          <div class="signature">
            Received By - ${dispatch.branch}
          </div>
        </div>

        <div class="footer">
          Millennium Kidss • Stock Management
        </div>

      </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 300);
  }

  function printLatestDispatch() {
    if (dispatches.length === 0) {
      alert("No dispatch record available to print.");
      return;
    }

    printDispatch(dispatches[0]);
  }

  return (
    <div className="issue-stock-page">
      <div className="issue-stock-heading">
        <div>
          <h1>Send Stock to Branch</h1>

          <p>Dispatch materials from Head Office to your branches.</p>
        </div>

        <button
          type="button"
          className="issue-print-btn"
          onClick={printLatestDispatch}
        >
          Print Latest Dispatch
        </button>
      </div>

      <div className="issue-stock-summary">
        <div>
          <span>Registered Items</span>
          <strong>{items.length}</strong>
        </div>

        <div>
          <span>Branches</span>
          <strong>{BRANCHES.length}</strong>
        </div>

        <div>
          <span>Total Dispatches</span>
          <strong>{dispatches.length}</strong>
        </div>
      </div>

      <div className="issue-stock-card">
        <h2>Branch Stock Dispatch</h2>

        <p className="issue-card-description">
          Enter the branch details and add all materials being sent in this
          dispatch.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="issue-form-grid">
            <label>
              Dispatch Date *
              <input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm({
                    ...form,
                    date: e.target.value,
                  })
                }
                required
              />
            </label>

            <label>
              Branch *
              <select
                value={form.branch}
                onChange={(e) =>
                  setForm({
                    ...form,
                    branch: e.target.value,
                  })
                }
                required
              >
                <option value="">Choose branch</option>

                {BRANCHES.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="issue-add-item-box">
            <h3>Add Items</h3>

            <div className="issue-add-item-grid">
              <label>
                Item Name *
                <input
                  type="text"
                  value={currentItem.itemName}
                  onChange={(e) =>
                    setCurrentItem({
                      ...currentItem,
                      itemName: e.target.value,
                    })
                  }
                  placeholder="Example: Chart Paper"
                  list="stock-items-list"
                />
                <datalist id="stock-items-list">
                  {items.map((item) => (
                    <option key={item.id} value={item.name} />
                  ))}
                </datalist>
              </label>

              <label>
                Quantity *
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={currentItem.quantity}
                  onChange={(e) =>
                    setCurrentItem({
                      ...currentItem,
                      quantity: e.target.value,
                    })
                  }
                  placeholder="Enter quantity"
                />
              </label>

              <button
                type="button"
                className="issue-add-btn"
                onClick={addItemToDispatch}
              >
                + Add Item
              </button>
            </div>
          </div>

          {dispatchItems.length > 0 && (
            <div className="dispatch-items-box">
              <h3>Items Being Sent</h3>

              <div className="issue-table-wrapper">
                <table className="issue-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Unit</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {dispatchItems.map((item, index) => (
                      <tr key={item.itemId}>
                        <td>{index + 1}</td>

                        <td>{item.itemName}</td>

                        <td>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateDispatchQuantity(
                                item.itemId,
                                e.target.value,
                              )
                            }
                            style={{
                              width: "90px",
                            }}
                          />
                        </td>

                        <td>{item.unit}</td>

                        <td>
                          <button
                            type="button"
                            onClick={() => removeDispatchItem(item.itemId)}
                            className="issue-delete-btn"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <label className="issue-full-width">
            Remarks
            <textarea
              value={form.remarks}
              onChange={(e) =>
                setForm({
                  ...form,
                  remarks: e.target.value,
                })
              }
              placeholder="Example: Monthly stationery sent to Khamla branch."
              rows="3"
            />
          </label>

          {message && (
            <div
              className={`issue-message ${
                message.includes("successfully") ? "success" : "error"
              }`}
              role="status"
            >
              {message}
            </div>
          )}

          <div className="issue-form-actions">
            <button
              type="button"
              className="issue-clear-btn"
              onClick={clearForm}
            >
              Clear
            </button>

            <button
              type="submit"
              className="issue-submit-btn"
              disabled={dispatchItems.length === 0}
            >
              Save & Issue Stock
            </button>
          </div>
        </form>
      </div>

      <div className="issue-stock-card">
        <div className="issue-history-heading">
          <div>
            <h2>Dispatch History</h2>

            <p className="issue-card-description">
              Previous stock dispatches sent to branches.
            </p>
          </div>
        </div>

        <div className="issue-table-wrapper">
          <table className="issue-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Branch</th>
                <th>Items</th>
                <th>Remarks</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {dispatches.length > 0 ? (
                dispatches.map((dispatch) => (
                  <tr key={dispatch.id}>
                    <td>{dispatch.date}</td>

                    <td>
                      <strong>{dispatch.branch}</strong>
                    </td>

                    <td>
                      {dispatch.items
                        .map(
                          (item) =>
                            `${item.itemName} (${item.quantity} ${item.unit})`,
                        )
                        .join(", ")}
                    </td>

                    <td>{dispatch.remarks || "—"}</td>

                    <td>
                      <button
                        type="button"
                        className="issue-print-btn"
                        onClick={() => printDispatch(dispatch)}
                      >
                        Print
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="issue-empty">
                    No stock dispatches yet.
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

export default IssueStock;
