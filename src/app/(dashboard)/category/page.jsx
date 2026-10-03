import CategoryTable from "@/components/product/CategoryTable";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";


const CategoryPage = () => {
    return (
        <ProtectedRoute>
            <CategoryTable />
        </ProtectedRoute>
    );
};

export default CategoryPage;