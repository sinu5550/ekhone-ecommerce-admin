"use client";

import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";
import CloudinaryImageInput from "@/components/ui/CloudinaryImageInput";
import {
  useBlogs,
  useCreateBlog,
  useDeleteBlog,
  useUpdateBlog,
} from "@/hooks/useBlogs";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import { useCallback, useState } from "react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { RiDeleteBinLine } from "react-icons/ri";
import { usePermission } from "@/context/PermissionProvider";


const Blogs = () => {

  const [title, setTitle] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [thumbnailImage, setThumbnailImage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingSectionIndex, setEditingSectionIndex] = useState(null);
  // UI states
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const { hasPermission } = usePermission();
  const { data: blogs, isLoading, mutate } = useBlogs();
  const { createBlog } = useCreateBlog();
  const { updateBlog } = useUpdateBlog();
  const { deleteBlog } = useDeleteBlog();

  // Sections management
  const [sections, setSections] = useState([]);
  const [currentSection, setCurrentSection] = useState({
    heading: "",
    paragraphs: [""],
    image: ""
  });

  // Validate form fields
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    } else if (title.trim().length > 500) {
      newErrors.title = "Title must be less than 500 characters";
    }

    if (!publishDate) {
      newErrors.publishDate = "Publish date is required";
    }

    if (!shortDescription.trim()) {
      newErrors.shortDescription = "Short description is required";
    } else if (shortDescription.trim().length < 50) {
      newErrors.shortDescription = "Short description must be at least 50 characters";
    }

    if (!thumbnailImage) {
      newErrors.thumbnailImage = "Thumbnail image is required";
    }

    if (sections.length === 0) {
      newErrors.sections = "At least one section is required";
    } else {
      // Validate each section
      sections.forEach((section, index) => {
        if (!section.heading.trim()) {
          newErrors[`section_${index}_heading`] = `Section ${index + 1} heading is required`;
        }
        if (!section.paragraphs || section.paragraphs.length === 0 || section.paragraphs.every(p => !p.trim())) {
          newErrors[`section_${index}_paragraphs`] = `Section ${index + 1} must have at least one paragraph`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, publishDate, shortDescription, thumbnailImage, sections]);

  // Section management functions
  const addParagraph = () => {
    setCurrentSection({
      ...currentSection,
      paragraphs: [...currentSection.paragraphs, ""]
    });
  };

  const updateParagraph = (index, value) => {
    const updatedParagraphs = [...currentSection.paragraphs];
    updatedParagraphs[index] = value;
    setCurrentSection({
      ...currentSection,
      paragraphs: updatedParagraphs
    });
  };

  const removeParagraph = (index) => {
    if (currentSection.paragraphs.length > 1) {
      const updatedParagraphs = currentSection.paragraphs.filter((_, i) => i !== index);
      setCurrentSection({
        ...currentSection,
        paragraphs: updatedParagraphs
      });
    } else {
      toast.error("At least one paragraph is required per section");
    }
  };

  const addSection = () => {
    // Validate current section
    if (!currentSection.heading.trim()) {
      toast.error("Please enter a heading for the section");
      return;
    }
    if (!currentSection.paragraphs.some(p => p.trim())) {
      toast.error("Please add at least one paragraph");
      return;
    }

    const newSection = {
      heading: currentSection.heading.trim(),
      paragraphs: currentSection.paragraphs.filter(p => p.trim()),
      image: currentSection.image || ""
    };

    if (editingSectionIndex !== null) {
      // Update existing section
      const updatedSections = [...sections];
      updatedSections[editingSectionIndex] = newSection;
      setSections(updatedSections);
      toast.success("Section updated successfully");
    } else {
      // Add new section
      setSections([...sections, newSection]);
      toast.success("Section added successfully");
    }

    // Reset section form
    resetSectionForm();
  };

  const resetSectionForm = () => {
    setCurrentSection({
      heading: "",
      paragraphs: [""],
      image: ""
    });
    setEditingSectionIndex(null);
    setShowSectionForm(false);
  };

  const editSection = (index) => {
    const section = sections[index];
    setCurrentSection({
      heading: section.heading,
      paragraphs: section.paragraphs,
      image: section.image || ""
    });
    setEditingSectionIndex(index);
    setShowSectionForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeSection = (index) => {
    const updatedSections = sections.filter((_, i) => i !== index);
    setSections(updatedSections);
    toast.success("Section removed");
  };

  const moveSectionUp = (index) => {
    if (index > 0) {
      const updatedSections = [...sections];
      [updatedSections[index], updatedSections[index - 1]] = [updatedSections[index - 1], updatedSections[index]];
      setSections(updatedSections);
    }
  };

  const moveSectionDown = (index) => {
    if (index < sections.length - 1) {
      const updatedSections = [...sections];
      [updatedSections[index], updatedSections[index + 1]] = [updatedSections[index + 1], updatedSections[index]];
      setSections(updatedSections);
    }
  };

  const handleSectionImageUpload = useCallback((url) => {
    setCurrentSection({ ...currentSection, image: url });
    toast.success("Section image uploaded successfully");
  }, [currentSection]);

  const handleThumbnailUpload = useCallback((url) => {
    setThumbnailImage(url);
    if (errors.thumbnailImage) {
      setErrors(prev => ({ ...prev, thumbnailImage: null }));
    }
    toast.success("Thumbnail image uploaded successfully");
  }, [errors.thumbnailImage]);

  const resetForm = useCallback(() => {
    setTitle("");
    setPublishDate("");
    setShortDescription("");
    setThumbnailImage("");
    setSections([]);
    setEditingId(null);
    setErrors({});
    setIsSubmitting(false);
    resetSectionForm();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      const blogData = {
        title: title.trim(),
        publishDate: publishDate,
        shortDescription: shortDescription.trim(),
        thumbnailImage: thumbnailImage.trim(),
        sections: sections
      };

      if (editingId) {
        await updateBlog(editingId, blogData);
        toast.success("Blog updated successfully");
      } else {
        await createBlog(blogData);
        toast.success("Blog created successfully");
      }

      resetForm();
      await mutate(); // Refresh blog list
    } catch (error) {
      console.error("Blog operation failed:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = useCallback((blog) => {
    setTitle(blog.title);
    setPublishDate(blog.publishDate.split('T')[0]);
    setShortDescription(blog.shortDescription);
    setThumbnailImage(blog.thumbnailImage);
    setSections(blog.sections || []);
    setEditingId(blog.id);
    setErrors({});
    resetSectionForm();

    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleDelete = useCallback(async (id, title) => {
    const result = await Swal.fire({
      title: "Delete Blog",
      text: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      const loadingToast = toast.loading("Deleting blog...");

      try {
        await deleteBlog(id);
        toast.dismiss(loadingToast);
        toast.success("Blog deleted successfully");
        await mutate();
      } catch (err) {
        toast.dismiss(loadingToast);
        console.error("Delete failed:", err);
        toast.error(err.message || "Delete failed. Please try again.");
      }
    }
  }, [deleteBlog, mutate]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="p-4">
          {/* Header */}
          <div className="gap-4 bg-white p-4 rounded-lg shadow mb-8 border border-stone-200">
            <h1 className="text-3xl font-bold text-gray-800 font-philosopher">
              Manage Blogs
            </h1>
            <p className="text-gray-600 mt-2">
              Create, edit, and manage your blog posts with rich sections
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Create/Edit Form */}
            <div className="lg:sticky lg:top-8 h-fit max-h-screen overflow-y-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingId ? "Edit Blog Post" : "Create New Blog Post"}
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Title Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={`w-full px-4 py-2 rounded border ${errors.title ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                      placeholder="Enter blog title"
                      disabled={isSubmitting}
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {title.length}/500 characters
                    </p>
                  </div>

                  {/* Publish Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Publish Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                      className={`w-full px-4 py-2 rounded border ${errors.publishDate ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                      disabled={isSubmitting}
                    />
                    {errors.publishDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.publishDate}</p>
                    )}
                  </div>

                  {/* Short Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Short Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      rows={3}
                      className={`w-full px-4 py-2 rounded border ${errors.shortDescription ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                      placeholder="Brief summary of the blog post"
                      disabled={isSubmitting}
                    />
                    {errors.shortDescription && (
                      <p className="mt-1 text-sm text-red-600">{errors.shortDescription}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Minimum 50 characters. This will appear in blog listings.
                    </p>
                  </div>

                  {/* Thumbnail Image */}
                  <div>
                    <CloudinaryImageInput
                      label="Thumbnail Image"
                      value={thumbnailImage}
                      onUpload={handleThumbnailUpload}
                      onError={(error) => setErrors({ ...errors, thumbnailImage: error })}
                      required
                      disabled={isSubmitting}
                    />
                    {errors.thumbnailImage && (
                      <p className="mt-1 text-sm text-red-600">{errors.thumbnailImage}</p>
                    )}
                    {thumbnailImage && !errors.thumbnailImage && (
                      <div className="mt-2">
                        <img
                          src={thumbnailImage}
                          alt="Thumbnail Preview"
                          className="h-32 w-full object-cover rounded border border-gray-200"
                        />
                      </div>
                    )}
                  </div>

                  {/* Sections Section */}
                  <div className="border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Blog Sections <span className="text-red-500">*</span>
                      </label>
                      {!showSectionForm && (
                        <button
                          type="button"
                          onClick={() => setShowSectionForm(true)}
                          className="text-sm bg-sky-600 text-white px-3 py-1 rounded hover:bg-sky-700"
                        >
                          + Add Section
                        </button>
                      )}
                    </div>

                    {/* Section Form */}
                    {showSectionForm && (
                      <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
                        <h3 className="font-medium mb-3">
                          {editingSectionIndex !== null ? "Edit Section" : "New Section"}
                        </h3>

                        <div className="space-y-3">
                          <input
                            type="text"
                            value={currentSection.heading}
                            onChange={(e) => setCurrentSection({ ...currentSection, heading: e.target.value })}
                            placeholder="Section Heading"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                          />

                          {currentSection.paragraphs.map((para, idx) => (
                            <div key={idx} className="space-y-2">
                              <div className="flex gap-2">
                                <textarea
                                  value={para}
                                  onChange={(e) => updateParagraph(idx, e.target.value)}
                                  rows={3}
                                  placeholder={`Paragraph ${idx + 1}`}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeParagraph(idx)}
                                  className="text-red-500 hover:text-red-800 px-2 cursor-pointer"
                                >
                                  <RiDeleteBinLine />
                                </button>
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={addParagraph}
                            className="text-sm text-sky-500 hover:text-sky-800"
                          >
                            + Add Paragraph
                          </button>

                          <CloudinaryImageInput
                            label="Section Image (Optional)"
                            value={currentSection.image}
                            onUpload={handleSectionImageUpload}
                            onError={(error) => toast.error(error)}
                            disabled={isSubmitting}
                          />

                          {currentSection.image && (
                            <img src={currentSection.image} alt="Section" className="h-24 object-cover rounded" />
                          )}

                          <div className="flex gap-2 pt-2">
                            {hasPermission('cms.create') && (
                              <button
                                type="button"
                                onClick={addSection}
                                className="bg-sky-600 text-white px-4 py-2 rounded hover:bg-sky-700 cursor-pointer"
                              >
                                {editingSectionIndex !== null ? "Update Section" : "Add Section"}
                              </button>
                            )}
                            {hasPermission('cms.create') && (
                              <button
                                type="button"
                                onClick={resetSectionForm}
                                className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-100"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sections List */}
                    {sections.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-700">Added Sections:</h4>
                        {sections.map((section, idx) => (
                          <div key={idx} className="border rounded-lg p-4 bg-white">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-gray-900">{section.heading}</h4>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveSectionUp(idx)}
                                  disabled={idx === 0}
                                  className="text-gray-500 hover:text-gray-700 disabled:opacity-50 px-2"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveSectionDown(idx)}
                                  disabled={idx === sections.length - 1}
                                  className="text-gray-500 hover:text-gray-700 disabled:opacity-50 px-2"
                                >
                                  ↓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => editSection(idx)}
                                  className="text-green-600 hover:text-green-800 ml-2"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeSection(idx)}
                                  className="text-red-600 hover:text-red-800 ml-2"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              {section.paragraphs.length} paragraph(s)
                            </div>
                            {section.image && (
                              <img src={section.image} alt={section.heading} className="h-16 object-cover rounded mt-2" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {errors.sections && (
                      <p className="mt-1 text-sm text-red-600">{errors.sections}</p>
                    )}
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-3 pt-4">
                    {hasPermission('cms.create') && (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-secound text-white px-6 py-2.5 rounded hover:bg-secound-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {editingId ? "Updating..." : "Creating..."}
                          </span>
                        ) : (
                          editingId ? "Update Blog Post" : "Create Blog Post"
                        )}
                      </button>
                    )}
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Right: Blog List */}
            <div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-xl font-semibold text-gray-900">
                    All Blog Posts
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Total: {blogs?.length || 0} post{blogs?.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                  {blogs?.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No blog posts</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by creating your first blog post.</p>
                    </div>
                  ) : (
                    blogs?.map((blog) => (
                      <div key={blog.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-3">
                            <h3 className="font-semibold text-xl text-gray-900">
                              {blog.title}
                            </h3>

                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>📅 {new Date(blog.publishDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}</span>
                            </div>

                            {blog.thumbnailImage && (
                              <img
                                src={blog.thumbnailImage}
                                alt={blog.title}
                                className="h-40 w-full object-cover rounded"
                              />
                            )}

                            <p className="text-gray-600 text-sm">
                              {blog.shortDescription.length > 150
                                ? blog.shortDescription.substring(0, 150) + "..."
                                : blog.shortDescription}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>
                                📝 {blog.sections?.length || 0} section(s)
                              </span>
                              <span>
                                Created: {new Date(blog.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 flex-shrink-0">
                            {hasPermission('cms.update') && (
                              <button
                                onClick={() => handleEdit(blog)}
                                className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
                              >
                                Edit
                              </button>
                            )}
                            {hasPermission('cms.delete') && (
                              <button
                                onClick={() => handleDelete(blog.id, blog.title)}
                                className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Blogs;