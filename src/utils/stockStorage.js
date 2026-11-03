
// const ITEMS_KEY = "mk_stock_items";
// const PURCHASES_KEY = "mk_stock_purchases";
// const MOVEMENTS_KEY = "mk_stock_movements";

// export function getItems() {
//   try {
//     return JSON.parse(localStorage.getItem(ITEMS_KEY)) || [];
//   } catch {
//     return [];
//   }
// }

// export function saveItems(items) {
//   localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
// }

// export function getPurchases() {
//   try {
//     return JSON.parse(localStorage.getItem(PURCHASES_KEY)) || [];
//   } catch {
//     return [];
//   }
// }

// export function savePurchases(purchases) {
//   localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));
// }

// export function getMovements() {
//   try {
//     return JSON.parse(localStorage.getItem(MOVEMENTS_KEY)) || [];
//   } catch {
//     return [];
//   }
// }

// export function saveMovements(movements) {
//   localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(movements));
// }

// export function getCentralStock() {
//   const items = getItems();

//   return items.map((item) => ({
//     ...item,
//     quantity: Number(item.quantity) || 0,
//   }));
// }

// export function saveCentralQuantity(itemId, quantity) {
//   const items = getItems();

//   const updatedItems = items.map((item) =>
//     item.id === itemId
//       ? { ...item, quantity: Number(quantity) || 0 }
//       : item
//   );

//   saveItems(updatedItems);
// }

const ITEMS_KEY = "mk_stock_items";
const PURCHASES_KEY = "mk_stock_purchases";
const MOVEMENTS_KEY = "mk_stock_movements";

export function getItems() {
  try {
    const saved = localStorage.getItem(ITEMS_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((item) => ({
      ...item,
      quantity: Number(item.quantity) || 0,
      minimumStock: Number(item.minimumStock) || 0,
    }));
  } catch (error) {
    console.error("Unable to read stock items:", error);
    return [];
  }
}

export function saveItems(items) {
  try {
    const cleanItems = Array.isArray(items)
      ? items.map((item) => ({
          ...item,
          quantity: Number(item.quantity) || 0,
          minimumStock: Number(item.minimumStock) || 0,
        }))
      : [];

    localStorage.setItem(ITEMS_KEY, JSON.stringify(cleanItems));

    /*
     * Refresh pages/components in the same browser tab.
     * The browser's native "storage" event handles other tabs.
     */
    window.dispatchEvent(new Event("stockUpdated"));

    return true;
  } catch (error) {
    console.error("Unable to save stock items:", error);
    return false;
  }
}

export function getPurchases() {
  try {
    const saved = localStorage.getItem(PURCHASES_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Unable to read purchases:", error);
    return [];
  }
}

export function savePurchases(purchases) {
  try {
    localStorage.setItem(
      PURCHASES_KEY,
      JSON.stringify(Array.isArray(purchases) ? purchases : []),
    );

    window.dispatchEvent(new Event("stockUpdated"));

    return true;
  } catch (error) {
    console.error("Unable to save purchases:", error);
    return false;
  }
}

export function getMovements() {
  try {
    const saved = localStorage.getItem(MOVEMENTS_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Unable to read stock movements:", error);
    return [];
  }
}

export function saveMovements(movements) {
  try {
    localStorage.setItem(
      MOVEMENTS_KEY,
      JSON.stringify(Array.isArray(movements) ? movements : []),
    );

    window.dispatchEvent(new Event("stockUpdated"));

    return true;
  } catch (error) {
    console.error("Unable to save stock movements:", error);
    return false;
  }
}

export function getCentralStock() {
  return getItems();
}

export function saveCentralQuantity(itemId, quantity) {
  const items = getItems();

  const updatedItems = items.map((item) =>
    String(item.id) === String(itemId)
      ? {
          ...item,
          quantity: Math.max(0, Number(quantity) || 0),
        }
      : item,
  );

  return saveItems(updatedItems);
}