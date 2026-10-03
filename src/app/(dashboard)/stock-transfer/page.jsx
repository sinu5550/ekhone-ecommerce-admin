"use client";

import React, { useEffect, useState } from "react";
import { Edit, Trash2, Plus, FileText, RotateCcw, Search, Import } from "lucide-react";
import stockData from "../../../../public/productData.json";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";

const StockTransfer = () => {

    const [stocks, setStocks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        setStocks(stockData);
    }, []);

    // Pagination calculations
    const indexOfLastItem = currentPage * rowsPerPage;
    const indexOfFirstItem = indexOfLastItem - rowsPerPage;
    const currentStocks = stocks.slice(indexOfFirstItem, indexOfLastItem);

    const totalPages = Math.ceil(stocks.length / rowsPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <ProtectedRoute >
            <div className="p-6 bg-gray-50 min-h-screen">
                {/* Header */}
                <div className="md:flex justify-between gap-10">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold">Stock Transfer List</h2>
                        <p className="text-sm text-gray-500">Manage your Stock Transfer</p>
                    </div>

                    {/* Top Buttons */}
                    <div className="md:flex items-center justify-between mb-4 gap-10 space-y-3 md:space-y-0">
                        <div className="flex gap-4">
                            <button
                                title="pdf"
                                className="p-2 border rounded bg-red-50 text-red-600 hover:bg-red-200 cursor-pointer"
                            >
                                <FileText size={18} />
                            </button>
                            <button
                                title="xls"
                                className="p-2 border rounded bg-green-50 text-green-600 hover:bg-green-200 cursor-pointer"
                            >
                                <FileText size={18} />
                            </button>
                            <button
                                title="Refresh"
                                className="p-2 border rounded bg-sky-50 text-sky-600 hover:bg-sky-200 cursor-pointer"
                                onClick={() => setStocks(stockData)}
                            >
                                <RotateCcw size={18} />
                            </button>
                        </div>

                        <div className="md:flex  gap-5">
                            <button className="flex items-center gap-2 px-2 py-2 rounded bg-secound text-white hover:text-secound hover:bg-transparent border border-secound cursor-pointer">
                                <Plus size={18} /> Add New
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 rounded bg-primary hover:bg-primary-hover text-black hover:text-white cursor-pointer">
                                <Import size={18} /> Import Transfer
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-md shadow-md border border-gray-100">
                    {/* Search and Filters */}
                    <div className="lg:flex justify-between gap-10 mb-5">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="search"
                                placeholder="Search..."
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                            />
                        </div>
                        <div className="flex gap-5">
                            <select className="border border-gray-200 bg-white rounded px-3 py-1 outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500">
                                <option>From Warehouse</option>
                            </select>
                            <select className="border border-gray-200 bg-white rounded px-3 py-1 outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500">
                                <option>To Warehouse</option>
                            </select>
                            <select className="border border-gray-200 bg-white rounded px-3 py-1 outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500">
                                <option>Sort by : Last 7 Days</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto border border-gray-100 rounded bg-white">
                        <table className="w-full border border-gray-200 text-sm">
                            <thead>
                                <tr className="bg-yellow-50 text-left">
                                    <th className="px-3 py-3">
                                        NO
                                    </th>
                                    <th className="px-3 py-3">From Warehouse</th>
                                    <th className="px-3 py-3">To Warehouse</th>
                                    <th className="px-3 py-3">No. of Products</th>
                                    <th className="px-3 py-3">Quantity Transfer</th>
                                    <th className="px-3 py-3">Unit</th>
                                    <th className="px-3 py-3">Ref. number</th>
                                    <th className="px-3 py-3">Date</th>
                                    <th className="px-3 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentStocks.length > 0 ? (
                                    currentStocks.map((item, index) => (
                                        <tr
                                            key={item.id}
                                            className="border border-gray-200 hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-3 py-2">
                                                {index + 1}
                                            </td>
                                            <td className="px-3 py-2">{item.warehouse}</td>
                                            <td className="px-3 py-2">{item.store}</td>
                                            <td className="px-3 py-2">{item.mainCategory}</td>
                                            <td className="px-3 py-2">{item.category}</td>
                                            <td className="px-3 py-2">{item.subCategory}</td>
                                            <td className="px-3 py-2">{item.brand}</td>
                                            <td className="px-3 py-2">{item.unit}</td>

                                            <td className="px-6 py-2 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(category._id)}
                                                        className="inline-flex items-center p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(category._id)}
                                                        className="inline-flex items-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="12" className="text-center py-5 text-gray-400">
                                            No stock data found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-8 text-sm ">
                        <div className="flex items-center gap-2 text-gray-500">
                            <span>Rows per page:</span>
                            <select
                                className="border rounded px-2 py-1"
                                value={rowsPerPage}
                                onChange={(e) => {
                                    setRowsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                            >

                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                            <span>
                                Showing {indexOfFirstItem + 1} -{" "}
                                {Math.min(indexOfLastItem, stocks.length)} of {stocks.length}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Prev Button */}
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-1 border border-gray-200 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                &lt;
                            </button>

                            {/* Smart Pagination */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((page) => {
                                    // Always show first and last
                                    if (page === 1 || page === totalPages) return true;
                                    // Show nearby pages around current
                                    return (
                                        page >= currentPage - 2 &&
                                        page <= currentPage + 2
                                    );
                                })
                                .map((page, i, arr) => (
                                    <React.Fragment key={page}>
                                        {/* Add "..." for skipped pages */}
                                        {i > 0 && arr[i - 1] !== page - 1 && (
                                            <span className="px-2">...</span>
                                        )}
                                        <button
                                            onClick={() => handlePageChange(page)}
                                            className={`px-3 py-1 rounded border border-gray-200 ${currentPage === page
                                                ? "bg-yellow-400 text-gray-800"
                                                : "hover:bg-gray-100"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    </React.Fragment>
                                ))}

                            {/* Next Button */}
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-1 border border-gray-200 rounded hover:bg-gray-100 disabled:opacity-50  disabled:cursor-not-allowed cursor-pointer"
                            >
                                &gt;
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};


export default StockTransfer;
