// components/admin/ClientManagement.jsx
"use client";

import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import CloudinaryImageInput from "@/components/ui/CloudinaryImageInput";

import {
    Building2,
    Edit,
    Trash2,
    Plus,
    X,
    Loader2,
    AlertCircle,
    Calendar,
    Clock,
    Save,
    MapPin,
    Globe,
    Briefcase,
    Star,
    TrendingUp,
    Youtube,
    Image as ImageIcon
} from "lucide-react";
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from "@/hooks/useOurClient";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";

const ClientManagement = () => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        image: '',
        testimonials: '',
        industry: '',
        location: '',
        founded: '',
        websiteUrl: '',
        isActive: true,
        projects: []
    });

    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');
    const [currentProject, setCurrentProject] = useState(null);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [projectDetails, setProjectDetails] = useState([]);
    const [currentDetail, setCurrentDetail] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const { clients, isLoading, mutate } = useClients();
    const { createClient } = useCreateClient();
    const { updateClient } = useUpdateClient();
    const { deleteClient } = useDeleteClient();

    const handleEdit = async (client) => {
        setFormData({
            name: client.name || '',
            description: client.description || '',
            category: client.category || '',
            image: client.image || '',
            testimonials: client.testimonials || '',
            industry: client.industry || '',
            location: client.location || '',
            founded: client.founded || '',
            websiteUrl: client.websiteUrl || '',
            isActive: client.isActive !== undefined ? client.isActive : true,
            projects: client.projects?.map(project => ({
                ...project,
                id: project.id,
                images: project.images || [],
                youtubeLink: project.youtubeLink || '',
                date: project.date ? new Date(project.date).toISOString().split('T')[0] : '',
                details: project.details?.map(detail => ({
                    ...detail,
                    id: detail.id
                })) || []
            })) || []
        });
        setEditingId(client.id);
        setIsModalOpen(true);
        setActiveTab('basic');
    };

    const handleAddNew = () => {
        setFormData({
            name: '',
            description: '',
            category: '',
            image: '',
            testimonials: '',
            industry: '',
            location: '',
            founded: '',
            websiteUrl: '',
            isActive: true,
            projects: []
        });
        setEditingId(null);
        setIsModalOpen(true);
        setActiveTab('basic');
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({
            name: '',
            description: '',
            category: '',
            image: '',
            testimonials: '',
            industry: '',
            location: '',
            founded: '',
            websiteUrl: '',
            isActive: true,
            projects: []
        });
        setErrors({});
        setActiveTab('basic');
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Client name is required";
        if (!formData.description.trim()) newErrors.description = "Description is required";
        if (!formData.category.trim()) newErrors.category = "Category is required";
        if (!formData.testimonials.trim()) newErrors.testimonials = "Testimonials are required";
        if (!formData.industry.trim()) newErrors.industry = "Industry is required";
        if (!formData.location.trim()) newErrors.location = "Location is required";
        if (!formData.founded) {
            newErrors.founded = "Founded year is required";
        } else if (isNaN(formData.founded) || formData.founded < 1800 || formData.founded > new Date().getFullYear()) {
            newErrors.founded = "Please enter a valid year";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fix the errors before submitting");
            return;
        }

        setIsSubmitting(true);
        try {
            const submitData = {
                name: formData.name,
                description: formData.description,
                category: formData.category,
                image: formData.image || null,
                testimonials: formData.testimonials,
                industry: formData.industry,
                location: formData.location,
                founded: parseInt(formData.founded),
                websiteUrl: formData.websiteUrl || null,
                isActive: formData.isActive,
                projects: formData.projects.map(project => ({
                    id: project.id || undefined,
                    name: project.name,
                    images: project.images || [],
                    youtubeLink: project.youtubeLink || null,
                    description: project.description,
                    date: project.date || new Date().toISOString(),
                    details: (project.details || []).map(detail => ({
                        id: detail.id || undefined,
                        title: detail.title,
                        description: detail.description,
                        image: detail.image || ''
                    }))
                }))
            };

            if (editingId) {
                await updateClient(editingId, submitData);
                toast.success("Client updated successfully");
            } else {
                await createClient(submitData);
                toast.success("Client created successfully");
            }

            await mutate();
            handleCloseModal();
        } catch (error) {
            toast.error(error.message || "Something went wrong");
            console.error("Submit error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id, name) => {
        const result = await Swal.fire({
            title: `Delete "${name}"?`,
            text: "This action cannot be undone. All associated projects and details will be removed.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
        });

        if (result.isConfirmed) {
            try {
                await deleteClient(id);
                toast.success("Client deleted successfully");
                await mutate();
            } catch (err) {
                console.error("Delete failed:", err);
                toast.error(err.message || "Delete failed. Please try again.");
            }
        }
    };

    const handleAddProject = () => {
        setCurrentProject(null);
        setProjectDetails([]);
        setIsProjectModalOpen(true);
    };

    const handleEditProject = (project) => {
        setCurrentProject(project);
        setProjectDetails(project.details || []);
        setIsProjectModalOpen(true);
    };

    const handleSaveProject = (projectData) => {
        if (currentProject) {
            const updatedProjects = formData.projects.map(p =>
                p.id === currentProject.id
                    ? { ...projectData, id: p.id, details: projectDetails }
                    : p
            );
            setFormData(prev => ({ ...prev, projects: updatedProjects }));
            toast.success("Project updated successfully");
        } else {
            setFormData(prev => ({
                ...prev,
                projects: [...prev.projects, { ...projectData, id: undefined, details: projectDetails }]
            }));
            toast.success("Project added successfully");
        }
        setIsProjectModalOpen(false);
        setCurrentProject(null);
        setProjectDetails([]);
    };

    const handleDeleteProject = (projectId) => {
        Swal.fire({
            title: 'Delete Project?',
            text: "This action cannot be undone. All project details will also be deleted.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                setFormData(prev => ({
                    ...prev,
                    projects: prev.projects.filter(p => p.id !== projectId)
                }));
                toast.success("Project deleted successfully");
            }
        });
    };

    const handleAddDetail = () => {
        setCurrentDetail(null);
        setIsDetailModalOpen(true);
    };

    const handleEditDetail = (detail) => {
        setCurrentDetail(detail);
        setIsDetailModalOpen(true);
    };

    const handleSaveDetail = (detailData) => {
        if (currentDetail) {
            const updatedDetails = projectDetails.map(d =>
                d.id === currentDetail.id ? { ...detailData, id: d.id } : d
            );
            setProjectDetails(updatedDetails);
            toast.success("Detail updated successfully");
        } else {
            setProjectDetails([...projectDetails, { ...detailData, id: undefined }]);
            toast.success("Detail added successfully");
        }
        setIsDetailModalOpen(false);
        setCurrentDetail(null);
    };

    const handleDeleteDetail = (detailId) => {
        setProjectDetails(projectDetails.filter(d => d.id !== detailId));
        toast.success("Detail deleted successfully");
    };

    if (isLoading) return <LoadingSpinner />;

    const clientList = clients || [];

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="py-8">
                    <div className="bg-white rounded shadow border border-gray-100 p-6 mb-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent font-philosopher">
                                    Client Management
                                </h1>
                                <p className="text-gray-500 mt-1">Manage your clients, projects, and success stories</p>
                            </div>
                            <button
                                onClick={handleAddNew}
                                className="flex items-center gap-2 px-4 py-2 bg-secound text-white rounded hover:bg-secound-hover transition-all duration-200 shadow cursor-pointer"
                            >
                                <Plus className="h-4 w-4" />
                                Add New Client
                            </button>
                        </div>
                    </div>

                    {clientList.length === 0 ? (
                        <div className="bg-white rounded-xl shadow border border-gray-100 p-12 text-center">
                            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-4 text-gray-500">No clients added yet.</p>
                            <button
                                onClick={handleAddNew}
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-secound text-white rounded hover:bg-secound-hover transition-all duration-200"
                            >
                                <Plus className="h-4 w-4" />
                                Add Your First Client
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {clientList.map((client) => (
                                <div key={client.id} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                    <div className="p-5 border-b border-gray-100">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1 space-y-3">
                                                {client.image && (
                                                    <div className="mb-3">
                                                        <img src={client.image} alt={client.name} className="h-16 w-16 object-contain rounded border border-gray-200" />
                                                    </div>
                                                )}
                                                <h3 className="text-2xl font-semibold text-gray-800 mb-1">{client.name}</h3>
                                                <div className="flex items-center gap-2 text-sm flex-wrap">
                                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">{client.category}</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs ${client.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {client.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <button onClick={() => handleEdit(client)} className="text-green-500 hover:text-white hover:bg-green-500 p-1.5 rounded transition-all duration-200" title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(client.id, client.name)} className="text-red-600 hover:text-white hover:bg-red-600 p-1.5 rounded transition-all duration-200" title="Delete">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-gray-600"><Briefcase className="h-4 w-4" /><span>{client.industry}</span></div>
                                            <div className="flex items-center gap-2 text-gray-600"><MapPin className="h-4 w-4" /><span>{client.location}</span></div>
                                            <div className="flex items-center gap-2 text-gray-600"><Calendar className="h-4 w-4" /><span>Founded: {client.founded}</span></div>
                                            {client.websiteUrl && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Globe className="h-4 w-4" />
                                                    <a href={client.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline truncate">{client.websiteUrl}</a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-5 border-b border-gray-100">
                                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{client.description}</p>
                                        <div className="mt-3 p-3 bg-gray-50 rounded">
                                            <div className="flex items-start gap-2">
                                                <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                                <p className="text-gray-600 text-sm italic line-clamp-2">"{client.testimonials}"</p>
                                            </div>
                                        </div>
                                    </div>

                                    {client.projects && client.projects.length > 0 && (
                                        <div className="p-5">
                                            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4" />
                                                Projects ({client.projects.length})
                                            </h4>
                                            <div className="space-y-2">
                                                {client.projects.slice(0, 2).map((project) => (
                                                    <div key={project.id} className="text-sm">
                                                        <p className="font-medium text-gray-800">{project.name}</p>
                                                        <p className="text-gray-500 text-xs line-clamp-2">{project.description}</p>
                                                        {project.youtubeLink && (
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <Youtube className="h-3 w-3 text-red-600" />
                                                                <span className="text-xs text-gray-500">Has video</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {client.projects.length > 2 && <p className="text-secound text-xs">+{client.projects.length - 2} more projects</p>}
                                            </div>
                                        </div>
                                    )}

                                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                        <div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span>Updated: {new Date(client.updatedAt).toLocaleDateString()}</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Client Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl max-w-4xl w-full my-8 overflow-y-auto max-h-[90vh]">
                        <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 bg-white z-10">
                            <div className="flex items-center gap-2">
                                {editingId ? <><Edit className="h-5 w-5 text-secound" /><h3 className="text-xl font-semibold text-gray-800">Edit Client</h3></> : <><Plus className="h-5 w-5 text-secound" /><h3 className="text-xl font-semibold text-gray-800">Add New Client</h3></>}
                            </div>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
                        </div>

                        <div className="border-b border-gray-100 px-6">
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setActiveTab('basic')} className={`py-2 px-4 font-medium transition-colors ${activeTab === 'basic' ? 'text-secound border-b-2 border-secound' : 'text-gray-500 hover:text-gray-700'}`}>Basic Information</button>
                                <button type="button" onClick={() => setActiveTab('projects')} className={`py-2 px-4 font-medium transition-colors ${activeTab === 'projects' ? 'text-secound border-b-2 border-secound' : 'text-gray-500 hover:text-gray-700'}`}>Projects & Details ({formData.projects.length})</button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            {activeTab === 'basic' && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Client Name <span className="text-red-500">*</span></label>
                                        <input type="text" name="name" value={formData.name} onChange={handleChange} className={`w-full px-4 py-2.5 rounded border ${errors.name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`} placeholder="Enter client name" disabled={isSubmitting} />
                                        {formData.name && <p className="mt-1 text-xs text-gray-500">Slug will be: {formData.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}</p>}
                                        {errors.name && <p className="mt-1 text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.name}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="block text-sm font-medium text-gray-700 mb-2">Category <span className="text-red-500">*</span></label><input type="text" name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Enterprise, Startup" disabled={isSubmitting} />{errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}</div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-2">Industry <span className="text-red-500">*</span></label><input type="text" name="industry" value={formData.industry} onChange={handleChange} className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Technology, Healthcare" disabled={isSubmitting} />{errors.industry && <p className="mt-1 text-sm text-red-600">{errors.industry}</p>}</div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="block text-sm font-medium text-gray-700 mb-2">Location <span className="text-red-500">*</span></label><input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Dhaka, Bangladesh" disabled={isSubmitting} />{errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}</div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-2">Founded Year <span className="text-red-500">*</span></label><input type="number" name="founded" value={formData.founded} onChange={handleChange} className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., 2026" disabled={isSubmitting} />{errors.founded && <p className="mt-1 text-sm text-red-600">{errors.founded}</p>}</div>
                                    </div>

                                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label><input type="url" name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://example.com" disabled={isSubmitting} /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Description <span className="text-red-500">*</span></label><textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Describe the client company..." disabled={isSubmitting} />{errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}</div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Testimonials <span className="text-red-500">*</span></label><textarea name="testimonials" value={formData.testimonials} onChange={handleChange} rows="3" className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Client testimonial or feedback..." disabled={isSubmitting} />{errors.testimonials && <p className="mt-1 text-sm text-red-600">{errors.testimonials}</p>}</div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Client Logo</label>
                                        <CloudinaryImageInput value={formData.image} onUpload={(url) => setFormData(prev => ({ ...prev, image: url }))} onError={(error) => toast.error(error)} />
                                        {formData.image && (<div className="mt-2"><img src={formData.image} alt="Client Logo Preview" className="h-20 w-20 object-contain rounded border border-gray-200" /><button type="button" onClick={() => setFormData(prev => ({ ...prev, image: '' }))} className="mt-1 text-xs text-red-600 hover:text-red-700">Remove Logo</button></div>)}
                                    </div>

                                    <div><label className="flex items-center gap-2"><input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="w-4 h-4 text-secound rounded border-gray-300 focus:ring-blue-500" /><span className="text-sm font-medium text-gray-700">Active Client</span></label></div>
                                </div>
                            )}

                            {activeTab === 'projects' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-lg font-semibold text-gray-800">Projects</h4>
                                        <button type="button" onClick={handleAddProject} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-all duration-200 text-sm"><Plus className="h-4 w-4" />Add Project</button>
                                    </div>

                                    {formData.projects.length === 0 ? (
                                        <div className="text-center py-8 bg-gray-50 rounded"><p className="text-gray-500">No projects added yet.</p><button type="button" onClick={handleAddProject} className="mt-2 text-secound hover:text-secound-hover text-sm">Add your first project</button></div>
                                    ) : (
                                        <div className="space-y-3">
                                            {formData.projects.map((project, index) => (
                                                <div key={project.id || index} className="border border-gray-200 rounded p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex-1"><h5 className="font-semibold text-gray-800">{project.name}</h5>{project.date && <p className="text-xs text-gray-500">{new Date(project.date).toLocaleDateString()}</p>}</div>
                                                        <div className="flex gap-2"><button type="button" onClick={() => handleEditProject(project)} className="text-secound hover:text-secound-hover"><Edit className="h-4 w-4" /></button><button type="button" onClick={() => handleDeleteProject(project.id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></button></div>
                                                    </div>

                                                    {project.images && project.images.length > 0 && (
                                                        <div className="mb-3">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <ImageIcon className="h-4 w-4 text-gray-500" />
                                                                <span className="text-xs font-medium text-gray-600">{project.images.length} Images</span>
                                                            </div>
                                                            <div className="flex gap-2 overflow-x-auto pb-2">
                                                                {project.images.slice(0, 3).map((img, idx) => (
                                                                    <img key={idx} src={img} alt={`${project.name} ${idx + 1}`} className="w-16 h-16 object-cover rounded border border-gray-200 flex-shrink-0" />
                                                                ))}
                                                                {project.images.length > 3 && <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500 flex-shrink-0">+{project.images.length - 3}</div>}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {project.youtubeLink && (
                                                        <div className="mb-2 flex items-center gap-2 p-2 bg-red-50 rounded">
                                                            <Youtube className="h-4 w-4 text-red-600" />
                                                            <a href={project.youtubeLink} target="_blank" rel="noopener noreferrer" className="text-sm text-red-600 hover:underline truncate">YouTube Video Link</a>
                                                        </div>
                                                    )}

                                                    <p className="text-sm text-gray-600">{project.description}</p>
                                                    {project.details && project.details.length > 0 && <div className="mt-2"><p className="text-xs text-gray-500">{project.details.length} details added</p></div>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3 pt-6 mt-6 border-t border-gray-100">
                                <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-secound text-white rounded hover:bg-secound-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />{editingId ? "Updating..." : "Creating..."}</> : <><Save className="h-4 w-4" />{editingId ? "Update Client" : "Create Client"}</>}
                                </button>
                                <button type="button" onClick={handleCloseModal} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-all duration-200"><X className="h-4 w-4" />Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isProjectModalOpen && (
                <ProjectModal
                    project={currentProject}
                    details={projectDetails}
                    onSave={handleSaveProject}
                    onClose={() => { setIsProjectModalOpen(false); setCurrentProject(null); setProjectDetails([]); }}
                    onAddDetail={handleAddDetail}
                    onEditDetail={handleEditDetail}
                    onDeleteDetail={handleDeleteDetail}
                />
            )}

            {isDetailModalOpen && (
                <DetailModal
                    detail={currentDetail}
                    onSave={handleSaveDetail}
                    onClose={() => { setIsDetailModalOpen(false); setCurrentDetail(null); }}
                />
            )}
        </ProtectedRoute>
    );
};

// Project Modal Component
const ProjectModal = ({ project, details, onSave, onClose, onAddDetail, onEditDetail, onDeleteDetail }) => {
    const [formData, setFormData] = useState({
        name: project?.name || '',
        images: project?.images || [],
        youtubeLink: project?.youtubeLink || '',
        description: project?.description || '',
        date: project?.date ? new Date(project.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleMultipleImageUpload = useCallback(async (files) => {
        if (!files || files.length === 0) return;

        setUploadingImage(true);
        const uploadedUrls = [];

        for (const file of files) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

                const response = await fetch(
                    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                    { method: 'POST', body: formData }
                );

                const data = await response.json();
                if (data.secure_url) {
                    uploadedUrls.push(data.secure_url);
                }
            } catch (error) {
                console.error('Upload error:', error);
                toast.error(`Failed to upload ${file.name}`);
            }
        }

        if (uploadedUrls.length > 0) {
            setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
            toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
        }
        setUploadingImage(false);
    }, []);

    const handleRemoveImage = (indexToRemove) => {
        Swal.fire({
            title: 'Remove Image?',
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, remove it!'
        }).then((result) => {
            if (result.isConfirmed) {
                setFormData(prev => ({
                    ...prev,
                    images: prev.images.filter((_, index) => index !== indexToRemove)
                }));
                toast.success("Image removed successfully");
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setErrors({ name: "Project name is required" });
            return;
        }
        if (!formData.description.trim()) {
            setErrors({ description: "Description is required" });
            return;
        }
        setIsSubmitting(true);
        onSave(formData);
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
                    <h3 className="text-xl font-semibold text-gray-800">{project ? 'Edit Project' : 'Add New Project'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Project Name <span className="text-red-500">*</span></label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className={`w-full px-4 py-2.5 rounded border ${errors.name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`} placeholder="Enter project name" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Project Images (Multiple)</label>
                        <div className="mb-3">
                            <label className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-500 transition-colors bg-gray-50">
                                <input type="file" multiple accept="image/*" onChange={(e) => handleMultipleImageUpload(e.target.files)} className="hidden" disabled={uploadingImage} />
                                {uploadingImage ? <><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Uploading...</span></> : <><ImageIcon className="h-4 w-4 text-gray-500" /><span className="text-sm text-gray-600">Click to upload multiple images</span></>}
                            </label>
                        </div>

                        {formData.images.length > 0 && (
                            <div className="mt-3">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Uploaded Images ({formData.images.length})</span>
                                    <button type="button" onClick={() => { Swal.fire({ title: 'Remove All Images?', text: "This action cannot be undone.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Yes, remove all' }).then((result) => { if (result.isConfirmed) { setFormData(prev => ({ ...prev, images: [] })); toast.success("All images removed"); } }); }} className="text-xs text-red-600 hover:text-red-700">Remove All</button>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {formData.images.map((img, idx) => (
                                        <div key={idx} className="relative group">
                                            <img src={img} alt={`Project image ${idx + 1}`} className="w-full h-24 object-cover rounded border border-gray-200" />
                                            <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-700"><X className="h-3 w-3" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">YouTube Video Link</label>
                        <div className="flex items-center gap-2">
                            <Youtube className="h-5 w-5 text-red-600 flex-shrink-0" />
                            <input type="url" name="youtubeLink" value={formData.youtubeLink} onChange={handleChange} className="flex-1 px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://youtube.com/watch?v=..." />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description <span className="text-red-500">*</span></label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className={`w-full px-4 py-2.5 rounded border ${errors.description ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`} placeholder="Project description..." />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Project Date</label>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-lg font-medium text-gray-700">Project Details</label>
                            <button type="button" onClick={onAddDetail} className="text-sm text-secound bg-transparent hover:bg-blue-50 border border-secound rounded-full px-3 py-1 flex items-center gap-1 transition-colors"><Plus className="h-3 w-3" />Add Detail</button>
                        </div>

                        {details.length === 0 ? <p className="text-sm text-gray-500 text-center py-4">No details added yet.</p> : (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {details.map((detail, index) => (
                                    <div key={detail.id || index} className="bg-gray-50 p-3 rounded flex justify-between items-start hover:shadow-sm transition-shadow">
                                        <div className="flex-1"><p className="font-medium text-gray-800">{detail.title}</p><p className="text-sm text-gray-600 line-clamp-2">{detail.description}</p>{detail.image && <img src={detail.image} alt={detail.title} className="mt-2 w-16 h-16 object-cover rounded border" />}</div>
                                        <div className="flex gap-2 ml-2"><button type="button" onClick={() => onEditDetail(detail)} className="text-secound hover:text-secound-hover p-1"><Edit className="h-4 w-4" /></button><button type="button" onClick={() => onDeleteDetail(detail.id)} className="text-red-600 hover:text-red-700 p-1"><Trash2 className="h-4 w-4" /></button></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-all duration-200">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-secound text-white rounded hover:bg-secound-hover transition-all duration-200 disabled:opacity-50">
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {project ? 'Update Project' : 'Add Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Detail Modal Component
const DetailModal = ({ detail, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        title: detail?.title || '',
        description: detail?.description || '',
        image: detail?.image || ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleImageUpload = useCallback((url) => {
        setFormData(prev => ({ ...prev, image: url }));
        toast.success("Image uploaded successfully");
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            setErrors({ title: "Title is required" });
            return;
        }
        if (!formData.description.trim()) {
            setErrors({ description: "Description is required" });
            return;
        }
        setIsSubmitting(true);
        onSave(formData);
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-xl w-full max-h-[80vh] overflow-y-auto">
                <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-800">{detail ? 'Edit Detail' : 'Add Detail'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Title <span className="text-red-500">*</span></label><input type="text" name="title" value={formData.title} onChange={handleChange} className={`w-full px-4 py-2.5 rounded border ${errors.title ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`} placeholder="Detail title" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Description <span className="text-red-500">*</span></label><textarea name="description" value={formData.description} onChange={handleChange} rows="3" className={`w-full px-4 py-2.5 rounded border ${errors.description ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`} placeholder="Detail description..." /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Image (Optional)</label><CloudinaryImageInput value={formData.image} onUpload={handleImageUpload} onError={(error) => toast.error(error)} />{formData.image && (<div className="mt-2"><img src={formData.image} alt="Preview" className="w-full h-32 object-cover rounded" /><button type="button" onClick={() => setFormData(prev => ({ ...prev, image: '' }))} className="mt-1 text-xs text-red-600 hover:text-red-700">Remove Image</button></div>)}</div>
                    <div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-all duration-200">Cancel</button><button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-secound text-white rounded hover:bg-secound-hover transition-all duration-200">{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save</button></div>
                </form>
            </div>
        </div>
    );
};

export default ClientManagement;