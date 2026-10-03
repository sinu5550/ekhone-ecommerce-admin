"use client";

import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";
import CloudinaryImageInput from "@/components/ui/CloudinaryImageInput";
import { usePermission } from "@/context/PermissionProvider";
import {
  useCreateStore,
  useDeleteStore,
  useStores,
  useUpdateStore,
} from "@/hooks/useOurStore";
import Image from "next/image";
import { useCallback, useState } from "react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";

const OurStorePage = () => {

  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [address, setAddress] = useState("");
  const [phone_number, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [google_mapLink, setGoogleMapLink] = useState("");
  const [notice, setNotice] = useState("");
  const [open_time, setOpenTime] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { stores, isLoading, error, mutate } = useStores();
  const { createStore } = useCreateStore();
  const { updateStore } = useUpdateStore();
  const { deleteStore } = useDeleteStore();
  const { hasPermission } = usePermission();

  const clearErrors = useCallback((field) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const handleImageUpload = useCallback((url) => {
    setImage(url);
    clearErrors("image");
    toast.success("Image uploaded successfully");
  }, [clearErrors]);

  const handleImageError = useCallback((errorMessage) => {
    setErrors(prev => ({
      ...prev,
      image: { message: errorMessage }
    }));
    toast.error(`Image upload failed: ${errorMessage}`);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!title.trim()) {
      toast.error("Title is required");
      setIsSubmitting(false);
      return;
    }

    if (!address.trim()) {
      toast.error("Address is required");
      setIsSubmitting(false);
      return;
    }

    try {
      const storeData = {
        title: title.trim(),
        image: image.trim() || null,
        address: address.trim(),
        phone_number: phone_number.trim() || null,
        email: email.trim() || null,
        google_mapLink: google_mapLink.trim() || null,
        notice: notice.trim() || null,
        open_time: open_time.trim() || null,
      };

      if (editingId) {
        await updateStore(editingId, storeData);
        toast.success("Store updated successfully");
        setEditingId(null);
      } else {
        await createStore(storeData);
        toast.success("Store created successfully");
      }

      clearForm();
      mutate();
    } catch (error) {
      toast.error(error.message || "Something went wrong");
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearForm = () => {
    setTitle("");
    setImage("");
    setAddress("");
    setPhoneNumber("");
    setEmail("");
    setGoogleMapLink("");
    setNotice("");
    setOpenTime("");
    setErrors({});
  };

  const handleEdit = (store) => {
    setTitle(store.title || "");
    setImage(store.image || "");
    setAddress(store.address || "");
    setPhoneNumber(store.phone_number || "");
    setEmail(store.email || "");
    setGoogleMapLink(store.google_mapLink || "");
    setNotice(store.notice || "");
    setOpenTime(store.open_time || "");
    setEditingId(store.id);
    setErrors({});
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await deleteStore(id);
        toast.success("Store deleted successfully");
        mutate();
      } catch (err) {
        console.error("Delete failed:", err);
        toast.error(err.message || "Delete failed. Please try again.");
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent font-philosopher">
                Store Management
              </h1>
              <p className="text-gray-500 mt-1">Manage your physical store locations</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-primary/10 text-primary-hover rounded-full text-sm font-medium">
                Total: {stores?.length || 0} Stores
              </span>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {editingId ? "Edit Store Information" : "Add New Store"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {editingId ? "Update the store details below" : "Fill in the details to create a new store"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Basic Information */}
              <div className="space-y-5">
                {/* Store Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full px-4 py-2 rounded border ${errors.title ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                    placeholder="e.g., Main Branch, Downtown Store"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows="2"
                    className={`w-full px-4 py-2 rounded border ${errors.title ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                    placeholder="Enter complete address"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone_number}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={`w-full px-4 py-2 rounded border ${errors.title ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                    placeholder="+1 (555) 123-4567"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-2 rounded border ${errors.title ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                    placeholder="store@example.com"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Right Column - Additional Information */}
              <div className="space-y-5">
                {/* Image Upload */}
                <div>
                  <CloudinaryImageInput
                    label="Store Image"
                    value={image}
                    onUpload={handleImageUpload}
                    onError={handleImageError}
                  />
                  {errors.image && (
                    <p className="text-sm text-red-600 mt-1">{errors.image.message}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Recommended: 1920x1080px (16:9 ratio)</p>
                </div>

                {/* Opening Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Hours
                  </label>
                  <input
                    type="text"
                    value={open_time}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className={`w-full px-4 py-2 rounded border ${errors.title ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                    placeholder="Mon-Fri: 9AM-6PM, Sat: 10AM-4PM"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Special Notice */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Notice
                  </label>
                  <input
                    type="text"
                    value={notice}
                    onChange={(e) => setNotice(e.target.value)}
                    className={`w-full px-4 py-2 rounded border ${errors.title ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                    placeholder="Holiday hours, special announcements"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Google Maps Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Maps Link
                  </label>
                  <input
                    type="url"
                    value={google_mapLink}
                    onChange={(e) => setGoogleMapLink(e.target.value)}
                    className={`w-full px-4 py-2 rounded border ${errors.title ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                    placeholder="Enter embed link"
                    disabled={isSubmitting}
                  />
                  <details className="text-xs text-gray-400 mt-2">
                    <summary className="cursor-pointer hover:text-gray-600">How to get Google Maps embed link?</summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded">
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Go to Google Maps and search for your location</li>
                        <li>Click on the "Share" button</li>
                        <li>Select the "Embed a map" tab</li>
                        <li>Copy the <code className="bg-gray-200 px-1 rounded">src</code> URL from the iframe code</li>
                        <li>Paste it here</li>
                      </ol>
                    </div>
                  </details>
                </div>
              </div>
            </div>

            {/* Image Preview */}
            {image && !errors.image && (
              <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">Image Preview</label>
                <div className="relative group">
                  <Image
                    src={image}
                    alt="Store preview"
                    className="w-full h-64 object-cover rounded shadow-md"
                    width={1200}
                    height={400}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImage("");
                      clearErrors("image");
                    }}
                    className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600"
                    title="Remove image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 pt-6 mt-2 border-t border-gray-100">
              {hasPermission('cms.create') && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-secound text-white rounded hover:bg-secound-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingId ? "Updating..." : "Creating..."}
                    </span>
                  ) : (
                    editingId ? "Update Store" : "Create Store"
                  )}
                </button>
              )}

              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    clearForm();
                  }}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gray-500 text-white rounded hover:bg-gray-600 transition-all duration-200"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Store List Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">All Stores</h2>
            <p className="text-sm text-gray-500 mt-1">Manage your existing store locations</p>
          </div>

          <div className="p-6">
            {stores?.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="mt-4 text-gray-500">No stores yet. Create your first store!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {stores?.map((store) => (
                  <div
                    key={store.id}
                    className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
                  >
                    {store.image && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={store.image}
                          alt={store.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-semibold text-gray-800">{store.title}</h3>
                        <div className="flex gap-2">
                          {hasPermission('cms.update') && (
                            <button
                              onClick={() => handleEdit(store)}
                              className="text-green-600 hover:text-white hover:bg-green-600 border border-green-600 px-3 py-1 rounded text-sm font-medium transition-all duration-200"
                            >
                              Edit
                            </button>
                          )}
                          {hasPermission('cms.delete') && (
                            <button
                              onClick={() => handleDelete(store.id)}
                              className="text-red-600 hover:text-white hover:bg-red-600 border border-red-600 px-3 py-1 rounded text-sm font-medium transition-all duration-200"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-gray-600 text-sm flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{store.address}</span>
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          {store.phone_number && (
                            <p className="text-gray-600 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {store.phone_number}
                            </p>
                          )}
                          {store.email && (
                            <p className="text-gray-600 flex items-center gap-2 truncate">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span className="truncate">{store.email}</span>
                            </p>
                          )}
                        </div>

                        {store.open_time && (
                          <p className="text-gray-600 text-sm flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {store.open_time}
                          </p>
                        )}

                        {store.notice && (
                          <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200">
                            <p className="text-amber-700 text-sm flex items-start gap-2">
                              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span>{store.notice}</span>
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        {store.google_mapLink && (
                          <a
                            href={store.google_mapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-hover text-sm inline-flex items-center gap-1 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            View on Maps
                          </a>
                        )}
                        <span className="text-xs text-gray-400">
                          Added {new Date(store.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OurStorePage;