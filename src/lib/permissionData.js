// CREATE EXTENSION IF NOT EXISTS pgcrypto;

// INSERT INTO "Permission"(id, module, action, slug)
// VALUES
// --Dashboard
//     (gen_random_uuid(), 'dashboard', 'view', 'dashboard.view'),
//     (gen_random_uuid(), 'dashboard', 'create_admin', 'dashboard.create_admin'),

//     --Product
//         (gen_random_uuid(), 'product', 'view', 'product.view'),
//     (gen_random_uuid(), 'product', 'create', 'product.create'),
//     (gen_random_uuid(), 'product', 'update', 'product.update'),
//     (gen_random_uuid(), 'product', 'delete', 'product.delete'),
//     (gen_random_uuid(), 'product', 'view_details', 'product.view_details'),
//     (gen_random_uuid(), 'product', 'export_pdf', 'product.export_pdf'),
//     (gen_random_uuid(), 'product', 'export_excel', 'product.export_excel'),

//     --Collections
//     (gen_random_uuid(), 'collection', 'view', 'collection.view'),
//     (gen_random_uuid(), 'collection', 'create', 'collection.create'),
//     (gen_random_uuid(), 'collection', 'update', 'collection.update'),
//     (gen_random_uuid(), 'collection', 'delete', 'collection.delete'),
//     (gen_random_uuid(), 'collection', 'status_update', 'collection.status_update'),
//
//     --Create Product
//         (gen_random_uuid(), 'create_product', 'view', 'create_product.view'),

//         --Main Category
//             (gen_random_uuid(), 'main_category', 'view', 'main_category.view'),
//             (gen_random_uuid(), 'main_category', 'create', 'main_category.create'),
//             (gen_random_uuid(), 'main_category', 'update', 'main_category.update'),
//             (gen_random_uuid(), 'main_category', 'delete', 'main_category.delete'),
//             (gen_random_uuid(), 'main_category', 'status_update', 'main_category.status_update'),

//             --Category
//                 (gen_random_uuid(), 'category', 'view', 'category.view'),
//             (gen_random_uuid(), 'category', 'create', 'category.create'),
//             (gen_random_uuid(), 'category', 'update', 'category.update'),
//             (gen_random_uuid(), 'category', 'delete', 'category.delete'),

//             --Sub Category
//                 (gen_random_uuid(), 'sub_category', 'view', 'sub_category.view'),
//                 (gen_random_uuid(), 'sub_category', 'create', 'sub_category.create'),
//                 (gen_random_uuid(), 'sub_category', 'update', 'sub_category.update'),
//                 (gen_random_uuid(), 'sub_category', 'delete', 'sub_category.delete'),

//                 --Brand
//                     (gen_random_uuid(), 'brand', 'view', 'brand.view'),
//                 (gen_random_uuid(), 'brand', 'create', 'brand.create'),
//                 (gen_random_uuid(), 'brand', 'update', 'brand.update'),
//                 (gen_random_uuid(), 'brand', 'delete', 'brand.delete'),

//                 --Unit
//                     (gen_random_uuid(), 'unit', 'view', 'unit.view'),
//                 (gen_random_uuid(), 'unit', 'create', 'unit.create'),
//                 (gen_random_uuid(), 'unit', 'update', 'unit.update'),
//                 (gen_random_uuid(), 'unit', 'delete', 'unit.delete'),

//                 --Variant Attribute
//                     (gen_random_uuid(), 'variant_attribute', 'view', 'variant_attribute.view'),
//                     (gen_random_uuid(), 'variant_attribute', 'create', 'variant_attribute.create'),
//                     (gen_random_uuid(), 'variant_attribute', 'update', 'variant_attribute.update'),
//                     (gen_random_uuid(), 'variant_attribute', 'delete', 'variant_attribute.delete'),

//                     --Warranty
//                         (gen_random_uuid(), 'warranty', 'view', 'warranty.view'),
//                     (gen_random_uuid(), 'warranty', 'create', 'warranty.create'),
//                     (gen_random_uuid(), 'warranty', 'update', 'warranty.update'),
//                     (gen_random_uuid(), 'warranty', 'delete', 'warranty.delete'),
//                     (gen_random_uuid(), 'warranty', 'status_update', 'warranty.status_update'),

