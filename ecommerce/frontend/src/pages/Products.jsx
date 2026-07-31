import { useEffect, useState } from "react";
import client, { extractErrorMessage } from "../api/client.js";
import { useCart } from "../context/CartContext.jsx";
import { fetchAvailableStock } from "../api/inventory.js";

function formatPrice(value) {
  const num = Number(value);
  return Number.isNaN(num) ? value : `$${num.toFixed(2)}`;
}

export default function Products() {
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingId, setAddingId] = useState(null);
  const [notice, setNotice] = useState("");
  // productId -> available stock (number), null = no inventory record, undefined = loading
  const [stock, setStock] = useState({});

  async function loadStock(list) {
    const entries = await Promise.all(
      list.map(async (p) => {
        try {
          return [p.id, await fetchAvailableStock(p.id)];
        } catch {
          return [p.id, null];
        }
      })
    );
    setStock(Object.fromEntries(entries));
  }

  async function handleAddToCart(product) {
    setAddingId(product.id);
    setNotice("");
    setError("");
    try {
      await addItem(product);
      setNotice(`Added "${product.name}" to cart`);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not add to cart"));
    } finally {
      setAddingId(null);
    }
  }

  async function loadProducts(searchTerm = "") {
    setLoading(true);
    setError("");
    try {
      // product-service: GET /api/products?search=&is_active=true
      const { data } = await client.get("/api/products", {
        params: {
          is_active: true,
          ...(searchTerm ? { search: searchTerm } : {}),
        },
      });
      setProducts(data);
      setStock({});
      loadStock(data); // fire-and-forget; cards fill in as stock resolves
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load products"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    loadProducts(search.trim());
  }

  return (
    <section>
      <div className="page-head">
        <h1>Products</h1>
        <form className="search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">
            Search
          </button>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      {loading ? (
        <p className="muted">Loading products…</p>
      ) : products.length === 0 ? (
        <p className="muted">No products found.</p>
      ) : (
        <div className="grid">
          {products.map((p) => {
            const available = stock[p.id]; // number | null | undefined
            const outOfStock = available === 0;
            return (
              <article key={p.id} className="card">
                <div className="card-img">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} loading="lazy" />
                  ) : (
                    <div className="img-placeholder">No image</div>
                  )}
                </div>
                <div className="card-body">
                  <span className="badge">{p.category_name || "Uncategorized"}</span>
                  <h3>{p.name}</h3>
                  <p className="brand">{p.brand}</p>
                  <p className="desc">{p.description}</p>
                  <p className="stock">
                    {available === undefined
                      ? "Checking stock…"
                      : available === null
                      ? "Stock: n/a"
                      : outOfStock
                      ? <span className="out">Out of stock</span>
                      : <span className="in">In stock: {available}</span>}
                  </p>
                  <div className="card-foot">
                    <span className="price">{formatPrice(p.price)}</span>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAddToCart(p)}
                      disabled={addingId === p.id || outOfStock}
                    >
                      {addingId === p.id
                        ? "Adding…"
                        : outOfStock
                        ? "Unavailable"
                        : "Add to cart"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
