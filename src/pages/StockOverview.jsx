// import React, { useEffect, useState } from "react";
// import "./StockOverview.css";

// const STORAGE_KEY = "mk_stock_items";

// const CATEGORIES = ["Stationery", "Cleaning", "Student", "Office"];

// const initialItems = [
//   {
//     id: 1,
//     name: "Crayons",
//     category: "Stationery",
//     unit: "Packets",
//     minimumStock: 10,
//     quantity: 0,
//   },
//   {
//     id: 2,
//     name: "Drawing Sheets",
//     category: "Student",
//     unit: "Packets",
//     minimumStock: 5,
//     quantity: 0,
//   },
//   {
//     id: 3,
//     name: "Notebooks",
//     category: "Stationery",
//     unit: "Pieces",
//     minimumStock: 20,
//     quantity: 0,
//   },
// ];

// const emptyForm = {
//   name: "",
//   category: "Stationery",
//   unit: "Pieces",
//   quantity: 0,
//   minimumStock: 0,
// };

// function normalizeCategory(category) {
//   const value = String(category || "")
//     .trim()
//     .toLowerCase();

//   if (value === "stationery") return "Stationery";
//   if (value.includes("clean")) return "Cleaning";
//   if (
//     value === "student" ||
//     value.includes("learning") ||
//     value.includes("art & craft") ||
//     value.includes("toy")
//   ) {
//     return "Student";
//   }
//   if (
//     value === "office" ||
//     value.includes("furniture") ||
//     value.includes("kitchen") ||
//     value === "other"
//   ) {
//     return "Office";
//   }

//   return "Office";
// }

// export default function StockOverview() {
//   // const [items, setItems] = useState(initialItems);
//   const [search, setSearch] = useState("");
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [form, setForm] = useState(emptyForm);
//   const [editingId, setEditingId] = useState(null);
//   const [showForm, setShowForm] = useState(false);

//   const [items, setItems] = useState(() => {
//     try {
//       const savedItems = localStorage.getItem(STORAGE_KEY);

//       if (savedItems != null) {
//         const parsedItems = JSON.parse(savedItems);

//         if (Array.isArray(parsedItems)) {
//           return parsedItems.map((item) => ({
//             ...item,
//             category: normalizeCategory(item.category),
//             quantity: Number(item.quantity) || 0,
//             minimumStock: Number(item.minimumStock) || 0,
//           }));
//         }
//       }
//     } catch (error) {
//       console.error("Unable to load stock items:", error);
//     }
//     return initialItems;
//   });

//   useEffect(() => {
//     try {
//       localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
//     } catch (error) {
//       console.error("Unable to save stock items:", error);
//     }
//   }, [items]);

//   const filteredItems = items.filter((item) => {
//     const searchText = search.trim().toLowerCase();

//     const matchesSearch = `${item.name} ${item.category} ${item.unit}`
//       .toLowerCase()
//       .includes(searchText);

//     const matchesCategory =
//       selectedCategory === "All" || item.category === selectedCategory;

//     return matchesSearch && matchesCategory;
//   });

//   const openAddForm = () => {
//     setEditingId(null);
//     setForm(emptyForm);
//     setShowForm(true);
//   };

//   const openEditForm = (item) => {
//     setEditingId(item.id);
//     setForm({
//       name: item.name,
//       category: normalizeCategory(item.category),
//       unit: item.unit,
//       quantity: item.quantity,
//       minimumStock: item.minimumStock || 0,
//     });
//     setShowForm(true);
//   };

//   const handleFormChange = (event) => {
//     const { name, value } = event.target;

//     setForm((previous) => ({
//       ...previous,
//       [name]: name === "quantity" ? value : value,
//     }));
//   };

//   const handleSubmit = (event) => {
//     event.preventDefault();

//     const itemName = form.name.trim();

//     if (!itemName) {
//       alert("Please enter an item name.");
//       return;
//     }

//     const itemData = {
//       name: itemName,
//       category: form.category,
//       unit: form.unit,
//       quantity: Math.max(0, Number(form.quantity) || 0),
//       minimumStock: Math.max(0, Number(form.minimumStock) || 0),
//     };

//     if (editingId !== null) {
//       setItems((previous) =>
//         previous.map((item) =>
//           item.id === editingId ? { ...item, ...itemData } : item,
//         ),
//       );
//     } else {
//       setItems((previous) => [
//         ...previous,
//         {
//           id: Date.now(),
//           ...itemData,
//           // quantity: 0,
//         },
//       ]);
//     }

