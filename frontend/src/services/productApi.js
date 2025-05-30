import { supabase } from '../services/supabaseClient.js'; // Ensure supabase is imported

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fetch all products with optional filters/pagination
export const fetchProducts = async (params = {}) => {
  try {
    // Construct the URL for the Supabase Edge Function
    const functionUrl = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-public-products`);

    // Append query parameters from the params object
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        functionUrl.searchParams.append(key, params[key]);
      }
    });

    // Replace apiClient call with direct fetch
    const response = await fetch(functionUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add the apikey header for Supabase function invocation
        'apikey': supabaseAnonKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data; // The function returns { success, count, totalPages, currentPage, data } or { success: false, error }

  } catch (error) {
    console.error("Error fetching products:", error.message);
    // Re-throw a consistent error structure
    throw new Error(error.message || 'Failed to fetch products');
  }
};

// Fetch a single product by its slug or ID
export const fetchProductByIdentifier = async (identifier) => {
  try {
    // Use Supabase Edge Function for product detail
    const functionUrl = `${supabaseUrl}/functions/v1/get-public-product-detail?identifier=${encodeURIComponent(identifier)}`;
    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add the apikey header here too
        'apikey': supabaseAnonKey,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data; // { success, data: product }
  } catch (error) {
    console.error(`Error fetching product ${identifier}:`, error.message);
    throw new Error(error.message || `Failed to fetch product ${identifier}`);
  }
};

// Fetch Categories from Supabase Function
export const fetchCategories = async () => {
  const functionUrl = `${supabaseUrl}/functions/v1/get-public-categories`;

  try {
    const response = await fetch(functionUrl, {
      method: "GET",
      headers: {
        // Keep existing headers for categories
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
      },
    });

    if (!response.ok) {
      // Log the response status and text for more details
      const errorText = await response.text();
      console.error(`Error fetching categories: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // Assuming the function returns { data: [...] } or just [...]
    return data.data ? { data: data.data } : { data: data };
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error; // Re-throw the error to be caught by the calling component
  }
};

// Add createProduct, updateProduct etc. later