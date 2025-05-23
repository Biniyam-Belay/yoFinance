import apiClient from './apiClient';

// Create a new order
export const createOrderApi = async (orderData) => {
    try {
        const response = await fetch(import.meta.env.VITE_SUPABASE_CREATE_ORDER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Order API - Error creating order:", {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            isNetworkError: !error.response,
            requestData: orderData // Log the data sent
        });
        throw error.response?.data || new Error(`Failed to create order. Status: ${error.response?.status || 'N/A'}`);
    }
};

// Fetch user's orders (Add this for the profile page later)
export const fetchMyOrdersApi = async () => {
    try {
        const response = await fetch(import.meta.env.VITE_SUPABASE_GET_MY_ORDERS_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Backend sends { success: true, count: num, data: orders[] }
        return data;
    } catch (error) {
        console.error("Order API - Error fetching orders:", {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            isNetworkError: !error.response
        });
        throw error.response?.data || new Error(`Failed to fetch orders. Status: ${error.response?.status || 'N/A'}`);
    }
};

// Fetch a single order by ID (Add this for order detail page later)
export const fetchOrderByIdApi = async (orderId) => {
    try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_GET_ORDER_DETAIL_URL}?id=${orderId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Backend sends { success: true, data: order }
        return data;
    } catch (error) {
         console.error(`Order API - Error fetching order ${orderId}:`, {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            isNetworkError: !error.response
         });
         throw error.response?.data || new Error(`Failed to fetch order ${orderId}. Status: ${error.response?.status || 'N/A'}`);
    }
 };