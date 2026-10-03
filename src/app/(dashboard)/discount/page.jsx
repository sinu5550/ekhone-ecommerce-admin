"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Edit, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { useModal } from "@/hooks/useModal";
import { usePagination } from "@/hooks/usePagination";
import Pagination from "@/components/shared/pagination";
import { apiClient } from "@/lib/apiClient";
import DiscountAddModal from "@/components/modal/DiscountModal/DiscountAddModal";
import { useDiscountCampaign } from "@/lib/dataFetch";
import DiscountEditModal from "@/components/modal/DiscountModal/DiscountEditModal";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import { usePermission } from "@/context/PermissionProvider";

const RECORDS_PER_PAGE = 20;

const DiscountCampaignsPage = () => {

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [isTogglingStatus, setIsTogglingStatus] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const { hasPermission } = usePermission();

    const editModal = useModal();
    const addModal = useModal();

    const { data, isLoading: isFetchingCampaigns, mutate: fetchCampaigns } = useDiscountCampaign();
    const discountData = data?.campaigns || [];

    const filteredCampaigns = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        return discountData.filter((item) => {
            const matchesSearch = !term ||
                [item.name, item.campaignCode, item.description].some(
                    field => field?.toLowerCase().includes(term)
                );
            const matchesStatus = statusFilter === "all" ||
                (statusFilter === "active" && item.active) ||
                (statusFilter === "inactive" && !item.active);
            const matchesType = typeFilter === "all" || item.campaignType === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [discountData, searchTerm, statusFilter, typeFilter]);

    const {
        currentRecords,
        currentPage,
        setCurrentPage,
        totalPages,
        totalRecords,
        indexOfFirstRecord,
        indexOfLastRecord
    } = usePagination(filteredCampaigns, RECORDS_PER_PAGE);

    const formatDate = useCallback((dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString();
    }, []);

    const getStatusBadge = useCallback((status) => {
        const colors = {
            Draft: "bg-gray-100 text-gray-800",
            Scheduled: "bg-blue-100 text-teal-800",
            Active: "bg-green-100 text-green-800",
            Paused: "bg-yellow-100 text-yellow-800",
            Expired: "bg-red-100 text-red-800",
            Completed: "bg-purple-100 text-purple-800"
        };
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || "bg-gray-100"}`}>
                {status}
            </span>
        );
    }, []);

    const handleToggleStatus = async (id) => {
        const campaign = discountData.find(item => item.id === id);
        if (!campaign) {
            toast.error("Campaign not found");
            return;
        }

        setIsTogglingStatus(id);
        try {
            await apiClient(`/api/discount-campaign/${id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ active: !campaign.active })
            });
            await fetchCampaigns();
            toast.success("Status updated successfully");
        } catch (err) {
            console.error("Status update failed:", err);
            toast.error("Failed to update status");
        } finally {
            setIsTogglingStatus(null);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Delete Campaign?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        });

        if (result.isConfirmed) {
            try {
                await apiClient(`/api/discount-campaign/${id}`, {
                    method: "DELETE"
                });
                await fetchCampaigns();
                toast.success("Campaign deleted successfully");
            } catch (err) {
                console.error("Delete failed:", err);
                toast.error("Delete failed. Please try again.");
            }
        }
    };

    const handleEdit = (campaign) => {
        setSelectedItem(campaign);
        editModal.open();
    };

    const handleEditSuccess = () => {
        fetchCampaigns();
        editModal.close();
        setSelectedItem(null);
    };

    const resetFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setTypeFilter("all");
        setCurrentPage(1);
    };

    const hasActiveFilters = searchTerm || statusFilter !== "all" || typeFilter !== "all";

    return (
        <ProtectedRoute >
            <div className="space-y-6 p-4 text-gray-900">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-philosopher">Discount Campaigns</h1>
                        <p className="text-gray-600 text-sm">Manage flash deals and discount campaigns</p>
                    </div>
                    {hasPermission('discount.create') && (
                        <button
                            onClick={addModal.open}
                            className="flex items-center gap-2 px-4 py-2.5 bg-secound hover:bg-secound-hover text-white rounded font-medium transition-colors cursor-pointer"
                        >
                            <Plus size={18} />
                            Create Campaign
                        </button>
                    )}
                </div>

                {/* Filters and Table */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-4">
                    {/* Filters */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-sm font-semibold text-gray-700">Filters:</h3>
                                {hasActiveFilters && (
                                    <button
                                        onClick={resetFilters}
                                        className="text-xs text-teal-600 hover:text-teal-800 underline"
                                    >
                                        Clear filters
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1 sm:w-96">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by name, code, or description..."
                                        className="pl-10 pr-3 py-2 bg-white border border-gray-200 rounded w-full focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-40"
                                >
                                    <option value="all">All Types</option>
                                    <option value="FlashDeal">Flash Deal</option>
                                    <option value="SeasonalSale">Seasonal Sale</option>
                                    <option value="CategorySale">Category Sale</option>
                                    <option value="ClearanceSale">Clearance</option>
                                    <option value="DealsToday">Deals Today</option>
                                    <option value="SpecialOffer">Special Offer</option>
                                </select>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-32"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-amber-50">
                                <tr>
                                    {["#", "Campaign", "Type", "Discount", "Period", "Products", "Status", "Actions"].map(header => (
                                        <th key={header} className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            {hasPermission('discount.view') && (
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {isFetchingCampaigns ? (
                                        <tr>
                                            <td colSpan={10} className="px-6 py-12 text-center">
                                                <div className="flex justify-center items-center">
                                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                    <span className="ml-2">Loading discount  campaign...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : currentRecords.length > 0 ? (
                                        currentRecords.map((item, index) => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {indexOfFirstRecord + index + 1}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium text-[13px] text-gray-900">{item.name}</p>
                                                        <p className="text-xs text-gray-500">{item.campaignCode}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-purple-100/70 border border-purple-300/70 text-purple-700 px-2.5 py-1 rounded-bl-xl rounded-tr-xl text-xs font-medium">
                                                        {item.campaignType.replace(/([A-Z])/g, ' $1').trim()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-semibold text-red-600">
                                                    {item.discountType === "Percentage"
                                                        ? `${item.discountValue}%`
                                                        : `৳${item.discountValue}`
                                                    }
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    <div className="text-xs space-y-1">
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-medium">Start:</span>
                                                            {formatDate(item.startAt)}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-medium">End:</span>
                                                            {formatDate(item.endAt)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {item.appliesToAll ? (
                                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                                            All Products
                                                        </span>
                                                    ) : (
                                                        item._count?.discountProducts || 0
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {getStatusBadge(item.status)}
                                                        {hasPermission('discount.status_update') && (
                                                            <label className="relative flex items-center cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={item.active}
                                                                    onChange={() => handleToggleStatus(item.id)}
                                                                    disabled={isTogglingStatus === item.id}
                                                                    className="sr-only"
                                                                />
                                                                <div
                                                                    className={`w-10 h-5 rounded-full transition-colors ${item.active ? "bg-green-500" : "bg-gray-300"
                                                                        } ${isTogglingStatus === item.id ? "opacity-50" : ""}`}
                                                                >
                                                                    <div
                                                                        className={`w-4 h-4 rounded-full bg-white transition-transform ${item.active ? "translate-x-5" : "translate-x-0.5"
                                                                            } mt-0.5`}
                                                                    />
                                                                </div>
                                                            </label>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        {hasPermission('discount.update') && (
                                                            <button
                                                                onClick={() => handleEdit(item)}
                                                                className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors cursor-pointer"
                                                                title="Edit campaign"
                                                            >
                                                                <Edit size={18} />
                                                            </button>
                                                        )}
                                                        {hasPermission('discount.delete') && (
                                                            <button
                                                                onClick={() => handleDelete(item.id)}
                                                                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                                                title="Delete campaign"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                                <Search className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                                <p>No campaigns found</p>
                                                {hasActiveFilters && (
                                                    <p className="text-sm text-gray-400 mt-1">
                                                        Try adjusting your filters
                                                    </p>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            )}
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalRecords={totalRecords}
                            indexOfFirstRecord={indexOfFirstRecord}
                            indexOfLastRecord={indexOfLastRecord}
                            className="border px-5 py-3 rounded-lg"
                        />
                    )}
                </div>

                {/* Add Modal */}
                <DiscountAddModal
                    isOpen={addModal.isOpen}
                    onClose={addModal.close}
                    onSuccess={() => {
                        fetchCampaigns();
                        addModal.close();
                    }}
                />

                {/* Edit Modal */}
                {selectedItem && (
                    <DiscountEditModal
                        isOpen={editModal.isOpen}
                        onClose={() => {
                            editModal.close();
                            setSelectedItem(null);
                        }}
                        discount={selectedItem}
                        onSuccess={handleEditSuccess}
                    />
                )}
            </div>
        </ProtectedRoute>
    );
};

export default DiscountCampaignsPage;