//     setForm(emptyForm);
//     setEditingId(null);
//     setShowForm(false);
//   };

//   const handleDelete = (id) => {
//     if (window.confirm("Are you sure you want to delete this item?")) {
//       setItems((previous) => previous.filter((item) => item.id !== id));
//     }
//   };

//   const cancelForm = () => {
//     setForm(emptyForm);
//     setEditingId(null);
//     setShowForm(false);
//   };

//   return (
//     <div className="stock-overview">
//       <div className="stock-page-header">
//         <div>
//           <h1>Stock Overview</h1>
//           <p>Manage and organise your inventory items.</p>
//         </div>

//         <button className="stock-add-button" onClick={openAddForm}>
//           + Add New Item
//         </button>
//       </div>

//       <div className="stock-summary-grid">
//         <div className="stock-summary-card">
//           <span>Total Items</span>
//           <strong>{items.length}</strong>
//         </div>

//         <div className="stock-summary-card">
//           <span>Categories</span>
//           <strong>{new Set(items.map((item) => item.category)).size}</strong>
//         </div>

//         <div className="stock-summary-card">
//           <span>Low Stock Items</span>
//           <strong>
//             {
//               items.filter(
//                 (item) =>
//                   item.minimumStock > 0 && item.quantity < item.minimumStock,
//               ).length
//             }
//           </strong>
//         </div>
//       </div>

//       {showForm && (
//         <div className="stock-form-card">
//           <h2>{editingId !== null ? "Edit Item" : "Add New Item"}</h2>

//           <form onSubmit={handleSubmit}>
//             <div className="stock-form-grid">
//               <div className="stock-form-field">
//                 <label htmlFor="stock-item-name">Item Name</label>
//                 <input
//                   id="stock-item-name"
//                   name="name"
//                   value={form.name}
//                   onChange={handleFormChange}
//                   placeholder="Enter item name"
//                   required
//                 />
//               </div>

//               <div className="stock-form-field">
//                 <label htmlFor="stock-item-category">Category</label>
//                 <select
//                   id="stock-item-category"
//                   name="category"
//                   value={form.category}
//                   onChange={handleFormChange}
//                   required
//                 >
//                   {CATEGORIES.map((category) => (
//                     <option key={category} value={category}>
//                       {category}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div className="stock-form-field">
//                 <label htmlFor="stock-item-unit">Unit</label>
//                 <select
//                   id="stock-item-unit"
//                   name="unit"
//                   value={form.unit}
//                   onChange={handleFormChange}
//                   required
//                 >
//                   <option value="Pieces">Pieces</option>
//                   <option value="Packets">Packets</option>
//                   <option value="Boxes">Boxes</option>
//                   <option value="Bottles">Bottles</option>
//                   <option value="Sets">Sets</option>
//                   <option value="Pairs">Pairs</option>
//                   <option value="Rolls">Rolls</option>
//                   <option value="Kg">Kg</option>
//                   <option value="Litres">Litres</option>
//                 </select>
//               </div>
//               {/*
//               <div className="stock-form-field">
//                 <label htmlFor="stock-minimum">Minimum Stock</label>
//                 <input
//                   id="stock-minimum"
//                   type="number"
//                   name="minimumStock"
//                   min="0"
//                   value={form.minimumStock}
//                   onChange={handleFormChange}
//                 />
//               </div> */}

//               <div className="stock-form-field">
//                 <label htmlFor="stock-quantity">Total Quantity</label>
//                 <input
//                   id="stock-quantity"
//                   type="number"
//                   name="quantity"
//                   min="0"
//                   value={form.quantity}
//                   onChange={handleFormChange}
//                   placeholder="Enter total quantity"
//                   required
//                 />
//               </div>

//               {/* <div className="stock-form-field">
//                 <label htmlFor="stock-minimum">Minimum Quantity</label>

//                 <input
//                   id="stock-minimum"
//                   type="number"
//                   name="minimumStock"
//                   min="0"
//                   value={form.minimumStock}
//                   onChange={handleFormChange}
//                   placeholder="Enter minimum quantity"
//                 />
//               </div> */}
//             </div>

