import ProductTable from "@/components/product/ProductTable";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import React from 'react';

const ProductPage = () => {
    return (
        <ProtectedRoute >
            <ProductTable />
        </ProtectedRoute>
    );
};

export default ProductPage;