//                     --Manage Stock
//                         (gen_random_uuid(), 'manage_stock', 'view', 'manage_stock.view'),
//                         (gen_random_uuid(), 'manage_stock', 'update', 'manage_stock.update'),

//                         --Stock Adjustment
//                             (gen_random_uuid(), 'stock_adjustment', 'view', 'stock_adjustment.view'),
//                             (gen_random_uuid(), 'stock_adjustment', 'update_stock', 'stock_adjustment.update_stock'),

//                             --Order
//                                 (gen_random_uuid(), 'order', 'create', 'order.create'),
//                             (gen_random_uuid(), 'order', 'view', 'order.view'),
//                             (gen_random_uuid(), 'order', 'update', 'order.update'),
//                             (gen_random_uuid(), 'order', 'delete', 'order.delete'),
//                             (gen_random_uuid(), 'order', 'payment_update', 'order.payment_update'),
//                             (gen_random_uuid(), 'order', 'status_update', 'order.status_update'),
//                             (gen_random_uuid(), 'order', 'view_details', 'order.view_details'),
//                             (gen_random_uuid(), 'order', 'export_excel', 'order.export_excel'),

//                             --Invoice
//                                 (gen_random_uuid(), 'invoice', 'create', 'invoice.create'),
//                             (gen_random_uuid(), 'invoice', 'view', 'invoice.view'),
//                             (gen_random_uuid(), 'invoice', 'view_details', 'invoice.view_details'),
//                             (gen_random_uuid(), 'invoice', 'export_pdf', 'invoice.export_pdf'),

//                             --Coupon
//                                 (gen_random_uuid(), 'coupon', 'view', 'coupon.view'),
//                             (gen_random_uuid(), 'coupon', 'create', 'coupon.create'),
//                             (gen_random_uuid(), 'coupon', 'update', 'coupon.update'),
//                             (gen_random_uuid(), 'coupon', 'delete', 'coupon.delete'),
//                             (gen_random_uuid(), 'coupon', 'status_update', 'coupon.status_update'),

//                             --Discount
//                                 (gen_random_uuid(), 'discount', 'view', 'discount.view'),
//                             (gen_random_uuid(), 'discount', 'create', 'discount.create'),
//                             (gen_random_uuid(), 'discount', 'update', 'discount.update'),
//                             (gen_random_uuid(), 'discount', 'delete', 'discount.delete'),
//                             (gen_random_uuid(), 'discount', 'status_update', 'discount.status_update'),

//                             --Bundle Product
//                                 (gen_random_uuid(), 'bundle_product', 'view', 'bundle_product.view'),
//                                 (gen_random_uuid(), 'bundle_product', 'create', 'bundle_product.create'),
//                                 (gen_random_uuid(), 'bundle_product', 'update', 'bundle_product.update'),
//                                 (gen_random_uuid(), 'bundle_product', 'delete', 'bundle_product.delete'),
//                                 (gen_random_uuid(), 'bundle_product', 'status_update', 'bundle_product.status_update'),

//                                 --Customer
//                                     (gen_random_uuid(), 'customer', 'view', 'customer.view'),
//                                 (gen_random_uuid(), 'customer', 'create', 'customer.create'),
//                                 (gen_random_uuid(), 'customer', 'update', 'customer.update'),
//                                 (gen_random_uuid(), 'customer', 'delete', 'customer.delete'),
//                                 (gen_random_uuid(), 'customer', 'status_update', 'customer.status_update'),
//                                 (gen_random_uuid(), 'customer', 'view_details', 'customer.view_details'),
//                                 (gen_random_uuid(), 'customer', 'export_excel', 'customer.export_excel'),

//                                 --Role Management
//                                     (gen_random_uuid(), 'role_management', 'view', 'role_management.view'),
//                                     (gen_random_uuid(), 'role_management', 'create', 'role_management.create'),
//                                     (gen_random_uuid(), 'role_management', 'update', 'role_management.update');