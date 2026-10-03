import SubCategoryTable from "@/components/product/SubCategoryTable";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";

const SubCategoryPage = () => {
    return (
        <ProtectedRoute >
            <div>
                <SubCategoryTable />
            </div>
        </ProtectedRoute>
    );
};

export default SubCategoryPage;