import { useEffect, useState } from "react";
import { fetchCategories, createCategory, createProduct } from "../api/catalog.js";
import { setInventory } from "../api/inventory.js";
import { extractErrorMessage } from "../api/client.js";

export default function Admin() {
  const [categories, setCategories] = useState([]);

  async function loadCategories() {
    try {
      setCategories(await fetchCategories());
    } catch {
      setCategories([]);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <section>
      <h1>Admin</h1>
      <p className="muted">Create catalog data and manage stock levels.</p>

      <div className="admin-grid">
        <CategoryForm onCreated={loadCategories} />
        <ProductForm categories={categories} />
        <InventoryForm />
      </div>
    </section>
  );
}

function Feedback({ error, success }) {
  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
    </>
  );
}

function CategoryForm({ onCreated }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const cat = await createCategory(name.trim());
      setSuccess(`Category "${cat.name}" created (id ${cat.id})`);
      setName("");
      onCreated?.();
    } catch (err) {
      setError(extractErrorMessage(err, "Could not create category"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-card">
      <h2>New Category</h2>
      <Feedback error={error} success={success} />
      <form onSubmit={submit}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
        </label>
        <button className="btn btn-primary full" disabled={busy}>
          {busy ? "Creating…" : "Create category"}
        </button>
      </form>
    </div>
  );
}

const EMPTY_PRODUCT = {
  name: "",
  description: "",
  brand: "",
  price: "",
  image_url: "",
  category_id: "",
  is_active: true,
};

function ProductForm({ categories }) {
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  function change(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        brand: form.brand,
        price: Number(form.price),
        image_url: form.image_url,
        category_id: Number(form.category_id),
        is_active: form.is_active,
      };
      const product = await createProduct(payload);
      setSuccess(`Product "${product.name}" created (id ${product.id}). Set its stock next →`);
      setForm(EMPTY_PRODUCT);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not create product"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-card">
      <h2>New Product</h2>
      <Feedback error={error} success={success} />
      <form onSubmit={submit}>
        <label>
          Name
          <input name="name" value={form.name} onChange={change} required minLength={2} />
        </label>
        <label>
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={change}
            required
            minLength={5}
            rows={3}
          />
        </label>
        <label>
          Brand
          <input name="brand" value={form.brand} onChange={change} required minLength={2} />
        </label>
        <div className="row-2">
          <label>
            Price
            <input
              name="price"
              type="number"
              step="0.01"
              min="0.01"
              value={form.price}
              onChange={change}
              required
            />
          </label>
          <label>
            Category
            <select name="category_id" value={form.category_id} onChange={change} required>
              <option value="" disabled>
                Select…
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Image URL
          <input
            name="image_url"
            type="url"
            value={form.image_url}
            onChange={change}
            required
            placeholder="https://…"
          />
        </label>
        <label className="checkbox">
          <input
            name="is_active"
            type="checkbox"
            checked={form.is_active}
            onChange={change}
          />
          Active (visible in store)
        </label>
        <button className="btn btn-primary full" disabled={busy || categories.length === 0}>
          {busy ? "Creating…" : "Create product"}
        </button>
        {categories.length === 0 && (
          <p className="muted small">Create a category first.</p>
        )}
      </form>
    </div>
  );
}

function InventoryForm() {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const inv = await setInventory(Number(productId), Number(quantity));
      setSuccess(
        `Stock for product ${inv.product_id} set. Available: ${inv.available_quantity}`
      );
      setQuantity("");
    } catch (err) {
      setError(extractErrorMessage(err, "Could not set inventory"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-card">
      <h2>Set Inventory</h2>
      <p className="muted small">
        Creates a stock record for a product, or updates it if one already exists.
      </p>
      <Feedback error={error} success={success} />
      <form onSubmit={submit}>
        <div className="row-2">
          <label>
            Product ID
            <input
              type="number"
              min="1"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
            />
          </label>
          <label>
            Total quantity
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </label>
        </div>
        <button className="btn btn-primary full" disabled={busy}>
          {busy ? "Saving…" : "Save stock"}
        </button>
      </form>
    </div>
  );
}