//             <div className="stock-form-actions">
//               <button
//                 type="button"
//                 className="stock-cancel-button"
//                 onClick={cancelForm}
//               >
//                 Cancel
//               </button>
//               <button type="submit" className="stock-add-button">
//                 {editingId !== null ? "Update Item" : "Save Item"}
//               </button>
//             </div>
//           </form>
//         </div>
//       )}

//       <div className="stock-table-card">
//         <div className="stock-table-heading">
//           <div>
//             <h2>Registered Items</h2>
//             <p>Search by name or filter items by category.</p>
//           </div>

//           <div className="stock-table-filters">
//             <select
//               className="stock-category-filter"
//               value={selectedCategory}
//               onChange={(event) => setSelectedCategory(event.target.value)}
//               aria-label="Filter items by category"
//             >
//               <option value="All">All Categories</option>
//               {CATEGORIES.map((category) => (
//                 <option key={category} value={category}>
//                   {category}
//                 </option>
//               ))}
//             </select>

//             <input
//               type="search"
//               className="stock-search-input"
//               value={search}
//               onChange={(event) => setSearch(event.target.value)}
//               placeholder="Search items..."
//               aria-label="Search items"
//             />
//           </div>
//         </div>

//         <div className="stock-table-wrapper">
//           <table className="stock-table">
//             <thead>
//               <tr>
//                 <th>Sr. No.</th>
//                 <th>Item Name</th>
//                 <th>Category</th>
//                 <th>Unit</th>
//                 <th>Current Quantity</th>
//                 {/* <th>Minimum Stock</th> */}
//                 <th>Actions</th>
//               </tr>
//             </thead>

//             <tbody>
//               {filteredItems.length > 0 ? (
//                 filteredItems.map((item, index) => (
//                   <tr key={item.id}>
//                     <td>{index + 1}</td>
//                     <td className="stock-item-name">{item.name}</td>
//                     <td>
//                       <span className="stock-category-tag">
//                         {item.category}
//                       </span>
//                     </td>
//                     <td>{item.unit}</td>
//                     <td>{item.quantity}</td>
//                     {/* <td>{item.minimumStock}</td> */}
//                     <td>
//                       <div className="stock-row-actions">
//                         <button
//                           type="button"
//                           className="stock-edit-button"
//                           onClick={() => openEditForm(item)}
//                         >
//                           Edit
//                         </button>
//                         <button
//                           type="button"
//                           className="stock-delete-button"
//                           onClick={() => handleDelete(item.id)}
//                         >
//                           Delete
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan="7" className="stock-empty-state">
//                     No items found. Try another search or category.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         <div className="stock-table-footer">
//           Showing {filteredItems.length} of {items.length} items
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import "./StockOverview.css";
import { getItems, saveItems } from "../utils/stockStorage";
// const STORAGE_KEY = "mk_stock_items";

const CATEGORIES = ["Stationery", "Cleaning", "Student", "Office"];

const initialItems = [
  {
    id: 1,
    name: "Crayons",
    category: "Stationery",
    unit: "Packets",
    minimumStock: 10,
    quantity: 0,
  },
  {
    id: 2,
    name: "Drawing Sheets",
    category: "Student",
    unit: "Packets",
    minimumStock: 5,
    quantity: 0,
  },
  {
    id: 3,
    name: "Notebooks",
    category: "Stationery",
    unit: "Pieces",
    minimumStock: 20,
    quantity: 0,
  },
];

const emptyForm = {
  name: "",
  category: "Stationery",
  unit: "Pieces",
  quantity: 0,
  minimumStock: 0,
};

function normalizeCategory(category) {
  const value = String(category || "")
    .trim()
    .toLowerCase();

  if (value === "stationery") return "Stationery";

  if (value.includes("clean")) return "Cleaning";

  if (
    value === "student" ||
    value.includes("learning") ||
    value.includes("art & craft") ||
    value.includes("toy")
  ) {
    return "Student";
  }

  if (
    value === "office" ||
    value.includes("furniture") ||
    value.includes("kitchen") ||
    value === "other"
  ) {
    return "Office";
  }

  return "Office";
}

// function readItemsFromStorage() {
//   try {
//     const savedItems = localStorage.getItem(STORAGE_KEY);

//     if (savedItems !== null) {
//       const parsedItems = JSON.parse(savedItems);

