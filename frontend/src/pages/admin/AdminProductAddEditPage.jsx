import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  fetchAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  fetchAdminCategories,
} from '../../services/adminApi';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { FiTrash2, FiSave, FiX, FiPlus, FiChevronLeft } from 'react-icons/fi';

const productSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number({ invalid_type_error: 'Price must be a number' }).positive('Price must be positive'),
  stockQuantity: z.coerce.number({ invalid_type_error: 'Stock must be a whole number' })
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative'),
  categoryId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  rating: z.coerce.number().min(0).max(5).optional().nullable().or(z.literal('')),
  reviewCount: z.coerce.number().int().min(0).optional().nullable().or(z.literal('')),
  originalPrice: z.coerce.number().positive().optional().nullable().or(z.literal('')),
  sellerName: z.string().max(100).optional().nullable(),
  sellerLocation: z.string().max(100).optional().nullable(),
  unitsSold: z.coerce.number({ invalid_type_error: 'Units Sold must be a whole number' })
    .int()
    .min(0)
    .optional()
    .nullable()
    .or(z.literal('')),
});

const AdminProductAddEditPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(productId);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      stockQuantity: '',
      categoryId: '',
      isActive: true,
      originalPrice: '',
      rating: '',
      reviewCount: '',
      sellerName: '',
      sellerLocation: '',
      unitsSold: '',
    },
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const categoriesResponse = await fetchAdminCategories();
        setCategories(categoriesResponse.data || []);

        if (isEditMode) {
          const productResponse = await fetchAdminProductById(productId);
          const productData = productResponse.data;
          if (productData) {
            reset({
              name: productData.name || '',
              description: productData.description || '',
              price: productData.price || 0,
              stockQuantity: productData.stock_quantity || 0,
              categoryId: productData.category_id || '',
              isActive: productData.is_active !== undefined ? productData.is_active : true,
              rating: productData.rating || '',
              reviewCount: productData.review_count || '',
              originalPrice: productData.original_price || '',
              sellerName: productData.seller_name || '',
              sellerLocation: productData.seller_location || '',
              unitsSold: productData.units_sold || '',
            });
            setExistingImages(productData.images || []);
            setImagePreviews(productData.images?.map(img => `${backendUrl}${img}`) || []);
          } else {
            throw new Error('Product not found');
          }
        } else {
          reset({
            name: '',
            description: '',
            price: '',
            stockQuantity: 0,
            categoryId: '',
            isActive: true,
            rating: '',
            reviewCount: '',
            originalPrice: '',
            sellerName: '',
            sellerLocation: '',
            unitsSold: '',
          });
          setExistingImages([]);
          setImagePreviews([]);
        }
      } catch (err) {
        setError(err.message || 'Failed to load data');
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [productId, isEditMode, reset, backendUrl]);

  const handleImageChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewImageFiles(files);
      const previews = files.map((file) => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  };

  const removeExistingImage = (indexToRemove) => {
    setExistingImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const removeNewImagePreview = (indexToRemove) => {
    setNewImageFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    setImagePreviews((prev) => {
      const urlToRemove = prev[indexToRemove];
      URL.revokeObjectURL(urlToRemove);
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const onSubmit = async (data) => {
    setError(null);
    const formData = new FormData();

    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('price', data.price);
    formData.append('stockQuantity', data.stockQuantity);
    if (data.categoryId) formData.append('categoryId', data.categoryId);
    formData.append('isActive', data.isActive);

    if (data.rating) formData.append('rating', data.rating);
    if (data.reviewCount) formData.append('reviewCount', data.reviewCount);
    if (data.originalPrice) formData.append('originalPrice', data.originalPrice);
    if (data.sellerName) formData.append('sellerName', data.sellerName);
    if (data.sellerLocation) formData.append('sellerLocation', data.sellerLocation);
    if (data.unitsSold) formData.append('unitsSold', data.unitsSold);

    const imagesToDelete = existingImages.filter(img => !imagePreviews.includes(`${backendUrl}${img}`));
    if (imagesToDelete.length > 0) {
      formData.append('imagesToDelete', JSON.stringify(imagesToDelete));
    }
    const keptExistingImages = existingImages.filter(img => imagePreviews.includes(`${backendUrl}${img}`));
    formData.append('images', JSON.stringify(keptExistingImages));

    newImageFiles.forEach((file) => {
      formData.append('newImages', file);
    });

    try {
      if (isEditMode) {
        await updateAdminProduct(productId, formData);
      } else {
        await createAdminProduct(formData);
      }
      navigate('/admin/products');
    } catch (err) {
      setError(err.response?.data?.error || err.message || `Failed to ${isEditMode ? 'update' : 'create'} product.`);
      console.error("Submit error:", err.response?.data || err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light text-gray-900 mb-1">
                {isEditMode ? 'Edit Product' : 'Create Product'}
              </h1>
              <p className="text-gray-600">
                {isEditMode ? 'Update product details' : 'Add a new product to your store'}
              </p>
            </div>
            <Link
              to="/admin/products"
              className="flex items-center text-gray-600 hover:text-black"
            >
              <FiChevronLeft className="mr-2" />
              Back to Products
            </Link>
          </div>
        </div>

        {error && <ErrorMessage message={error} className="mb-6" />}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 border border-gray-100">
            <div className="mb-8">
              <h2 className="text-xl font-light text-gray-900 mb-6 pb-2 border-b border-gray-200">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    {...register('name')}
                    className={`block w-full px-4 py-3 border rounded-lg focus:ring-1 focus:ring-black focus:border-black ${
                      errors.name ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    {...register('description')}
                    className={`block w-full px-4 py-3 border rounded-lg focus:ring-1 focus:ring-black focus:border-black ${
                      errors.description ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.description && (
                    <p className="text-red-600 text-xs mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    id="categoryId"
                    {...register('categoryId')}
                    className={`block w-full px-4 py-3 border rounded-lg focus:ring-1 focus:ring-black focus:border-black ${
                      errors.categoryId ? 'border-red-500' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="text-red-600 text-xs mt-1">{errors.categoryId.message}</p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    {...register('isActive')}
                    className="h-4 w-4 border-gray-300 rounded text-black focus:ring-black"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Product is active
                  </label>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-light text-gray-900 mb-6 pb-2 border-b border-gray-200">
                Pricing & Inventory
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="price"
                    {...register('price')}
                    className={`block w-full px-4 py-3 border rounded-lg focus:ring-1 focus:ring-black focus:border-black ${
                      errors.price ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.price && (
                    <p className="text-red-600 text-xs mt-1">{errors.price.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-700 mb-1">
                    Original Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="originalPrice"
                    {...register('originalPrice')}
                    className={`block w-full px-4 py-3 border rounded-lg focus:ring-1 focus:ring-black focus:border-black ${
                      errors.originalPrice ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.originalPrice && (
                    <p className="text-red-600 text-xs mt-1">{errors.originalPrice.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    step="1"
                    id="stockQuantity"
                    {...register('stockQuantity')}
                    className={`block w-full px-4 py-3 border rounded-lg focus:ring-1 focus:ring-black focus:border-black ${
                      errors.stockQuantity ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.stockQuantity && (
                    <p className="text-red-600 text-xs mt-1">{errors.stockQuantity.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="unitsSold" className="block text-sm font-medium text-gray-700 mb-1">
                    Units Sold
                  </label>
                  <input
                    type="number"
                    step="1"
                    id="unitsSold"
                    {...register('unitsSold')}
                    className={`block w-full px-4 py-3 border rounded-lg focus:ring-1 focus:ring-black focus:border-black ${
                      errors.unitsSold ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.unitsSold && (
                    <p className="text-red-600 text-xs mt-1">{errors.unitsSold.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-light text-gray-900 mb-6 pb-2 border-b border-gray-200">
                Optional Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                    Rating (0-5)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    id="rating"
                    {...register('rating')}
                    className={`block w-full px-4 py-3 border rounded-lg focus:ring-1 focus:ring-black focus:border-black ${
                      errors.rating ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.rating && (
                    <p className="text-red-600 text-xs mt-1">{errors.rating.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="reviewCount" className="block text-sm font-medium text-gray-700 mb-1">
                    Review Count
                  </label>
                  <input
                    type="number"
                    step="1"
                    id="reviewCount"
                    {...register('reviewCount')}
                    className={`block w-full px-4 py-3 border rounded-lg focus:ring-1 focus:ring-black focus:border-black ${
                      errors.reviewCount ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.reviewCount && (
                    <p className="text-red-600 text-xs mt-1">{errors.reviewCount.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="sellerName" className="block text-sm font-medium text-gray-700 mb-1">
                    Seller Name
                  </label>
                  <input
                    type="text"
                    id="sellerName"
                    {...register('sellerName')}
                    className={`block w-full px-4 py-3 border rounded-lg focus:ring-1 focus:ring-black focus:border-black ${
                      errors.sellerName ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.sellerName && (
                    <p className="text-red-600 text-xs mt-1">{errors.sellerName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="sellerLocation" className="block text-sm font-medium text-gray-700 mb-1">
                    Seller Location
                  </label>
                  <input
                    type="text"
                    id="sellerLocation"
                    {...register('sellerLocation')}
                    className={`block w-full px-4 py-3 border rounded-lg focus:ring-1 focus:ring-black focus:border-black ${
                      errors.sellerLocation ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.sellerLocation && (
                    <p className="text-red-600 text-xs mt-1">{errors.sellerLocation.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-light text-gray-900 mb-6 pb-2 border-b border-gray-200">
                Product Images
              </h2>
              
              {isEditMode && existingImages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Current Images</h3>
                  <div className="flex flex-wrap gap-4">
                    {existingImages.map((imgUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={`${backendUrl}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`}
                          alt={`Product ${index + 1}`}
                          className="h-24 w-24 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-image.jpg';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {imagePreviews.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">New Images to Upload</h3>
                  <div className="flex flex-wrap gap-4">
                    {imagePreviews.map((previewUrl, index) => (
                      <div key={previewUrl} className="relative group">
                        <img
                          src={previewUrl}
                          alt={`Preview ${index + 1}`}
                          className="h-24 w-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImagePreview(index)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isEditMode ? 'Add More Images' : 'Upload Images'}
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer">
                    <div className="flex flex-col items-center justify-center h-24 w-24 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                      <FiPlus className="text-gray-400" size={20} />
                      <span className="text-xs text-gray-500 mt-1">Add Images</span>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500">
                    JPEG, PNG, GIF, WEBP<br />
                    Max 5MB per image
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Link
                to="/admin/products"
                className="px-6 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-lg text-white flex items-center gap-2 ${
                  isSubmitting ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'
                } transition-colors`}
              >
                {isSubmitting ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <FiSave size={16} />
                    {isEditMode ? 'Update Product' : 'Create Product'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProductAddEditPage;