import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    totalRecords,
    indexOfFirstRecord,
    indexOfLastRecord,
    className = ""
}) => {
    if (totalPages <= 1) return null;

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            onPageChange(page);
        }
    };

    const getPageNumbers = () => {
        if (totalPages <= 5) {
            // Show all pages if total pages is 5 or less
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        let startPage = Math.max(1, currentPage - 1);
        let endPage = Math.min(totalPages, currentPage + 1);

        // Adjust to always show 3 pages if possible
        if (currentPage <= 2) {
            startPage = 1;
            endPage = 3;
        } else if (currentPage >= totalPages - 1) {
            startPage = totalPages - 2;
            endPage = totalPages;
        }

        const pages = [];

        // Always show first page
        if (startPage > 1) {
            pages.push(1);
            if (startPage > 2) pages.push("ellipsis-start");
        }

        // Middle pages
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        // Always show last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pages.push("ellipsis-end");
            pages.push(totalPages);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className={`flex flex-col md:flex-row justify-between items-center px-4 py-6 gap-4 ${className}`}>
            <p className="text-sm text-gray-600">
                Showing {indexOfFirstRecord} to {indexOfLastRecord} of {totalRecords} members
            </p>
            <div className="flex flex-wrap gap-2 items-center">
                {/* Previous Button */}
                <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="p-2 bg-white hover:bg-primary-hover border border-gray-200 hover:border-primary-hover rounded-full cursor-pointer disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={16} />

                </button>

                {/* Page Numbers */}
                {pageNumbers.map((page, index) => {
                    if (page === "ellipsis-start" || page === "ellipsis-end") {
                        return (
                            <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-500">
                                ...
                            </span>
                        );
                    }

                    return (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 rounded-full transition-colors  font-medium ${currentPage === page
                                ? 'bg-primary border border-primary text-white'
                                : 'bg-white  text-black hover:text-white hover:bg-primary border border-gray-200 hover:border-primary'
                                }`}
                        >
                            {page}
                        </button>
                    );
                })}

                {/* Next Button */}
                <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="p-2 bg-white hover:bg-primary hover:text-white border border-gray-200 hover:border-primary-hover rounded-full cursor-pointer disabled:cursor-not-allowed"
                >

                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;