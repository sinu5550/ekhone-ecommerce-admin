"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Trash2, Eye, X, Mail, Copy, Check, Filter, RotateCcw } from "lucide-react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { useEnquiryUs } from "@/lib/dataFetch";
import { usePagination } from "@/hooks/usePagination";
import Pagination from "@/components/shared/pagination";
import { apiClient } from "@/lib/apiClient";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import { usePermission } from "@/context/PermissionProvider";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";

const RECORDS_PER_PAGE = 20;

// Service options for filter
const SERVICE_OPTIONS = [
    { value: "all", label: "All Services" },
    { value: "Interior Design", label: "Interior Design" },
    { value: "Custom Product Design", label: "Custom Product Design" },
    { value: "Product Return Request", label: "Product Return Request" },
    { value: "General Inquiry", label: "General Inquiry" },
    { value: "Dealership Request", label: "Dealership Request" },
];

const EnquiryUsPage = () => {

    const { data: enquiryData = [], isLoading, mutate } = useEnquiryUs();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedService, setSelectedService] = useState("all");
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [copiedField, setCopiedField] = useState(null); 
    const { hasPermission } = usePermission();

    /** Filtering Logic */
    const filteredEnquiries = useMemo(() => {
        let filtered = enquiryData;

        // Filter by service
        if (selectedService !== "all") {
            filtered = filtered.filter(
                (enquiry) => enquiry.selectedService === selectedService
            );
        }

        // Filter by search term
        const term = searchTerm.toLowerCase().trim();
        if (term) {
            filtered = filtered.filter((enquiry) => {
                return [enquiry.name, enquiry.email, enquiry.subject, enquiry.mobile, enquiry.selectedService].some(
                    (field) => field?.toLowerCase().includes(term)
                );
            });
        }

        return filtered;
    }, [enquiryData, searchTerm, selectedService]);

    /** Pagination Hook */
    const {
        currentRecords,
        currentPage,
        setCurrentPage,
        totalPages,
        totalRecords,
        indexOfFirstRecord,
        indexOfLastRecord,
    } = usePagination(filteredEnquiries, RECORDS_PER_PAGE);

    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    }, [setCurrentPage]);

    const handleServiceFilter = useCallback((value) => {
        setSelectedService(value);
        setCurrentPage(1);
    }, [setCurrentPage]);

    /** Show only Product Return Requests */
    const showProductReturns = useCallback(() => {
        setSelectedService("Product Return Request");
        setSearchTerm("");
        setCurrentPage(1);
    }, [setCurrentPage]);

    /** View Enquiry Details */
    const handleViewDetails = (enquiry) => {
        setSelectedEnquiry(enquiry);
        setIsModalOpen(true);
    };

    /** Close Modal */
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedEnquiry(null);
    };

    /** Delete enquiry */
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Delete Enquiry?",
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
                await apiClient(`/api/enquiry-us/${id}`, { method: "DELETE" });
                await mutate();
                toast.success("Enquiry deleted successfully");
            } catch (err) {
                console.error("Delete failed:", err);
                toast.error("Delete failed. Please try again.");
            }
        }
    };

    /** Copy to clipboard - unique per field per row */
    const handleCopy = (text, field, id) => {
        const uniqueKey = `${field}-${id}`;
        navigator.clipboard.writeText(text).then(() => {
            setCopiedField(uniqueKey);
            toast.success(`${field} copied to clipboard!`);
            setTimeout(() => setCopiedField(null), 2000);
        }).catch(() => {
            toast.error("Failed to copy");
        });
    };

    /** Generate mailto link with pre-filled subject and body */
    const getMailtoLink = (enquiry) => {
        const subject = encodeURIComponent(`Re: ${enquiry.subject}`);
        const body = encodeURIComponent(
            `Dear ${enquiry.name},\n\n` +
            `Thank you for your enquiry regarding "${enquiry.subject}".\n\n` +
            `Your message:\n${enquiry.message}\n\n` +
            `\n\n---\n` +
            `Enquiry Details:\n` +
            `Name: ${enquiry.name}\n` +
            `Email: ${enquiry.email}\n` +
            `Mobile: ${enquiry.mobile}\n` +
            `Service: ${enquiry.selectedService}` +
            (enquiry.orderNumber ? `\nOrder Number: ${enquiry.orderNumber}` : '')
        );
        return `mailto:${enquiry.email}?subject=${subject}&body=${body}`;
    };

    // Loading state
    if (isLoading) return <LoadingSpinner />;

    return (
        <ProtectedRoute>
            <div className="space-y-6 p-4 text-gray-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-philosopher">Enquiry Us</h1>
                        <p className="text-gray-600 text-sm">Total number of enquiry : ({enquiryData.length})</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded shadow-sm border border-gray-200 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded">
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-gray-500" />
                            <h3 className="text-sm font-semibold text-gray-700">Filters:</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                            {/* Service Filter Dropdown */}
                            <div className="relative flex-1 sm:flex-none min-w-[180px]">
                                <select
                                    value={selectedService}
                                    onChange={(e) => handleServiceFilter(e.target.value)}
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm pr-8 appearance-none cursor-pointer"
                                >
                                    {SERVICE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <ChevronDown size={16} className="text-gray-400" />
                                </div>
                            </div>

                            {/* Show Product Returns Button */}
                            <button
                                onClick={showProductReturns}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded transition-colors duration-200 text-sm font-medium whitespace-nowrap"
                                title="Show all product return requests"
                            >
                                <RotateCcw size={16} />
                                Return Requests
                                {enquiryData.filter(e => e.selectedService === "Product Return Request").length > 0 && (
                                    <span className="ml-1 bg-amber-700 text-white text-xs px-2 py-0.5 rounded-full">
                                        {enquiryData.filter(e => e.selectedService === "Product Return Request").length}
                                    </span>
                                )}
                            </button>

                            {/* Search Input */}
                            <div className="relative flex-1 sm:flex-none sm:w-64">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Search enquiries..."
                                    className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto border border-gray-200 rounded bg-white shadow-sm">
                        <table className="w-full">
                            <thead className="bg-amber-50">
                                <tr>
                                    {["#", "Name", "Email", "Mobile No", "Service",  "Actions"].map((header) => (
                                        <th
                                            key={header}
                                            className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            {hasPermission('enquiry_us.view') && (
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentRecords.length > 0 ? (
                                        currentRecords.map((item, index) => {
                                            const isProductReturn = item.selectedService === "Product Return Request";
                                            const emailKey = `email-${item.id}`;
                                            const mobileKey = `mobile-${item.id}`;

                                            return (
                                                <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                    <td className="px-6 py-3 text-sm text-gray-800">
                                                        {indexOfFirstRecord + index }
                                                    </td>
                                                    <td className="px-6 py-3 text-sm font-medium text-gray-800">
                                                        {item.name}
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-gray-600">
                                                        <div className="flex items-center gap-2">
                                                            <span>{item.email}</span>
                                                            <button
                                                                onClick={() => handleCopy(item.email, "Email", item.id)}
                                                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                                title="Copy email"
                                                            >
                                                                {copiedField === emailKey ? (
                                                                    <Check size={14} className="text-green-500" />
                                                                ) : (
                                                                    <Copy size={14} className="text-gray-400 hover:text-gray-600" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-gray-600">
                                                        <div className="flex items-center gap-2">
                                                            <span>{item.mobile}</span>
                                                            <button
                                                                onClick={() => handleCopy(item.mobile, "Mobile", item.id)}
                                                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                                title="Copy mobile number"
                                                            >
                                                                {copiedField === mobileKey ? (
                                                                    <Check size={14} className="text-green-500" />
                                                                ) : (
                                                                    <Copy size={14} className="text-gray-400 hover:text-gray-600" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-3 text-sm">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isProductReturn
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                                                            }`}>
                                                            {isProductReturn && <RotateCcw size={12} />}
                                                            {item.selectedService}
                                                        </span>
                                                    </td>
                    
                                                    <td className="px-6 py-3">
                                                        <div className="flex gap-2">
                                                            {hasPermission('enquiry_us.details') && (
                                                                <button
                                                                    onClick={() => handleViewDetails(item)}
                                                                    className="p-2 text-gray-400 hover:text-sky-500 transition-colors duration-200 rounded hover:bg-blue-50 cursor-pointer"
                                                                    title="View Details"
                                                                >
                                                                    <Eye size={18} />
                                                                </button>
                                                            )}
                                                            {hasPermission('enquiry_us.email_reply') && (
                                                                <a
                                                                    href={getMailtoLink(item)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-200 rounded hover:bg-green-50 inline-flex items-center"
                                                                    title="Reply via Email"
                                                                >
                                                                    <Mail size={18} />
                                                                </a>
                                                            )}
                                                            {hasPermission('enquiry_us.delete') && (
                                                                <button
                                                                    onClick={() => handleDelete(item.id)}
                                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200 rounded hover:bg-red-50 cursor-pointer"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Search className="h-12 w-12 text-gray-300 mb-2" />
                                                    <p className="text-lg font-medium text-gray-800">No enquiries found</p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {searchTerm || selectedService !== "all"
                                                            ? "Try adjusting your search or filter criteria"
                                                            : "No enquiries have been submitted yet"
                                                        }
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            )}
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalRecords={totalRecords}
                            indexOfFirstRecord={indexOfFirstRecord}
                            indexOfLastRecord={indexOfLastRecord}
                            className="border border-gray-100 px-5 py-3 rounded"
                        />
                    )}
                </div>
            </div>

            {/* View Details Modal */}
            {isModalOpen && selectedEnquiry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 font-exo">
                                Enquiry Details
                                {selectedEnquiry.selectedService === "Product Return Request" && (
                                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                        <RotateCcw size={14} />
                                        Return Request
                                    </span>
                                )}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-gray-100 rounded transition-colors duration-200"
                            >
                                <X size={24} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</label>
                                    <p className="text-gray-800 font-medium mt-1">{selectedEnquiry.name}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-gray-800 font-medium">{selectedEnquiry.email}</p>
                                        <button
                                            onClick={() => handleCopy(selectedEnquiry.email, "Email", selectedEnquiry.id)}
                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                            title="Copy email"
                                        >
                                            {copiedField === `email-${selectedEnquiry.id}` ? (
                                                <Check size={16} className="text-green-500" />
                                            ) : (
                                                <Copy size={16} className="text-gray-400 hover:text-gray-600" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile Number</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-gray-800 font-medium">{selectedEnquiry.mobile}</p>
                                        <button
                                            onClick={() => handleCopy(selectedEnquiry.mobile, "Mobile", selectedEnquiry.id)}
                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                            title="Copy mobile number"
                                        >
                                            {copiedField === `mobile-${selectedEnquiry.id}` ? (
                                                <Check size={16} className="text-green-500" />
                                            ) : (
                                                <Copy size={16} className="text-gray-400 hover:text-gray-600" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</label>
                                    <p className="text-gray-800 font-medium mt-1">{selectedEnquiry.subject}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Selected Service</label>
                                    <p className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${selectedEnquiry.selectedService === "Product Return Request"
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {selectedEnquiry.selectedService === "Product Return Request" && <RotateCcw size={14} />}
                                        {selectedEnquiry.selectedService}
                                    </p>
                                </div>
                                {selectedEnquiry.orderNumber && (
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Number</label>
                                        <p className="text-gray-800 font-medium mt-1 bg-amber-50 px-3 py-1 rounded border border-amber-200 inline-block">
                                            #{selectedEnquiry.orderNumber}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</label>
                                <div className="mt-2 p-4 bg-gray-50 rounded border border-gray-200">
                                    <p className="text-gray-800 whitespace-pre-wrap">{selectedEnquiry.message}</p>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date : </label>
                                        <p className="text-gray-700 mt-1">
                                            {new Date(selectedEnquiry.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Updated</label>
                                        <p className="text-gray-700 mt-1">
                                            {new Date(selectedEnquiry.updatedAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                            {hasPermission('enquiry_us.email_reply') && (
                                <a
                                    href={getMailtoLink(selectedEnquiry)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-secound hover:bg-secound-hover text-white rounded transition-colors duration-500 font-medium flex items-center gap-2"
                                >
                                    <Mail size={18} />
                                    Reply via Email
                                </a>
                            )}
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition-colors duration-500 font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ProtectedRoute>
    );
};

export default EnquiryUsPage;

// ChevronDown component
const ChevronDown = ({ size = 20, className = "" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <polyline points="6 9 12 15 18 9" />
    </svg>
);




