import CollectionTable from "@/components/collection/CollectionTable";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";

const CollectionsPage = () => {
    return (
        <ProtectedRoute>
            <CollectionTable />
        </ProtectedRoute>
    );
};

export default CollectionsPage;