//       if (Array.isArray(parsedItems)) {
//         return parsedItems.map((item) => ({
//           ...item,
//           category: normalizeCategory(item.category),
//           quantity: Number(item.quantity) || 0,
//           minimumStock: Number(item.minimumStock) || 0,
//         }));
//       }
//     }
//   } catch (error) {
//     console.error("Unable to load stock items:", error);
//   }

//   return initialItems;
// }

function readItemsFromStorage() {
  return getItems().map((item) => ({
    ...item,
    category: normalizeCategory(item.category),
    quantity: Number(item.quantity) || 0,
    minimumStock: Number(item.minimumStock) || 0,
  }));
}

export default function StockOverview() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [items, setItems] = useState(() => readItemsFromStorage());
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  /*
   * IMPORTANT:
   * Stock Overview reads the same master inventory used by
   * Add Stock, Issue Stock, Return Stock, etc.
   */

  /*
   * Refresh Stock Overview whenever another stock page changes
   * the master inventory.
   */
  useEffect(() => {
    const refreshItems = () => {
      const latestItems = readItemsFromStorage();
      setItems(latestItems);
    };

    window.addEventListener("stockUpdated", refreshItems);
    window.addEventListener("focus", refreshItems);

    return () => {
      window.removeEventListener("stockUpdated", refreshItems);
      window.removeEventListener("focus", refreshItems);
    };
  }, []);

  /*
   * Listen to browser LocalStorage changes as well.
   * This helps if another browser tab changes the stock.
   */
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === STORAGE_KEY) {
        setItems(readItemsFromStorage());
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const filteredItems = items.filter((item) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch = `${item.name} ${item.category} ${item.unit}`
      .toLowerCase()
      .includes(searchText);

    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const openAddForm = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
      quantity: 0,
      minimumStock: 0,
    });

    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingId(item.id);

    setForm({
      name: item.name || "",
      category: normalizeCategory(item.category),
      unit: item.unit || "Pieces",
      quantity: Number(item.quantity) || 0,
      minimumStock: Number(item.minimumStock) || 0,
    });

    setShowForm(true);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const itemName = form.name.trim();

    if (!itemName) {
      alert("Please enter an item name.");
      return;
    }

    const quantity = Math.max(0, Number(form.quantity) || 0);
    const minimumStock = Math.max(0, Number(form.minimumStock) || 0);

    /*
     * Always read the latest inventory before changing it.
     * This prevents stale React state from overwriting changes
     * made by Add Stock / Issue Stock / Return Stock.
     */
    const currentItems = readItemsFromStorage();

    if (editingId !== null) {
      const updatedItems = currentItems.map((item) =>
        String(item.id) === String(editingId)
          ? {
              ...item,
              name: itemName,
              category: form.category,
              unit: form.unit,
              quantity,
              minimumStock,
            }
          : item,
      );

      // localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
      saveItems(updatedItems);
      setItems(updatedItems);
      setItems(updatedItems);

      window.dispatchEvent(new Event("stockUpdated"));
    } else {
      /*
       * Prevent duplicate master items.
       * Same name + same category = existing stock item.
       */
      const existingItem = currentItems.find(
        (item) =>
          String(item.name || "")
            .trim()
            .toLowerCase() === itemName.toLowerCase() &&
          normalizeCategory(item.category) === form.category,
      );

      if (existingItem) {
        alert(
          `"${itemName}" already exists in Stock Overview. Please edit the existing item or add its quantity through Add Stock.`,
        );
        return;
      }

      const newItem = {
        id: Date.now(),
        name: itemName,
        category: form.category,
        unit: form.unit,
        quantity,
        minimumStock,
      };

      const updatedItems = [...currentItems, newItem];

      // localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
      saveItems(updatedItems);
      setItems(updatedItems);

      window.dispatchEvent(new Event("stockUpdated"));
    }

    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleDelete = (id) => {
    const item = items.find((stockItem) => String(stockItem.id) === String(id));

    if (!item) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.name}" from Stock Overview?`,
    );

    if (!confirmed) return;

    const currentItems = readItemsFromStorage();

    const updatedItems = currentItems.filter(
      (stockItem) => String(stockItem.id) !== String(id),
    );

    // localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
    saveItems(updatedItems);
    setItems(updatedItems);

    window.dispatchEvent(new Event("stockUpdated"));
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const lowStockCount = items.filter(
    (item) =>
      Number(item.minimumStock) > 0 &&
      Number(item.quantity) < Number(item.minimumStock),
  ).length;

  return (
    <div className="stock-overview">
      <div className="stock-page-header">
        <div>
          <h1>Stock Overview</h1>
          <p>Manage and organise your inventory items.</p>
        </div>

        <button className="stock-add-button" onClick={openAddForm}>
          + Add New Item
        </button>
      </div>

      <div className="stock-summary-grid">
        <div className="stock-summary-card">
          <span>Total Items</span>
          <strong>{items.length}</strong>
        </div>

        <div className="stock-summary-card">
          <span>Categories</span>
          <strong>{new Set(items.map((item) => item.category)).size}</strong>
        </div>

        <div className="stock-summary-card">
          <span>Low Stock Items</span>
          <strong>{lowStockCount}</strong>
        </div>
      </div>

      {showForm && (
        <div className="stock-form-card">
          <h2>{editingId !== null ? "Edit Item" : "Add New Item"}</h2>

          <form onSubmit={handleSubmit}>
            <div className="stock-form-grid">
              <div className="stock-form-field">
                <label htmlFor="stock-item-name">Item Name</label>

                <input
                  id="stock-item-name"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="Enter item name"
                  required
                />
              </div>

              <div className="stock-form-field">
                <label htmlFor="stock-item-category">Category</label>

                <select
                  id="stock-item-category"
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                  required
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="stock-form-field">
                <label htmlFor="stock-item-unit">Unit</label>

                <select
                  id="stock-item-unit"
                  name="unit"
                  value={form.unit}
                  onChange={handleFormChange}
                  required
                >
                  <option value="Pieces">Pieces</option>
                  <option value="Packets">Packets</option>
                  <option value="Boxes">Boxes</option>
                  <option value="Bottles">Bottles</option>
                  <option value="Sets">Sets</option>
                  <option value="Pairs">Pairs</option>
                  <option value="Rolls">Rolls</option>
                  <option value="Kg">Kg</option>
                  <option value="Litres">Litres</option>
                </select>
              </div>

              <div className="stock-form-field">
                <label htmlFor="stock-quantity">Total Quantity</label>

                <input
                  id="stock-quantity"
                  type="number"
                  name="quantity"
                  min="0"
                  step="any"
                  value={form.quantity}
                  onChange={handleFormChange}
                  placeholder="Enter total quantity"
                  required
                />
              </div>

              <div className="stock-form-field">
                <label htmlFor="stock-minimum">Minimum Quantity</label>

                <input
                  id="stock-minimum"
                  type="number"
                  name="minimumStock"
                  min="0"
                  step="any"
                  value={form.minimumStock}
                  onChange={handleFormChange}
                  placeholder="Enter minimum quantity"
                />
              </div>
            </div>

            <div className="stock-form-actions">
              <button
                type="button"
                className="stock-cancel-button"
                onClick={cancelForm}
              >
                Cancel
              </button>

              <button type="submit" className="stock-add-button">
                {editingId !== null ? "Update Item" : "Save Item"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="stock-table-card">
        <div className="stock-table-heading">
          <div>
            <h2>Registered Items</h2>
            <p>Search by name or filter items by category.</p>
          </div>

          <div className="stock-table-filters">
            <select
              className="stock-category-filter"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              aria-label="Filter items by category"
            >
              <option value="All">All Categories</option>

              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <input
              type="search"
              list="stock-search-options"
              className="stock-search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search items..."
              aria-label="Search items"
            />

            <datalist id="stock-search-options">
              {items.map((item) => (
                <option key={`item-${item.id}`} value={item.name} />
              ))}

              {CATEGORIES.map((category) => (
                <option key={`category-${category}`} value={category} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="stock-table-wrapper">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Current Quantity</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>

                    <td className="stock-item-name">{item.name}</td>

                    <td>
                      <span className="stock-category-tag">
                        {item.category}
                      </span>
                    </td>

                    <td>{item.unit}</td>

                    <td>{Number(item.quantity) || 0}</td>

                    <td>
                      <div className="stock-row-actions">
                        <button
                          type="button"
                          className="stock-edit-button"
                          onClick={() => openEditForm(item)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="stock-delete-button"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="stock-empty-state">
                    No items found. Try another search or category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="stock-table-footer">
          Showing {filteredItems.length} of {items.length} items
        </div>
      </div>
    </div>
  );
}
