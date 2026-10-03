"use client";
import { useState, useMemo, useCallback } from "react";

/**
 * Universal reusable pagination hook
 * @param {Array} allRecords - Array of all items
 * @param {number} recordsPerPage - Items per page
 */

export const usePagination = (allRecords = [], recordsPerPage = 1) => {
    const [currentPage, setCurrentPage] = useState(1);

    const paginationData = useMemo(() => {
        const totalRecords = allRecords.length;
        const totalPages = Math.ceil(totalRecords / recordsPerPage) || 1;

        // Keep page within valid range
        const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

        if (validCurrentPage !== currentPage && totalPages > 0) {
            setTimeout(() => setCurrentPage(validCurrentPage), 0);
        };

        const indexOfLastRecord = validCurrentPage * recordsPerPage;
        const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
        const currentRecords = allRecords.slice(indexOfFirstRecord, indexOfLastRecord);

        // Fix: Correct index calculations for display
        const displayFirstRecord = totalRecords > 0 ? indexOfFirstRecord + 1 : 0;
        const displayLastRecord = Math.min(indexOfLastRecord, totalRecords);

        return {
            totalRecords,
            totalPages,
            currentRecords,
            indexOfFirstRecord: displayFirstRecord,
            indexOfLastRecord: displayLastRecord,
            validCurrentPage
        };
    }, [allRecords, currentPage, recordsPerPage]);

    const handlePageChange = useCallback((page) => {
        setCurrentPage(Math.max(1, Math.min(page, Math.ceil(allRecords.length / recordsPerPage) || 1)));
    }, [allRecords.length, recordsPerPage]);

    const resetToFirstPage = useCallback(() => setCurrentPage(1), []);

    return {
        ...paginationData,
        currentPage: paginationData.validCurrentPage,
        setCurrentPage: handlePageChange,
        resetToFirstPage
    };
};

