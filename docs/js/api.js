// js/api.js
import { products } from "../constants/products.js";
import { DEFAULT_LIMIT } from "./config.js";

const API_BASE = "https://dummyjson.com/products";

let allproducts = null;

export async function fetchProducts(limit = DEFAULT_LIMIT) {
  return products;
}

export async function getAllProducts() {
  if (allproducts && allproducts.length) return allproducts;
  const stored = JSON.parse(localStorage.getItem("allProducts") || "[]");
  if (stored.length) {
    allproducts = stored;
    return allproducts;
  }
  return await fetchProducts();
}
