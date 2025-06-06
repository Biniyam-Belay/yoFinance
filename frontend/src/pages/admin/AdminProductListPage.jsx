import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProducts, deleteProduct } from '../../store/productSlice';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiAlertCircle } from 'react-icons/fi';
import Pagination from '../../components/common/Pagination';
import { formatETB } from "../../utils/utils";
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet';

const AdminProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const currentSearch = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const dispatch = useDispatch();
  const { items: products = [], loading, error } = useSelector((state) => state.products);
  const [deleteError, setDeleteError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        if (searchTerm) {
          newParams.set('search', searchTerm);
        } else {
          newParams.delete('search');
        }
        newParams.set('page', '1');
        return newParams;
      }, { replace: true });
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, setSearchParams]);

  useEffect(() => {
    dispatch(fetchProducts({
      page: currentPage,
      limit: 10,
      search: currentSearch || undefined,
    }));
  }, [dispatch, currentPage, currentSearch]);

  const handleDelete = async (productId, productName) => {
    if (window.confirm(`Delete "${productName}"? This cannot be undone.`)) {
      setDeletingId(productId);
      setDeleteError(null);
      try {
        await deleteAdminProduct(productId);
        queryClient.invalidateQueries(['admin-products']);
        refetch();
        toast.success('Product deleted successfully!');
      } catch (err) {
        toast.error(err.error || err.message || 'Failed to delete product.');
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1) {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set('page', newPage.toString());
        return newParams;
      }, { replace: true });
    }
  };

  // Pagination and total count logic (Redux version: count from products.length or add to slice if needed)
  const totalPages = 1; // Placeholder: update if you add total count to Redux
  const totalProducts = products.length;

  // Filter products by search term (if needed)
  const filteredProducts = searchTerm
    ? products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Admin Products | SuriAddis</title>
        <meta name="description" content="Admin: View, search, and manage all products in the SuriAddis store." />
      </Helmet>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
          <p className="text-slate-500 mt-1">
            {loading ? 'Loading...' : `${totalProducts} products found`}
          </p>
        </div>
        <Link
          to="/admin/products/new"
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800 text-sm whitespace-nowrap"
        >
          <FiPlus size={16} />
          Add Product
        </Link>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
        <input
          type="search"
          placeholder="Search products..."
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Error Message */}
      {error && <ErrorMessage message={error} />}
      {deleteError && <ErrorMessage message={deleteError} />}

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Spinner />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center p-12 text-slate-500">
            <FiAlertCircle className="mx-auto h-10 w-10 text-slate-400 mb-4" />
            <p className="font-medium">No products found</p>
            {searchTerm && <p className="text-sm mt-1">Try adjusting your search.</p>}
            {!searchTerm && (
              <Link
                to="/admin/products/new"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800 text-sm"
              >
                <FiPlus size={16} />
                Add First Product
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">
                      Trending
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">
                      Featured
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">
                      New Arrival
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredProducts.map((product) => {
                    // Determine the image URL for preview
                    const firstImageInfo = product.images?.[0];
                    let imageUrl = 'https://exutmsxktrnltvdgnlop.supabase.co/storage/v1/object/public/public_assets/placeholder.webp'; // Default placeholder

                    if (firstImageInfo) {
                      let pathOrUrlValue;
                      if (typeof firstImageInfo === 'string') {
                        pathOrUrlValue = firstImageInfo;
                      } else if (firstImageInfo && (firstImageInfo.image_url || firstImageInfo.url)) {
                        pathOrUrlValue = firstImageInfo.image_url || firstImageInfo.url;
                      }

                      if (pathOrUrlValue) {
                        if (pathOrUrlValue.startsWith('http')) {
                          imageUrl = pathOrUrlValue;
                        } else {
                          const viteBackendUrl = import.meta.env.VITE_BACKEND_URL;
                          if (viteBackendUrl) {
                            try {
                              imageUrl = new URL(pathOrUrlValue, viteBackendUrl).href;
                            } catch (e) {
                              console.error(`Failed to construct image URL for path "${pathOrUrlValue}" and base "${viteBackendUrl}":`, e);
                              // imageUrl remains the default placeholder
                            }
                          }
                          // If viteBackendUrl is not set and path is relative, imageUrl also remains placeholder
                        }
                      }
                    }

                    return (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded-md overflow-hidden">
                              <img
                                src={imageUrl}
                                alt={product.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://exutmsxktrnltvdgnlop.supabase.co/storage/v1/object/public/public_assets/placeholder.webp';
                                }}
                              />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-900">{product.name}</div>
                              <div className="text-sm text-slate-500 lg:hidden mt-1">
                                {product.category?.name || <span className="italic">No category</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 hidden lg:table-cell">
                          {product.category?.name || <span className="italic text-slate-400">No category</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {formatETB(product.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden sm:table-cell">
                          {product.stock_quantity ?? product.stockQuantity ?? 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-center hidden md:table-cell">
                          {product.is_trending ? '✅' : ''}
                        </td>
                        <td className="px-6 py-4 text-sm text-center hidden md:table-cell">
                          {product.is_featured ? '✅' : ''}
                        </td>
                        <td className="px-6 py-4 text-sm text-center hidden md:table-cell">
                          {product.is_new_arrival ? '✅' : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                          <div className="flex items-center justify-end gap-4">
                            <Link
                              to={`/admin/products/edit/${product.id}`}
                              className="text-slate-600 hover:text-slate-900 transition-colors"
                              title="Edit"
                            >
                              <FiEdit2 size={16} />
                            </Link>
                            <button
                              onClick={() => handleDelete(product.id, product.name)}
                              disabled={deletingId === product.id || loading}
                              className={`text-slate-600 hover:text-red-600 transition-colors ${
                                deletingId === product.id || loading ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              title="Delete"
                            >
                              {deletingId === product.id ? <Spinner size="xs" /> : <FiTrash2 size={16} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-4 sm:px-6 border-t border-slate-100">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminProductListPage;